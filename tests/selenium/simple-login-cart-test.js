/**
 * MadeME Food Delivery App - Simplified Login and Cart Test
 *
 * This script focuses on:
 * 1. Login with user credentials
 * 2. Direct navigation to a restaurant
 * 3. Adding items to cart
 * 4. Proceeding to checkout
 */

const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");

// Simple logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Function to take screenshots
async function takeScreenshot(driver, name) {
  const dir = path.join(__dirname, "../screenshots/simple-login");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filename = `${name}.png`;
  const screenshotPath = path.join(dir, filename);

  try {
    const screenshot = await driver.takeScreenshot();
    fs.writeFileSync(screenshotPath, screenshot, "base64");
    log(`Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    log(`Error taking screenshot: ${error.message}`);
  }
}

async function runSimpleLoginCartTest() {
  log("Starting Simplified Login and Cart Test");
  let driver = null;

  try {
    // Initialize WebDriver
    log("Initializing Chrome WebDriver");
    const options = new chrome.Options();
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    await driver.manage().setTimeouts({ implicit: 5000, pageLoad: 30000 });
    log("WebDriver initialized successfully");

    // 1. Navigate to the login page
    log("Navigating to login page");
    await driver.get("http://localhost:5173/login");
    await driver.sleep(2000);
    await takeScreenshot(driver, "01_login_page");

    // 2. Fill in login form
    log("Filling login form with credentials");
    log("Using email: rawart.media@gmail.com and password: admin123");

    // Find and fill email field
    try {
      const emailField = await driver.findElement(
        By.css('input[type="email"], input[name="email"]')
      );
      await emailField.clear();
      await emailField.sendKeys("rawart.media@gmail.com");
      log("Filled email field");
    } catch (error) {
      log(`Error finding or filling email field: ${error.message}`);
      // Try another selector
      try {
        const inputs = await driver.findElements(By.css("input"));
        if (inputs.length > 0) {
          await inputs[0].clear();
          await inputs[0].sendKeys("rawart.media@gmail.com");
          log("Filled first input field as email");
        }
      } catch (e) {
        log(`Error filling email with alternative method: ${e.message}`);
      }
    }

    // Find and fill password field
    try {
      const passwordField = await driver.findElement(
        By.css('input[type="password"], input[name="password"]')
      );
      await passwordField.clear();
      await passwordField.sendKeys("admin123");
      log("Filled password field");
    } catch (error) {
      log(`Error finding or filling password field: ${error.message}`);
      // Try another selector
      try {
        const inputs = await driver.findElements(By.css("input"));
        if (inputs.length > 1) {
          await inputs[1].clear();
          await inputs[1].sendKeys("admin123");
          log("Filled second input field as password");
        }
      } catch (e) {
        log(`Error filling password with alternative method: ${e.message}`);
      }
    }

    await takeScreenshot(driver, "02_login_filled");

    // 3. Click login button
    log("Looking for login button");
    let loginButton = null;

    // First try standard selectors
    try {
      loginButton = await driver.findElement(By.css('button[type="submit"]'));
      log("Found submit button");
    } catch (e) {
      log("No submit button found, looking for button with text");

      try {
        // Find all buttons
        const buttons = await driver.findElements(By.css("button"));
        log(`Found ${buttons.length} buttons`);

        // Log all button text
        for (let i = 0; i < buttons.length; i++) {
          try {
            const text = await buttons[i].getText();
            log(`Button ${i + 1}: "${text}"`);

            // If text is login-related, use this button
            if (
              text.toLowerCase().includes("login") ||
              text.toLowerCase().includes("sign in") ||
              text.toLowerCase().includes("sign-in")
            ) {
              loginButton = buttons[i];
              log(`Using button ${i + 1} for login`);
              break;
            }
          } catch (error) {
            log(`Couldn't get text for button ${i + 1}`);
          }
        }

        // If no login button found by text, try second button (common pattern)
        if (!loginButton && buttons.length > 1) {
          loginButton = buttons[1];
          log("Using second button as login button");
        }
      } catch (error) {
        log(`Error finding buttons: ${error.message}`);
      }
    }

    if (loginButton) {
      log("Clicking login button");
      try {
        await loginButton.click();
        log("Clicked login button");
      } catch (error) {
        log(`Error clicking login button: ${error.message}`);

        // Try JavaScript click as fallback
        try {
          await driver.executeScript("arguments[0].click();", loginButton);
          log("Clicked login button using JavaScript");
        } catch (e) {
          log(`JavaScript click failed: ${e.message}`);
        }
      }
    } else {
      log("Could not find login button");

      // Try to submit the form directly as last resort
      try {
        const form = await driver.findElement(By.css("form"));
        await form.submit();
        log("Submitted login form directly");
      } catch (error) {
        log(`Form submit failed: ${error.message}`);
      }
    }

    // Wait for login to complete
    await driver.sleep(3000);

    // 4. Check login status
    const currentUrl = await driver.getCurrentUrl();
    log(`Current URL after login attempt: ${currentUrl}`);

    await takeScreenshot(driver, "03_after_login");

    if (currentUrl.includes("login")) {
      log("Login appears to have failed, still on login page");

      // Check for any error messages
      try {
        const errorMessages = await driver.findElements(
          By.css(".error, .alert, .notification, .toast")
        );

        if (errorMessages.length > 0) {
          for (const msg of errorMessages) {
            const text = await msg.getText();
            log(`Error message: "${text}"`);
          }
        }
      } catch (e) {
        // Ignore if we can't find error messages
      }

      // Continue anyway for testing subsequent steps
      log("Continuing to restaurant page despite login issue");
    } else {
      log("Login successful, redirected away from login page");
    }

    // 5. Navigate to restaurant directly
    log("Navigating directly to restaurant page");
    await driver.get("http://localhost:5173/restaurant/1");
    await driver.sleep(3000);
    await takeScreenshot(driver, "04_restaurant_page");

    // 6. Add items to cart
    log("Adding items to cart");

    // Find all "Add to Cart" buttons
    let addToCartButtons = [];

    try {
      // First try with exact text
      addToCartButtons = await driver.findElements(
        By.xpath("//button[contains(text(), 'Add to Cart')]")
      );

      if (addToCartButtons.length === 0) {
        // Try with just "Add" text
        addToCartButtons = await driver.findElements(
          By.xpath("//button[contains(text(), 'Add')]")
        );
      }

      log(`Found ${addToCartButtons.length} add to cart buttons`);
    } catch (error) {
      log(`Error finding Add to Cart buttons: ${error.message}`);
    }

    if (addToCartButtons.length === 0) {
      // If no add buttons found, try looking at all buttons
      try {
        const allButtons = await driver.findElements(By.css("button"));
        log(`Found ${allButtons.length} total buttons`);

        // Log button text
        for (let i = 0; i < allButtons.length; i++) {
          try {
            const text = await allButtons[i].getText();
            log(`Button ${i + 1}: "${text}"`);
          } catch (e) {
            log(`Button ${i + 1}: [Error getting text]`);
          }
        }

        // Use buttons 3-5 (assuming first buttons are navigation)
        for (let i = 3; i < Math.min(6, allButtons.length); i++) {
          try {
            log(`Trying to click button ${i + 1}`);
            await allButtons[i].click();
            await driver.sleep(1000);
          } catch (e) {
            log(`Error clicking button ${i + 1}: ${e.message}`);
          }
        }
      } catch (error) {
        log(`Error processing buttons: ${error.message}`);
      }
    } else {
      // Click first two add-to-cart buttons
      for (let i = 0; i < Math.min(2, addToCartButtons.length); i++) {
        try {
          log(`Clicking add to cart button ${i + 1}`);
          await addToCartButtons[i].click();
          await driver.sleep(1500);

          // Check for notifications after adding
          try {
            const notifications = await driver.findElements(
              By.css(
                ".notification, .toast, .alert, .snackbar, .MuiSnackbar-root"
              )
            );

            if (notifications.length > 0) {
              const notificationText = await notifications[0].getText();
              log(`Notification after adding: "${notificationText}"`);
            }
          } catch (e) {
            // Ignore notification errors
          }
        } catch (error) {
          log(`Error clicking add button ${i + 1}: ${error.message}`);
        }
      }
    }

    await takeScreenshot(driver, "05_after_adding_items");

    // 7. Navigate to cart
    log("Navigating to cart page");
    await driver.get("http://localhost:5173/cart");
    await driver.sleep(2000);
    await takeScreenshot(driver, "06_cart_page");

    // 8. Look for checkout button
    log("Looking for checkout button");
    let checkoutButton = null;

    try {
      // Try with exact text match
      const checkoutButtons = await driver.findElements(
        By.xpath(
          "//button[contains(text(), 'Proceed to Checkout') or contains(text(), 'Checkout')]"
        )
      );

      if (checkoutButtons.length > 0) {
        checkoutButton = checkoutButtons[0];
        log("Found checkout button by text");
      } else {
        // Log all buttons
        const allButtons = await driver.findElements(By.css("button"));
        log(`Found ${allButtons.length} buttons on cart page`);

        for (let i = 0; i < allButtons.length; i++) {
          try {
            const text = await allButtons[i].getText();
            log(`Button ${i + 1}: "${text}"`);

            // Look for checkout-related text
            if (
              text.toLowerCase().includes("checkout") ||
              text.toLowerCase().includes("proceed") ||
              text.toLowerCase().includes("payment")
            ) {
              checkoutButton = allButtons[i];
              log(`Found checkout button: Button ${i + 1}`);
              break;
            }
          } catch (e) {
            log(`Button ${i + 1}: [Error getting text]`);
          }
        }

        // If still no button found, use the last button (often primary action)
        if (!checkoutButton && allButtons.length > 0) {
          checkoutButton = allButtons[allButtons.length - 1];
          log("Using last button as checkout button");
        }
      }
    } catch (error) {
      log(`Error finding checkout button: ${error.message}`);
    }

    // 9. Click checkout button
    if (checkoutButton) {
      log("Clicking checkout button");
      try {
        await checkoutButton.click();
        log("Clicked checkout button");
      } catch (error) {
        log(`Error clicking checkout button: ${error.message}`);

        // Try JavaScript click
        try {
          await driver.executeScript("arguments[0].click();", checkoutButton);
          log("Clicked checkout button with JavaScript");
        } catch (e) {
          log(`JavaScript click failed: ${e.message}`);
        }
      }

      // Wait for navigation
      await driver.sleep(3000);

      // Check where we ended up
      const finalUrl = await driver.getCurrentUrl();
      log(`Final URL after checkout: ${finalUrl}`);
      await takeScreenshot(driver, "07_after_checkout");
    } else {
      log("No checkout button found");
    }

    log("Test completed");
  } catch (error) {
    log(`Error during test execution: ${error.message}`);
  } finally {
    // Clean up
    if (driver) {
      try {
        log("Closing browser");
        await driver.quit();
        log("Browser closed");
      } catch (error) {
        log(`Error closing browser: ${error.message}`);
      }
    }
  }
}

// Run the test
runSimpleLoginCartTest().catch((error) => {
  console.error("Unhandled error:", error);
});
