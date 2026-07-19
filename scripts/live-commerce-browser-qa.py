"""Run the approved commerce journey against an isolated local authority store.

This check never reads or writes the primary authority database. It starts the
already-built standalone application on a dedicated loopback port, imports the
shared QA-only catalogue fixture into a process-specific SQLite database, then
exercises the bilingual product, cart, and checkout UI with Playwright.
"""

from __future__ import annotations

import http.cookiejar
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import time
import urllib.error
import urllib.request

from playwright.sync_api import Page, sync_playwright
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError


ROOT = Path(__file__).resolve().parents[1]
PORT = int(os.environ.get("ELORE_LIVE_COMMERCE_QA_PORT", "3097"))
QA_SCOPE = os.environ.get("ELORE_LIVE_COMMERCE_QA_SCOPE", "full")
BASE_URL = f"http://127.0.0.1:{PORT}"
SERVER_FILE = ROOT / ".next" / "standalone" / "server.js"
DATA_DIR = ROOT / ".data"
ARTIFACT_DIR = ROOT / ".artifacts" / "live-commerce-browser-qa"
SERVER_LOG_PATH = ARTIFACT_DIR / "server.log"
DATABASE_PATH = DATA_DIR / f"live-commerce-browser-qa-{os.getpid()}.sqlite"
LEGACY_ORDER_PATH = DATA_DIR / f"live-commerce-browser-qa-orders-{os.getpid()}.json"
PRODUCT_SLUG = "qa-authority-product"
OPS_ACCESS_CODE = "live-commerce-browser-qa-access"
COMMERCE_EVENT_SEQUENCE = [
    "view_item",
    "add_to_cart",
    "view_cart",
    "begin_checkout",
]


def ensure_isolated_paths() -> None:
    data_root = DATA_DIR.resolve()
    for candidate in (DATABASE_PATH, LEGACY_ORDER_PATH):
        resolved = candidate.resolve()
        if resolved.parent != data_root or "live-commerce-browser-qa" not in resolved.name:
            raise RuntimeError(f"Refusing non-isolated QA path: {resolved}")


def remove_scratch_files() -> None:
    for base in (DATABASE_PATH, LEGACY_ORDER_PATH):
        for suffix in ("", "-shm", "-wal"):
            candidate = Path(f"{base}{suffix}")
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
            raise RuntimeError(f"QA server exited with {process.returncode}.\n{output}")
        try:
            with urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=1) as response:
                if response.status == 200:
                    return
        except (OSError, urllib.error.URLError):
            pass
        time.sleep(0.25)
    raise RuntimeError("Timed out waiting for the isolated QA server.")


def fixture_payload() -> dict[str, object]:
    script = (
        "import {validPayload} from './scripts/fixtures/qa-catalog-fixture.mjs';"
        "process.stdout.write(JSON.stringify(validPayload));"
    )
    # Python does not expose Node's executable. Resolve the same binary available
    # to the project without invoking a shell, so fixture values remain unmodified.
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Node.js is required to read the shared QA fixture.")
    result = subprocess.run(
        [node, "--input-type=module", "--eval", script],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return json.loads(result.stdout)


def json_request(
    opener: urllib.request.OpenerDirector,
    path: str,
    *,
    method: str = "GET",
    payload: dict[str, object] | None = None,
    request_headers: dict[str, str] | None = None,
) -> tuple[int, dict[str, object], object]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"Accept": "application/json"}
    if payload is not None:
        headers.update({"Content-Type": "application/json", "Origin": BASE_URL})
    headers.update(request_headers or {})
    request = urllib.request.Request(
        f"{BASE_URL}{path}", data=body, headers=headers, method=method
    )
    try:
        with opener.open(request, timeout=10) as response:
            return (
                response.status,
                json.loads(response.read().decode("utf-8")),
                response.headers,
            )
    except urllib.error.HTTPError as error:
        response_body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"{method} {path} failed with {error.code}: {response_body}"
        ) from error


def seed_catalog() -> None:
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar())
    )
    status, _, login_headers = json_request(
        opener,
        "/api/ops-access/login",
        method="POST",
        payload={"accessCode": OPS_ACCESS_CODE, "nextPath": "/ops/catalog"},
    )
    if status != 200:
        raise RuntimeError(f"QA ops login returned {status}.")
    session_cookie = (login_headers.get("Set-Cookie") or "").split(";", 1)[0]
    if not session_cookie:
        raise RuntimeError("QA ops login did not return a session cookie.")
    auth_headers = {"Cookie": session_cookie}
    status, imported, _ = json_request(
        opener,
        "/api/ops/catalog/authority",
        method="POST",
        payload=fixture_payload(),
        request_headers=auth_headers,
    )
    if status != 201 or not imported.get("importId"):
        raise RuntimeError(f"QA catalogue import was not accepted: {imported}")
    status, published, _ = json_request(
        opener,
        "/api/ops/catalog/authority",
        method="PATCH",
        payload={"action": "publish", "importId": imported["importId"]},
        request_headers=auth_headers,
    )
    if status != 200 or not published.get("readiness", {}).get("ready"):
        raise RuntimeError(f"QA catalogue publication was not ready: {published}")


def install_diagnostics(page: Page, diagnostics: dict[str, list[str]]) -> None:
    page.on(
        "console",
        lambda message: diagnostics["console"].append(message.text)
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: diagnostics["page"].append(str(error)))

    def request_failed(request) -> None:
        failure = request.failure or "unknown failure"
        if "ERR_ABORTED" in failure and (
            request.url.endswith("/api/catalog") or "_rsc=" in request.url
        ):
            return
        diagnostics["request"].append(f"{request.method} {request.url}: {failure}")

    page.on("requestfailed", request_failed)
    page.on(
        "response",
        lambda response: diagnostics["response"].append(
            f"{response.status} {response.request.method} {response.url}"
        )
        if response.status >= 400
        else None,
    )


def wait_for_images(page: Page, selector: str) -> None:
    page.wait_for_function(
        """selector => [...document.querySelectorAll(selector)]
        .every(image => image.complete && image.naturalWidth > 0)""",
        arg=selector,
    )


def assert_no_horizontal_overflow(page: Page, label: str) -> None:
    dimensions = page.evaluate(
        """() => ({
          viewport: window.innerWidth,
          body: document.body.scrollWidth,
          document: document.documentElement.scrollWidth,
        })"""
    )
    if max(dimensions["body"], dimensions["document"]) > dimensions["viewport"] + 1:
        raise AssertionError(f"{label} has horizontal overflow: {dimensions}")


def expected_money(page: Page, locale: str, value: int) -> str:
    return page.evaluate(
        """([locale, value]) => new Intl.NumberFormat(
          locale === 'ar' ? 'ar-SA' : 'en-SA',
          { style: 'currency', currency: 'SAR', maximumFractionDigits: 2 }
        ).format(value)""",
        [locale, value],
    )


def wait_for_analytics_event(page: Page, event_name: str) -> None:
    page.wait_for_function(
        """eventName => (window.dataLayer ?? [])
        .filter(entry => entry?.event === eventName).length >= 1""",
        arg=event_name,
    )


def assert_analytics_journey(page: Page, label: str) -> None:
    events = page.evaluate(
        """names => (window.dataLayer ?? [])
        .filter(entry => names.includes(entry?.event))""",
        COMMERCE_EVENT_SEQUENCE,
    )
    sequence = [event.get("event") for event in events]
    if sequence != COMMERCE_EVENT_SEQUENCE:
        raise AssertionError(
            f"{label} commerce analytics sequence is not exact: {sequence}"
        )

    view_names = ("view_item", "view_cart", "begin_checkout")
    for event_name in view_names:
        if sequence.count(event_name) != 1:
            raise AssertionError(
                f"{label} {event_name} must be emitted exactly once."
            )

    forbidden_fragments = ("phone", "email", "address", "fullname", "full_name")
    for event in events:
        exposed = set()
        for key in event:
            normalized_key = str(key).replace("-", "_").lower()
            if any(fragment in normalized_key for fragment in forbidden_fragments):
                exposed.add(normalized_key)
        if exposed:
            raise AssertionError(
                f"{label} analytics event {event.get('event')} exposes PII keys: {sorted(exposed)}"
            )
        serialized = json.dumps(event, ensure_ascii=False).lower()
        if "qa customer" in serialized:
            raise AssertionError(
                f"{label} analytics event {event.get('event')} captured a customer name."
            )


def assert_web_vitals(page: Page, label: str) -> None:
    page.wait_for_function(
        """() => (window.dataLayer ?? [])
        .some(entry => entry?.event === 'web_vital')""",
        timeout=10_000,
    )
    events = page.evaluate(
        """() => (window.dataLayer ?? [])
        .filter(entry => entry?.event === 'web_vital')"""
    )
    allowed_keys = {"event", "name", "id", "value", "delta", "rating", "navigationType"}
    allowed_names = {"CLS", "FCP", "FID", "INP", "LCP", "TTFB"}
    allowed_ratings = {"good", "needs-improvement", "poor"}
    metric_ids = []

    for event in events:
        unexpected_keys = set(event) - allowed_keys
        if unexpected_keys:
            raise AssertionError(
                f"{label} web_vital exposes unsupported keys: {sorted(unexpected_keys)}"
            )
        if event.get("name") not in allowed_names or event.get("rating") not in allowed_ratings:
            raise AssertionError(f"{label} web_vital contains an invalid metric contract: {event}")
        if not all(
            isinstance(event.get(key), (int, float)) and math.isfinite(event[key])
            for key in ("value", "delta")
        ):
            raise AssertionError(f"{label} web_vital values must be finite numbers: {event}")
        metric_ids.append(event.get("id"))

    if len(metric_ids) != len(set(metric_ids)):
        raise AssertionError(f"{label} web_vital metric IDs must not be duplicated: {metric_ids}")


def verify_checkout_errors(page: Page) -> None:
    submit = page.locator('button[type="submit"]')
    submit.wait_for(state="visible")
    try:
        page.wait_for_function(
            "() => { const button = document.querySelector('button[type=submit]'); return button && !button.disabled; }",
            timeout=15_000,
        )
    except PlaywrightTimeoutError as error:
        state = page.evaluate(
            """() => ({
              submitDisabled: document.querySelector('button[type=submit]')?.disabled,
              submitText: document.querySelector('button[type=submit]')?.textContent?.trim(),
              checkoutError: document.querySelector('[data-checkout-error]')?.textContent?.trim(),
              checkoutState: document.querySelector('[data-checkout-surface]')?.getAttribute('data-checkout-state'),
            })"""
        )
        raise AssertionError(f"Checkout submit did not become ready: {state}") from error
    submit.click()
    page.locator('[data-checkout-invalid="true"]').first.wait_for(state="visible")

    invalid = page.locator('[data-checkout-invalid="true"]')
    if invalid.count() != 6:
        raise AssertionError(f"Expected 6 checkout field errors; found {invalid.count()}.")
    try:
        page.wait_for_function(
            "document.activeElement?.id === 'checkout-full-name'", timeout=2_000
        )
    except PlaywrightTimeoutError as error:
        active_id = page.evaluate("document.activeElement?.id")
        raise AssertionError(
            f"Checkout did not focus the first invalid field; active={active_id!r}."
        ) from error

    for index in range(invalid.count()):
        field = invalid.nth(index)
        if field.get_attribute("aria-invalid") != "true":
            raise AssertionError("Invalid checkout field is missing aria-invalid=true.")
        description_id = field.get_attribute("aria-describedby")
        if not description_id:
            raise AssertionError("Invalid checkout field is missing aria-describedby.")
        description = page.locator(f"#{description_id}")
        if description.count() != 1 or not description.inner_text().strip():
            raise AssertionError(f"Checkout error association is broken: {description_id}")

    full_name = page.locator("#checkout-full-name")
    full_name.fill("QA Customer")
    if full_name.get_attribute("aria-describedby") is not None:
        raise AssertionError("Corrected checkout field retained a stale error association.")


def run_journey(
    browser,
    locale: str,
    viewport_name: str,
    width: int,
    height: int,
    diagnostics: dict[str, list[str]],
) -> None:
    context = browser.new_context(viewport={"width": width, "height": height})
    context.add_init_script(
        "localStorage.setItem('elore.analytics.consent.v1', 'granted');"
    )
    page = context.new_page()
    install_diagnostics(page, diagnostics)
    label = f"{locale}-{viewport_name}"

    try:
        page.goto(
            f"{BASE_URL}/{locale}/product/{PRODUCT_SLUG}",
            wait_until="domcontentloaded",
        )
        product = page.locator("[data-reference-product][data-public-product]")
        product.wait_for(state="visible")
        wait_for_analytics_event(page, "view_item")
        if page.locator("h1").count() != 1:
            raise AssertionError(f"{label} PDP must expose exactly one h1.")
        wait_for_images(page, "[data-reference-product] img")
        assert_no_horizontal_overflow(page, f"{label} PDP")
        page.screenshot(path=ARTIFACT_DIR / f"{label}-pdp.png", full_page=True)

        variants = page.locator("[data-reference-product] fieldset button")
        if variants.count() < 2:
            raise AssertionError(f"{label} PDP did not expose multiple verified variants.")
        variants.nth(1).click()
        if variants.nth(1).get_attribute("aria-pressed") != "true":
            raise AssertionError(f"{label} PDP variant selection did not update.")
        # The second fixture variant deliberately has one unit for the authority's
        # race-condition test. Return to the first, sufficiently stocked variant
        # before exercising a quantity of two through checkout.
        variants.first.click()
        if variants.first.get_attribute("aria-pressed") != "true":
            raise AssertionError(f"{label} PDP did not restore the stocked variant.")

        quantity = page.locator("[data-reference-product] output")
        quantity.locator("..").locator("button").nth(1).click()
        if quantity.inner_text().strip() != "2":
            raise AssertionError(f"{label} PDP quantity control did not reach 2.")
        page.locator("#purchase button:not(fieldset button)").last.click()
        purchase_status = page.locator('#purchase [role="status"]')
        purchase_status.wait_for(state="visible")
        if not purchase_status.inner_text().strip():
            raise AssertionError(f"{label} PDP did not confirm the cart mutation.")
        wait_for_analytics_event(page, "add_to_cart")

        page.locator(f'#purchase a[href="/{locale}/cart"]').click()
        cart = page.locator('[data-cart-state="ready"]')
        cart.wait_for(state="visible")
        wait_for_analytics_event(page, "view_cart")
        wait_for_images(page, '[data-cart-state="ready"] img')
        if page.locator('[data-cart-state="ready"] img').count() < 1:
            raise AssertionError(f"{label} cart does not show approved product media.")
        cart_text = cart.inner_text()
        for amount in (115, 230):
            if expected_money(page, locale, amount) not in cart_text:
                raise AssertionError(f"{label} cart is missing the localized SAR amount {amount}.")
        if page.locator('[data-cart-state="ready"] h1').count() != 1:
            raise AssertionError(f"{label} cart must expose exactly one h1.")
        assert_no_horizontal_overflow(page, f"{label} cart")
        page.screenshot(path=ARTIFACT_DIR / f"{label}-cart.png", full_page=True)

        cart.locator(f'a[href="/{locale}/checkout"]').click()
        checkout = page.locator('[data-checkout-state="ready"]')
        checkout.wait_for(state="visible")
        wait_for_analytics_event(page, "begin_checkout")
        if page.locator('[data-checkout-state="ready"] h1').count() != 1:
            raise AssertionError(f"{label} checkout must expose exactly one h1.")
        assert_no_horizontal_overflow(page, f"{label} checkout")
        verify_checkout_errors(page)
        # Validation waits until the authority quote and payment options are
        # stable, so duplicate quote-key view events cannot hide behind timing.
        assert_analytics_journey(page, label)
        assert_web_vitals(page, label)
        assert_no_horizontal_overflow(page, f"{label} checkout validation")
        page.screenshot(
            path=ARTIFACT_DIR / f"{label}-checkout-validation.png", full_page=True
        )
    except Exception:
        page.screenshot(path=ARTIFACT_DIR / f"{label}-failure.png", full_page=True)
        raise
    finally:
        context.close()


def main() -> None:
    ensure_isolated_paths()
    if not SERVER_FILE.exists():
        raise RuntimeError("Standalone build is missing. Run `npm run build` first.")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    for artifact in ARTIFACT_DIR.iterdir():
        if artifact.is_file() and artifact.suffix in {".png", ".json", ".log"}:
            artifact.unlink()
    remove_scratch_files()

    environment = os.environ.copy()
    environment.update(
        {
            "COZMATEKS_PROJECT_ROOT": str(ROOT),
            "HOSTNAME": "127.0.0.1",
            "PORT": str(PORT),
            "APP_ENV": "development",
            "AUTHORITY_DB_PATH": str(DATABASE_PATH),
            "ORDER_AUTHORITY_FILE": str(LEGACY_ORDER_PATH),
            "OPS_ACCESS_CODE": OPS_ACCESS_CODE,
            "OPS_ACCESS_SIGNING_SECRET": "live-commerce-browser-qa-signing-secret",
            "PUBLIC_TERMS_VERSION": "qa-terms-v1",
            "PUBLIC_PRIVACY_NOTICE_VERSION": "qa-privacy-v1",
            "PUBLIC_CATALOG_APPROVED": "true",
            "PUBLIC_LEGAL_CONTENT_APPROVED": "true",
            "PAYMENT_PROVIDER_LABEL": "QA payment provider",
            "PAYMENT_PROVIDER_CALLBACK_SECRET": "qa-payment-callback-secret",
            "PAYMENT_PROVIDER_BASE_URL": "http://127.0.0.1:1/unused",
            "PAYMENT_PROVIDER_REQUEST_PATH": "/payments/links",
            "PAYMENT_PROVIDER_API_KEY": "qa-payment-api-key",
        }
    )
    server_log = SERVER_LOG_PATH.open("w", encoding="utf-8")
    server = subprocess.Popen(
        [shutil.which("node") or "node", str(SERVER_FILE)],
        cwd=ROOT,
        env=environment,
        stdout=server_log,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    diagnostics = {"console": [], "page": [], "request": [], "response": []}
    journeys = {
        "full": [
            ("ar", "desktop", 1440, 960),
            ("ar", "mobile", 390, 844),
            ("en", "desktop", 1440, 960),
            ("en", "mobile", 390, 844),
        ],
        "en-mobile": [("en", "mobile", 390, 844)],
    }.get(QA_SCOPE)
    if journeys is None:
        raise RuntimeError(f"Unsupported ELORE_LIVE_COMMERCE_QA_SCOPE: {QA_SCOPE}")

    try:
        wait_for_server(server)
        seed_catalog()
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                for locale, viewport_name, width, height in journeys:
                    run_journey(
                        browser,
                        locale,
                        viewport_name,
                        width,
                        height,
                        diagnostics,
                    )
            finally:
                browser.close()

        failures = {key: values for key, values in diagnostics.items() if values}
        if failures:
            raise AssertionError(
                "Browser diagnostics found unexpected failures:\n"
                + json.dumps(failures, ensure_ascii=False, indent=2)
            )
        print(
            json.dumps(
                {
                    "status": "passed",
                    "scope": QA_SCOPE,
                    "journeys": [f"{locale}-{viewport}" for locale, viewport, _, _ in journeys],
                    "database": "isolated-and-removed",
                    "artifacts": str(ARTIFACT_DIR),
                },
                ensure_ascii=False,
            )
        )
    except Exception as error:
        if server.poll() is not None:
            server_log.flush()
            server_output = SERVER_LOG_PATH.read_text(
                encoding="utf-8", errors="replace"
            )
            tail = "\n".join(server_output.splitlines()[-40:])
            raise RuntimeError(
                f"Isolated QA server exited with {server.returncode}.\n{tail}"
            ) from error
        raise
    finally:
        (ARTIFACT_DIR / "diagnostics.json").write_text(
            json.dumps(diagnostics, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        if server.poll() is None:
            server.terminate()
            try:
                server.wait(timeout=8)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait(timeout=5)
        server_log.close()
        remove_scratch_files()


if __name__ == "__main__":
    main()
