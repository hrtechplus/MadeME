/**
 * MadeME Food Delivery App - Enhanced Signup Test
 *
 * This is a standalone Selenium test script that doesn't require Mocha.
 * It tests the signup functionality by launching a browser and going through
 * the entire registration process.
 *
 * Usage: node enhanced-signup-test.js
 */

const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Configuration
const config = {
  baseUrl: "http://localhost:5173",
  screenshotsDir: path.join(__dirname, "../screenshots"),
  testTimeout: 60000, // 60 seconds
};

// Test steps track success/failure of each step
const testSteps = [];

// Function to take screenshots
async function takeScreenshot(driver, name) {
  if (!fs.existsSync(config.screenshotsDir)) {
    fs.mkdirSync(config.screenshotsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const screenshotPath = path.join(
    config.screenshotsDir,
    `${name}_${timestamp}.png`
  );
  const screenshot = await driver.takeScreenshot();

  fs.writeFileSync(screenshotPath, screenshot, "base64");
  console.log(
    `${colors.cyan}Screenshot saved to: ${screenshotPath}${colors.reset}`
  );
  return screenshotPath;
}

// Add a test step result
function addTestStep(name, passed, error = null) {
  const step = {
    name,
    passed,
    error: error ? error.message : null,
    timestamp: new Date(),
  };

  testSteps.push(step);

  if (passed) {
    console.log(
      `${colors.bright}${colors.green}✓ PASS: ${colors.reset}${name}`
    );
  } else {
    console.log(`${colors.bright}${colors.red}✗ FAIL: ${colors.reset}${name}`);
    if (error) {
      console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    }
  }
}

// Print test report
function printTestReport() {
  console.log("\n" + "=".repeat(80));
  console.log(
    `${colors.bright}TEST REPORT: SIGNUP FUNCTIONALITY${colors.reset}`
  );
  console.log("=".repeat(80));

  let passed = 0;
  let failed = 0;

  testSteps.forEach((step, index) => {
    if (step.passed) {
      passed++;
      console.log(
        `${index + 1}. ${colors.green}✓ PASS: ${step.name}${colors.reset}`
      );
    } else {
      failed++;
      console.log(
        `${index + 1}. ${colors.red}✗ FAIL: ${step.name}${colors.reset}`
      );
      if (step.error) {
        console.log(`   ${colors.red}Error: ${step.error}${colors.reset}`);
      }
    }
  });

  console.log("-".repeat(80));
  console.log(`Total Steps: ${testSteps.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(
    `${colors.bright}Result: ${
      failed === 0 ? colors.green + "PASSED" : colors.red + "FAILED"
    }${colors.reset}`
  );
  console.log("=".repeat(80));
}

async function runSignupTest() {
  console.log(
    `${colors.bright}${colors.blue}Starting Enhanced Signup Test...${colors.reset}`
  );
  let driver = null;

  try {
    // 1. Setup Chrome WebDriver
    console.log(
      `\n${colors.yellow}Setting up Chrome WebDriver...${colors.reset}`
    );
    const options = new chrome.Options();
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");
    // options.addArguments('--headless'); // Uncomment to run without visible browser

    try {
      driver = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();

      await driver.manage().setTimeouts({ implicit: 5000, pageLoad: 30000 });
      addTestStep("Initialize Chrome WebDriver", true);
    } catch (error) {
      addTestStep("Initialize Chrome WebDriver", false, error);
      throw error;
    }

    // 2. Navigate to the application
    try {
      console.log(`\n${colors.yellow}Navigating to homepage...${colors.reset}`);
      await driver.get(config.baseUrl);
      const title = await driver.getTitle();
      console.log(`Page title: "${title}"`);

      await takeScreenshot(driver, "enhanced_homepage");
      addTestStep("Navigate to homepage", true);
    } catch (error) {
      await takeScreenshot(driver, "navigate_homepage_error");
      addTestStep("Navigate to homepage", false, error);
      throw error;
    }

    // 3. Navigate to register page
    try {
      console.log(
        `\n${colors.yellow}Navigating to register page...${colors.reset}`
      );
      await driver.get(`${config.baseUrl}/register`);
      await driver.wait(until.urlContains("register"), 5000);

      await takeScreenshot(driver, "enhanced_register_page");
      addTestStep("Navigate to register page", true);
    } catch (error) {
      await takeScreenshot(driver, "navigate_register_error");
      addTestStep("Navigate to register page", false, error);
      throw error;
    }

    // 4. Fill out registration form
    try {
      console.log(
        `\n${colors.yellow}Filling out registration form...${colors.reset}`
      );

      // Generate unique test data
      const timestamp = new Date().getTime();
      const testEmail = `test.user.${timestamp}@example.com`;
      const testPassword = "Password123!";
      const testName = "Test User";

      console.log(`Test data: Email=${testEmail}, Name=${testName}`);

      // Find and fill form fields with more robust selectors
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

      // Confirm password field
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
          `${colors.yellow}Note: Could not find dedicated confirm password field${colors.reset}`
        );
      }

      await takeScreenshot(driver, "enhanced_filled_form");
      addTestStep("Fill registration form", true);
    } catch (error) {
      await takeScreenshot(driver, "fill_form_error");
      addTestStep("Fill registration form", false, error);
      throw error;
    }

    // 5. Submit the form
    try {
      console.log(
        `\n${colors.yellow}Submitting registration form...${colors.reset}`
      );

      // Try to find and click submit button
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
      }

      // Wait for response
      await driver.sleep(3000);

      await takeScreenshot(driver, "enhanced_submission_result");
      addTestStep("Submit registration form", true);
    } catch (error) {
      await takeScreenshot(driver, "submit_form_error");
      addTestStep("Submit registration form", false, error);
      throw error;
    }

    // 6. Verify registration result
    try {
      console.log(
        `\n${colors.yellow}Verifying registration result...${colors.reset}`
      );

      // Get current URL after submission
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);

      // Get page source to look for success/error messages
      const pageSource = await driver.getPageSource();

      // Determine registration outcome
      if (currentUrl.includes("login")) {
        console.log("Redirected to login page - registration successful");
        addTestStep("Verify registration success", true);
      } else if (pageSource.toLowerCase().includes("success")) {
        console.log("Success message found - registration successful");
        addTestStep("Verify registration success", true);
      } else if (
        pageSource.toLowerCase().includes("error") ||
        pageSource.toLowerCase().includes("already exists")
      ) {
        console.log(
          "Error message found - registration failed (may be expected if user exists)"
        );
        // Don't mark as failure if user already exists
        if (pageSource.toLowerCase().includes("already exists")) {
          addTestStep("Verify registration result", true);
          console.log("User already exists - considering test passed");
        } else {
          addTestStep(
            "Verify registration result",
            false,
            new Error("Registration failed with error")
          );
        }
      } else {
        // If we're still on the register page but no error, something might be wrong
        if (currentUrl.includes("register")) {
          console.log(
            "Still on register page without clear error - may indicate validation issue"
          );
          addTestStep(
            "Verify registration result",
            false,
            new Error("Still on register page without clear error message")
          );
        } else {
          console.log("No clear success or error indicators, but URL changed");
          addTestStep("Verify registration result", true);
        }
      }
    } catch (error) {
      addTestStep("Verify registration result", false, error);
    }

    console.log(
      `\n${colors.blue}${colors.bright}Test execution completed!${colors.reset}`
    );
  } catch (error) {
    console.error(
      `\n${colors.red}${colors.bright}Test execution failed: ${error.message}${colors.reset}`
    );
  } finally {
    // Clean up WebDriver
    if (driver) {
      try {
        console.log(`\n${colors.yellow}Closing browser...${colors.reset}`);
        await driver.quit();
        console.log("Browser closed successfully");
      } catch (error) {
        console.error(`Error closing browser: ${error.message}`);
      }
    }

    // Print test report
    printTestReport();
  }

  // Return test result (success = no failures)
  return testSteps.every((step) => step.passed);
}

// Run the test
runSignupTest()
  .then((success) => {
    console.log(
      `\n${colors.blue}Test run complete. Overall result: ${
        success ? colors.green + "PASSED" : colors.red + "FAILED"
      }${colors.reset}`
    );
    // Exit with appropriate code for CI/CD pipelines
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error(
      `\n${colors.red}Unexpected error in test runner: ${error.message}${colors.reset}`
    );
    process.exit(1);
  });
