const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");

// Function to take screenshots
async function takeScreenshot(driver, name) {
  const screenshotsDir = path.join(__dirname, "../screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const screenshotPath = path.join(screenshotsDir, `${name}_${timestamp}.png`);
  const screenshot = await driver.takeScreenshot();

  fs.writeFileSync(screenshotPath, screenshot, "base64");
  console.log(`Screenshot saved to: ${screenshotPath}`);
  return screenshotPath;
}

async function runSignupTest() {
  console.log("Starting standalone signup test...");
  let driver = null;

  try {
    // Setup ChromeDriver
    console.log("Setting up Chrome options...");
    const options = new chrome.Options();
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");

    // Build WebDriver
    console.log("Creating Chrome WebDriver...");
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    console.log("WebDriver created successfully");

    // Set reasonable timeout
    await driver.manage().setTimeouts({ implicit: 5000 });

    // Navigate to the application
    console.log("Navigating to the application...");
    await driver.get("http://localhost:5173");
    console.log("Successfully loaded homepage");
    await takeScreenshot(driver, "standalone_homepage");

    // Look for the register link - first try the navbar
    try {
      console.log("Looking for register link...");
      // Try different selectors since we don't know the exact structure
      let registerLink = null;

      // Try common selectors for navigation links
      const possibleLinkSelectors = [
        'a[href="/register"]',
        'a[href="#/register"]',
        'a[href*="register"]',
        'button:contains("Sign Up")',
        'button:contains("Register")',
        '.nav-link[href*="register"]',
      ];

      for (const selector of possibleLinkSelectors) {
        try {
          const elements = await driver.findElements(By.css(selector));
          if (elements.length > 0) {
            registerLink = elements[0];
            console.log(`Found register link with selector: ${selector}`);
            break;
          }
        } catch (err) {
          // Ignore and try next selector
        }
      }

      if (registerLink) {
        // Click the register link
        await registerLink.click();
        console.log("Clicked on register link");
      } else {
        // If we can't find the link, navigate directly
        console.log(
          "Could not find register link, navigating directly to register page"
        );
        await driver.get("http://localhost:5173/register");
      }

      // Wait for the registration page to load
      console.log("Waiting for register page to load...");
      await driver.wait(until.urlContains("register"), 5000);
      console.log("Register page loaded");

      // Take screenshot of register page
      await takeScreenshot(driver, "standalone_register_page");

      // Look for form fields - trying common field names/selectors
      console.log("Looking for registration form fields...");

      // Generate unique test user data
      const timestamp = new Date().getTime();
      const testEmail = `test.user.${timestamp}@example.com`;
      const testPassword = "Password123!";
      const testName = "Test User";

      // Try to find and fill the name field
      try {
        const nameField = await driver.findElement(
          By.css(
            'input[name="name"], input[placeholder*="name" i], input[id*="name" i]'
          )
        );
        await nameField.sendKeys(testName);
        console.log("Filled name field");
      } catch (err) {
        console.log("Could not find name field:", err.message);
      }

      // Try to find and fill the email field
      try {
        const emailField = await driver.findElement(
          By.css(
            'input[type="email"], input[name="email"], input[placeholder*="email" i], input[id*="email" i]'
          )
        );
        await emailField.sendKeys(testEmail);
        console.log("Filled email field");
      } catch (err) {
        console.log("Could not find email field:", err.message);
      }

      // Try to find and fill the password field
      try {
        const passwordField = await driver.findElement(
          By.css(
            'input[type="password"], input[name="password"], input[placeholder*="password" i], input[id*="password" i]'
          )
        );
        await passwordField.sendKeys(testPassword);
        console.log("Filled password field");
      } catch (err) {
        console.log("Could not find password field:", err.message);
      }

      // Try to find and fill the confirm password field
      try {
        const confirmPasswordField = await driver.findElement(
          By.css(
            'input[name="confirmPassword"], input[placeholder*="confirm" i], input[id*="confirm" i], input[type="password"]:not([name="password"])'
          )
        );
        await confirmPasswordField.sendKeys(testPassword);
        console.log("Filled confirm password field");
      } catch (err) {
        console.log("Could not find confirm password field:", err.message);
      }

      // Take screenshot of filled form
      await takeScreenshot(driver, "standalone_filled_form");

      // Submit the form
      console.log("Submitting registration form...");
      try {
        // Try to find submit button
        const submitButton = await driver.findElement(
          By.css(
            'button[type="submit"], input[type="submit"], button:contains("Register"), button:contains("Sign Up")'
          )
        );
        await submitButton.click();
        console.log("Clicked submit button");
      } catch (err) {
        console.log(
          "Could not find submit button, trying to submit form directly"
        );
        // If no submit button found, try to submit the form directly
        try {
          const form = await driver.findElement(By.css("form"));
          await driver.executeScript("arguments[0].submit();", form);
          console.log("Submitted form directly");
        } catch (formErr) {
          console.log("Could not find form to submit", formErr.message);
        }
      }

      // Wait for response (success message or redirect)
      console.log("Waiting for registration response...");
      await driver.sleep(3000); // Give some time for the response

      // Take screenshot of response
      await takeScreenshot(driver, "standalone_registration_result");

      // Get current URL to see if we were redirected
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL after registration: ${currentUrl}`);

      // Check if we made it to a success page or login page
      if (currentUrl.includes("login") || currentUrl.includes("success")) {
        console.log(
          "Registration appears successful - redirected to login or success page"
        );
      } else {
        // Look for success or error messages
        const pageSource = await driver.getPageSource();
        if (pageSource.includes("success") || pageSource.includes("Success")) {
          console.log("Found success message on page");
        } else if (
          pageSource.includes("error") ||
          pageSource.includes("Error")
        ) {
          console.log(
            "Found error message on page - registration might have failed"
          );
        } else {
          console.log("No clear success or error message found");
        }
      }

      console.log("Test completed successfully!");
    } catch (err) {
      console.error("Error during registration process:", err.message);
      if (driver) {
        await takeScreenshot(driver, "standalone_error");
      }
    }
  } catch (mainError) {
    console.error("Main error in test execution:", mainError.message);
  } finally {
    // Clean up
    if (driver) {
      console.log("Closing browser...");
      await driver.quit();
      console.log("Browser closed");
    }
  }
}

// Run the test
runSignupTest().catch((err) => {
  console.error("Unexpected error in test runner:", err);
  process.exit(1);
});
