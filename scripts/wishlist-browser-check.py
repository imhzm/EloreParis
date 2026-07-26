from __future__ import annotations

import json
import os

from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("WISHLIST_BASE_URL", "http://localhost:3056")
STORAGE_KEY = "elore:wishlist:v1"


def saved_payload(slugs: list[str]) -> str:
    return json.dumps({"version": 1, "slugs": slugs})


def install_storage(context, value: str) -> None:
    context.add_init_script(
        f"window.localStorage.setItem({json.dumps(STORAGE_KEY)}, {json.dumps(value)});"
    )


def collect_errors(page) -> list[str]:
    errors: list[str] = []
    page.on(
        "console",
        lambda message: errors.append(message.text) if message.type == "error" else None,
    )
    page.on("pageerror", lambda error: errors.append(str(error)))
    return errors


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    try:
        ar_context = browser.new_context(viewport={"width": 1280, "height": 900})
        install_storage(ar_context, saved_payload(["missing-product-a", "missing-product-b"]))
        ar_page = ar_context.new_page()
        ar_errors = collect_errors(ar_page)
        response = ar_page.goto(f"{BASE_URL}/ar/wishlist", wait_until="domcontentloaded")
        assert response is not None and response.status == 200
        ar_page.locator("[data-wishlist-surface]").wait_for(state="visible")
        ar_page.wait_for_function(
            "() => document.querySelector('[data-wishlist-state]')?.dataset.wishlistState !== 'loading'"
        )
        assert ar_page.locator("html").get_attribute("dir") == "rtl"
        state = ar_page.locator("[data-wishlist-state]").get_attribute("data-wishlist-state")
        stored = json.loads(ar_page.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
        if state == "gated":
            assert stored["slugs"] == ["missing-product-a", "missing-product-b"]
            assert ar_page.locator("[data-wishlist-header]").get_attribute("aria-label") == "2 عناصر في المفضلة"
        else:
            assert state == "empty"
            assert stored["slugs"] == []
            assert "لم يعد منشور" in ar_page.locator("main").inner_text()
        assert ar_errors == [], f"Arabic wishlist browser errors: {ar_errors}"
        ar_context.close()

        en_context = browser.new_context(viewport={"width": 320, "height": 800})
        install_storage(en_context, "not-json")
        en_page = en_context.new_page()
        en_errors = collect_errors(en_page)
        response = en_page.goto(f"{BASE_URL}/en/wishlist", wait_until="domcontentloaded")
        assert response is not None and response.status == 200
        en_page.locator("[data-wishlist-surface]").wait_for(state="visible")
        en_page.wait_for_function(
            "() => document.querySelector('[data-wishlist-state]')?.dataset.wishlistState !== 'loading'"
        )
        assert en_page.locator("html").get_attribute("dir") == "ltr"
        assert en_page.locator("[data-wishlist-header] span").count() == 0
        viewport_width = en_page.evaluate("window.innerWidth")
        document_width = en_page.evaluate("document.documentElement.scrollWidth")
        assert document_width <= viewport_width, (document_width, viewport_width)
        assert en_errors == [], f"English wishlist browser errors: {en_errors}"
        en_context.close()

        print("Wishlist RTL gated persistence, malformed storage and 320px browser checks passed.")
    finally:
        browser.close()
