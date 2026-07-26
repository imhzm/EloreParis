from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import parse_qsl, urljoin, urlparse

from playwright.sync_api import BrowserContext, Page, sync_playwright


VIEWPORTS = (
    ("compact", 320, 720),
    ("mobile", 390, 844),
    ("tablet", 768, 1024),
    ("desktop", 1440, 960),
)

DISCOVERY_CLUSTERS = {
    "concerns": ("pigmentation", "makeup-longwear"),
    "routines": (
        "morning-routine-oily-skin",
        "occasion-base-routine",
        "humidity-proof-hair-routine",
        "after-shower-body-routine",
    ),
    "ingredients": ("niacinamide", "vitamin-c", "hyaluronic-acid", "panthenol", "shea-butter"),
}
LEGACY_DISCOVERY_PATHS = tuple(
    path
    for cluster, slugs in DISCOVERY_CLUSTERS.items()
    for path in (f"/{cluster}", *(f"/{cluster}/{slug}" for slug in slugs))
)
LOCALIZED_DISCOVERY_PATHS = {
    f"/{locale}{path}"
    for locale in ("ar", "en")
    for path in LEGACY_DISCOVERY_PATHS
}
DISCOVERY_BROWSER_CASES = (
    ("/ar/concerns", "ar-SA", "rtl", "hub"),
    ("/en/concerns", "en-SA", "ltr", "hub"),
    ("/ar/routines", "ar-SA", "rtl", "hub"),
    ("/en/routines", "en-SA", "ltr", "hub"),
    ("/ar/ingredients", "ar-SA", "rtl", "hub"),
    ("/en/ingredients", "en-SA", "ltr", "hub"),
    ("/ar/concerns/pigmentation", "ar-SA", "rtl", "detail"),
    ("/en/concerns/makeup-longwear", "en-SA", "ltr", "detail"),
    ("/ar/routines/morning-routine-oily-skin", "ar-SA", "rtl", "detail"),
    ("/en/routines/occasion-base-routine", "en-SA", "ltr", "detail"),
    ("/ar/ingredients/vitamin-c", "ar-SA", "rtl", "detail"),
    ("/en/ingredients/shea-butter", "en-SA", "ltr", "detail"),
)
TRUST_SUPPORT_PATHS = (
    "/trust", "/trust/verification", "/trust/privacy", "/trust/shipping",
    "/trust/returns", "/trust/authenticity", "/about", "/contact", "/faq", "/terms",
)
LOCALIZED_TRUST_SUPPORT_PATHS = {
    f"/{locale}{path}" for locale in ("ar", "en") for path in TRUST_SUPPORT_PATHS
}
TRUST_SUPPORT_CASES = (
    ("/ar/trust", "ar-SA", "rtl"),
    ("/en/trust", "en-SA", "ltr"),
    ("/ar/trust/privacy", "ar-SA", "rtl"),
    ("/en/trust/returns", "en-SA", "ltr"),
    ("/ar/about", "ar-SA", "rtl"),
    ("/en/contact", "en-SA", "ltr"),
    ("/ar/faq", "ar-SA", "rtl"),
    ("/en/terms", "en-SA", "ltr"),
)
JOURNAL_SLUGS = (
    "morning-ritual-for-hot-weather",
    "uneven-tone-without-overcomplication",
    "makeup-longevity-without-heavy-layers",
    "post-wash-hair-rhythm-in-humidity",
    "after-shower-bodycare-by-texture",
    "read-an-ingredient-before-you-choose",
)
LOCALIZED_JOURNAL_PATHS = {
    f"/{locale}/journal" for locale in ("ar", "en")
} | {
    f"/{locale}/journal/{slug}" for locale in ("ar", "en") for slug in JOURNAL_SLUGS
}
JOURNAL_CASES = (
    ("/ar/journal", "ar-SA", "rtl", "hub"),
    ("/en/journal", "en-SA", "ltr", "hub"),
    ("/ar/journal/morning-ritual-for-hot-weather", "ar-SA", "rtl", "article"),
    ("/en/journal/post-wash-hair-rhythm-in-humidity", "en-SA", "ltr", "article"),
)
LOCALIZED_SEARCH_PATHS = {"/ar/search", "/en/search"}
LEGACY_JOURNAL_REDIRECTS = {
    "practical-morning-routine-glow-sunscreen-fast-layering": "/ar/journal/morning-ritual-for-hot-weather",
    "pigmentation-routine-feels-random-what-to-fix-first": "/ar/journal/uneven-tone-without-overcomplication",
    "how-to-choose-makeup-longwear-without-heavy-layering": "/ar/journal/makeup-longevity-without-heavy-layers",
    "calm-hair-after-washing-humid-days-without-heavy-layers": "/ar/journal/post-wash-hair-rhythm-in-humidity",
    "after-shower-body-routine-that-is-easy-to-keep": "/ar/journal/after-shower-bodycare-by-texture",
    "niacinamide-explained-plain-language": "/ar/ingredients/niacinamide",
}


def attach_diagnostics(page: Page, diagnostics: dict[str, list[str]]) -> None:
    def record_request_failure(request) -> None:
        failure = request.failure or "unknown failure"
        request_path = urlparse(request.url).path
        if failure == "net::ERR_ABORTED" and "_rsc=" in request.url:
            return
        if failure == "net::ERR_ABORTED" and request.is_navigation_request():
            return
        if (
            failure == "net::ERR_ABORTED"
            and request.method == "GET"
            and request_path == "/_next/image"
        ):
            return
        if (
            failure == "net::ERR_ABORTED"
            and request.method == "GET"
            and request.url.rstrip("/").endswith(("/ar", "/en"))
        ):
            return
        if (
            failure == "net::ERR_ABORTED"
            and request.method == "GET"
            and request_path in LOCALIZED_DISCOVERY_PATHS
        ):
            return
        if (
            failure == "net::ERR_ABORTED"
            and request.method == "GET"
            and request_path in LOCALIZED_TRUST_SUPPORT_PATHS
        ):
            return
        if (
            failure == "net::ERR_ABORTED"
            and request.method == "GET"
            and request_path in LOCALIZED_JOURNAL_PATHS
        ):
            return
        if (
            failure == "net::ERR_ABORTED"
            and request.method == "GET"
            and request_path.startswith(("/ar/shop/", "/en/shop/"))
            and request_path.rsplit("/", 1)[-1]
            in {"perfumes", "skincare", "makeup", "haircare", "bodycare", "tools", "beauty-sets"}
        ):
            return
        if (
            failure == "net::ERR_ABORTED"
            and request.method in {"GET", "POST"}
            and request_path in LOCALIZED_SEARCH_PATHS
        ):
            return
        diagnostics["request_failures"].append(
            f"{request.method} {request.url}: {failure}"
        )

    page.on(
        "console",
        lambda message: diagnostics["console_errors"].append(message.text)
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: diagnostics["page_errors"].append(str(error)))
    page.on("requestfailed", record_request_failure)
    page.on(
        "response",
        lambda response: diagnostics["bad_responses"].append(
            f"{response.status} {response.url}"
        )
        if response.status >= 400
        else None,
    )


def assert_no_horizontal_overflow(page: Page, label: str) -> None:
    overflow = page.evaluate(
        "Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)"
        " - window.innerWidth"
    )
    if overflow > 1:
        raise AssertionError(f"{label} has {overflow}px horizontal overflow")


def capture_scroll_states(
    page: Page,
    base_url: str,
    route: str,
    output_dir: Path,
    viewport_name: str,
) -> None:
    page.goto(urljoin(base_url, route), wait_until="domcontentloaded")
    page.locator("body").wait_for(state="visible")
    assert_no_horizontal_overflow(page, f"{viewport_name}:{route}")
    total_scroll = page.evaluate(
        "Math.max(document.documentElement.scrollHeight - window.innerHeight, 0)"
    )

    for label, ratio in (("start", 0), ("middle", 0.5), ("end", 0.92)):
        page.evaluate("y => window.scrollTo({ top: y, behavior: 'instant' })", total_scroll * ratio)
        page.wait_for_timeout(250)
        page.screenshot(
            path=str(output_dir / f"{viewport_name}-{route.strip('/').replace('/', '-') or 'home'}-{label}.png")
        )


def verify_sticky_scene(page: Page, scene_selector: str, expected_offset: int) -> None:
    scene = page.locator(scene_selector).first
    scene.scroll_into_view_if_needed()
    page.wait_for_timeout(150)
    frame = scene.locator(":scope > div").first
    position = frame.evaluate("element => getComputedStyle(element).position")
    top = frame.evaluate("element => parseFloat(getComputedStyle(element).top)")
    if position != "sticky":
        raise AssertionError(f"{scene_selector} frame is {position}, expected sticky")
    if abs(top - expected_offset) > 1:
        raise AssertionError(
            f"{scene_selector} sticky offset is {top}, expected {expected_offset}"
        )


def verify_search_keyboard(page: Page, base_url: str) -> None:
    page.goto(urljoin(base_url, "/search"), wait_until="networkidle")
    combobox = page.get_by_role("combobox")
    # Use an approved editorial/ingredient query rather than a quarantined SKU.
    combobox.fill("vitamin c")
    page.get_by_role("listbox").wait_for(state="visible", timeout=10_000)
    combobox.press("ArrowDown")
    active_descendant = combobox.get_attribute("aria-activedescendant")
    if not active_descendant:
        raise AssertionError("Search combobox did not expose aria-activedescendant")
    selected = page.locator(f"#{active_descendant}")
    if selected.get_attribute("aria-selected") != "true":
        raise AssertionError("Keyboard-selected search result is not aria-selected")
    destination = selected.get_attribute("href")
    if destination != "/ar/ingredients/vitamin-c":
        raise AssertionError(
            f"Predictive search ranked {destination} first for vitamin c"
        )
    combobox.press("Enter")
    if destination:
        page.wait_for_url(f"**{destination}", wait_until="networkidle", timeout=10_000)
    else:
        page.wait_for_load_state("networkidle")
    if destination and destination not in page.url:
        raise AssertionError(
            f"Search Enter navigation reached {page.url}, expected {destination}"
        )


def verify_search_surface(
    page: Page,
    base_url: str,
    route: str,
    expected_lang: str,
    expected_dir: str,
    viewport_width: int,
) -> None:
    page.goto(urljoin(base_url, route), wait_until="networkidle")
    scenes = page.locator("[data-search-scene]")
    if scenes.count() != 5:
        raise AssertionError(f"{route} must render five search scenes")
    if page.locator("h1").count() != 1:
        raise AssertionError(f"{route} must expose exactly one h1")
    if page.locator("html").get_attribute("lang") != expected_lang:
        raise AssertionError(f"{route} has an incorrect html lang")
    if page.locator("html").get_attribute("dir") != expected_dir:
        raise AssertionError(f"{route} has an incorrect text direction")
    assert_no_horizontal_overflow(page, route)
    positions = page.locator("[data-search-frame]").evaluate_all(
        "elements => elements.map(element => getComputedStyle(element).position)"
    )
    expected = ["static"]
    if positions != expected:
        raise AssertionError(f"{route} has search frame positions {positions}, expected {expected}")
    if page.locator("[data-search-results] a").count() == 0:
        raise AssertionError(f"{route} did not render search results")
    html = page.content()
    for forbidden in ('href="/products/', "Radiant Dew", "Velvet Base", '"@type":"Product"'):
        if forbidden in html:
            raise AssertionError(f"{route} exposes unapproved search content: {forbidden}")

    sticky_scenes = scenes.evaluate_all(
        "elements => elements.filter(element => getComputedStyle(element).position === 'sticky').length"
    )
    if sticky_scenes:
        raise AssertionError(f"{route} reintroduced sticky search scenes")


def verify_home_motion(
    page: Page,
    base_url: str,
    viewport_width: int,
    route: str,
    expected_lang: str,
    expected_dir: str,
    expected_title: str,
) -> None:
    page.goto(urljoin(base_url, route), wait_until="domcontentloaded")
    page.locator("[data-reference-home]").wait_for(state="visible")
    section_selectors = (
        "[data-home-hero]",
        "[data-home-bento]",
        "[data-home-trust]",
        "[data-home-catalog-gate]",
        "[data-home-routine]",
        "[data-home-gifting]",
        "[data-home-editorial]",
        "[data-home-newsletter]",
    )
    positions = [
        page.locator(selector).evaluate(
            "element => element.getBoundingClientRect().top + scrollY"
        )
        for selector in section_selectors
    ]
    if positions != sorted(positions):
        raise AssertionError(f"{route} has an incorrect reference narrative order")

    html = page.locator("html")
    if html.get_attribute("lang") != expected_lang:
        raise AssertionError(f"{route} has an incorrect html lang")
    if html.get_attribute("dir") != expected_dir:
        raise AssertionError(f"{route} has an incorrect text direction")
    if page.locator("#home-title").inner_text().strip() != expected_title:
        raise AssertionError(f"{route} has incorrect localized hero copy")

    body_text = page.locator("body").inner_text()
    for forbidden in ("Cozmateks", "Bioderma", "Eucerin"):
        if forbidden in body_text:
            raise AssertionError(f"Homepage still exposes forbidden legacy copy: {forbidden}")

    arrival = page.locator("[data-home-signature-motion]").evaluate(
        "element => getComputedStyle(element).animationName"
    )
    if "hero-arrival" not in arrival:
        raise AssertionError(
            f"{route} lost the approved Hero arrival motion: {arrival}"
        )


def verify_discovery_surface(
    page: Page,
    base_url: str,
    route: str,
    expected_lang: str,
    expected_dir: str,
    surface: str,
    viewport_width: int,
) -> None:
    page.goto(urljoin(base_url, route), wait_until="networkidle")
    surface_selector = "[data-discovery-kind]" if surface == "hub" else "[data-discovery-detail]"
    discovery = page.locator(surface_selector)
    discovery.wait_for(state="visible")
    if discovery.count() != 1:
        raise AssertionError(f"{route} must expose one discovery surface")
    if page.locator("h1").count() != 1:
        raise AssertionError(f"{route} must expose exactly one h1")
    if page.locator("html").get_attribute("lang") != expected_lang:
        raise AssertionError(f"{route} has an incorrect html lang")
    if page.locator("html").get_attribute("dir") != expected_dir:
        raise AssertionError(f"{route} has an incorrect text direction")
    assert_no_horizontal_overflow(page, route)

    sticky_sections = discovery.locator("section").evaluate_all(
        "elements => elements.filter(element => getComputedStyle(element).position === 'sticky').length"
    )
    if sticky_sections != 0:
        raise AssertionError(f"{route} must not trap visitors in sticky scenes")

    html = page.content()
    body_text = page.locator("body").inner_text()
    for forbidden in ('href="/products/', '"@type":"Product"', "Radiant Dew", "Velvet Base"):
        if forbidden in html or forbidden in body_text:
            raise AssertionError(f"{route} exposes unapproved commerce content: {forbidden}")

    if expected_dir == "ltr" and surface == "detail":
        related_hrefs = page.locator("[data-discovery-related] a").evaluate_all(
            "elements => elements.map(element => element.getAttribute('href'))"
        )
        if any(href == "/journal" or (href or "").startswith("/search") for href in related_hrefs):
            raise AssertionError(f"{route} links English visitors into a legacy Arabic surface")



def verify_discovery_keyboard(page: Page, base_url: str) -> None:
    page.goto(urljoin(base_url, "/ar/ingredients/vitamin-c"), wait_until="networkidle")
    chapter_link = page.locator('a[href="#chapters"]')
    chapter_link.focus()
    chapter_link.press("Enter")
    page.wait_for_timeout(180)
    if urlparse(page.url).fragment != "chapters":
        raise AssertionError("Discovery chapter CTA did not support keyboard activation")

    summary = page.locator("[data-discovery-faq] summary").first
    summary.scroll_into_view_if_needed()
    summary.focus()
    summary.press("Enter")
    if not summary.locator("xpath=..").evaluate("element => element.open"):
        raise AssertionError("Discovery FAQ did not open from the keyboard")


def verify_journal_keyboard(page: Page, base_url: str) -> None:
    page.goto(
        urljoin(base_url, "/ar/journal/morning-ritual-for-hot-weather"),
        wait_until="networkidle",
    )
    answer_link = page.locator('a[href="#article-answer"]').first
    answer_link.focus()
    answer_link.press("Enter")
    page.wait_for_timeout(180)
    if urlparse(page.url).fragment != "article-answer":
        raise AssertionError("Journal answer CTA did not support keyboard activation")
    toc_link = page.locator('[data-article-toc] a[href="#chapter-1"]')
    toc_link.focus()
    toc_link.press("Enter")
    page.wait_for_timeout(180)
    if urlparse(page.url).fragment != "chapter-1":
        raise AssertionError("Journal TOC did not reach its stable chapter target")
    summary = page.locator("[data-article-faq] summary").first
    summary.scroll_into_view_if_needed()
    summary.focus()
    summary.press("Enter")
    if not summary.locator("xpath=..").evaluate("element => element.open"):
        raise AssertionError("Journal FAQ did not open from the keyboard")


def verify_reduced_motion(
    context: BrowserContext,
    base_url: str,
) -> None:
    page = context.new_page()
    page.goto(urljoin(base_url, "/ar/shop"), wait_until="networkidle")
    shop_positions = page.locator("[data-shop-hub] section").evaluate_all(
        "elements => elements.map(element => getComputedStyle(element).position)"
    )
    scroll_behavior = page.locator("html").evaluate(
        "element => getComputedStyle(element).scrollBehavior"
    )
    if any(position == "sticky" for position in shop_positions):
        raise AssertionError(
            f"Reduced-motion shop reintroduced sticky sections: {shop_positions}"
        )
    if scroll_behavior != "auto":
        raise AssertionError(
            f"Reduced-motion scroll behavior is {scroll_behavior}, expected auto"
        )
    page.goto(urljoin(base_url, "/ar/shop/skincare"), wait_until="networkidle")
    category_positions = page.locator("[data-collection-grid] section").evaluate_all(
        "elements => elements.map(element => getComputedStyle(element).position)"
    )
    if any(position == "sticky" for position in category_positions):
        raise AssertionError(
            f"Reduced-motion category reintroduced sticky sections: {category_positions}"
        )
    page.goto(urljoin(base_url, "/ar"), wait_until="domcontentloaded")
    page.locator("[data-home-signature-motion]").wait_for(state="visible")
    transforms = page.locator(
        "[data-home-signature-motion], [data-home-hero-media] img"
    ).evaluate_all(
        "elements => elements.map(element => getComputedStyle(element).transform)"
    )
    if any(transform != "none" for transform in transforms):
        raise AssertionError(
            f"Reduced-motion homepage still has transforms: {transforms}"
        )
    for route in ("/ar/concerns", "/en/ingredients/vitamin-c"):
        page.goto(urljoin(base_url, route), wait_until="networkidle")
        positions = page.locator("[data-discovery-experience] section").evaluate_all(
            "elements => elements.map(element => getComputedStyle(element).position)"
        )
        if any(position == "sticky" for position in positions):
            raise AssertionError(
                f"Reduced-motion discovery reintroduced sticky frames: {positions}"
            )
    for route, selector in (
        ("/ar/journal", "[data-journal-scene]"),
        ("/en/journal/read-an-ingredient-before-you-choose", "[data-article-scene]"),
    ):
        page.goto(urljoin(base_url, route), wait_until="networkidle")
        positions = page.locator(f"{selector} > [data-journal-frame], {selector} > [data-article-frame]").evaluate_all(
            "elements => elements.map(element => getComputedStyle(element).position)"
        )
        if any(position == "sticky" for position in positions):
            raise AssertionError(
                f"Reduced-motion journal reintroduced sticky frames: {positions}"
            )
        transforms = page.locator("[data-journal-motion] img").evaluate_all(
            "elements => elements.map(element => getComputedStyle(element).transform)"
        )
        if any(transform != "none" for transform in transforms):
            raise AssertionError(
                f"Reduced-motion journal still has transforms: {transforms}"
            )
    page.goto(urljoin(base_url, "/en/search?q=vitamin%20c"), wait_until="networkidle")
    search_positions = page.locator("[data-search-frame]").evaluate_all(
        "elements => elements.map(element => getComputedStyle(element).position)"
    )
    if any(position == "sticky" for position in search_positions):
        raise AssertionError(
            f"Reduced-motion search reintroduced sticky frames: {search_positions}"
        )
    search_animation = page.locator("[data-search-motion]").evaluate(
        "element => getComputedStyle(element).animationName"
    )
    if search_animation != "none":
        raise AssertionError(
            f"Reduced-motion search still has animation: {search_animation}"
        )
    page.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Elore Paris browser regression checks")
    parser.add_argument("--base-url", default="http://127.0.0.1:3056")
    parser.add_argument("--output", default=".artifacts/browser-regression")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/") + "/"
    output_dir = Path(args.output).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    diagnostics: dict[str, list[str]] = {
        "console_errors": [],
        "page_errors": [],
        "request_failures": [],
        "bad_responses": [],
    }

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)

        for viewport_name, width, height in VIEWPORTS:
            context = browser.new_context(viewport={"width": width, "height": height})
            page = context.new_page()
            attach_diagnostics(page, diagnostics)

            for route in (
                "/ar",
                "/en",
                "/ar/shop",
                "/en/shop",
                "/ar/shop/skincare",
                "/en/shop/haircare",
            ):
                capture_scroll_states(
                    page, base_url, route, output_dir, viewport_name
                )

            if viewport_name in {"compact", "mobile", "desktop"}:
                for case_index in (0, 3, 4, 6, 9, 10):
                    capture_scroll_states(
                        page,
                        base_url,
                        DISCOVERY_BROWSER_CASES[case_index][0],
                        output_dir,
                        viewport_name,
                    )
                capture_scroll_states(
                    page, base_url, "/ar/journal", output_dir, viewport_name
                )
                capture_scroll_states(
                    page,
                    base_url,
                    "/en/journal/post-wash-hair-rhythm-in-humidity",
                    output_dir,
                    viewport_name,
                )

            verify_home_motion(
                page,
                base_url,
                width,
                "/ar",
                "ar-SA",
                "rtl",
                "جمالٌ يُروى كتجربة.",
            )
            verify_home_motion(
                page,
                base_url,
                width,
                "/en",
                "en-SA",
                "ltr",
                "Beauty, composed with intention.",
            )

            for shop_route, lang, direction, heading in (
                ("/ar/shop", "ar-SA", "rtl", "الجمال، باختيار\nأكثر هدوءًا."),
                ("/en/shop", "en-SA", "ltr", "Beauty, chosen\nwith more clarity."),
            ):
                page.goto(urljoin(base_url, shop_route), wait_until="networkidle")
                shop = page.locator("[data-shop-hub]")
                shop.wait_for(state="visible")
                if shop.locator(":scope > section").count() != 4:
                    raise AssertionError(f"{shop_route} must render four shop chapters")
                if page.locator("html").get_attribute("lang") != lang:
                    raise AssertionError(f"{shop_route} has an incorrect html lang")
                if page.locator("html").get_attribute("dir") != direction:
                    raise AssertionError(f"{shop_route} has an incorrect text direction")
                if page.locator("h1").inner_text().strip() != heading:
                    raise AssertionError(f"{shop_route} has incorrect localized shop copy")
                sticky_sections = shop.locator(":scope > section").evaluate_all(
                    "elements => elements.filter(element => getComputedStyle(element).position === 'sticky').length"
                )
                if sticky_sections != 0:
                    raise AssertionError(f"{shop_route} must not trap visitors in sticky scenes")
                shop_html = page.content()
                for forbidden_copy in ("BIODERMA", "EUCERIN", "منتجات حقيقية", "منتجات أصلية"):
                    if forbidden_copy in shop_html:
                        raise AssertionError(
                            f"Unapproved shop copy remains visible: {forbidden_copy}"
                        )

            for category_route, lang, direction, heading in (
                ("/ar/shop/skincare", "ar-SA", "rtl", "العناية بالبشرة"),
                ("/en/shop/skincare", "en-SA", "ltr", "Skincare"),
                ("/ar/shop/haircare", "ar-SA", "rtl", "العناية بالشعر"),
                ("/en/shop/haircare", "en-SA", "ltr", "Haircare"),
            ):
                page.goto(urljoin(base_url, category_route), wait_until="networkidle")
                collection = page.locator("[data-collection-grid]")
                collection.wait_for(state="visible")
                if page.locator("[data-collection-hero]").count() != 1:
                    raise AssertionError(f"{category_route} must render one collection Hero")
                if page.locator("[data-collection-routes]").count() != 1:
                    raise AssertionError(f"{category_route} must render its discovery routes")
                if page.locator("html").get_attribute("lang") != lang:
                    raise AssertionError(f"{category_route} has an incorrect html lang")
                if page.locator("html").get_attribute("dir") != direction:
                    raise AssertionError(f"{category_route} has an incorrect text direction")
                if page.locator("h1").inner_text().strip() != heading:
                    raise AssertionError(f"{category_route} has incorrect localized copy")
                sticky_sections = collection.locator("section").evaluate_all(
                    "elements => elements.filter(element => getComputedStyle(element).position === 'sticky').length"
                )
                if sticky_sections != 0:
                    raise AssertionError(f"{category_route} must not trap visitors in sticky scenes")
                catalog_state = collection.locator("[data-catalog-state]").get_attribute(
                    "data-catalog-state"
                )
                if catalog_state == "available":
                    if collection.locator("[data-product-card]").count() == 0:
                        raise AssertionError(
                            f"{category_route} reports an available catalog without product cards"
                        )
                    continue
                if catalog_state != "gated":
                    raise AssertionError(
                        f"{category_route} exposes an unknown catalog state: {catalog_state}"
                    )
                body_text = collection.inner_text()
                for forbidden_copy in ("ر.س", "SAR"):
                    if forbidden_copy in body_text:
                        raise AssertionError(
                            f"Unapproved commerce copy remains in {category_route}: {forbidden_copy}"
                        )
                for forbidden_control in ("عرض المنتج", "View product"):
                    if page.get_by_text(forbidden_control, exact=True).count() > 0:
                        raise AssertionError(
                            f"Unapproved commerce control remains in {category_route}: {forbidden_control}"
                        )

            for discovery_route, lang, direction, surface in DISCOVERY_BROWSER_CASES:
                verify_discovery_surface(
                    page,
                    base_url,
                    discovery_route,
                    lang,
                    direction,
                    surface,
                    width,
                )

            for trust_route, lang, direction in TRUST_SUPPORT_CASES:
                page.goto(urljoin(base_url, trust_route), wait_until="networkidle")
                experience_selector = (
                    "[data-about-editorial]" if trust_route.endswith("/about")
                    else "[data-trust-experience]"
                )
                experience = page.locator(experience_selector)
                experience.wait_for(state="visible", timeout=10_000)
                if experience.count() != 1:
                    raise AssertionError(f"{trust_route} must render one trust experience")
                if page.locator("h1").count() != 1:
                    raise AssertionError(f"{trust_route} must expose exactly one h1")
                if page.locator("html").get_attribute("lang") != lang:
                    raise AssertionError(f"{trust_route} has an incorrect html lang")
                if page.locator("html").get_attribute("dir") != direction:
                    raise AssertionError(f"{trust_route} has an incorrect text direction")
                assert_no_horizontal_overflow(page, trust_route)
                sticky_sections = experience.locator("section").evaluate_all(
                    "elements => elements.filter(element => getComputedStyle(element).position === 'sticky').length"
                )
                if sticky_sections != 0:
                    raise AssertionError(f"{trust_route} must not trap visitors in sticky scenes")
                body_text = page.locator("body").inner_text()
                for forbidden in ("support@example", "+966", "24 hours"):
                    if forbidden in body_text:
                        raise AssertionError(f"{trust_route} exposes invented support facts: {forbidden}")
                contact_hrefs = page.locator('a[href^="mailto:"], a[href^="tel:"], a[href*="wa.me"]').count()
                if contact_hrefs:
                    raise AssertionError(f"{trust_route} exposes an unapproved external contact channel")

            for journal_route, lang, direction, surface in JOURNAL_CASES:
                page.goto(urljoin(base_url, journal_route), wait_until="networkidle")
                selector = "[data-journal-experience]" if surface == "hub" else "[data-article-experience]"
                experience = page.locator(selector)
                experience.wait_for(state="visible", timeout=10_000)
                if experience.count() != 1:
                    raise AssertionError(f"{journal_route} must render one journal experience")
                if page.locator("h1").count() != 1:
                    raise AssertionError(f"{journal_route} must expose exactly one h1")
                if page.locator("html").get_attribute("lang") != lang:
                    raise AssertionError(f"{journal_route} has an incorrect html lang")
                if page.locator("html").get_attribute("dir") != direction:
                    raise AssertionError(f"{journal_route} has an incorrect text direction")
                assert_no_horizontal_overflow(page, journal_route)
                sticky_sections = experience.locator("section").evaluate_all(
                    "elements => elements.filter(element => getComputedStyle(element).position === 'sticky').length"
                )
                if sticky_sections != 0:
                    raise AssertionError(f"{journal_route} must not trap visitors in sticky scenes")
                html = page.content()
                for forbidden in (
                    'href="/products/', '"@type":"Product"', '"@type":"Offer"',
                    '"@type":"FAQPage"', "Radiant Dew", "Velvet Base",
                ):
                    if forbidden in html:
                        raise AssertionError(f"{journal_route} exposes quarantined content: {forbidden}")
                if surface == "article":
                    chapter_ids = page.locator("[data-article-chapters] > section").evaluate_all(
                        "elements => elements.map(element => element.id)"
                    )
                    if chapter_ids != ["chapter-1", "chapter-2", "chapter-3"]:
                        raise AssertionError(f"{journal_route} has unstable chapter ids: {chapter_ids}")

            verify_search_surface(
                page,
                base_url,
                "/ar/search?q=نياسيناميد",
                "ar-SA",
                "rtl",
                width,
            )
            verify_search_surface(
                page,
                base_url,
                "/en/search?q=vitamin%20c",
                "en-SA",
                "ltr",
                width,
            )

            quarantined_product = context.request.get(
                urljoin(base_url, "/products/radiant-dew-serum"),
                max_redirects=0,
            )
            if quarantined_product.status != 308:
                raise AssertionError(
                    "Quarantined prototype PDP must redirect until catalog approval; "
                    f"received {quarantined_product.status}"
                )
            if quarantined_product.headers.get("location") != "/ar/shop":
                raise AssertionError("Quarantined prototype PDP did not redirect to /ar/shop")

            if viewport_name == "desktop":
                root_redirect = context.request.get(base_url, max_redirects=0)
                if root_redirect.status != 308:
                    raise AssertionError("Root URL must return a permanent locale redirect")
                if root_redirect.headers.get("location") != "/ar":
                    raise AssertionError("Root URL did not redirect to /ar")
                shop_redirect = context.request.get(
                    urljoin(base_url, "/shop?source=browser"), max_redirects=0
                )
                if shop_redirect.status != 308 or shop_redirect.headers.get("location") != "/ar/shop?source=browser":
                    raise AssertionError("Legacy shop URL must preserve its query in one redirect")
                category_redirect = context.request.get(
                    urljoin(base_url, "/shop/skincare?source=browser"), max_redirects=0
                )
                if category_redirect.status != 308 or category_redirect.headers.get("location") != "/ar/shop/skincare?source=browser":
                    raise AssertionError("Legacy category URL must preserve its query in one redirect")
                expected_query = {"source": "browser", "ref": "a/b"}
                for legacy_path in LEGACY_DISCOVERY_PATHS:
                    redirect = context.request.get(
                        urljoin(base_url, f"{legacy_path}?source=browser&ref=a%2Fb"),
                        max_redirects=0,
                    )
                    location = redirect.headers.get("location") or ""
                    parsed_location = urlparse(location)
                    if redirect.status != 308 or parsed_location.path != f"/ar{legacy_path}":
                        raise AssertionError(
                            f"Legacy discovery URL {legacy_path} did not redirect once to Arabic"
                        )
                    if dict(parse_qsl(parsed_location.query)) != expected_query:
                        raise AssertionError(
                            f"Legacy discovery URL {legacy_path} did not preserve its query"
                        )
                for legacy_path in TRUST_SUPPORT_PATHS:
                    redirect = context.request.get(
                        urljoin(base_url, f"{legacy_path}?source=browser&ref=a%2Fb"),
                        max_redirects=0,
                    )
                    location = redirect.headers.get("location") or ""
                    parsed_location = urlparse(location)
                    if redirect.status != 308 or parsed_location.path != f"/ar{legacy_path}":
                        raise AssertionError(
                            f"Legacy trust/support URL {legacy_path} did not redirect once to Arabic"
                        )
                    if dict(parse_qsl(parsed_location.query)) != expected_query:
                        raise AssertionError(
                            f"Legacy trust/support URL {legacy_path} did not preserve its query"
                        )
                journal_index = context.request.get(
                    urljoin(base_url, "/journal?source=browser&ref=a%2Fb"), max_redirects=0
                )
                index_location = urlparse(journal_index.headers.get("location") or "")
                if journal_index.status != 308 or index_location.path != "/ar/journal":
                    raise AssertionError("Legacy journal index did not redirect once to Arabic")
                if dict(parse_qsl(index_location.query)) != expected_query:
                    raise AssertionError("Legacy journal index did not preserve its query")
                search_redirect = context.request.get(
                    urljoin(base_url, "/search?q=vitamin%20c&source=browser"),
                    max_redirects=0,
                )
                search_location = urlparse(search_redirect.headers.get("location") or "")
                if search_redirect.status != 308 or search_location.path != "/ar/search":
                    raise AssertionError("Legacy search did not redirect once to Arabic")
                if dict(parse_qsl(search_location.query)) != {"q": "vitamin c", "source": "browser"}:
                    raise AssertionError("Legacy search did not preserve its query")
                for legacy_slug, destination in LEGACY_JOURNAL_REDIRECTS.items():
                    redirect = context.request.get(
                        urljoin(base_url, f"/journal/{legacy_slug}?source=browser&ref=a%2Fb"),
                        max_redirects=0,
                    )
                    location = urlparse(redirect.headers.get("location") or "")
                    if redirect.status != 308 or location.path != destination:
                        raise AssertionError(
                            f"Legacy journal URL {legacy_slug} did not reach its exact replacement"
                        )
                    if dict(parse_qsl(location.query)) != expected_query:
                        raise AssertionError(
                            f"Legacy journal URL {legacy_slug} did not preserve its query"
                        )
                retired = context.request.get(
                    urljoin(base_url, "/journal/serum-or-moisturizer-how-to-choose-right-morning-layer"),
                    max_redirects=0,
                )
                if retired.status != 410 or "noindex" not in (retired.headers.get("x-robots-tag") or ""):
                    raise AssertionError("Retired journal content must return a noindex 410")
                for missing_path in (
                    "/ar/concerns/not-a-route",
                    "/en/routines/not-a-route",
                    "/ar/ingredients/not-a-route",
                    "/en/ingredients/not-a-route",
                    "/ar/routines/vitamin-c",
                    "/en/trust/not-a-route",
                    "/ar/journal/not-a-route",
                    "/en/journal/not-a-route",
                    "/ar/search/not-a-route",
                    "/en/search/not-a-route",
                ):
                    missing = context.request.get(urljoin(base_url, missing_path), max_redirects=0)
                    if missing.status != 404:
                        raise AssertionError(f"Unknown discovery route {missing_path} must return 404")
                verify_discovery_keyboard(page, base_url)
                verify_journal_keyboard(page, base_url)
                verify_search_keyboard(page, base_url)

            context.close()

        for reduced_viewport in (
            {"width": 390, "height": 844},
            {"width": 1440, "height": 960},
        ):
            reduced_context = browser.new_context(
                viewport=reduced_viewport, reduced_motion="reduce"
            )
            verify_reduced_motion(reduced_context, base_url)
            reduced_context.close()
        browser.close()

    (output_dir / "diagnostics.json").write_text(
        json.dumps(diagnostics, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    failures = {key: value for key, value in diagnostics.items() if value}
    if failures:
        raise AssertionError(json.dumps(failures, ensure_ascii=False, indent=2))

    print(
        json.dumps(
            {
                "status": "passed",
                "viewports": [name for name, _, _ in VIEWPORTS],
                "output": str(output_dir),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
