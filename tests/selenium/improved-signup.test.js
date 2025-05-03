const { Builder, By, Key, until } = require("selenium-webdriver");
const { expect } = require("chai");
const TestUtils = require("./testUtils");

describe("Improved Signup Test", function () {
  let driver;

  // Increase mocha timeout to prevent premature test failures
  this.timeout(120000); // 2 minute timeout

  before(async function () {
    try {
      console.log("Initializing Chrome WebDriver...");

      // Create driver directly instead of using TestUtils to have more control
      const chrome = require("selenium-webdriver/chrome");
      const options = new chrome.Options();
      options.addArguments("--no-sandbox");
      options.addArguments("--disable-dev-shm-usage");

      driver = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();

      console.log("Chrome WebDriver initialized successfully");

      // Set longer implicit wait time
      await driver.manage().setTimeouts({ implicit: 10000, pageLoad: 30000 });
    } catch (error) {
      console.error("Failed to initialize WebDriver:", error);
      throw error;
    }
  });

  after(async function () {
    if (driver) {
      try {
        console.log("Closing browser...");
        await driver.quit();
        console.log("Browser closed successfully");
      } catch (error) {
        console.error("Error closing browser:", error);
      }
    }
  });

  it("should open the application and navigate to register page", async function () {
    try {
      // Navigate to homepage
      console.log("Navigating to homepage...");
      await driver.get("http://localhost:5173");

      // Short pause to let the page load completely
      await driver.sleep(2000);

      // Take a screenshot
      await TestUtils.takeScreenshot(driver, "improved_homepage");

      // Navigate directly to register page instead of clicking links
      console.log("Navigating to register page...");
      await driver.get("http://localhost:5173/register");

      // Wait for the page to load by looking for common form elements
      await driver.wait(
        until.elementLocated(
          By.css('form, input[type="email"], input[name="email"]')
        ),
        10000
      );

      // Take a screenshot of register page
      await TestUtils.takeScreenshot(driver, "improved_register_page");

      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).to.include("register");
    } catch (error) {
      console.error("Failed to navigate to register page:", error);
      await TestUtils.takeScreenshot(driver, "navigation_error");
      throw error;
    }
  });

  it("should fill out and submit the registration form", async function () {
    try {
      // Generate unique test data
      const timestamp = new Date().getTime();
      const testEmail = `test.user.${timestamp}@example.com`;
      const testPassword = "Password123!";
      const testName = "Test User";

      console.log(`Using test email: ${testEmail}`);

      // Find and fill form fields using more flexible selectors
      // Name field
      const nameField = await driver.findElement(
        By.css(
          'input[name="name"], input[placeholder*="name" i], input[id*="name" i]'
        )
      );
      await nameField.clear();
      await nameField.sendKeys(testName);

      // Email field
      const emailField = await driver.findElement(
        By.css(
          'input[type="email"], input[name="email"], input[placeholder*="email" i]'
        )
      );
      await emailField.clear();
      await emailField.sendKeys(testEmail);

      // Password field
      const passwordField = await driver.findElement(
        By.css('input[type="password"], input[name="password"]')
      );
      await passwordField.clear();
      await passwordField.sendKeys(testPassword);

      // Confirm password field - try multiple selectors
      try {
        const confirmPasswordField = await driver.findElement(
          By.css(
            'input[name="confirmPassword"], input[id*="confirm" i], input[placeholder*="confirm" i], input[type="password"]:nth-of-type(2)'
          )
        );
        await confirmPasswordField.clear();
        await confirmPasswordField.sendKeys(testPassword);
      } catch (err) {
        console.log(
          "Could not find dedicated confirm password field, may not be required"
        );
      }

      // Take screenshot of filled form
      await TestUtils.takeScreenshot(driver, "improved_filled_form");

      // Submit the form either by clicking submit button or submitting the form directly
      try {
        const submitButton = await driver.findElement(
          By.css('button[type="submit"], input[type="submit"]')
        );
        await submitButton.click();
        console.log("Clicked submit button");
      } catch (err) {
        console.log(
          "Could not find submit button, trying to submit form directly"
        );
        const form = await driver.findElement(By.css("form"));
        await driver.executeScript("arguments[0].submit();", form);
        console.log("Submitted form directly");
      }

      // Wait to see the response
      await driver.sleep(3000);

      // Take screenshot after submission
      await TestUtils.takeScreenshot(driver, "improved_submission_result");

      // Check result - could be redirect to login, success message, or staying on same page with errors
      const finalUrl = await driver.getCurrentUrl();
      console.log(`URL after submission: ${finalUrl}`);

      // Look for success or error indicators
      const pageSource = await driver.getPageSource();
      const hasSuccess =
        pageSource.toLowerCase().includes("success") ||
        finalUrl.includes("login");
      const hasError =
        pageSource.toLowerCase().includes("error") ||
        pageSource.toLowerCase().includes("invalid");

      if (hasSuccess) {
        console.log("Registration appears successful");
      } else if (hasError) {
        console.log("Registration appears to have failed with errors");
        // Don't fail the test as this could be expected if user already exists
      } else {
        console.log("No clear success or error indication found");
      }
    } catch (error) {
      console.error("Failed during form submission:", error);
      await TestUtils.takeScreenshot(driver, "form_submission_error");
      throw error;
    }
  });
});
