"""Accessibility audit of the Elore Paris storefront with axe-core.

Reuses the isolated server boot, QA catalogue seeding, and route list from
device-matrix-audit, then runs axe-core (vendored in node_modules) on every
public route at representative viewports in both locales and records rule
violations to .artifacts/a11y-audit/findings.json.

Diagnostic auditor, not a pass/fail gate.
"""

from __future__ import annotations

import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

_SPEC = importlib.util.spec_from_file_location(
    "device_matrix_audit", ROOT / "scripts" / "device-matrix-audit.py"
)
dma = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(dma)

PORT = 3081
AXE_SOURCE = ROOT / "node_modules" / "axe-core" / "axe.min.js"
ARTIFACT_DIR = ROOT / ".artifacts" / "a11y-audit"
DATABASE_PATH = dma.DATA_DIR / f"a11y-audit-{os.getpid()}.sqlite"
LEGACY_ORDER_PATH = dma.DATA_DIR / f"a11y-audit-orders-{os.getpid()}.json"
SERVER_LOG_PATH = ARTIFACT_DIR / "server.log"

VIEWPORTS = [(320, 568), (390, 844), (768, 1024), (1440, 900)]

AXE_RUN = """
() => new Promise((resolve) => {
  axe.run(document, {
    resultTypes: ['violations'],
    rules: { 'color-contrast': { enabled: true } },
  }, (error, results) => resolve(error ? { error: String(error) } : {
    violations: results.violations.map((v) => ({
      id: v.id, impact: v.impact, help: v.help,
      nodes: v.nodes.length,
      samples: v.nodes.slice(0, 2).map((n) => ({
        target: (n.target || []).join(' ').slice(0, 140),
        summary: (n.failureSummary || '').replace(/\\s+/g, ' ').slice(0, 200),
      })),
    })),
  }));
})
"""


def main() -> None:
    if not dma.SERVER_FILE.exists():
        raise RuntimeError("Standalone build is missing. Run `npm run build` first.")
    if not AXE_SOURCE.exists():
        raise RuntimeError("axe-core is missing from node_modules.")
    dma.DATA_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    dma.PORT = PORT
    dma.BASE_URL = f"http://127.0.0.1:{PORT}"
    dma.DATABASE_PATH = DATABASE_PATH
    dma.LEGACY_ORDER_PATH = LEGACY_ORDER_PATH
    dma.remove_scratch_files = lambda: None

    environment = os.environ.copy()
    environment.update(
        {
            "COZMATEKS_PROJECT_ROOT": str(ROOT),
            "HOSTNAME": "127.0.0.1",
            "PORT": str(PORT),
            "APP_ENV": "development",
            "AUTHORITY_DB_PATH": str(DATABASE_PATH),
            "ORDER_AUTHORITY_FILE": str(LEGACY_ORDER_PATH),
            "OPS_ACCESS_CODE": dma.OPS_ACCESS_CODE,
            "OPS_ACCESS_SIGNING_SECRET": "a11y-audit-signing-secret",
            "PUBLIC_TERMS_VERSION": "qa-terms-v1",
            "PUBLIC_PRIVACY_NOTICE_VERSION": "qa-privacy-v1",
            "PUBLIC_CATALOG_APPROVED": "true",
            "PUBLIC_LEGAL_CONTENT_APPROVED": "true",
        }
    )
    server_log = SERVER_LOG_PATH.open("w", encoding="utf-8")
    server = subprocess.Popen(
        [shutil.which("node") or "node", str(dma.SERVER_FILE)],
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
        dma.wait_for_server(server)
        dma.seed_catalog()
        routes = dma.collect_routes()
        print(f"Auditing {len(routes)} routes x {len(VIEWPORTS)} viewports x 2 locales")
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                for locale in ("ar", "en"):
                    for route in routes:
                        key = f"{locale}{route}"
                        findings.setdefault(key, {})
                        for width, height in VIEWPORTS:
                            context = browser.new_context(
                                viewport={"width": width, "height": height}
                            )
                            page = context.new_page()
                            page_errors: list[str] = []

                            def on_page_error(error) -> None:
                                page_errors.append(str(error))

                            page.on("pageerror", on_page_error)
                            try:
                                page.goto(
                                    f"{dma.BASE_URL}/{locale}{route}",
                                    wait_until="networkidle",
                                    timeout=20000,
                                )
                            except Exception:
                                page.goto(
                                    f"{dma.BASE_URL}/{locale}{route}",
                                    wait_until="domcontentloaded",
                                    timeout=20000,
                                )
                            page.wait_for_timeout(250)
                            # axe walks ancestor backgrounds; content-visibility:auto
                            # regions make it read the page background instead of the
                            # real one, so neutralize it before the run.
                            page.evaluate(
                                """() => {
                                  for (const el of document.querySelectorAll('*')) {
                                    if (getComputedStyle(el).contentVisibility === 'auto') {
                                      el.style.contentVisibility = 'visible';
                                    }
                                  }
                                }"""
                            )
                            page.add_script_tag(path=str(AXE_SOURCE))
                            result = page.evaluate(AXE_RUN)
                            issues: dict[str, object] = {}
                            if page_errors:
                                issues["pageErrors"] = page_errors[:5]
                            if isinstance(result, dict) and result.get("error"):
                                issues["axeError"] = result["error"]
                            elif isinstance(result, dict):
                                for violation in result["violations"]:
                                    issues.setdefault(violation["id"], []).append(
                                        {
                                            "impact": violation["impact"],
                                            "help": violation["help"],
                                            "nodes": violation["nodes"],
                                            "samples": violation["samples"],
                                        }
                                    )
                            if issues:
                                findings[key][f"{width}x{height}"] = issues
                            context.close()
                        clean = sum(
                            1 for viewport in VIEWPORTS
                            if f"{viewport[0]}x{viewport[1]}" not in findings[key]
                        )
                        print(f"  done {key}  ({clean}/{len(VIEWPORTS)} clean)")
            finally:
                browser.close()

        (ARTIFACT_DIR / "findings.json").write_text(
            json.dumps(findings, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        summary: dict[str, int] = {}
        for viewports in findings.values():
            for issues in viewports.values():
                if not isinstance(issues, dict):
                    continue
                for kind in issues:
                    if kind in ("pageErrors", "axeError"):
                        continue
                    summary[kind] = summary.get(kind, 0) + 1
        print("\nViolation kinds (rule id: route-viewport hits):")
        for kind, count in sorted(summary.items(), key=lambda item: -item[1]):
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
        for base in (DATABASE_PATH, LEGACY_ORDER_PATH):
            for suffix in ("", "-shm", "-wal"):
                Path(f"{base}{suffix}").unlink(missing_ok=True)


if __name__ == "__main__":
    main()
