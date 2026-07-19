from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from urllib.parse import urljoin

from playwright.sync_api import BrowserContext, Page, sync_playwright


@dataclass(frozen=True)
class PageCase:
    name: str
    path: str
    selector: str


CASES = (
    PageCase("home-ar", "/ar", "[data-reference-home]"),
    PageCase("home-en", "/en", "[data-reference-home]"),
    PageCase("shop-ar", "/ar/shop", "[data-shop-hub]"),
    PageCase("shop-en", "/en/shop", "[data-shop-hub]"),
    PageCase("collection-ar", "/ar/shop/skincare", "[data-collection-grid]"),
    PageCase("collection-en", "/en/shop/skincare", "[data-collection-grid]"),
    PageCase("search-ar", "/ar/search?q=ritual", "[data-search-experience]"),
    PageCase("search-en", "/en/search?q=ritual", "[data-search-experience]"),
    PageCase("cart-ar", "/ar/cart", "[data-cart-surface]"),
    PageCase("cart-en", "/en/cart", "[data-cart-surface]"),
    PageCase("checkout-ar", "/ar/checkout", "[data-checkout-surface]"),
    PageCase("checkout-en", "/en/checkout", "[data-checkout-surface]"),
    PageCase("concerns-ar", "/ar/concerns", "[data-discovery-kind=concern]"),
    PageCase("concerns-en", "/en/concerns", "[data-discovery-kind=concern]"),
    PageCase("routines-ar", "/ar/routines", "[data-discovery-kind=routine]"),
    PageCase("routines-en", "/en/routines", "[data-discovery-kind=routine]"),
    PageCase("ingredients-ar", "/ar/ingredients", "[data-discovery-kind=ingredient]"),
    PageCase("ingredients-en", "/en/ingredients", "[data-discovery-kind=ingredient]"),
    PageCase("concern-detail-ar", "/ar/concerns/pigmentation", "[data-discovery-detail=concern]"),
    PageCase("concern-detail-en", "/en/concerns/pigmentation", "[data-discovery-detail=concern]"),
    PageCase("routine-detail-ar", "/ar/routines/morning-routine-oily-skin", "[data-discovery-detail=routine]"),
    PageCase("routine-detail-en", "/en/routines/morning-routine-oily-skin", "[data-discovery-detail=routine]"),
    PageCase("ingredient-detail-ar", "/ar/ingredients/niacinamide", "[data-discovery-detail=ingredient]"),
    PageCase("ingredient-detail-en", "/en/ingredients/niacinamide", "[data-discovery-detail=ingredient]"),
    PageCase("journal-ar", "/ar/journal", "[data-journal-experience]"),
    PageCase("journal-en", "/en/journal", "[data-journal-experience]"),
    PageCase("article-ar", "/ar/journal/morning-ritual-for-hot-weather", "[data-article-experience]"),
    PageCase("article-en", "/en/journal/morning-ritual-for-hot-weather", "[data-article-experience]"),
    PageCase("about-ar", "/ar/about", "[data-trust-variant=brand]"),
    PageCase("about-en", "/en/about", "[data-trust-variant=brand]"),
    PageCase("contact-ar", "/ar/contact", "[data-trust-variant=support]"),
    PageCase("contact-en", "/en/contact", "[data-trust-variant=support]"),
    PageCase("faq-ar", "/ar/faq", "[data-trust-variant=faq]"),
    PageCase("faq-en", "/en/faq", "[data-trust-variant=faq]"),
    PageCase("trust-ar", "/ar/trust", "[data-trust-variant=policy]"),
    PageCase("trust-en", "/en/trust", "[data-trust-variant=policy]"),
    PageCase("privacy-ar", "/ar/trust/privacy", "[data-trust-variant=policy]"),
    PageCase("privacy-en", "/en/trust/privacy", "[data-trust-variant=policy]"),
    PageCase("terms-ar", "/ar/terms", "[data-trust-variant=policy]"),
    PageCase("terms-en", "/en/terms", "[data-trust-variant=policy]"),
)

MOBILE_SCREENSHOTS = {
    "home-ar",
    "shop-ar",
    "cart-ar",
    "concerns-ar",
    "journal-ar",
    "trust-ar",
}

DESKTOP_SCREENSHOTS = {
    "home-en",
    "shop-en",
    "search-en",
    "about-en",
    "journal-en",
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def attach_diagnostics(page: Page, label: str, diagnostics: dict[str, list[str]]) -> None:
    page.on(
        "console",
        lambda message: diagnostics["consoleErrors"].append(f"{label}: {message.text}")
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: diagnostics["pageErrors"].append(f"{label}: {error}"))
    page.on(
        "requestfailed",
        lambda request: diagnostics["requestFailures"].append(
            f"{label}: {request.method} {request.url}: {request.failure}"
        )
        if request.failure != "net::ERR_ABORTED"
        else None,
    )
    page.on(
        "response",
        lambda response: diagnostics["failedResponses"].append(
            f"{label}: {response.status} {response.url}"
        )
        if response.status >= 400
        else None,
    )


def settle_page(page: Page, base_url: str, case: PageCase) -> None:
    response = page.goto(urljoin(f"{base_url}/", case.path.lstrip("/")), wait_until="domcontentloaded")
    require(response is not None and response.status < 400, f"{case.name} navigation failed")
    page.locator(case.selector).wait_for(state="visible", timeout=20_000)
    page.wait_for_function("document.fonts?.status === 'loaded'", timeout=20_000)
    page.wait_for_timeout(350)


def inspect_accessibility(page: Page, case: PageCase) -> dict:
    locale = "ar" if case.path.startswith("/ar") else "en"
    expected_dir = "rtl" if locale == "ar" else "ltr"
    expected_lang = "ar" if locale == "ar" else "en"
    html = page.locator("html")
    page_height = page.evaluate("document.documentElement.scrollHeight")
    overflow = page.evaluate(
        "Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth"
    )
    duplicate_ids = page.locator("[id]").evaluate_all(
        "elements => elements.map(element => element.id).filter((id, index, ids) => ids.indexOf(id) !== index)"
    )
    inaccessible_controls = page.locator("main a, main button").evaluate_all(
        """elements => elements
          .filter(element => element.getClientRects().length > 0)
          .filter(element => !((element.getAttribute('aria-label') || element.textContent || '').trim()))
          .map(element => element.outerHTML.slice(0, 180))"""
    )
    missing_alt = page.locator("main img").evaluate_all(
        "elements => elements.filter(image => !image.hasAttribute('alt')).map(image => image.currentSrc)"
    )
    sticky_sections = page.locator("main section").evaluate_all(
        "elements => elements.filter(element => getComputedStyle(element).position === 'sticky').length"
    )
    body_font = page.locator("body").evaluate("element => getComputedStyle(element).fontFamily")
    heading_font = page.locator("h1").evaluate("element => getComputedStyle(element).fontFamily")

    require(html.get_attribute("dir") == expected_dir, f"{case.name} has the wrong direction")
    require((html.get_attribute("lang") or "").startswith(expected_lang), f"{case.name} has the wrong language")
    require(page.locator("main#main-content").count() == 1, f"{case.name} must expose one main landmark")
    require(page.locator("h1").count() == 1, f"{case.name} must expose exactly one h1")
    require(bool(page.title().strip()), f"{case.name} must expose a document title")
    require(500 <= page_height < 10_000, f"{case.name} has an implausible page height: {page_height}")
    require(overflow <= 1, f"{case.name} has {overflow}px horizontal overflow")
    require(not duplicate_ids, f"{case.name} has duplicate ids: {duplicate_ids}")
    require(not inaccessible_controls, f"{case.name} has unnamed controls: {inaccessible_controls}")
    require(not missing_alt, f"{case.name} has images without alt attributes: {missing_alt}")
    require(sticky_sections == 0, f"{case.name} regressed to sticky content scenes")
    require("Public Sans" in body_font and "Cairo" in body_font, f"{case.name} lost the bilingual body stack")
    require("Playfair Display" in heading_font and "Cairo" in heading_font, f"{case.name} lost the bilingual display stack")

    return {
        "name": case.name,
        "path": case.path,
        "dir": expected_dir,
        "height": page_height,
        "overflow": overflow,
        "stickySections": sticky_sections,
        "bodyFont": body_font,
        "headingFont": heading_font,
    }


def verify_consent_and_mobile_shell(context: BrowserContext, base_url: str, output: Path) -> dict:
    page = context.new_page()
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(f"{base_url}/ar", wait_until="domcontentloaded")
    banner = page.locator("[data-analytics-consent]")
    banner.wait_for(state="visible", timeout=15_000)
    box = banner.bounding_box()
    require(
        box is not None and box["height"] <= 372,
        f"The mobile consent banner obscures too much of the viewport: {box}",
    )
    buttons = banner.locator("button")
    require(buttons.count() == 2, "Consent must offer equally clear accept and reject actions")
    buttons.nth(1).click()
    banner.wait_for(state="hidden")

    menu_trigger = page.locator("button[aria-controls='mobile-nav-drawer']")
    menu_trigger.click()
    drawer = page.locator("#mobile-nav-drawer[role=dialog]")
    drawer.wait_for(state="visible")
    require(drawer.get_attribute("aria-modal") == "true", "Mobile navigation must be modal")
    page.keyboard.press("Escape")
    drawer.wait_for(state="hidden")
    require(menu_trigger.evaluate("element => document.activeElement === element"), "Mobile navigation must restore focus")

    search_trigger = page.locator("button[aria-controls='store-search-dialog']")
    search_trigger.click()
    search_dialog = page.locator("#store-search-dialog[role=dialog]")
    search_dialog.wait_for(state="visible")
    require(search_dialog.locator("input").first.evaluate("element => document.activeElement === element"), "Search must focus its input")
    page.keyboard.press("Escape")
    search_dialog.wait_for(state="hidden")

    cart_trigger = page.locator("button[aria-controls='header-cart-drawer']")
    cart_trigger.click()
    cart_drawer = page.locator("#header-cart-drawer[role=dialog]")
    cart_drawer.wait_for(state="visible")
    page.keyboard.press("Escape")
    cart_drawer.wait_for(state="hidden")
    page.screenshot(path=str(output / "mobile-shell-ar.png"), full_page=True)
    page.close()
    return {"consentHeight": box["height"], "menuFocusRestored": True, "dialogsChecked": 3}


def run_matrix(
    context: BrowserContext,
    base_url: str,
    output: Path,
    diagnostics: dict[str, list[str]],
    viewport: dict[str, int],
    suffix: str,
    screenshot_names: set[str],
) -> list[dict]:
    results = []
    for case in CASES:
        page = context.new_page()
        page.set_viewport_size(viewport)
        attach_diagnostics(page, f"{suffix}:{case.name}", diagnostics)
        settle_page(page, base_url, case)
        results.append(inspect_accessibility(page, case))
        if case.name in screenshot_names:
            page.screenshot(path=str(output / f"{case.name}-{suffix}.png"), full_page=True)
        page.close()
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="ELORE full reference-system browser regression")
    parser.add_argument("--base-url", default="http://127.0.0.1:3056")
    parser.add_argument("--output", default=".artifacts/full-reference-browser")
    args = parser.parse_args()
    base_url = args.base_url.rstrip("/")
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    diagnostics = {
        "consoleErrors": [],
        "pageErrors": [],
        "requestFailures": [],
        "failedResponses": [],
    }

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context()
        shell = verify_consent_and_mobile_shell(context, base_url, output)
        desktop = run_matrix(
            context,
            base_url,
            output,
            diagnostics,
            {"width": 1440, "height": 960},
            "desktop",
            DESKTOP_SCREENSHOTS,
        )
        mobile = run_matrix(
            context,
            base_url,
            output,
            diagnostics,
            {"width": 390, "height": 844},
            "mobile",
            MOBILE_SCREENSHOTS,
        )
        context.close()
        browser.close()

    for category, entries in diagnostics.items():
        require(not entries, f"{category}: {entries[:12]}")

    report = {
        "cases": [asdict(case) for case in CASES],
        "desktop": desktop,
        "mobile": mobile,
        "shell": shell,
        "diagnostics": diagnostics,
    }
    (output / "results.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "desktopPages": len(desktop),
                "mobilePages": len(mobile),
                "shell": shell,
                "diagnostics": diagnostics,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
