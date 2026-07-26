from __future__ import annotations

import os
from pathlib import Path
import shutil
import subprocess
import time
import urllib.error
import urllib.request

from playwright.sync_api import Browser, BrowserContext, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
PORT = int(os.environ.get("ELORE_SITE_CONTENT_QA_PORT", "3077"))
BASE_URL = f"http://127.0.0.1:{PORT}"
OUTPUT_DIR = ROOT / "test-results" / "site-content-authority"
SERVER_FILE = ROOT / ".next" / "standalone" / "server.js"
DATA_DIR = ROOT / ".data"
DATABASE_PATH = DATA_DIR / f"site-content-browser-{os.getpid()}.sqlite"
MEDIA_ROOT = DATA_DIR / f"site-content-browser-media-{os.getpid()}"
SERVER_LOG_PATH = OUTPUT_DIR / "server.log"
OPS_ACCESS_CODE = "site-content-browser-access"


def remove_scratch_paths() -> None:
    for suffix in ("", "-shm", "-wal"):
        candidate = Path(f"{DATABASE_PATH}{suffix}")
        if candidate.exists():
            candidate.unlink()
    if MEDIA_ROOT.exists():
        shutil.rmtree(MEDIA_ROOT)


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
                f"Content Authority QA server exited with {process.returncode}.\n{output}"
            )
        try:
            with urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=1) as response:
                if response.status == 200:
                    return
        except (OSError, urllib.error.URLError):
            pass
        time.sleep(0.25)
    raise RuntimeError("Timed out waiting for the Content Authority QA server.")


def start_server() -> tuple[subprocess.Popen[str], object]:
    if not SERVER_FILE.exists():
        raise RuntimeError("Standalone build is missing. Run npm run build first.")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    remove_scratch_paths()
    log_handle = SERVER_LOG_PATH.open("w", encoding="utf-8")
    environment = {
        **os.environ,
        "HOSTNAME": "127.0.0.1",
        "PORT": str(PORT),
        "APP_ENV": "development",
        "AUTHORITY_DB_PATH": str(DATABASE_PATH),
        "PROMOTION_MEDIA_ROOT": str(MEDIA_ROOT),
        "OPS_ACCESS_CODE": OPS_ACCESS_CODE,
        "OPS_ACCESS_SIGNING_SECRET": "site-content-browser-signing-secret",
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


def stop_server(process: subprocess.Popen[str], log_handle: object) -> None:
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)
    log_handle.close()
    remove_scratch_paths()


def authenticate(context: BrowserContext) -> None:
    response = context.request.post(
        f"{BASE_URL}/api/ops-access/login",
        headers={"Origin": BASE_URL},
        data={
            "accessCode": OPS_ACCESS_CODE,
            "nextPath": "/ops/content",
        },
    )
    if response.status != 200:
        raise AssertionError(
            f"Content Authority login returned {response.status}: {response.text()}"
        )
    set_cookie = response.headers.get("set-cookie", "")
    cookie_pair = set_cookie.split(";", 1)[0]
    if "=" not in cookie_pair:
        raise AssertionError("Content Authority login did not return a session cookie.")
    cookie_attributes = {
        attribute.strip().lower() for attribute in set_cookie.split(";")[1:]
    }
    if "path=/" not in cookie_attributes:
        raise AssertionError("Ops session cookie must cover both /ops and /api/ops.")
    name, value = cookie_pair.split("=", 1)
    # Production standalone cookies are Secure. The QA server is intentionally
    # loopback HTTP, so install the signed token explicitly for this context.
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


def audit_view(
    browser: Browser, viewport: dict[str, int], screenshot_name: str
) -> None:
    context = browser.new_context(viewport=viewport)
    try:
        authenticate(context)
        page = context.new_page()
        problems: list[str] = []
        page.on(
            "console",
            lambda message: problems.append(
                f"console:{message.type}:{message.text}"
            )
            if message.type == "error"
            else None,
        )
        page.on("pageerror", lambda error: problems.append(f"pageerror:{error}"))

        def record_failed_request(request) -> None:
            failure = request.failure or ""
            if "_rsc=" in request.url and "ERR_ABORTED" in failure:
                return
            problems.append(
                f"requestfailed:{request.method}:{request.url}:{failure}"
            )

        page.on("requestfailed", record_failed_request)
        page.on(
            "response",
            lambda response: problems.append(
                f"response:{response.status}:{response.url}"
            )
            if response.status >= 400
            else None,
        )

        response = page.goto(
            f"{BASE_URL}/ops/content",
            wait_until="domcontentloaded",
            timeout=60_000,
        )
        if response is None or response.status != 200:
            raise AssertionError(
                f"Content Authority navigation returned {response.status if response else 'no response'}"
            )
        page.get_by_role(
            "heading", name="تحكم فعلي، نشر محكوم، ورجوع بلا فقد بيانات."
        ).wait_for(timeout=30_000)
        assert page.get_by_text("SITE CONTENT AUTHORITY").is_visible()
        assert page.get_by_role(
            "button", name="حفظ نسخة جديدة"
        ).is_visible()
        assert page.get_by_role(
            "heading", name="رفع واعتماد صور الموقع"
        ).is_visible()
        assert page.get_by_role(
            "heading", name="Journal, Discovery, Shop, Categories, and Bento"
        ).is_visible()

        family = page.get_by_label("Content family")
        family.select_option("shop")
        page.get_by_role("heading", name="Shop hub").wait_for()
        family.select_option("journal-interface")
        page.get_by_label("Surface").select_option("hero-image")
        page.get_by_role("heading", name="Journal hero image").wait_for()
        family.select_option("discovery-interface")
        assert page.get_by_label("Surface").input_value() == "hub"
        page.get_by_role("heading", name="concern hub interface").wait_for()
        family.select_option("journal-article")
        assert page.get_by_text("Structural key · locked").first.is_visible()
        page.get_by_role("button", name="English").click()
        assert page.locator('input[dir="ltr"]').first.is_visible()
        overflow = page.evaluate(
            "() => document.documentElement.scrollWidth > document.documentElement.clientWidth"
        )
        assert not overflow, "Horizontal page overflow detected"
        page.screenshot(path=str(OUTPUT_DIR / screenshot_name), full_page=True)
        if problems:
            raise AssertionError("\n".join(problems))
    finally:
        context.close()


def main() -> None:
    process, log_handle = start_server()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                audit_view(
                    browser,
                    {"width": 1440, "height": 1000},
                    "content-desktop.png",
                )
                audit_view(
                    browser,
                    {"width": 390, "height": 844},
                    "content-mobile.png",
                )
            finally:
                browser.close()
    finally:
        stop_server(process, log_handle)
    print(
        "Content Authority desktop/mobile UI, console, network, and overflow checks passed."
    )


if __name__ == "__main__":
    main()
