const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

/**
 * Utility class for Selenium tests
 */
class TestUtils {
  /**
   * Creates a new WebDriver instance
   * @param {boolean} headless - Whether to run in headless mode
   * @returns {WebDriver} The WebDriver instance
   */
  static async createDriver(headless = false) {
    const options = new chrome.Options();
    if (headless) {
      options.addArguments("--headless");
    }

    const driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    // Set implicit wait time
    await driver.manage().setTimeouts({ implicit: 10000 });

    return driver;
  }

  /**
   * Login to the application
   * @param {WebDriver} driver - WebDriver instance
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<void>}
   */
  static async login(
    driver,
    email = "user@example.com",
    password = "password123"
  ) {
    await driver.get("http://localhost:5173/login");

    // Enter credentials
    await driver.findElement(By.name("email")).sendKeys(email);
    await driver.findElement(By.name("password")).sendKeys(password);

    // Click login button
    await driver.findElement(By.css('button[type="submit"]')).click();

    // Wait for navigation to home page
    await driver.wait(
      until.urlContains("/home"),
      5000,
      "Expected URL to change to home page"
    );
  }

  /**
   * Take a screenshot and save it to the screenshots directory
   * @param {WebDriver} driver - WebDriver instance
   * @param {string} testName - Name of the test
   * @returns {Promise<string>} Path to the screenshot file
   */
  static async takeScreenshot(driver, testName) {
    const fs = require("fs");
    const path = require("path");

    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(__dirname, "../screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Take screenshot
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const screenshotPath = path.join(
      screenshotsDir,
      `${testName}_${timestamp}.png`
    );
    const screenshot = await driver.takeScreenshot();

    // Save screenshot
    fs.writeFileSync(screenshotPath, screenshot, "base64");
    return screenshotPath;
  }

  /**
   * Add items to cart from a restaurant menu
   * @param {WebDriver} driver - WebDriver instance
   * @param {number} restaurantId - Restaurant ID
   * @param {number} itemCount - Number of items to add
   * @returns {Promise<void>}
   */
  static async addItemsToCart(driver, restaurantId = 1, itemCount = 2) {
    // Navigate to restaurant menu
    await driver.get(`http://localhost:5173/restaurant/${restaurantId}`);

    // Find add to cart buttons
    const addToCartButtons = await driver.findElements(
      By.css(".add-to-cart-btn")
    );

    // Add items to cart
    for (let i = 0; i < Math.min(itemCount, addToCartButtons.length); i++) {
      await addToCartButtons[i].click();
      await driver.sleep(500); // Small delay to ensure item is added
    }
  }
}

module.exports = TestUtils;
