const { Builder, By, Key, until } = require("selenium-webdriver");
const { expect } = require("chai");
const TestUtils = require("./testUtils");
const fs = require("fs");
const path = require("path");

describe("Basic Signup Test", function () {
  let driver;

  before(async function () {
    this.timeout(30000); // Increase timeout for setup

    try {
      // Create driver with visible browser (not headless)
      console.log("Initializing Chrome WebDriver...");
      driver = await TestUtils.createDriver(false);
      console.log("Chrome WebDriver initialized successfully");
    } catch (error) {
      console.error("Failed to initialize WebDriver:", error.message);
      throw error;
    }
  });

  after(async function () {
    // Close the browser after tests or if tests fail
    if (driver) {
      console.log("Closing browser...");
      await driver.quit();
      console.log("Browser closed successfully");
    }
  });

  it("should navigate to the application and verify it loads", async function () {
    this.timeout(30000); // Increase timeout for navigation

    try {
      console.log("Navigating to homepage...");
      await driver.get("http://localhost:5173");

      // Wait for some element that indicates the page has loaded
      console.log("Waiting for page to load...");
      await driver.wait(until.elementLocated(By.css("body")), 10000);

      // Take a screenshot regardless of outcome
      await TestUtils.takeScreenshot(driver, "basic-homepage-loaded");

      // Get and log the title for debugging
      const title = await driver.getTitle();
      console.log(`Page loaded with title: "${title}"`);

      // Get and log the URL for debugging
      const url = await driver.getCurrentUrl();
      console.log(`Current URL: ${url}`);

      // Success!
      console.log("Homepage successfully loaded");
    } catch (error) {
      // Take a screenshot on failure to help debugging
      if (driver) {
        await TestUtils.takeScreenshot(driver, "basic-homepage-failure");
      }
      console.error("Failed to load homepage:", error.message);
      throw error;
    }
  });

  it("should fill out and submit a basic registration form", async function () {
    this.timeout(30000); // Increase timeout for registration

    try {
      // Generate unique test email
      const timestamp = new Date().getTime();
      const testEmail = `test.user.${timestamp}@example.com`;
      const testPassword = "Password123";
      const testName = "Test User";

      // Navigate directly to register page
      console.log("Navigating to register page...");
      await driver.get("http://localhost:5173/register");

      // Wait for the form to be visible
      console.log("Waiting for registration form...");
      await driver.wait(until.elementLocated(By.name("email")), 10000);

      // Take screenshot before filling form
      await TestUtils.takeScreenshot(driver, "basic-register-page");

      // Fill out form
      console.log("Filling out registration form...");
      await driver.findElement(By.name("name")).sendKeys(testName);
      await driver.findElement(By.name("email")).sendKeys(testEmail);
      await driver.findElement(By.name("password")).sendKeys(testPassword);
      await driver
        .findElement(By.name("confirmPassword"))
        .sendKeys(testPassword);

      // Take screenshot of filled form
      await TestUtils.takeScreenshot(driver, "basic-filled-form");

      // Submit form
      console.log("Submitting registration form...");
      const submitButton = await driver.findElement(
        By.css('button[type="submit"]')
      );
      await submitButton.click();

      // Wait for some kind of response (redirect or message)
      console.log("Waiting for registration response...");
      await driver.sleep(5000); // Simple wait to see the response

      // Take final screenshot regardless of outcome
      await TestUtils.takeScreenshot(driver, "basic-registration-result");

      // Report the current URL for debugging
      const finalUrl = await driver.getCurrentUrl();
      console.log(`After submission URL: ${finalUrl}`);
    } catch (error) {
      console.error("Registration test failed:", error.message);

      // Take error screenshot
      if (driver) {
        await TestUtils.takeScreenshot(driver, "basic-registration-error");
      }

      throw error;
    }
  });
});
