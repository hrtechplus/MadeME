const { Builder, By, Key, until } = require("selenium-webdriver");
const { expect } = require("chai");
const TestUtils = require("./testUtils");
const fs = require("fs");
const path = require("path");

describe("Signup Tests", function () {
  let driver;

  // Generate a unique email for each test run to avoid conflicts
  const timestamp = new Date().getTime();
  const testEmail = `test.user.${timestamp}@example.com`;
  const testPassword = "Password123";
  const testName = "Test User";

  before(async function () {
    // Create driver with visible browser (not headless)
    driver = await TestUtils.createDriver(false);
  });

  after(async function () {
    // Close the browser after tests
    if (driver) {
      await driver.quit();
    }
  });

  it("should navigate to the register page", async function () {
    // Navigate to the homepage
    await driver.get("http://localhost:5173");

    // Take a screenshot of the homepage
    await TestUtils.takeScreenshot(driver, "signup-homepage");

    // Find and click on the signup/register link in the navbar
    const registerLink = await driver.findElement(
      By.css('a[href="/register"]')
    );
    await registerLink.click();

    // Verify that we are on the registration page
    await driver.wait(until.urlContains("/register"), 5000);

    // Take a screenshot of the registration page
    await TestUtils.takeScreenshot(driver, "signup-register-page");

    const pageTitle = await driver.findElement(By.css("h1")).getText();
    expect(pageTitle).to.include("Create Account");
  });

  it("should be able to fill out the registration form", async function () {
    // Fill in the form fields
    await driver.findElement(By.name("name")).sendKeys(testName);
    await driver.findElement(By.name("email")).sendKeys(testEmail);
    await driver.findElement(By.name("password")).sendKeys(testPassword);

    // Find confirm password field and fill it
    await driver.findElement(By.name("confirmPassword")).sendKeys(testPassword);

    // Take a screenshot of the filled form
    await TestUtils.takeScreenshot(driver, "signup-filled-form");

    // Optional: Log the test data being used
    console.log(`Test signup with email: ${testEmail} and name: ${testName}`);
  });

  it("should submit the form and register successfully", async function () {
    // Find and click the submit button
    const submitButton = await driver.findElement(
      By.css('button[type="submit"]')
    );
    await submitButton.click();

    // Wait for registration to complete - either we get a success message or are redirected to login
    try {
      // Option 1: Look for success message that appears on the page
      await driver.wait(
        until.elementLocated(By.css(".MuiAlert-standardSuccess")),
        5000
      );

      // Take screenshot of success message
      await TestUtils.takeScreenshot(driver, "signup-success-message");

      // Option 2: Check if redirected to login page
      await driver.wait(until.urlContains("/login"), 7000);
      console.log("Successfully redirected to login page after registration");

      // Take screenshot of login page after redirect
      await TestUtils.takeScreenshot(driver, "signup-redirect-to-login");
    } catch (error) {
      // If neither happens, check for error messages
      const errorElement = await driver.findElements(
        By.css(".MuiAlert-standardError")
      );
      if (errorElement.length > 0) {
        const errorText = await errorElement[0].getText();
        console.error(`Registration error: ${errorText}`);

        // Take screenshot of error
        await TestUtils.takeScreenshot(driver, "signup-error");

        // If the error is about the user already existing, that's acceptable for our test
        if (errorText.includes("already exists")) {
          console.log("User already exists, considering test as passed");
        } else {
          throw new Error(`Registration failed: ${errorText}`);
        }
      } else {
        throw error;
      }
    }
  });

  it("should verify login with newly created account", async function () {
    // Navigate to login page (if not already there)
    await driver.get("http://localhost:5173/login");

    // Enter credentials for the newly created account
    await driver.findElement(By.name("email")).sendKeys(testEmail);
    await driver.findElement(By.name("password")).sendKeys(testPassword);

    // Take screenshot before login
    await TestUtils.takeScreenshot(driver, "signup-login-attempt");

    // Click login button
    await driver.findElement(By.css('button[type="submit"]')).click();

    // Wait for successful login (redirect to home page)
    try {
      await driver.wait(
        until.urlContains("/home"),
        5000,
        "Expected URL to change to home page"
      );

      // Take screenshot of successful login
      await TestUtils.takeScreenshot(driver, "signup-successful-login");

      // Verify some element that indicates successful login, like username in navbar
      const userElement = await driver.findElement(
        By.css(".user-profile, .username")
      );
      expect(await userElement.isDisplayed()).to.be.true;
    } catch (error) {
      // Take screenshot of any errors
      await TestUtils.takeScreenshot(driver, "signup-login-error");
      throw error;
    }
  });
});
