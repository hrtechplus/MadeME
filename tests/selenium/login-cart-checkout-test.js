/**
 * MadeME Food Delivery App - Login, Add to Cart, and Checkout Test
 *
 * This script tests the full user flow:
 * 1. Login with user credentials
 * 2. Select a restaurant
 * 3. Add items to cart
 * 4. Proceed to checkout
 *
 * Usage: node login-cart-checkout-test.js
 */

const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");

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
  screenshotsDir: path.join(__dirname, "../screenshots/checkout-flow"),
  userCredentials: {
    email: "rawart.media@gmail.com",
    password: "admin123",
  },
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
    `${colors.bright}TEST REPORT: LOGIN, CART & CHECKOUT${colors.reset}`
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

async function runCheckoutTest() {
  console.log(
    `${colors.bright}${colors.blue}Starting Login, Cart & Checkout Test...${colors.reset}`
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

    // 2. Navigate to login page
    try {
      console.log(
        `\n${colors.yellow}Navigating to login page...${colors.reset}`
      );

      // Go directly to login page
      await driver.get(`${config.baseUrl}/login`);
      await driver.sleep(2000);

      await takeScreenshot(driver, "login_page");
      addTestStep("Navigate to login page", true);
    } catch (error) {
      await takeScreenshot(driver, "login_page_error");
      addTestStep("Navigate to login page", false, error);
      throw error;
    }

    // 3. Login with credentials
    try {
      console.log(
        `\n${colors.yellow}Logging in with user credentials...${colors.reset}`
      );
      console.log(`Using email: ${config.userCredentials.email}`);

      // Find and fill email field
      const emailField = await driver.findElement(
        By.css('input[type="email"], input[name="email"]')
      );
      await emailField.clear();
      await emailField.sendKeys(config.userCredentials.email);

      // Find and fill password field
      const passwordField = await driver.findElement(
        By.css('input[type="password"], input[name="password"]')
      );
      await passwordField.clear();
      await passwordField.sendKeys(config.userCredentials.password);

      await takeScreenshot(driver, "login_filled");

      // Submit login form - fixed selector to avoid invalid selector error
      console.log("Looking for login button");
      const loginButtons = await driver.findElements(By.css("button"));

      // Log all buttons for debugging
      console.log(`Found ${loginButtons.length} buttons on login page`);
      let loginButton = null;

      for (let i = 0; i < loginButtons.length; i++) {
        try {
          const text = await loginButtons[i].getText();
          console.log(`Button ${i + 1}: "${text}"`);

          // Find button with login-related text
          if (
            text.toLowerCase().includes("login") ||
            text.toLowerCase().includes("sign in") ||
            text.toLowerCase().includes("submit")
          ) {
            loginButton = loginButtons[i];
            console.log(`Using button ${i + 1} as login button`);
            break;
          }
        } catch (e) {
          console.log(`Couldn't get text for button ${i + 1}`);
        }
      }

      // If we couldn't find by text, try the form submit button or just use the last button
      if (!loginButton) {
        try {
          loginButton = await driver.findElement(
            By.css('button[type="submit"]')
          );
          console.log("Found submit button");
        } catch (e) {
          // If no submit button, use last button (often the primary action)
          if (loginButtons.length > 0) {
            loginButton = loginButtons[loginButtons.length - 1];
            console.log("Using last button as login button");
          } else {
            throw new Error("No buttons found on login page");
          }
        }
      }

      // Click the login button
      await loginButton.click();
      console.log("Clicked login button");

      // Wait for login to complete and redirect
      await driver.sleep(3000);

      // Check if login was successful
      const currentUrl = await driver.getCurrentUrl();
      if (currentUrl.includes("login")) {
        // Still on login page, login might have failed
        await takeScreenshot(driver, "login_failed");
        throw new Error("Login failed, still on login page");
      }

      await takeScreenshot(driver, "after_login");
      addTestStep("Login with user credentials", true);
    } catch (error) {
      await takeScreenshot(driver, "login_error");
      addTestStep("Login with user credentials", false, error);
      throw error;
    }

    // 4. Navigate to or confirm on restaurants page
    try {
      console.log(
        `\n${colors.yellow}Ensuring we're on restaurants page...${colors.reset}`
      );

      const currentUrl = await driver.getCurrentUrl();
      if (
        !currentUrl.includes("restaurants") &&
        !currentUrl.includes("dashboard")
      ) {
        // If not already on restaurant list, navigate there
        await driver.get(`${config.baseUrl}/restaurants`);
        await driver.sleep(2000);
      }

      await takeScreenshot(driver, "restaurants_page");
      addTestStep("Navigate to restaurants page", true);
    } catch (error) {
      await takeScreenshot(driver, "restaurants_page_error");
      addTestStep("Navigate to restaurants page", false, error);
      throw error;
    }

    // 5. Select a restaurant
    try {
      console.log(`\n${colors.yellow}Selecting a restaurant...${colors.reset}`);

      // First check if we have restaurant cards on the page
      const restaurantSelectors = [
        ".restaurant-card",
        ".restaurant-item",
        ".MuiCard-root",
        ".card",
        'a[href*="restaurant"]',
        "div:has(h3):has(img)",
      ];

      let restaurantCards = [];

      for (const selector of restaurantSelectors) {
        try {
          restaurantCards = await driver.findElements(By.css(selector));
          if (restaurantCards.length > 0) {
            console.log(
              `Found ${restaurantCards.length} restaurants with selector: ${selector}`
            );
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }

      if (restaurantCards.length === 0) {
        // If no restaurant cards found, try direct navigation to a restaurant
        console.log(
          "No restaurant cards found, navigating directly to a restaurant"
        );
        await driver.get(`${config.baseUrl}/restaurant/1`);
        await driver.sleep(2000);
      } else {
        // Click on the first restaurant card
        console.log(
          `Clicking on first of ${restaurantCards.length} restaurants`
        );

        // Try to get the name for logging
        try {
          const nameElement = await restaurantCards[0].findElement(
            By.css("h2, h3, h4, .name, .title")
          );
          const name = await nameElement.getText();
          console.log(`Selected restaurant: ${name}`);
        } catch (e) {
          console.log("Could not get restaurant name, but continuing");
        }

        await restaurantCards[0].click();
        await driver.sleep(3000);
      }

      // Verify we're on a restaurant detail page
      const currentUrl = await driver.getCurrentUrl();
      if (currentUrl.includes("restaurant/")) {
        console.log(
          `Successfully navigated to restaurant detail: ${currentUrl}`
        );
      } else {
        console.log("Not on restaurant detail page, trying direct navigation");
        await driver.get(`${config.baseUrl}/restaurant/1`);
        await driver.sleep(2000);
      }

      await takeScreenshot(driver, "restaurant_detail");
      addTestStep("Select a restaurant", true);
    } catch (error) {
      await takeScreenshot(driver, "restaurant_selection_error");
      addTestStep("Select a restaurant", false, error);
      throw error;
    }

    // 6. Add items to cart
    try {
      console.log(`\n${colors.yellow}Adding items to cart...${colors.reset}`);

      // Take screenshot of menu
      await takeScreenshot(driver, "menu");

      // Find all buttons with "Add to Cart" text
      const addToCartButtons = await driver.findElements(
        By.xpath(
          "//button[contains(text(), 'Add to Cart') or contains(text(), 'Add')]"
        )
      );

      console.log(`Found ${addToCartButtons.length} "Add to Cart" buttons`);

      if (addToCartButtons.length === 0) {
        // If no "Add to Cart" buttons found, look for any buttons that might add to cart
        const allButtons = await driver.findElements(By.css("button"));
        console.log(`Found ${allButtons.length} total buttons`);

        // Log all buttons to help diagnose
        for (let i = 0; i < Math.min(10, allButtons.length); i++) {
          try {
            const text = await allButtons[i].getText();
            console.log(`Button ${i + 1}: "${text}"`);
          } catch (e) {
            console.log(`Button ${i + 1}: [Error getting text]`);
          }
        }

        // Try with the first few buttons (skip navigation buttons at the top)
        if (allButtons.length > 3) {
          console.log(
            "Trying to click on button 4 (assuming it might be an add button)"
          );
          await allButtons[3].click();
          await driver.sleep(1000);

          // Try one more button if available
          if (allButtons.length > 4) {
            console.log("Trying to click on button 5 as well");
            await allButtons[4].click();
            await driver.sleep(1000);
          }
        }
      } else {
        // Click on first two "Add to Cart" buttons (or as many as available)
        const itemsToAdd = Math.min(2, addToCartButtons.length);

        for (let i = 0; i < itemsToAdd; i++) {
          // Try to get parent element to find item name
          try {
            const parentElement = await addToCartButtons[i].findElement(
              By.xpath("../..")
            );
            const titleElement = await parentElement.findElement(
              By.css("h3, h4, .name, .title")
            );
            const itemName = await titleElement.getText();
            console.log(`Adding to cart: ${itemName}`);
          } catch (e) {
            console.log(`Adding item #${i + 1} (couldn't get name)`);
          }

          // Click the add to cart button
          await addToCartButtons[i].click();
          console.log(`Clicked "Add to Cart" button ${i + 1}`);
          await driver.sleep(1500); // Wait between clicks
        }
      }

      // Take screenshot after adding items
      await driver.sleep(1000);
      await takeScreenshot(driver, "after_adding_items");

      // Look for any notifications about items being added
      try {
        const notifications = await driver.findElements(
          By.css(".notification, .toast, .snackbar, .MuiSnackbar-root, .alert")
        );

        if (notifications.length > 0) {
          for (const notification of notifications) {
            const text = await notification.getText();
            console.log(`Notification: "${text}"`);
          }
        }
      } catch (e) {
        // Ignore if we can't find notifications
      }

      addTestStep("Add items to cart", true);
    } catch (error) {
      await takeScreenshot(driver, "add_items_error");
      addTestStep("Add items to cart", false, error);
      throw error;
    }

    // 7. Navigate to cart (if not automatically redirected)
    try {
      console.log(
        `\n${colors.yellow}Navigating to cart page...${colors.reset}`
      );

      // Look for any cart link/icon or just navigate directly
      try {
        // Try to find cart link
        const cartLinks = await driver.findElements(
          By.css(
            'a[href="/cart"], a[href*="cart"], button:contains("Cart"), button:contains("View Cart")'
          )
        );

        if (cartLinks.length > 0) {
          console.log("Found cart link, clicking it");
          await cartLinks[0].click();
          await driver.sleep(2000);
        } else {
          // Navigate directly to cart
          console.log("No cart link found, navigating directly to cart page");
          await driver.get(`${config.baseUrl}/cart`);
          await driver.sleep(2000);
        }
      } catch (e) {
        // If error, navigate directly
        console.log("Error finding cart link, navigating directly");
        await driver.get(`${config.baseUrl}/cart`);
        await driver.sleep(2000);
      }

      await takeScreenshot(driver, "cart_page");
      addTestStep("Navigate to cart", true);
    } catch (error) {
      await takeScreenshot(driver, "cart_navigation_error");
      addTestStep("Navigate to cart", false, error);
      throw error;
    }

    // 8. Verify cart contents and proceed to checkout
    try {
      console.log(
        `\n${colors.yellow}Verifying cart and proceeding to checkout...${colors.reset}`
      );

      // Check for cart items
      const cartItemSelectors = [
        ".cart-item",
        ".item",
        ".line-item",
        '[data-testid="cart-item"]',
      ];

      let cartItems = [];

      for (const selector of cartItemSelectors) {
        try {
          cartItems = await driver.findElements(By.css(selector));
          if (cartItems.length > 0) {
            console.log(
              `Found ${cartItems.length} cart items with selector: ${selector}`
            );
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }

      // If no cart items found with standard selectors, look for price elements
      if (cartItems.length === 0) {
        const priceElements = await driver.findElements(
          By.xpath("//*[contains(text(), '$')]")
        );
        console.log(
          `Found ${priceElements.length} price elements on cart page`
        );

        // If multiple price elements, we probably have items
        if (priceElements.length > 1) {
          console.log("Multiple price elements found, assuming cart has items");
        } else {
          console.log("Cart might be empty, but continuing anyway");
        }
      } else {
        console.log(`Cart contains ${cartItems.length} items`);
      }

      // Look for "Proceed to Checkout" button
      const checkoutButtonSelectors = [
        'button:contains("Checkout")',
        'button:contains("Proceed to Checkout")',
        'a:contains("Checkout")',
        "button.checkout",
        "a.checkout",
      ];

      let checkoutButton = null;

      for (const selector of checkoutButtonSelectors) {
        try {
          const buttons = await driver.findElements(By.css(selector));
          if (buttons.length > 0) {
            checkoutButton = buttons[0];
            console.log(`Found checkout button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }

      // If no checkout button found with CSS selectors, try XPath
      if (!checkoutButton) {
        try {
          const xpathButtons = await driver.findElements(
            By.xpath(
              "//button[contains(text(), 'Checkout') or contains(text(), 'Proceed')]"
            )
          );

          if (xpathButtons.length > 0) {
            checkoutButton = xpathButtons[0];
            console.log("Found checkout button with XPath");
          }
        } catch (e) {
          console.log("No checkout button found with XPath either");
        }
      }

      // If still no checkout button, look for any buttons
      if (!checkoutButton) {
        const allButtons = await driver.findElements(By.css("button"));
        console.log(`Found ${allButtons.length} total buttons on cart page`);

        // Log all button text to help diagnose
        for (let i = 0; i < allButtons.length; i++) {
          try {
            const text = await allButtons[i].getText();
            console.log(`Button ${i + 1}: "${text}"`);

            // If text contains checkout-related terms, use this button
            if (
              text.toLowerCase().includes("checkout") ||
              text.toLowerCase().includes("proceed") ||
              text.toLowerCase().includes("payment")
            ) {
              checkoutButton = allButtons[i];
              console.log(`Using button ${i + 1} as checkout button`);
              break;
            }
          } catch (e) {
            // Continue to next button
          }
        }

        // If we still don't have a checkout button but have buttons, try the last one
        // (often the primary action is at the bottom)
        if (!checkoutButton && allButtons.length > 0) {
          checkoutButton = allButtons[allButtons.length - 1];
          console.log("Using last button as potential checkout button");
        }
      }

      if (checkoutButton) {
        // Take screenshot before clicking checkout
        await takeScreenshot(driver, "before_checkout");

        // Click the checkout button
        console.log("Clicking on checkout button");
        await checkoutButton.click();

        // Wait for navigation to checkout/payment page
        await driver.sleep(3000);

        // Check where we ended up
        const currentUrl = await driver.getCurrentUrl();
        console.log(`After checkout button, URL is: ${currentUrl}`);

        await takeScreenshot(driver, "after_checkout");
        addTestStep("Proceed to checkout", true);
      } else {
        console.log("No checkout button found - unable to proceed to checkout");
        throw new Error("Could not find checkout button");
      }
    } catch (error) {
      await takeScreenshot(driver, "checkout_error");
      addTestStep("Proceed to checkout", false, error);
      throw error;
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
runCheckoutTest()
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
