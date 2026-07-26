from __future__ import annotations

import os
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("RITUAL_BASE_URL", "http://127.0.0.1:3056")
CAPTURE = os.environ.get("RITUAL_CAPTURE") == "1"


def check_locale(browser, locale: str, width: int, height: int) -> None:
    page = browser.new_page(viewport={"width": width, "height": height})
    errors: list[str] = []
    page.on(
        "console",
        lambda message: errors.append(message.text) if message.type == "error" else None,
    )
    page.on("pageerror", lambda error: errors.append(str(error)))

    response = page.goto(f"{BASE_URL}/{locale}/rituals/builder", wait_until="domcontentloaded")
    page.locator("[data-ritual-builder]").wait_for(state="visible")
    assert response is not None and response.status == 200
    assert page.locator("html").get_attribute("dir") == ("rtl" if locale == "ar" else "ltr")
    assert page.locator("[data-ritual-builder]").count() == 1
    assert page.locator("fieldset").count() == 1
    assert page.locator('input[type="radio"]').count() == 4
    page.wait_for_timeout(1_000)

    next_label = "السؤال التالي" if locale == "ar" else "Next question"
    finish_label = "شاهدي اختياراتك" if locale == "ar" else "See my edit"
    for step in range(4):
        next_button = page.get_by_role(
            "button", name=finish_label if step == 3 else next_label, exact=True
        )
        for _ in range(20):
            page.locator('input[type="radio"]').first.evaluate("element => element.click()")
            if not next_button.is_disabled():
                break
            page.wait_for_timeout(250)
        assert not next_button.is_disabled()
        next_button.click()

    assert page.locator("fieldset").count() == 0
    main_text = page.locator("main").inner_text()
    assert ("طقس مبني" in main_text) if locale == "ar" else ("ritual shaped" in main_text.lower())
    catalog_available = page.locator("[data-ritual-builder]").get_attribute(
        "data-catalog-available"
    )
    if catalog_available == "false":
        gate = (
            "التوصيات غير منشورة بعد"
            if locale == "ar"
            else "Recommendations are not published yet"
        )
        assert gate in main_text

    if CAPTURE:
        Path("tmp").mkdir(exist_ok=True)
        page.screenshot(
            path=f"tmp/ritual-builder-{locale}-{width}.png", full_page=True
        )

    assert errors == [], f"Browser errors on {locale}: {errors}"
    page.close()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    try:
        redirect_page = browser.new_page()
        redirect_page.goto(f"{BASE_URL}/ar/rituals", wait_until="domcontentloaded")
        redirect_page.locator("[data-ritual-builder]").wait_for(state="visible")
        assert redirect_page.url.endswith("/ar/rituals/builder")
        redirect_page.close()

        check_locale(browser, "ar", 1440, 1000)
        check_locale(browser, "en", 390, 844)
        print(
            "Ritual builder desktop RTL, mobile LTR, quiz and redirect browser checks passed."
        )
    finally:
        browser.close()
