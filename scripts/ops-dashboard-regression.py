from __future__ import annotations

import os
from pathlib import Path
import re
import shutil
import subprocess
import time
import urllib.error
import urllib.request

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "test-results" / "ops-dashboard"
SERVER_FILE = ROOT / ".next" / "standalone" / "server.js"
PORT = int(os.environ.get("TEST_PORT", "3058"))
EXTERNAL_BASE_URL = os.environ.get("OPS_TEST_BASE_URL", "").strip()
BASE_URL = EXTERNAL_BASE_URL or f"http://127.0.0.1:{PORT}"
OPS_ACCESS_CODE = os.environ.get(
    "OPS_TEST_ACCESS_CODE", "ops-dashboard-browser-access"
).strip()
DATABASE_PATH = ROOT / ".data" / f"ops-dashboard-browser-{os.getpid()}.sqlite"
SERVER_LOG_PATH = OUTPUT_DIR / "server.log"

DESKTOP_ROUTES = (
    ("overview", "/ops", "نظرة عامة"),
    ("orders", "/ops/orders", "الطلبات"),
    ("customers", "/ops/customers", "العملاء"),
    ("analytics", "/ops/analytics?period=30", "التحليلات"),
    ("catalog", "/ops/catalog", "الكتالوج والمخزون"),
    ("promotions", "/ops/promotions", "العروض والكوبونات"),
    ("fulfillment", "/ops/fulfillment", "التنفيذ والشحن"),
    ("content", "/ops/content", "المحتوى"),
    ("notifications", "/ops/notifications", "الإشعارات"),
    ("audit", "/ops/audit", "سجل النشاط"),
    ("release", "/ops/release", "جاهزية الإطلاق"),
    ("settings", "/ops/settings", "الإعدادات"),
)


def remove_scratch_database() -> None:
    for suffix in ("", "-shm", "-wal"):
        candidate = Path(f"{DATABASE_PATH}{suffix}")
        if candidate.exists():
            candidate.unlink()


def wait_for_server(process: subprocess.Popen[str]) -> None:
    deadline = time.monotonic() + 45
    while time.monotonic() < deadline:
        if process.poll() is not None:
            output = (
                SERVER_LOG_PATH.read_text(encoding="utf-8", errors="replace")
                if SERVER_LOG_PATH.exists()
                else ""
            )
            raise RuntimeError(
                f"Ops dashboard QA server exited with {process.returncode}.\n{output}"
            )
        try:
            with urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=1) as response:
                if response.status == 200:
                    return
        except (OSError, urllib.error.URLError):
            pass
        time.sleep(0.25)
    raise RuntimeError("Timed out waiting for the ops dashboard QA server.")


def start_server() -> tuple[subprocess.Popen[str], object] | tuple[None, None]:
    if EXTERNAL_BASE_URL:
        return None, None
    if not SERVER_FILE.exists():
        raise RuntimeError("Standalone build is missing. Run npm run build first.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    remove_scratch_database()
    log_handle = SERVER_LOG_PATH.open("w", encoding="utf-8")
    environment = {
        **os.environ,
        "HOSTNAME": "127.0.0.1",
        "PORT": str(PORT),
        "APP_ENV": "development",
        "AUTHORITY_DB_PATH": str(DATABASE_PATH),
        "OPS_ACCESS_CODE": OPS_ACCESS_CODE,
        "OPS_ACCESS_SIGNING_SECRET": "ops-dashboard-browser-signing-secret",
    }
    process = subprocess.Popen(
        [shutil.which("node") or "node", str(SERVER_FILE)],
        cwd=ROOT,
        env=environment,
        stdout=log_handle,
        stderr=subprocess.STDOUT,
        text=True,
    )
    wait_for_server(process)
    return process, log_handle


def stop_server(process: subprocess.Popen[str] | None, log_handle: object | None) -> None:
    if process is not None and process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)
    if log_handle is not None:
        log_handle.close()
    if not EXTERNAL_BASE_URL:
        remove_scratch_database()


def authenticate(context: BrowserContext) -> None:
    response = context.request.post(
        f"{BASE_URL}/api/ops-access/login",
        headers={"Origin": BASE_URL},
        data={"accessCode": OPS_ACCESS_CODE, "nextPath": "/ops"},
    )
    if response.status != 200:
        raise AssertionError(
            f"Protected browser login returned {response.status}: {response.text()}"
        )
    set_cookie = response.headers.get("set-cookie", "")
    cookie_pair = set_cookie.split(";", 1)[0]
    if "=" not in cookie_pair:
        raise AssertionError("Protected browser login did not return a session cookie.")
    cookie_attributes = {
        attribute.strip().lower() for attribute in set_cookie.split(";")[1:]
    }
    if "path=/" not in cookie_attributes:
        raise AssertionError("Ops session cookie must cover both /ops and /api/ops.")
    name, value = cookie_pair.split("=", 1)
    # The standalone build correctly marks ops cookies Secure because it runs
    # with NODE_ENV=production. This loopback-only browser check has no TLS, so
    # install the returned signed token explicitly without weakening production.
    context.add_cookies(
        [
            {
                "name": name,
                "value": value,
                "domain": "127.0.0.1",
                "path": "/",
                "httpOnly": True,
                "sameSite": "Strict",
                "secure": False,
            }
        ]
    )


def attach_diagnostics(page: Page, diagnostics: dict[str, list[str]]) -> None:
    page.on(
        "console",
        lambda message: diagnostics["console"].append(message.text)
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: diagnostics["page"].append(str(error)))

    def record_failed_request(request) -> None:
        failure = request.failure or "unknown failure"
        if request.method == "GET" and "_rsc=" in request.url and "ERR_ABORTED" in failure:
            return
        diagnostics["request"].append(
            f"{request.method} {request.url}: {failure}"
        )

    page.on("requestfailed", record_failed_request)


def navigate(page: Page, pathname: str):
    response = page.goto(f"{BASE_URL}{pathname}", wait_until="load", timeout=60_000)
    try:
        page.wait_for_load_state("networkidle", timeout=5_000)
    except PlaywrightTimeoutError:
        # Next route prefetches can remain active after the document is usable.
        pass
    return response


def assert_no_document_overflow(page: Page, route_name: str) -> None:
    dimensions = page.evaluate(
        """() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        })"""
    )
    if dimensions["scrollWidth"] > dimensions["clientWidth"] + 2:
        raise AssertionError(
            f"{route_name} has document-level horizontal overflow: {dimensions}"
        )


def test_desktop(browser: Browser) -> None:
    diagnostics: dict[str, list[str]] = {
        "console": [],
        "page": [],
        "request": [],
    }
    context = browser.new_context(
        viewport={"width": 1440, "height": 1000},
        locale="ar-SA",
        color_scheme="light",
    )
    try:
        authenticate(context)
        page = context.new_page()
        attach_diagnostics(page, diagnostics)

        for route_name, pathname, active_label in DESKTOP_ROUTES:
            response = navigate(page, pathname)
            if response is None or response.status != 200:
                raise AssertionError(f"{pathname} did not return 200")
            navigation = page.get_by_role(
                "navigation", name="أقسام لوحة التحكم"
            )
            try:
                navigation.wait_for(state="visible", timeout=10_000)
            except PlaywrightTimeoutError as error:
                raise AssertionError(
                    f"{pathname} did not render the operations navigation; current URL is {page.url}"
                ) from error
            navigation.get_by_text(active_label, exact=True).wait_for(state="visible")
            page.locator("main#main-content").wait_for(state="visible")
            assert_no_document_overflow(page, route_name)

            if route_name in {"overview", "customers", "analytics", "settings"}:
                page.screenshot(
                    path=str(OUTPUT_DIR / f"desktop-{route_name}.png"),
                    full_page=True,
                )

        navigate(page, "/ops/customers")
        page.get_by_role(
            "searchbox", name="البحث في العملاء والطلبات"
        ).fill("customer-that-does-not-exist")
        page.get_by_role("button", name="بحث").click()
        page.wait_for_url(re.compile(r"/ops/customers\?q="))
        page.get_by_text("لا توجد نتائج مطابقة", exact=True).wait_for(
            state="visible"
        )

        navigate(page, "/ops/analytics")
        page.get_by_label("الفترة").select_option("7")
        page.get_by_role("button", name="تحديث").click()
        page.wait_for_url(re.compile(r"/ops/analytics\?period=7"))
        if page.get_by_label("الفترة").input_value() != "7":
            raise AssertionError("Analytics period did not update to 7 days.")

        navigate(page, "/ops/settings")
        settings_text = page.locator("main").inner_text()
        for secret_marker in (
            "passwordHash",
            "accessCode",
            "OPS_ACCESS_SIGNING_SECRET=",
        ):
            if secret_marker in settings_text:
                raise AssertionError(
                    f"Settings exposed protected configuration: {secret_marker}"
                )
    finally:
        context.close()

    failures = [
        f"{kind}: {value}"
        for kind, values in diagnostics.items()
        for value in values
    ]
    if failures:
        raise AssertionError("\n".join(failures))


def test_mobile(browser: Browser) -> None:
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        locale="ar-SA",
        color_scheme="light",
    )
    try:
        authenticate(context)
        page = context.new_page()
        navigate(page, "/ops/customers")
        menu_button = page.get_by_role(
            "button", name="فتح قائمة لوحة التحكم"
        )
        menu_button.wait_for(state="visible")
        menu_button.click()
        page.wait_for_timeout(300)
        sidebar = page.locator("#ops-sidebar")
        open_box = sidebar.bounding_box()
        if not open_box or open_box["x"] >= 390 or open_box["x"] + open_box["width"] <= 0:
            raise AssertionError("Mobile operations sidebar did not open.")
        active_label = page.evaluate(
            "() => document.activeElement?.getAttribute('aria-label')"
        )
        if active_label != "إغلاق قائمة لوحة التحكم":
            raise AssertionError("Mobile menu did not move focus to its close control.")

        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        restored_label = page.evaluate(
            "() => document.activeElement?.getAttribute('aria-label')"
        )
        if restored_label != "فتح قائمة لوحة التحكم":
            raise AssertionError("Mobile menu did not restore focus after Escape.")
        closed_box = sidebar.bounding_box()
        if not closed_box or not (
            closed_box["x"] >= 390 or closed_box["x"] + closed_box["width"] <= 0
        ):
            raise AssertionError("Mobile operations sidebar remained visible.")
        assert_no_document_overflow(page, "mobile-customers")
        page.screenshot(
            path=str(OUTPUT_DIR / "mobile-customers.png"), full_page=True
        )
    finally:
        context.close()


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    process, log_handle = start_server()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                test_desktop(browser)
                test_mobile(browser)
            finally:
                browser.close()
    finally:
        stop_server(process, log_handle)
    print("Ops dashboard browser regression passed.")


if __name__ == "__main__":
    main()
