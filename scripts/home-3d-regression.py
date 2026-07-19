import argparse
import json
from pathlib import Path

from playwright.sync_api import Page, sync_playwright


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def source_contract_checks() -> dict:
    bento_source = Path("src/components/bento-commerce-grid.tsx").read_text(encoding="utf-8")
    collection_source = Path("src/components/collection-grid-experience.tsx").read_text(encoding="utf-8")
    assert_true(
        '<section className={styles.section} aria-labelledby="bento-section-title">' in bento_source
        and '<h2 id="bento-section-title" className={styles.srOnly}>' in bento_source,
        "The Bento section must expose an h2 before its h3 card titles",
    )
    assert_true(
        '<Image src={hero.image} alt={hero.imageAlt} fill sizes="(max-width: 900px) 100vw, 46vw" priority />'
        in collection_source,
        "The collection Hero must remain the sole explicit high-priority image",
    )
    assert_true(
        "priority={index <" not in collection_source,
        "Collection product cards must not compete with the Hero for image priority",
    )
    return {"bentoSectionHeading": "h2", "collectionHeroPriority": True, "priorityProductCards": 0}


def open_home(page: Page, base_url: str, locale: str) -> None:
    page.goto(f"{base_url}/{locale}", wait_until="domcontentloaded")
    page.locator("[data-reference-home]").wait_for(state="visible", timeout=15_000)
    page.wait_for_function("document.fonts?.status === 'loaded'", timeout=15_000)
    page.wait_for_function(
        """() => {
          const image = document.querySelector('[data-home-hero-media] img');
          return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
        }""",
        timeout=15_000,
    )


def section_positions(page: Page) -> list[float]:
    selectors = [
        "[data-home-hero]",
        "[data-home-bento]",
        "[data-home-trust]",
        "[data-home-catalog-gate]",
        "[data-home-routine]",
        "[data-home-gifting]",
        "[data-home-editorial]",
        "[data-home-newsletter]",
    ]
    return [
        page.locator(selector).evaluate("element => element.getBoundingClientRect().top + scrollY")
        for selector in selectors
    ]


def desktop_checks(page: Page, base_url: str, output: Path) -> dict:
    page.set_viewport_size({"width": 1440, "height": 1000})
    open_home(page, base_url, "ar")

    hero = page.locator("[data-home-hero]")
    hero_box = hero.bounding_box()
    assert_true(hero_box is not None, "The reference-led hero must render")
    assert_true(390 <= hero_box["height"] <= 540, "The desktop Hero must keep the compact reference geometry")

    hero_image = page.locator("[data-home-hero-media] img")
    current_source = hero_image.evaluate("element => element.currentSrc")
    assert_true("hero-perfume-ritual-desktop-v3" in current_source, "Desktop must load the approved panoramic perfume Hero asset")
    assert_true(page.locator("[data-home-3d-object]").count() == 0, "The unsupported branded CSS bottle must not ship")

    heading_levels = page.locator("[data-reference-home] h1, [data-reference-home] h2, [data-reference-home] h3").evaluate_all(
        "elements => elements.map(element => Number(element.tagName.slice(1)))"
    )
    assert_true(
        all(current - previous <= 1 for previous, current in zip(heading_levels, heading_levels[1:])),
        f"Home heading levels must not skip a level: {heading_levels}",
    )

    positions = section_positions(page)
    assert_true(positions == sorted(positions), "Home sections must follow the approved reference narrative")
    bento_top = positions[1]
    trust_top = positions[2]
    hero_bottom = hero_box["y"] + hero_box["height"]
    assert_true(bento_top < hero_bottom, "The Bento grid must overlap the Hero like the approved reference")
    assert_true(trust_top < 1_000, "The service strip must enter the first desktop viewport after the Bento")

    sticky_sections = page.locator("[data-reference-home] section").evaluate_all(
        "elements => elements.filter(element => getComputedStyle(element).position === 'sticky').length"
    )
    assert_true(sticky_sections == 0, "Reference Home sections must not trap visitors in sticky scroll scenes")

    page.screenshot(path=str(output / "home-reference-desktop-ar.png"), full_page=True)

    newsletter = page.locator("#newsletter")
    newsletter.scroll_into_view_if_needed()
    newsletter.wait_for(state="visible")
    assert_true(newsletter.locator("input[type=email]").is_visible(), "Newsletter email field must remain visible")
    assert_true(newsletter.locator("input[type=checkbox]").is_visible(), "Newsletter consent must remain visible")

    open_home(page, base_url, "en")
    assert_true(page.locator("html").get_attribute("dir") == "ltr", "English home must remain LTR")
    assert_true(page.locator("h1").count() == 1, "English home must keep one primary heading")
    english_transform = page.locator("[data-home-hero-media] img").evaluate(
        "element => new DOMMatrixReadOnly(getComputedStyle(element).transform).a"
    )
    assert_true(english_transform < 0, "Desktop English must mirror the text-free Hero composition toward its reading start")

    total_height = page.evaluate("document.documentElement.scrollHeight")
    assert_true(total_height < 8_000, "The compact Home should not regress into the previous 13k-pixel narrative")

    return {
        "heroHeight": hero_box["height"],
        "desktopHeroSource": current_source,
        "sectionPositions": positions,
        "bentoOverlap": hero_bottom - bento_top,
        "stickySectionCount": sticky_sections,
        "englishHeroScaleX": english_transform,
        "pageHeight": total_height,
    }


def mobile_checks(page: Page, base_url: str, output: Path) -> dict:
    page.set_viewport_size({"width": 390, "height": 844})
    open_home(page, base_url, "ar")

    source = page.locator("[data-home-hero-media] img").evaluate("element => element.currentSrc")
    assert_true("hero-perfume-ritual-mobile-v2" in source, "Mobile must load its dedicated portrait perfume Hero asset")
    overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    assert_true(overflow <= 1, "Mobile Home must not overflow horizontally")
    assert_true(page.locator("[data-home-hero] h1").is_visible(), "Mobile Hero heading must remain visible")
    assert_true(page.locator("[data-home-hero] a").first.is_visible(), "Mobile primary CTA must remain visible")

    page.screenshot(path=str(output / "home-reference-mobile-ar.png"), full_page=True)
    return {"mobileHeroSource": source, "horizontalOverflow": overflow}


def responsive_sweep(page: Page, base_url: str, output: Path) -> list[dict]:
    results = []
    for width, height in ((768, 900), (1024, 900), (1920, 1080)):
        page.set_viewport_size({"width": width, "height": height})
        open_home(page, base_url, "ar")
        overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        hero_box = page.locator("[data-home-hero]").bounding_box()
        source = page.locator("[data-home-hero-media] img").evaluate("element => element.currentSrc")
        assert_true(overflow <= 1, f"Home must not overflow at {width}px")
        assert_true(
            hero_box is not None and 390 <= hero_box["height"] <= 600,
            f"Hero must preserve the compact reference geometry at {width}px",
        )
        assert_true(page.locator("[data-home-hero] h1").is_visible(), f"Hero heading must remain visible at {width}px")
        assert_true("hero-perfume-ritual-desktop-v3" in source, f"{width}px must use the wide perfume Hero art direction")
        page.screenshot(path=str(output / f"home-reference-hero-{width}-ar.png"))
        results.append({"width": width, "heroHeight": hero_box["height"], "horizontalOverflow": overflow})
    return results


def compact_viewport_sweep(page: Page, base_url: str, output: Path) -> list[dict]:
    results = []
    for width, height in ((320, 568), (430, 932), (667, 375)):
        page.set_viewport_size({"width": width, "height": height})
        open_home(page, base_url, "ar")
        overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        hero_box = page.locator("[data-home-hero]").bounding_box()
        cta_box = page.locator("[data-home-hero] a").first.bounding_box()
        source = page.locator("[data-home-hero-media] img").evaluate("element => element.currentSrc")
        assert_true(overflow <= 1, f"Home must not overflow at {width}x{height}")
        assert_true(hero_box is not None and hero_box["height"] <= 820, f"Mobile Hero must remain bounded at {width}x{height}")
        assert_true(cta_box is not None, f"Primary CTA must remain rendered at {width}x{height}")
        assert_true("hero-perfume-ritual-mobile-v2" in source, f"{width}x{height} must use mobile perfume art direction")
        if width > height:
            assert_true(hero_box["height"] <= 360, "Landscape Hero must use the compact split composition")
            assert_true(cta_box["y"] + cta_box["height"] <= height, "Landscape primary CTA must remain in the first viewport")
        page.screenshot(path=str(output / f"home-reference-{width}x{height}-ar.png"))
        results.append(
            {
                "width": width,
                "height": height,
                "heroHeight": hero_box["height"],
                "horizontalOverflow": overflow,
                "primaryCtaBottom": cta_box["y"] + cta_box["height"],
            }
        )
    return results


def reduced_motion_checks(page: Page, base_url: str) -> dict:
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.emulate_media(reduced_motion="reduce")
    open_home(page, base_url, "ar")
    motion = page.locator("[data-home-signature-motion]").evaluate(
        "element => ({ animation: getComputedStyle(element).animationName, transform: getComputedStyle(element).transform })"
    )
    assert_true(motion["animation"] == "none", "Reduced-motion mode must disable the Hero arrival")
    assert_true(motion["transform"] == "none", "Reduced-motion mode must not leave the Hero copy transformed")
    return motion


def main() -> None:
    parser = argparse.ArgumentParser(description="ÉLORÉ PARIS reference-led Home regression checks")
    parser.add_argument("--base-url", default="http://127.0.0.1:3056")
    parser.add_argument("--output", default=".artifacts/home-reference")
    args = parser.parse_args()
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)

    diagnostics: dict[str, list[str]] = {"consoleErrors": [], "pageErrors": [], "failedResponses": []}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda message: diagnostics["consoleErrors"].append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: diagnostics["pageErrors"].append(str(error)))
        page.on(
            "response",
            lambda response: diagnostics["failedResponses"].append(f"{response.status} {response.url}")
            if response.status >= 400
            else None,
        )
        results = {
            "sourceContracts": source_contract_checks(),
            "desktop": desktop_checks(page, args.base_url.rstrip("/"), output),
            "mobile": mobile_checks(page, args.base_url.rstrip("/"), output),
            "responsiveSweep": responsive_sweep(page, args.base_url.rstrip("/"), output),
            "compactViewportSweep": compact_viewport_sweep(page, args.base_url.rstrip("/"), output),
            "reducedMotion": reduced_motion_checks(page, args.base_url.rstrip("/")),
            "diagnostics": diagnostics,
        }
        browser.close()

    assert_true(not diagnostics["consoleErrors"], f"Browser console errors: {diagnostics['consoleErrors']}")
    assert_true(not diagnostics["pageErrors"], f"Browser page errors: {diagnostics['pageErrors']}")
    assert_true(not diagnostics["failedResponses"], f"Failed responses: {diagnostics['failedResponses']}")
    (output / "results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
