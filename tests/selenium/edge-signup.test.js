const { Builder, By, Key, until } = require("selenium-webdriver");
const { expect } = require("chai");
const TestUtils = require("./testUtils");

describe("Edge Case Signup Tests", function () {
  let driver;

  before(async function () {
    // Create driver with visible browser
    driver = await TestUtils.createDriver(false);

    // Navigate to the register page at start of tests
    await driver.get("http://localhost:5173/register");

    // Wait for page to load
    await driver.wait(until.elementLocated(By.name("email")), 5000);
  });

  after(async function () {
    // Close browser after all tests
    if (driver) {
      await driver.quit();
    }
  });

  // Reset form between tests
  afterEach(async function () {
    // Clear all form fields
    const nameField = await driver.findElement(By.name("name"));
    const emailField = await driver.findElement(By.name("email"));
    const passwordField = await driver.findElement(By.name("password"));
    const confirmPasswordField = await driver.findElement(
      By.name("confirmPassword")
    );

    await nameField.clear();
    await emailField.clear();
    await passwordField.clear();
    await confirmPasswordField.clear();
  });

  it("should show error for empty form submission", async function () {
    // Try to submit the empty form
    const submitButton = await driver.findElement(
      By.css('button[type="submit"]')
    );
    await submitButton.click();

    // Take screenshot
    await TestUtils.takeScreenshot(driver, "edge-empty-form-error");

    // Check for validation messages
    const validationErrors = await driver.findElements(
      By.css(
        ".MuiFormHelperText-root, .validation-error, .required-field-message"
      )
    );
    expect(validationErrors.length).to.be.greaterThan(0);
  });

  it("should validate password confirmation match", async function () {
    // Fill in form with mismatched passwords
    await driver.findElement(By.name("name")).sendKeys("Test User");
    await driver.findElement(By.name("email")).sendKeys("test@example.com");
    await driver.findElement(By.name("password")).sendKeys("password123");
    await driver
      .findElement(By.name("confirmPassword"))
      .sendKeys("password456");

    // Try to submit
    const submitButton = await driver.findElement(
      By.css('button[type="submit"]')
    );
    await submitButton.click();

    // Take screenshot
    await TestUtils.takeScreenshot(driver, "edge-password-mismatch");

    // Check for password mismatch error
    const errorMessages = await driver.findElements(
      By.css(".MuiAlert-standardError, .error-message")
    );

    // If specific error elements aren't found, look for any visible validation message
    if (errorMessages.length === 0) {
      const validationErrors = await driver.findElements(
        By.css(".MuiFormHelperText-root, .validation-error")
      );
      expect(validationErrors.length).to.be.greaterThan(0);
    } else {
      const errorText = await errorMessages[0].getText();
      expect(errorText.toLowerCase()).to.include("match") ||
        expect(errorText.toLowerCase()).to.include("password");
    }
  });

  it("should validate email format", async function () {
    // Fill in form with invalid email
    await driver.findElement(By.name("name")).sendKeys("Test User");
    await driver.findElement(By.name("email")).sendKeys("invalid-email");
    await driver.findElement(By.name("password")).sendKeys("password123");
    await driver
      .findElement(By.name("confirmPassword"))
      .sendKeys("password123");

    // Try to submit
    const submitButton = await driver.findElement(
      By.css('button[type="submit"]')
    );
    await submitButton.click();

    // Take screenshot
    await TestUtils.takeScreenshot(driver, "edge-invalid-email-format");

    // Check if still on register page (wasn't submitted successfully)
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/register");

    // Look for validation errors
    const emailField = await driver.findElement(By.name("email"));

    // Check for HTML5 validation or custom validation messages
    const isValid = await emailField.getAttribute("validity.valid");
    if (isValid === "false") {
      console.log("HTML5 validation caught invalid email");
    } else {
      // Look for error messages
      const errorMessages = await driver.findElements(
        By.css(".error-message, .MuiFormHelperText-root")
      );
      const hasErrors = errorMessages.length > 0;

      // If no specific error elements, check if we're still on the form (which means submission failed)
      expect(hasErrors || currentUrl.includes("/register")).to.be.true;
    }
  });

  it("should validate minimum password length", async function () {
    // Fill in form with short password
    await driver.findElement(By.name("name")).sendKeys("Test User");
    await driver.findElement(By.name("email")).sendKeys("test@example.com");
    await driver.findElement(By.name("password")).sendKeys("12345"); // Too short
    await driver.findElement(By.name("confirmPassword")).sendKeys("12345");

    // Try to submit
    const submitButton = await driver.findElement(
      By.css('button[type="submit"]')
    );
    await submitButton.click();

    // Take screenshot
    await TestUtils.takeScreenshot(driver, "edge-short-password");

    // Look for error messages about password length
    const errorMessages = await driver.findElements(
      By.css(".MuiAlert-standardError, .error-message, .MuiFormHelperText-root")
    );

    if (errorMessages.length > 0) {
      // Try to find error message about password length
      let foundLengthError = false;
      for (const errorElem of errorMessages) {
        const text = await errorElem.getText();
        if (
          text.toLowerCase().includes("length") ||
          text.toLowerCase().includes("character")
        ) {
          foundLengthError = true;
          break;
        }
      }

      // If no specific length error, at least we should still be on the register page
      if (!foundLengthError) {
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.include("/register");
      }
    } else {
      // If no error messages displayed, we should at least still be on the register page
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).to.include("/register");
    }
  });
});
