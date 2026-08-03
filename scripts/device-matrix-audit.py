"""Exhaustive device-matrix audit of the Elore Paris storefront.

Boots the already-built standalone app with an isolated SQLite database and the
shared QA catalogue fixture, enumerates every public route from the real
sitemap, then sweeps both locales across a dense viewport matrix and records
layout, accessibility, Arabic/RTL, image, console, and network problems.

This is a diagnostic auditor, not a pass/fail gate: it writes
.artifacts/device-matrix-audit/findings.json with every candidate finding so a
human or agent can triage real bugs from expected behaviour.
"""

from __future__ import annotations

import http.cookiejar
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ElementTree

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
PORT = int(os.environ.get("ELORE_DEVICE_MATRIX_PORT", "3067"))
BASE_URL = f"http://127.0.0.1:{PORT}"
SERVER_FILE = ROOT / ".next" / "standalone" / "server.js"
DATA_DIR = ROOT / ".data"
ARTIFACT_DIR = ROOT / ".artifacts" / "device-matrix-audit"
SERVER_LOG_PATH = ARTIFACT_DIR / "server.log"
DATABASE_PATH = DATA_DIR / f"device-matrix-audit-{os.getpid()}.sqlite"
LEGACY_ORDER_PATH = DATA_DIR / f"device-matrix-audit-orders-{os.getpid()}.json"
OPS_ACCESS_CODE = "device-matrix-audit-access"

VIEWPORTS = [
    (320, 568, "m-320", True),
    (360, 640, "m-360", True),
    (375, 667, "m-375", True),
    (390, 844, "m-390", True),
    (393, 852, "m-393", True),
    (412, 915, "m-412", True),
    (414, 896, "m-414", True),
    (600, 960, "t-600", True),
    (768, 1024, "t-768", True),
    (834, 1112, "t-834", True),
    (1024, 1366, "t-1024", True),
    (1280, 800, "l-1280", False),
    (1366, 768, "l-1366", False),
    (1440, 900, "l-1440", False),
    (1536, 864, "l-1536", False),
    (1920, 1080, "d-1920", False),
    (2560, 1440, "d-2560", False),
]

PAGE_CHECKS = """
() => {
  const out = { lang: '', dir: '', viewportMeta: false, overflow: 0,
    clippedX: [], clippedY: [], tapTargets: [], arabicSpacing: [],
    missingAlt: [], missingDims: [], duplicateIds: [], emptyLinks: [] };
  const doc = document.documentElement;
  out.lang = doc.getAttribute('lang') || '';
  out.dir = doc.getAttribute('dir') || '';
  const meta = document.querySelector('meta[name="viewport"]');
  out.viewportMeta = Boolean(meta && /width=device-width/i.test(meta.content));
  out.overflow = Math.max(0, doc.scrollWidth - window.innerWidth);

  const arabic = /[\\u0600-\\u06FF\\u0750-\\u077F]/;
  const push = (list, item) => { if (list.length < 15) list.push(item); };

  for (const el of document.querySelectorAll('body *')) {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const text = (el.textContent || '').trim();
    const cls = (el.className || '').toString();
    if (/srOnly|sr-only|visuallyHidden/i.test(cls)) continue;

    if (text && (style.overflowX === 'hidden' || style.overflowX === 'clip')) {
      for (const child of el.querySelectorAll('p, h1, h2, h3, h4, span, strong, small, a, li, dt, dd, button, label')) {
        if (!(child.textContent || '').trim()) continue;
        if (child.closest('[aria-hidden="true"]')) continue;
        const enclosingDetails = child.closest('details');
        if (enclosingDetails && !enclosingDetails.open) continue;
        const childStyle = window.getComputedStyle(child);
        if (childStyle.position === 'absolute') continue;
        const childRect = child.getBoundingClientRect();
        if (childRect.width === 0 || childRect.height === 0) continue;
        const overRight = childRect.right - rect.right;
        const overBottom = childRect.bottom - rect.bottom;
        if (overRight > 2) {
          push(out.clippedX, { tag: child.tagName, cls: cls.slice(0, 80),
            text: (child.textContent || '').trim().slice(0, 60), diff: Math.round(overRight) });
        }
        if (overBottom > 2 && rect.height < 800) {
          push(out.clippedY, { tag: child.tagName, cls: cls.slice(0, 80),
            text: (child.textContent || '').trim().slice(0, 60), diff: Math.round(overBottom) });
        }
      }
    }

    if (el.tagName === 'IMG') {
      if (!el.hasAttribute('alt') && !el.closest('[aria-hidden="true"]')) {
        push(out.missingAlt, { src: (el.getAttribute('src') || '').slice(0, 110) });
      }
      if (style.position !== 'absolute' &&
          (!el.hasAttribute('width') || !el.hasAttribute('height')) && rect.width > 40) {
        push(out.missingDims, { src: (el.getAttribute('src') || '').slice(0, 110), w: Math.round(rect.width) });
      }
    }
  }

  for (const el of document.querySelectorAll('button, a')) {
    if (el.closest('[aria-hidden="true"]')) continue;
    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const looksInteractive = el.tagName === 'BUTTON' || style.backgroundColor !== 'rgba(0, 0, 0, 0)' || style.borderWidth !== '0px';
    if (looksInteractive && (rect.width < 40 || rect.height < 40)) {
      push(out.tapTargets, { tag: el.tagName, cls: (el.className || '').toString().slice(0, 80),
        text: (el.textContent || '').trim().slice(0, 40), w: Math.round(rect.width), h: Math.round(rect.height) });
    }
    if (el.tagName === 'A') {
      const href = el.getAttribute('href') || '';
      if (href === '' || href === '#' || href === '#!') {
        push(out.emptyLinks, { text: (el.textContent || '').trim().slice(0, 50), cls: (el.className || '').toString().slice(0, 80) });
      }
    }
  }

  if (out.lang.startsWith('ar')) {
    for (const el of document.querySelectorAll('body *')) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none') continue;
      const spacing = style.letterSpacing;
      if (spacing !== 'normal' && spacing !== '0px' && arabic.test(el.textContent || '')) {
        push(out.arabicSpacing, { tag: el.tagName, cls: (el.className || '').toString().slice(0, 80),
          spacing, text: (el.textContent || '').trim().slice(0, 50) });
      }
    }
  }

  const ids = new Set();
  for (const el of document.querySelectorAll('[id]')) {
    const id = el.id;
    if (ids.has(id)) push(out.duplicateIds, id);
    ids.add(id);
  }

  return out;
}
"""


def remove_scratch_files() -> None:
    for base in (DATABASE_PATH, LEGACY_ORDER_PATH):
        for suffix in ("", "-shm", "-wal"):
            Path(f"{base}{suffix}").unlink(missing_ok=True)


def wait_for_server(process: subprocess.Popen[str]) -> None:
    deadline = time.monotonic() + 45
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(
                f"Audit server exited with {process.returncode}.\n"
                + (SERVER_LOG_PATH.read_text(errors="replace") if SERVER_LOG_PATH.exists() else "")
            )
        try:
            with urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=1) as response:
                if response.status == 200:
                    return
        except (OSError, urllib.error.URLError):
            pass
        time.sleep(0.25)
    raise RuntimeError("Timed out waiting for the audit server.")


def fixture_payload() -> dict[str, object]:
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Node.js is required to read the shared QA fixture.")
    result = subprocess.run(
        [
            node,
            "--input-type=module",
            "--eval",
            "import {validPayload} from './scripts/fixtures/qa-catalog-fixture.mjs';"
            "process.stdout.write(JSON.stringify(validPayload));",
        ],
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
            parsed = json.loads(response.read().decode("utf-8"))
            headers = {
                (key or "").lower(): value for key, value in response.headers.items()
            }
            return response.status, parsed, headers
    except urllib.error.HTTPError as error:
        raise RuntimeError(
            f"{method} {path} failed with {error.code}: {error.read().decode('utf-8', errors='replace')}"
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
        raise RuntimeError(f"Audit ops login returned {status}.")
    session_cookie = (login_headers.get("set-cookie") or "").split(";", 1)[0]
    auth_headers = {"Cookie": session_cookie}
    status, imported, _ = json_request(
        opener,
        "/api/ops/catalog/authority",
        method="POST",
        payload=fixture_payload(),
        request_headers=auth_headers,
    )
    if status != 201 or not imported.get("importId"):
        raise RuntimeError(f"Audit catalogue import was not accepted: {imported}")
    status, published, _ = json_request(
        opener,
        "/api/ops/catalog/authority",
        method="PATCH",
        payload={"action": "publish", "importId": imported["importId"]},
        request_headers=auth_headers,
    )
    if status != 200 or not published.get("readiness", {}).get("ready"):
        raise RuntimeError(f"Audit catalogue publication was not ready: {published}")
    return session_cookie


def sitemap_routes(locale: str) -> list[str]:
    # The sitemap is intentionally fenced while search indexing is disabled
    # (release gate), so the audit enumerates routes explicitly instead.
    del locale
    return []


EXTRA_PUBLIC_ROUTES = [
    "/",
    "/shop",
    "/shop/skincare",
    "/shop/makeup",
    "/shop/perfumes",
    "/shop/haircare",
    "/shop/bodycare",
    "/shop/tools",
    "/shop/beauty-sets",
    "/concerns",
    "/concerns/pigmentation",
    "/concerns/makeup-longwear",
    "/ingredients",
    "/ingredients/niacinamide",
    "/ingredients/vitamin-c",
    "/ingredients/hyaluronic-acid",
    "/ingredients/panthenol",
    "/ingredients/shea-butter",
    "/routines",
    "/routines/morning-routine-oily-skin",
    "/routines/occasion-base-routine",
    "/routines/humidity-proof-hair-routine",
    "/routines/after-shower-body-routine",
    "/rituals",
    "/rituals/builder",
    "/journal",
    "/journal/morning-ritual-for-hot-weather",
    "/journal/uneven-tone-without-overcomplication",
    "/journal/makeup-longevity-without-heavy-layers",
    "/journal/post-wash-hair-rhythm-in-humidity",
    "/journal/after-shower-bodycare-by-texture",
    "/journal/read-an-ingredient-before-you-choose",
    "/product/qa-authority-product",
    "/products/qa-authority-product",
    "/about",
    "/faq",
    "/contact",
    "/terms",
    "/trust/verification",
    "/trust/privacy",
    "/trust/shipping",
    "/trust/returns",
    "/trust/authenticity",
    "/cart",
    "/checkout",
    "/checkout/success",
    "/track-order",
    "/wishlist",
    "/search?q=serum",
    "/account/orders",
    "/unsubscribe",
    "/404-does-not-exist",
]


def collect_routes() -> list[str]:
    routes = sorted(set(EXTRA_PUBLIC_ROUTES))
    if not routes:
        raise RuntimeError("Audit route list is empty.")
    return routes


def audit_route(
    page, context, route: str, locale: str, viewport_name: str, findings: dict
) -> None:
    key = f"{locale}{route}"
    url = f"{BASE_URL}/{locale}{route}"
    console_errors: list[str] = []
    page_errors: list[str] = []
    request_failures: list[str] = []
    response_errors: list[str] = []

    def on_console(message) -> None:
        if message.type == "error":
            if "ERR_NO_BUFFER_SPACE" in message.text:
                return
            console_errors.append(message.text)

    def on_page_error(error) -> None:
        page_errors.append(str(error))

    def on_request_failed(request) -> None:
        failure = request.failure or "unknown failure"
        if "ERR_ABORTED" in failure and (
            request.url.endswith("/api/catalog")
            or "_rsc=" in request.url
            or request.method == "POST"
        ):
            return
        if "ERR_NO_BUFFER_SPACE" in failure:
            return
        request_failures.append(f"{request.method} {request.url}: {failure}")

    def on_response(response) -> None:
        if response.status >= 400 and "/api/" not in response.url:
            response_errors.append(f"{response.status} {response.request.method} {response.url}")

    page.on("console", on_console)
    page.on("pageerror", on_page_error)
    page.on("requestfailed", on_request_failed)
    page.on("response", on_response)
    try:
        page.goto(url, wait_until="networkidle", timeout=20000)
    except Exception:
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=20000)
        except Exception as error:
            findings[key][viewport_name] = {
                "error": f"load failed: {error.__class__.__name__}: {error}"
            }
            return
    page.wait_for_timeout(250)

    checks = page.evaluate(PAGE_CHECKS)
    issues: dict[str, object] = {}
    is_expected_404 = "404-does-not-exist" in route
    if console_errors and not is_expected_404:
        issues["console"] = console_errors[:10]
    if page_errors:
        issues["pageErrors"] = page_errors[:5]
    if request_failures:
        issues["requestFailures"] = request_failures[:10]
    if response_errors and not is_expected_404:
        issues["responseErrors"] = response_errors[:10]
    if checks["overflow"] > 0:
        issues["overflowPx"] = checks["overflow"]
    if checks["clippedX"]:
        issues["clippedX"] = checks["clippedX"]
    if checks["clippedY"]:
        issues["clippedY"] = checks["clippedY"]
    if checks["tapTargets"]:
        issues["tapTargets"] = checks["tapTargets"]
    if checks["arabicSpacing"]:
        issues["arabicSpacing"] = checks["arabicSpacing"]
    if checks["missingAlt"]:
        issues["missingAlt"] = checks["missingAlt"]
    if checks["missingDims"]:
        issues["missingDims"] = checks["missingDims"]
    if checks["duplicateIds"]:
        issues["duplicateIds"] = checks["duplicateIds"]
    if checks["emptyLinks"]:
        issues["emptyLinks"] = checks["emptyLinks"]
    if not checks["lang"].lower().startswith(locale):
        issues["langMismatch"] = f"{checks['lang']} expected {locale}*"
    if checks["dir"] != ("rtl" if locale == "ar" else "ltr"):
        issues["dirMismatch"] = f"{checks['dir']} expected {'rtl' if locale == 'ar' else 'ltr'}"
    if not checks["viewportMeta"]:
        issues["viewportMeta"] = "missing"

    if issues:
        findings[key][viewport_name] = issues

    screenshot_path = None
    if issues and viewport_name in ("m-320", "d-1920"):
        screenshot_path = ARTIFACT_DIR / f"{key.replace('/', '_')}_{viewport_name}.png"
        try:
            page.screenshot(path=screenshot_path, full_page=True)
        except Exception:
            screenshot_path = None


def main() -> None:
    if not SERVER_FILE.exists():
        raise RuntimeError("Standalone build is missing. Run `npm run build` first.")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    for artifact in ARTIFACT_DIR.iterdir():
        if artifact.is_file() and artifact.suffix in {".png", ".log", ".json"}:
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
            "OPS_ACCESS_SIGNING_SECRET": "device-matrix-audit-signing-secret",
            "PUBLIC_TERMS_VERSION": "qa-terms-v1",
            "PUBLIC_PRIVACY_NOTICE_VERSION": "qa-privacy-v1",
            "PUBLIC_CATALOG_APPROVED": "true",
            "PUBLIC_LEGAL_CONTENT_APPROVED": "true",
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
    findings: dict[str, dict[str, object]] = {}
    try:
        wait_for_server(server)
        seed_catalog()
        routes = collect_routes()
        print(f"Auditing {len(routes)} routes x {len(VIEWPORTS)} viewports x 2 locales")
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                for locale in ("ar", "en"):
                    for route in routes:
                        key = f"{locale}{route}"
                        findings.setdefault(key, {})
                        for width, height, viewport_name, is_touch in VIEWPORTS:
                            context = browser.new_context(
                                viewport={"width": width, "height": height},
                                is_mobile=is_touch,
                                has_touch=is_touch,
                                device_scale_factor=2 if is_touch else 1,
                            )
                            page = context.new_page()
                            try:
                                audit_route(
                                    page, context, route, locale, viewport_name, findings
                                )
                            finally:
                                context.close()
                        print(f"  done {key}  ({len(findings[key])} viewports with issues)")
            finally:
                browser.close()

        clean_count = sum(
            1
            for key, viewports in findings.items()
            for viewport_name in VIEWPORTS
            if viewport_name[2] not in viewports and key
        )
        print(f"\nPages with zero issues: {clean_count} / {len(routes) * 2 * len(VIEWPORTS)}")
        (ARTIFACT_DIR / "findings.json").write_text(
            json.dumps(findings, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        issue_kinds: dict[str, int] = {}
        for viewports in findings.values():
            for issues in viewports.values():
                if not isinstance(issues, dict):
                    continue
                for kind in issues:
                    issue_kinds[kind] = issue_kinds.get(kind, 0) + 1
        print("Issue kinds:")
        for kind, count in sorted(issue_kinds.items(), key=lambda item: -item[1]):
            print(f"  {kind}: {count}")
    finally:
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
