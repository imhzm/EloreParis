import argparse
import json
from pathlib import Path

from playwright.sync_api import Page, sync_playwright


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def open_home(page: Page, base_url: str, locale: str) -> None:
    page.goto(f"{base_url}/{locale}", wait_until="domcontentloaded")
    page.locator("[data-home-scene]").first.wait_for(state="visible", timeout=15_000)
    page.wait_for_function("document.fonts?.status === 'loaded'", timeout=15_000)


def scene_midpoint(page: Page, index: int) -> None:
    page.locator("[data-home-scene]").nth(index).evaluate(
        """scene => {
            const travel = Math.max(scene.offsetHeight - window.innerHeight, 1);
            window.scrollTo({ top: scene.offsetTop + travel * 0.55, behavior: 'instant' });
        }"""
    )
    page.wait_for_timeout(250)


def desktop_checks(page: Page, base_url: str, output: Path) -> dict:
    page.set_viewport_size({"width": 1440, "height": 1000})
    open_home(page, base_url, "ar")

    scenes = page.locator("[data-home-scene]")
    viewports = page.locator("[data-home-cinematic-viewport]")
    assert_true(scenes.count() == 10, "The home page must expose exactly ten scroll scenes")
    assert_true(viewports.count() == 6, "Six home scenes must use a full-screen cinematic viewport")

    hero = scenes.first
    hero_height = hero.evaluate("element => element.getBoundingClientRect().height")
    assert_true(hero_height >= 1700, "The desktop hero needs enough scroll travel for continuous motion")

    viewport_style = viewports.first.evaluate(
        "element => ({ position: getComputedStyle(element).position, top: getComputedStyle(element).top })"
    )
    assert_true(viewport_style["position"] == "sticky", "Desktop cinematic frames must remain sticky")

    world = page.locator("[data-home-3d-world]")
    transform_start = world.evaluate("element => getComputedStyle(element).transform")
    scale_start = world.evaluate(
        "element => new DOMMatrixReadOnly(getComputedStyle(element).transform).a"
    )
    assert_true(scale_start <= 1.04, "Hero scroll scale must stay within the 1.035 motion budget")
    page.screenshot(path=str(output / "home-3d-desktop-hero-start.png"))
    scene_midpoint(page, 0)
    transform_mid = world.evaluate("element => getComputedStyle(element).transform")
    progress_mid = float(hero.evaluate("element => getComputedStyle(element).getPropertyValue('--progress')"))
    assert_true(0.35 < progress_mid < 0.75, "Hero progress must follow the current scroll position")
    assert_true(transform_start != transform_mid, "The 3D camera transform must change during hero scrolling")

    scene_midpoint(page, 1)
    product = page.locator("[data-home-3d-object]")
    product_transform = product.evaluate("element => getComputedStyle(element).transform")
    assert_true(product_transform != "none", "The product monument must render as a 3D object")
    product_rotation_y = product.evaluate(
        """element => {
            const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
            return Math.abs(Math.atan2(matrix.m13, matrix.m11) * 180 / Math.PI);
        }"""
    )
    assert_true(product_rotation_y <= 3.1, "Product motion must stay within the approved 2-3 degree range")
    page.screenshot(path=str(output / "home-3d-desktop-product.png"))

    scene_midpoint(page, 9)
    newsletter = page.locator("#newsletter")
    newsletter.wait_for(state="visible")
    finale = newsletter.evaluate(
        """element => {
            const rect = element.getBoundingClientRect();
            const content = element.closest('[class*=editContent]');
            return {
                top: rect.top,
                bottom: rect.bottom,
                opacity: Number.parseFloat(getComputedStyle(content).opacity),
            };
        }"""
    )
    assert_true(finale["opacity"] >= 0.95, "The newsletter finale must remain fully opaque at its interaction point")
    assert_true(finale["top"] >= 0 and finale["bottom"] <= 1000, "The newsletter form must fit inside the desktop viewport")
    assert_true(newsletter.locator("input[type=checkbox]").is_visible(), "Newsletter consent must be visible")
    page.screenshot(path=str(output / "home-3d-desktop-newsletter.png"))

    open_home(page, base_url, "en")
    assert_true(page.locator("html").get_attribute("dir") == "ltr", "English home must remain LTR")
    assert_true(page.locator("h1").count() == 1, "English home must keep one primary heading")

    return {
        "sceneCount": scenes.count(),
        "cinematicViewportCount": viewports.count(),
        "heroProgressAtMidpoint": progress_mid,
        "heroScaleAtStart": scale_start,
        "productRotationY": product_rotation_y,
        "newsletterFinale": finale,
        "stickyTop": viewport_style["top"],
    }


def mobile_checks(page: Page, base_url: str, output: Path) -> dict:
    page.set_viewport_size({"width": 390, "height": 844})
    open_home(page, base_url, "ar")
    viewport = page.locator("[data-home-cinematic-viewport]").first
    position = viewport.evaluate("element => getComputedStyle(element).position")
    assert_true(position == "relative", "Mobile cinematic scenes must use the lightweight static layout")
    overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    assert_true(overflow <= 1, "Mobile home must not overflow horizontally")
    product_transform = page.locator("[data-home-3d-object]").evaluate(
        "element => getComputedStyle(element).transform"
    )
    assert_true(product_transform == "none", "Mobile must use the static product fallback")
    page.screenshot(path=str(output / "home-3d-mobile-hero.png"))
    return {
        "cinematicPosition": position,
        "horizontalOverflow": overflow,
        "productTransform": product_transform,
    }


def reduced_motion_checks(page: Page, base_url: str) -> dict:
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.emulate_media(reduced_motion="reduce")
    open_home(page, base_url, "ar")
    scene_midpoint(page, 1)
    product_transform = page.locator("[data-home-3d-object]").evaluate(
        "element => getComputedStyle(element).transform"
    )
    cue_display = page.locator("[aria-hidden='true']", has_text="SCROLL TO EXPLORE").evaluate(
        "element => getComputedStyle(element).display"
    )
    assert_true(product_transform == "none", "Reduced-motion mode must disable the 3D product transform")
    assert_true(cue_display == "none", "Reduced-motion mode must hide the animated scroll cue")
    return {"productTransform": product_transform, "scrollCueDisplay": cue_display}


def main() -> None:
    parser = argparse.ArgumentParser(description="ÉLORÉ PARIS home 3D regression checks")
    parser.add_argument("--base-url", default="http://127.0.0.1:3056")
    parser.add_argument("--output", default=".artifacts/home-3d")
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
            "desktop": desktop_checks(page, args.base_url.rstrip("/"), output),
            "mobile": mobile_checks(page, args.base_url.rstrip("/"), output),
            "reducedMotion": reduced_motion_checks(page, args.base_url.rstrip("/")),
            "diagnostics": diagnostics,
        }
        browser.close()

    assert_true(not diagnostics["pageErrors"], f"Browser page errors: {diagnostics['pageErrors']}")
    assert_true(not diagnostics["failedResponses"], f"Failed responses: {diagnostics['failedResponses']}")
    (output / "results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
