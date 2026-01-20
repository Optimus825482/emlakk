"""
Diagnostic Script - Test Chrome startup step by step
Identify exactly where the issue occurs
"""

import sys
import logging
import time

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

chromium_path = r"C:\Users\erkan\undetected-chromium\chromium\chrome-win\chrome.exe"
chromedriver_path = r"C:\Users\erkan\chromedriver\win64-146.0.7643.0\chromedriver-win64\chromedriver.exe"

test_url = "https://www.sahibinden.com/satilik-arsa/sakarya-hendek?pagingSize=50&sorting=date_desc"


def test_basic_selenium():
    """Test 1: Try with regular Selenium (no undetected)"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 1: Basic Selenium Chrome (no undetected_chromedriver)")
    logger.info("=" * 60)

    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.chrome.options import Options

        logger.info("✓ Selenium imported successfully")

        options = Options()
        options.binary_location = chromium_path
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--lang=tr-TR")

        logger.info(f"✓ Chrome options set")
        logger.info(f"✓ Binary path: {chromium_path}")
        logger.info(f"✓ Driver path: {chromedriver_path}")

        logger.info("⏳ Starting Chrome with basic Selenium...")
        service = Service(executable_path=chromedriver_path)

        driver = webdriver.Chrome(service=service, options=options)

        logger.info("✅ Chrome started successfully!")
        logger.info(f"✓ Current URL: {driver.current_url}")

        time.sleep(2)

        logger.info("⏳ Navigating to test URL...")
        driver.get(test_url)

        logger.info(f"✅ Page loaded: {driver.title}")
        logger.info(f"✓ Page URL: {driver.current_url}")

        time.sleep(3)
        driver.quit()
        logger.info("✅ Chrome closed successfully")
        return True

    except Exception as e:
        logger.error(f"❌ Basic Selenium test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_undetected_basic():
    """Test 2: undetected_chromedriver with auto version detection"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 2: undetected_chromedriver (auto version)")
    logger.info("=" * 60)

    try:
        import undetected_chromedriver as uc

        logger.info("✓ undetected_chromedriver imported")

        options = uc.ChromeOptions()
        options.binary_location = chromium_path
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--lang=tr-TR")

        logger.info(f"✓ Options configured")
        logger.info("⏳ Starting Chrome with undetected_chromedriver (auto version)...")

        driver = uc.Chrome(options=options, version_main=None, use_subprocess=False)

        logger.info("✅ Chrome started successfully!")
        logger.info(f"✓ Current URL: {driver.current_url}")

        time.sleep(2)

        logger.info("⏳ Navigating to test URL...")
        driver.get(test_url)

        logger.info(f"✅ Page loaded: {driver.title}")
        logger.info(f"✓ Page URL: {driver.current_url}")

        time.sleep(5)

        page_source = driver.page_source
        if (
            "searchresultstable" in page_source.lower()
            or "classifieddetailtitle" in page_source.lower()
        ):
            logger.info("✅ Page content loaded (found expected elements)")
        else:
            logger.warning("⚠️ Page loaded but might be blocked/redirected")

        time.sleep(2)
        driver.quit()
        logger.info("✅ Chrome closed successfully")
        return True

    except Exception as e:
        logger.error(f"❌ undetected_chromedriver auto test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_undetected_manual():
    """Test 3: undetected_chromedriver with manual driver 146"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 3: undetected_chromedriver (manual driver 146)")
    logger.info("=" * 60)

    try:
        import undetected_chromedriver as uc

        logger.info("✓ undetected_chromedriver imported")

        options = uc.ChromeOptions()
        options.binary_location = chromium_path
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--lang=tr-TR")

        logger.info(f"✓ Options configured")
        logger.info(f"✓ Manual driver path: {chromedriver_path}")
        logger.info(
            "⏳ Starting Chrome with undetected_chromedriver (manual driver 146)..."
        )

        driver = uc.Chrome(
            options=options,
            driver_executable_path=chromedriver_path,
            version_main=146,
            use_subprocess=False,
            headless=False,
        )

        logger.info("✅ Chrome started successfully!")
        logger.info(f"✓ Current URL: {driver.current_url}")

        time.sleep(2)

        logger.info("⏳ Navigating to test URL...")
        driver.get(test_url)

        logger.info(f"✅ Page loaded: {driver.title}")
        logger.info(f"✓ Page URL: {driver.current_url}")

        time.sleep(5)

        page_source = driver.page_source
        if (
            "searchresultstable" in page_source.lower()
            or "classifieddetailtitle" in page_source.lower()
        ):
            logger.info("✅ Page content loaded (found expected elements)")
        else:
            logger.warning("⚠️ Page loaded but might be blocked/redirected")

        time.sleep(2)
        driver.quit()
        logger.info("✅ Chrome closed successfully")
        return True

    except Exception as e:
        logger.error(f"❌ undetected_chromedriver manual 146 test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_chromedriver_version():
    """Test 4: Check ChromeDriver version compatibility"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 4: ChromeDriver Version Check")
    logger.info("=" * 60)

    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service

        logger.info(f"Checking ChromeDriver: {chromedriver_path}")

        service = Service(executable_path=chromedriver_path)
        driver = webdriver.Chrome(service=service)

        capabilities = driver.capabilities
        logger.info(f"✓ Chrome version: {capabilities.get('browserVersion')}")
        logger.info(
            f"✓ ChromeDriver version: {capabilities.get('chrome', {}).get('chromedriverVersion')}"
        )

        driver.quit()
        return True

    except Exception as e:
        logger.error(f"❌ Version check failed: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    logger.info("\n" + "#" * 60)
    logger.info("# CHROME DIAGNOSTIC SCRIPT")
    logger.info("#" * 60)

    results = {}

    # Run all tests
    results["basic_selenium"] = test_basic_selenium()
    results["undetected_auto"] = test_undetected_basic()
    results["undetected_manual_146"] = test_undetected_manual()
    results["version_check"] = test_chromedriver_version()

    # Summary
    logger.info("\n" + "#" * 60)
    logger.info("# TEST SUMMARY")
    logger.info("#" * 60)
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        logger.info(f"{test_name}: {status}")

    # Recommendation
    logger.info("\n" + "=" * 60)
    logger.info("RECOMMENDATION")
    logger.info("=" * 60)

    if results["basic_selenium"]:
        logger.info("✓ Basic Selenium works - Chrome/ChromeDriver compatible")
    else:
        logger.error("✗ Basic Selenium fails - Chrome/ChromeDriver mismatch!")

    if results["undetected_auto"]:
        logger.info("✓ undetected_chromedriver (auto version) works")
        logger.info("  → Use version_main=None in your script")
    elif results["undetected_manual_146"]:
        logger.info("✓ undetected_chromedriver (manual 146) works")
        logger.info("  → Your current config should work")
    else:
        logger.error("✗ undetected_chromedriver fails - Try:")
        logger.error("  1. Use stable ChromeDriver (not canary)")
        logger.error("  2. Use version_main=None for auto detection")
        logger.error("  3. Check Chrome binary version matches driver")

    logger.info("\n")
