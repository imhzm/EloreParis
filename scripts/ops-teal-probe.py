"""Probe rendered ops surfaces for leftover teal/green-tinted dark colors.

Boots the standalone server (already built), logs in through /ops-access,
and samples computed styles of every visible element on /ops plus one
subsurface. Fails if any sampled color is green-dominant in dark ranges.
"""
import os
import sys
import time
import urllib.request
import urllib.error
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SERVER_FILE = ROOT / ".next" / "standalone" / "server.js"
PORT = 3063
BASE_URL = f"http://127.0.0.1:{PORT}"
ACCESS_CODE = "ops-teal-probe-access"
DATABASE_PATH = ROOT / ".data" / f"teal-probe-{os.getpid()}.sqlite"

PROBE_SNIPPET = """
() => {
  const results = [];
  const seen = new Set();
  const walk = (root) => {
    for (const el of root.querySelectorAll('*')) {
      const style = window.getComputedStyle(el);
      const candidates = [
        style.backgroundColor,
        style.color,
        ...Array.from(style.backgroundImage.matchAll(/rgba?\\(([^)]+)\\)/g), (m) => m[0]),
      ];
      for (const value of candidates) {
        if (!value || !value.includes('rgba')) continue;
        if (seen.has(value)) continue;
        seen.add(value);
        const rgb = value.match(/[\\d.]+/g).map(Number);
        if (rgb.length < 3) continue;
        const [r, g, b] = rgb;
        if (g > r + 8 && g > b + 8) results.push({ color: value, element: el.tagName, cls: el.className });
      }
    }
  };
  walk(document.body);
  return results;
}
"""


def wait_for_server(timeout_seconds=45):
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=1):
                return
        except (urllib.error.URLError, OSError):
            time.sleep(0.25)
    raise SystemExit("standalone server did not start")


def main():
    for suffix in ("", "-shm", "-wal"):
        Path(f"{DATABASE_PATH}{suffix}").unlink(missing_ok=True)
    server = subprocess.Popen(
        [sys.executable if False else "node", SERVER_FILE],
        cwd=ROOT,
        env={
            **os.environ,
            "HOSTNAME": "127.0.0.1",
            "PORT": str(PORT),
            "APP_ENV": "development",
            "AUTHORITY_DB_PATH": str(DATABASE_PATH),
            "OPS_ACCESS_CODE": ACCESS_CODE,
            "ENFORCE_OPS_ACCESS": "true",
            "OPS_ACCESS_SIGNING_SECRET": "teal-probe-signing-secret",
        },
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        wait_for_server()
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 900})
            login = page.request.post(
                f"{BASE_URL}/api/ops-access/login",
                headers={"Content-Type": "application/json", "Origin": BASE_URL},
                data='{"accessCode": "%s", "nextPath": "/ops"}' % ACCESS_CODE,
            )
            if login.status != 200:
                print("PROBE FAIL: ops login rejected", login.status)
                print(login.text())
                browser.close()
                raise SystemExit(1)
            page.goto(f"{BASE_URL}/ops", wait_until="networkidle")
            probe_routes = [
                "/ops",
                "/ops/orders",
                "/ops/catalog",
                "/ops/fulfillment",
                "/ops/release",
                "/ops/audit",
                "/ops-access",
            ]
            all_hits = []
            for route in probe_routes:
                page.goto(f"{BASE_URL}{route}", wait_until="networkidle")
                hits = page.evaluate(PROBE_SNIPPET)
                for hit in hits:
                    hit["route"] = route
                all_hits.extend(hits)
            if not all_hits:
                print(
                    "PROBE PASS: no teal-dominant colors found on "
                    + ", ".join(probe_routes)
                )
            else:
                print("PROBE FAIL: teal-dominant colors found")
                for hit in all_hits[:20]:
                    print(" ", hit)
                browser.close()
                raise SystemExit(1)
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=10)
        except subprocess.TimeoutExpired:
            server.kill()
        for suffix in ("", "-shm", "-wal"):
            Path(f"{DATABASE_PATH}{suffix}").unlink(missing_ok=True)


if __name__ == "__main__":
    main()
