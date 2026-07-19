import argparse
import json
from pathlib import Path

from playwright.sync_api import Page, sync_playwright


CATEGORIES = (
    "perfumes",
    "skincare",
    "makeup",
    "haircare",
    "bodycare",
    "tools",
    "beauty-sets",
)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def open_category(page: Page, base_url: str, locale: str, slug: str) -> None:
    page.goto(f"{base_url}/{locale}/shop/{slug}", wait_until="domcontentloaded")
    page.locator("[data-collection-grid]").wait_for(state="visible", timeout=15_000)
    page.wait_for_function("document.fonts?.status === 'loaded'", timeout=15_000)
    page.wait_for_function(
        """() => {
          const image = document.querySelector('[data-collection-hero] img');
          return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
        }""",
        timeout=15_000,
    )


def inspect_page(page: Page, base_url: str, locale: str, slug: str) -> dict:
    open_category(page, base_url, locale, slug)
    root = page.locator("[data-collection-grid]")
    catalog_state = root.locator("[data-catalog-state]").get_attribute("data-catalog-state")
    page_height = page.evaluate("document.documentElement.scrollHeight")
    sticky_sections = root.locator("section").evaluate_all(
        "elements => elements.filter(element => getComputedStyle(element).position === 'sticky').length"
    )

    require(page.locator("h1").count() == 1, f"{locale}/{slug} must expose one h1")
    require(catalog_state in ("gated", "available"), f"{locale}/{slug} must expose a truthful catalogue state")
    require(page.locator("[data-category-scene]").count() == 0, f"{locale}/{slug} must not return to the retired cinematic scenes")
    require(root.locator("[data-collection-routes] a").count() == 3, f"{locale}/{slug} must keep three useful discovery routes")
    require(sticky_sections == 0, f"{locale}/{slug} must not trap visitors in sticky scenes")
    require(1_500 <= page_height < 6_000, f"{locale}/{slug} must remain a compact, complete collection page")
    require(page.evaluate("document.documentElement.scrollWidth - window.innerWidth") <= 1, f"{locale}/{slug} overflows horizontally")

    return {
        "locale": locale,
        "slug": slug,
        "mode": catalog_state,
        "height": page_height,
        "stickySectionCount": sticky_sections,
        "horizontalOverflow": page.evaluate("document.documentElement.scrollWidth - window.innerWidth"),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="ÉLORÉ compact collection regression checks")
    parser.add_argument("--base-url", default="http://127.0.0.1:3056")
    parser.add_argument("--output", default=".artifacts/category-cinematic")
    args = parser.parse_args()
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)

    diagnostics = {"consoleErrors": [], "pageErrors": [], "failedResponses": []}
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("console", lambda message: diagnostics["consoleErrors"].append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: diagnostics["pageErrors"].append(str(error)))
        page.on("response", lambda response: diagnostics["failedResponses"].append(f"{response.status} {response.url}") if response.status >= 400 else None)

        for locale in ("ar", "en"):
            for slug in CATEGORIES:
                results.append(inspect_page(page, args.base_url.rstrip("/"), locale, slug))

        open_category(page, args.base_url.rstrip("/"), "ar", "skincare")
        page.screenshot(path=str(output / "desktop-ar-skincare.png"), full_page=True)

        page.set_viewport_size({"width": 390, "height": 844})
        open_category(page, args.base_url.rstrip("/"), "ar", "skincare")
        require(page.locator("[data-collection-hero]").is_visible(), "Mobile collection Hero must remain visible")
        require(page.evaluate("document.documentElement.scrollWidth - window.innerWidth") <= 1, "Mobile collection must not overflow")
        page.screenshot(path=str(output / "mobile-ar-skincare.png"), full_page=True)

        page.emulate_media(reduced_motion="reduce")
        open_category(page, args.base_url.rstrip("/"), "en", "skincare")
        require(page.locator("[data-collection-grid]").is_visible(), "Reduced-motion collection must remain visible")
        browser.close()

    require(not diagnostics["consoleErrors"], f"Console errors: {diagnostics['consoleErrors']}")
    require(not diagnostics["pageErrors"], f"Page errors: {diagnostics['pageErrors']}")
    require(not diagnostics["failedResponses"], f"Failed responses: {diagnostics['failedResponses']}")
    report = {"pages": results, "diagnostics": diagnostics}
    (output / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
