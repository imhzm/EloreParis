from pathlib import Path
from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:3077"
OUTPUT_DIR = Path("test-results/site-content-authority")


def authenticate(context):
    response = context.request.post(
        f"{BASE_URL}/api/ops-access/login",
        headers={"Origin": BASE_URL},
        data={
            "accessCode": "site-content-browser-access",
            "nextPath": "/ops/content",
        },
    )
    assert response.status == 200, response.text()


def audit_view(browser, viewport, screenshot_name):
    context = browser.new_context(viewport=viewport)
    authenticate(context)
    page = context.new_page()
    problems = []
    page.on("console", lambda message: problems.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.on("pageerror", lambda error: problems.append(f"pageerror:{error}"))
    def record_failed_request(request):
        failure = request.failure or ""
        if "_rsc=" in request.url and "ERR_ABORTED" in failure:
            return
        problems.append(f"requestfailed:{request.method}:{request.url}:{failure}")

    page.on("requestfailed", record_failed_request)
    page.on("response", lambda response: problems.append(f"response:{response.status}:{response.url}") if response.status >= 400 else None)

    page.goto(f"{BASE_URL}/ops/content", wait_until="domcontentloaded", timeout=60_000)
    page.get_by_role("heading", name="تحكم فعلي، نشر محكوم، ورجوع بلا فقد بيانات.").wait_for()
    assert page.get_by_text("SITE CONTENT AUTHORITY").is_visible()
    assert page.get_by_role("button", name="حفظ نسخة جديدة").is_visible()
    assert page.get_by_role("heading", name="رفع واعتماد صور الموقع").is_visible()
    assert page.get_by_role("heading", name="Journal, Discovery, Shop, Categories, and Bento").is_visible()
    family = page.get_by_label("Content family")
    family.select_option("shop")
    page.get_by_role("heading", name="Shop hub").wait_for()
    family.select_option("journal-interface")
    page.get_by_label("Surface").select_option("hero-image")
    page.get_by_role("heading", name="Journal hero image").wait_for()
    family.select_option("discovery-interface")
    assert page.get_by_label("Surface").input_value() == "hub"
    page.get_by_role("heading", name="concern hub interface").wait_for()
    family.select_option("journal-article")
    assert page.get_by_text("Structural key · locked").first.is_visible()
    page.get_by_role("button", name="English").click()
    assert page.locator('input[dir="ltr"]').first.is_visible()
    overflow = page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
    assert not overflow, "Horizontal page overflow detected"
    page.screenshot(path=str(OUTPUT_DIR / screenshot_name), full_page=True)
    context.close()
    assert not problems, "\n".join(problems)


OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    audit_view(browser, {"width": 1440, "height": 1000}, "content-desktop.png")
    audit_view(browser, {"width": 390, "height": 844}, "content-mobile.png")
    browser.close()

print("Content Authority desktop/mobile UI, console, network, and overflow checks passed.")
