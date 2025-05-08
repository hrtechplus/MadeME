/**
 * MadeME Food Delivery App - Simple Cart Check
 *
 * A simplified test to check if adding items to cart actually works.
 * This script focuses on:
 * 1. Going directly to a restaurant page
 * 2. Adding an item to cart
 * 3. Checking if the item appears in the cart
 */

const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");

// Simple test config
const config = {
  baseUrl: "http://localhost:5173",
  screenshotsDir: path.join(__dirname, "../screenshots/simple-cart"),
  debug: true, // Enable to see more detailed logs
};

// Ensure screenshots directory exists
if (!fs.existsSync(config.screenshotsDir)) {
  fs.mkdirSync(config.screenshotsDir, { recursive: true });
}

// Simple logging
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Take screenshot
async function takeScreenshot(driver, name) {
  const screenshotPath = path.join(config.screenshotsDir, `${name}.png`);
  try {
    const screenshot = await driver.takeScreenshot();
    fs.writeFileSync(screenshotPath, screenshot, "base64");
    log(`Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    log(`Error taking screenshot: ${error.message}`);
  }
}

async function runCartCheck() {
  log("Starting Simple Cart Check");
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

    // Go directly to the first restaurant
    log("Navigating directly to restaurant/1");
    await driver.get(`${config.baseUrl}/restaurant/1`);
    await driver.sleep(3000);
    await takeScreenshot(driver, "01_restaurant_page");

    // Find and click first add to cart button
    let addedItem = null;
    try {
      log("Looking for add to cart buttons");
      const addButtons = await driver.findElements(By.css("button"));

      // Log all buttons for debugging
      if (config.debug) {
        log(`Found ${addButtons.length} buttons on page`);
        for (let i = 0; i < addButtons.length; i++) {
          try {
            const text = await addButtons[i].getText();
            log(`Button ${i + 1}: "${text}"`);
          } catch (e) {
            log(`Button ${i + 1}: [Error getting text]`);
          }
        }
      }

      // Find a button with "Add" text
      let addButton = null;
      for (const btn of addButtons) {
        const text = await btn.getText();
        if (text.toLowerCase().includes("add") || text === "+") {
          addButton = btn;
          log(`Found add button with text: "${text}"`);
          break;
        }
      }

      if (!addButton && addButtons.length > 0) {
        // Just use the first button if we couldn't find one with "Add" text
        addButton = addButtons[0];
        log('Could not find an explicit "Add" button, using first button');
      }

      if (addButton) {
        // Try to get the name of the item we're adding
        try {
          // Look up a few levels to find a container that might have product info
          let element = addButton;
          for (let i = 0; i < 3; i++) {
            try {
              element = await element.findElement(By.xpath(".."));

              // Try to find a name in this element
              try {
                const nameElement = await element.findElement(
                  By.css("h1, h2, h3, h4, h5, h6, .name, .title")
                );
                addedItem = await nameElement.getText();
                log(`Adding item to cart: "${addedItem}"`);
                break;
              } catch (e) {
                // No name in this element, continue
              }
            } catch (e) {
              break;
            }
          }
        } catch (e) {
          log("Could not determine item name");
        }

        // Take screenshot before clicking
        await takeScreenshot(driver, "02_before_adding");

        // Click the add button
        await addButton.click();
        log("Clicked add button");

        // Wait for any notifications or cart updates
        await driver.sleep(2000);
        await takeScreenshot(driver, "03_after_adding");

        // Look for any visual indication that item was added
        try {
          const notifications = await driver.findElements(
            By.css(
              ".notification, .toast, .alert, .snackbar, .MuiSnackbar-root"
            )
          );
          if (notifications.length > 0) {
            for (const notification of notifications) {
              const text = await notification.getText();
              log(`Notification found: "${text}"`);
            }
          }
        } catch (e) {
          log("No notifications found");
        }
      } else {
        log("No add buttons found");
      }
    } catch (error) {
      log(`Error adding item to cart: ${error.message}`);
    }

    // Check for cart count in header
    let cartCountFound = false;
    try {
      log("Looking for cart count indicators");
      const cartIndicators = await driver.findElements(
        By.css(".cart-badge, .cart-count, .badge, .cart-items-count")
      );

      if (cartIndicators.length > 0) {
        for (const indicator of cartIndicators) {
          const text = await indicator.getText();
          log(`Cart indicator found with text: "${text}"`);
          cartCountFound = true;
        }
      }
    } catch (e) {
      log("No cart count indicators found");
    }

    // Go to cart page
    log("Navigating directly to cart page");
    await driver.get(`${config.baseUrl}/cart`);
    await driver.sleep(2000);
    await takeScreenshot(driver, "04_cart_page");

    // Check page source for any cart-related content
    const pageSource = await driver.getPageSource();
    log(`Cart page source length: ${pageSource.length} characters`);

    // Try both standard and custom ways to find cart items
    let cartItemsFound = false;
    let cartItemsCount = 0;

    // Method 1: Standard selectors
    const standardSelectors = [
      ".cart-item",
      ".item",
      ".line-item",
      ".product-in-cart",
      '[data-testid="cart-item"]',
      ".cart-product",
    ];

    for (const selector of standardSelectors) {
      try {
        const items = await driver.findElements(By.css(selector));
        if (items.length > 0) {
          cartItemsFound = true;
          cartItemsCount = items.length;
          log(`Found ${items.length} cart items with selector: ${selector}`);

          // Get text of first item
          const firstItemText = await items[0].getText();
          log(`First cart item text: "${firstItemText}"`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    // Method 2: Look for price elements that might be in the cart
    if (!cartItemsFound) {
      log("Looking for price elements in cart");
      try {
        const priceElements = await driver.findElements(
          By.xpath("//*[contains(text(), '$')]")
        );
        log(
          `Found ${priceElements.length} elements with '$' character on cart page`
        );

        if (priceElements.length > 0) {
          // If we found price elements, we probably have items in the cart
          cartItemsFound = priceElements.length > 1; // More than just a total

          // Try to get text from these elements
          for (let i = 0; i < Math.min(3, priceElements.length); i++) {
            try {
              // Get the parent element which might contain the whole cart item
              const parent = await priceElements[i].findElement(
                By.xpath("../..")
              );
              const text = await parent.getText();
              log(
                `Price-containing element ${i + 1}: "${text.substring(0, 50)}${
                  text.length > 50 ? "..." : ""
                }"`
              );
            } catch (e) {
              // Skip if can't get text
            }
          }
        }
      } catch (e) {
        log(`Error looking for price elements: ${e.message}`);
      }
    }

    // Method 3: Look for any "empty cart" indications
    try {
      const emptyCartMessages = await driver.findElements(
        By.xpath(
          "//*[contains(text(), 'empty') or contains(text(), 'Empty') or contains(text(), 'no items')]"
        )
      );

      if (emptyCartMessages.length > 0) {
        log('Found "empty cart" message:');
        for (const msg of emptyCartMessages) {
          const text = await msg.getText();
          log(`Empty cart message: "${text}"`);
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // Final screenshot showing cart analysis
    await takeScreenshot(driver, "05_cart_analysis");

    // Print conclusion
    if (cartItemsFound) {
      log(`SUCCESS: Found ${cartItemsCount} items in cart`);
      if (addedItem) {
        log(`Item "${addedItem}" was successfully added to cart`);
      } else {
        log("Item was successfully added to cart (name unknown)");
      }
    } else if (cartCountFound) {
      log(
        "PARTIAL SUCCESS: Cart count indicator was updated, but no items found on cart page"
      );
    } else {
      log(
        "FAILURE: No items found in cart and no cart count indicators updated"
      );
      log("The add-to-cart functionality may not be working correctly");
    }

    log("Test completed");
  } catch (error) {
    log(`Error during test execution: ${error.message}`);
  } finally {
    // Close the browser
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
runCartCheck().catch((error) => {
  console.error("Unhandled error:", error);
});
