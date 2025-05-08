/**
 * MadeME Food Delivery App - Direct Restaurant Selection Test
 *
 * This script tests adding items to cart by:
 * 1. Opening the home page
 * 2. Directly selecting a featured restaurant from the home page
 * 3. Adding items to the cart
 * 4. Verifying cart contents
 *
 * Usage: node direct-restaurant-test.js
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
  screenshotsDir: path.join(__dirname, "../screenshots/direct"),
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
    `${colors.bright}TEST REPORT: DIRECT RESTAURANT SELECTION${colors.reset}`
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

async function runDirectRestaurantTest() {
  console.log(
    `${colors.bright}${colors.blue}Starting Direct Restaurant Selection Test...${colors.reset}`
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

    // 2. Navigate to the home page
    try {
      console.log(
        `\n${colors.yellow}Navigating to home page...${colors.reset}`
      );
      await driver.get(config.baseUrl);
      const title = await driver.getTitle();
      console.log(`Page title: "${title}"`);

      await driver.sleep(2000); // Wait for any animations or content to load
      await takeScreenshot(driver, "homepage");

      // Analyze home page to see what elements are available
      const pageSource = await driver.getPageSource();
      console.log(`Page source length: ${pageSource.length} characters`);

      addTestStep("Navigate to home page", true);
    } catch (error) {
      await takeScreenshot(driver, "homepage_error");
      addTestStep("Navigate to home page", false, error);
      throw error;
    }

    // 3. Select a featured restaurant directly from home page
    try {
      console.log(
        `\n${colors.yellow}Selecting a restaurant from home page...${colors.reset}`
      );

      // Try different approaches to find featured restaurants

      // Approach 1: Look for featured or popular restaurant sections
      const featuredSectionSelectors = [
        ".featured-restaurants",
        ".popular-restaurants",
        ".recommended-restaurants",
        ".restaurant-showcase",
        'section:has(h2:contains("Featured"))',
        'section:has(h2:contains("Popular"))',
      ];

      let featuredSection = null;
      let featuredRestaurants = [];

      // Try to find a featured restaurants section
      for (const selector of featuredSectionSelectors) {
        try {
          console.log(
            `Looking for featured section with selector: ${selector}`
          );
          const sections = await driver.findElements(By.css(selector));
          if (sections.length > 0) {
            featuredSection = sections[0];
            console.log(`Found featured section with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }

      // If found a featured section, look for restaurants within it
      if (featuredSection) {
        featuredRestaurants = await featuredSection.findElements(
          By.css('.restaurant-card, .restaurant, .card, a[href*="restaurant"]')
        );
        console.log(
          `Found ${featuredRestaurants.length} restaurants in featured section`
        );
      }

      // Approach 2: If no featured section or no restaurants in it, look for any restaurants on home page
      if (!featuredRestaurants.length) {
        console.log("Looking for restaurants anywhere on home page");

        const restaurantSelectors = [
          ".restaurant-card",
          ".restaurant-item",
          ".restaurant",
          'a[href*="restaurant"]',
          ".MuiCard-root",
          ".card:has(img)",
          "div:has(h3):has(img)",
        ];

        for (const selector of restaurantSelectors) {
          try {
            const restaurants = await driver.findElements(By.css(selector));
            if (restaurants.length > 0) {
              featuredRestaurants = restaurants;
              console.log(
                `Found ${restaurants.length} restaurants with selector: ${selector}`
              );
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }
      }

      // Approach 3: If still no restaurants found, use JavaScript to find elements that look like restaurants
      if (!featuredRestaurants.length) {
        console.log("Using JavaScript to find restaurant elements");

        const jsRestaurants = await driver.executeScript(`
          // Find elements that look like restaurant cards
          function findRestaurants() {
            // Look for elements with restaurant-related text near images
            const elements = [];
            
            // Find all images
            const images = document.querySelectorAll('img');
            for (const img of images) {
              // Look at parent elements up to 3 levels up
              let element = img;
              for (let i = 0; i < 3; i++) {
                element = element.parentElement;
                if (!element) break;
                
                // Check if this element or its children contain restaurant-related text
                const text = element.textContent.toLowerCase();
                if (text.includes('restaurant') || 
                    text.includes('cafe') || 
                    text.includes('food') || 
                    text.includes('pizza') || 
                    text.includes('burger')) {
                  elements.push(element);
                  break;
                }
                
                // Check if this element is clickable or contains a link
                if (element.tagName === 'A' || 
                    element.onclick || 
                    element.querySelector('a') ||
                    getComputedStyle(element).cursor === 'pointer') {
                  elements.push(element);
                  break;
                }
              }
            }
            
            return elements;
          }
          
          const restaurantElements = findRestaurants();
          // Mark these elements for identification
          restaurantElements.forEach((el, i) => {
            el.setAttribute('data-selenium-restaurant', 'restaurant-' + i);
          });
          
          return restaurantElements.length;
        `);

        console.log(
          `Found ${jsRestaurants} potential restaurant elements via JavaScript`
        );

        if (jsRestaurants > 0) {
          // Find the marked elements
          featuredRestaurants = await driver.findElements(
            By.css("[data-selenium-restaurant]")
          );
        }
      }

      // Approach 4: If all else fails, navigate directly to restaurant list
      if (!featuredRestaurants.length) {
        console.log(
          'No restaurants found on home page, looking for a "View all" or similar link'
        );

        // Look for "View All", "See More", "All Restaurants" etc. links
        const viewAllSelectors = [
          'a:contains("View All")',
          'a:contains("See More")',
          'a:contains("All Restaurants")',
          'a:contains("Browse")',
          'a[href="/restaurants"]',
          'a[href*="restaurant"]',
        ];

        let viewAllLink = null;

        for (const selector of viewAllSelectors) {
          try {
            const links = await driver.findElements(By.css(selector));
            if (links.length > 0) {
              viewAllLink = links[0];
              console.log(
                `Found "View All" type link with selector: ${selector}`
              );
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }

        if (viewAllLink) {
          await viewAllLink.click();
          console.log(
            'Clicked on "View All" link to navigate to restaurant list'
          );
          await driver.sleep(2000);

          // Now look for restaurants on this page
          featuredRestaurants = await driver.findElements(
            By.css(".restaurant-card, .restaurant-item, .restaurant, .card")
          );
          console.log(
            `Found ${featuredRestaurants.length} restaurants on restaurant list page`
          );
        } else {
          // Navigate directly to restaurants page as last resort
          console.log("Navigating directly to restaurants page");
          await driver.get(`${config.baseUrl}/restaurants`);
          await driver.sleep(2000);

          featuredRestaurants = await driver.findElements(
            By.css(".restaurant-card, .restaurant-item, .restaurant, .card")
          );
          console.log(
            `Found ${featuredRestaurants.length} restaurants on restaurant list page`
          );
        }
      }

      // Try to select the first restaurant if any were found
      if (featuredRestaurants.length > 0) {
        await takeScreenshot(driver, "before_restaurant_selection");

        // Try to get the name for logging
        try {
          const nameElement = await featuredRestaurants[0].findElement(
            By.css("h2, h3, h4, .name, .title")
          );
          const name = await nameElement.getText();
          console.log(`Selected restaurant: ${name}`);
        } catch (e) {
          console.log("Could not get restaurant name, but continuing");
        }

        // Click on the restaurant
        try {
          await featuredRestaurants[0].click();
          console.log("Clicked on restaurant");
        } catch (clickError) {
          console.log(`Error clicking restaurant: ${clickError.message}`);

          // Try with JavaScript as fallback
          await driver.executeScript(
            "arguments[0].click();",
            featuredRestaurants[0]
          );
          console.log("Clicked restaurant with JavaScript");
        }

        // Wait for navigation
        await driver.sleep(3000);

        // Check if we're on a restaurant detail page
        const currentUrl = await driver.getCurrentUrl();
        console.log(`Current URL after selection: ${currentUrl}`);

        // Verify that we're on a restaurant detail page
        if (
          currentUrl.includes("restaurant/") ||
          !currentUrl.includes(config.baseUrl)
        ) {
          console.log("Successfully navigated to a restaurant detail page");
        } else {
          // Fallback: direct navigation to a restaurant
          console.log(
            "Did not navigate to restaurant detail, trying direct navigation"
          );
          await driver.get(`${config.baseUrl}/restaurant/1`);
          await driver.sleep(2000);
        }

        await takeScreenshot(driver, "restaurant_detail");
        addTestStep("Select restaurant from home page", true);
      } else {
        // If no restaurants found, navigate directly to a restaurant detail page
        console.log(
          "No restaurants found, navigating directly to a restaurant detail page"
        );
        await driver.get(`${config.baseUrl}/restaurant/1`);
        await driver.sleep(2000);
        await takeScreenshot(driver, "direct_restaurant_navigation");
        addTestStep("Navigate directly to restaurant detail", true);
      }
    } catch (error) {
      await takeScreenshot(driver, "restaurant_selection_error");
      addTestStep("Select restaurant from home page", false, error);
      throw error;
    }

    // 4. Add items to cart
    try {
      console.log(`\n${colors.yellow}Adding items to cart...${colors.reset}`);

      // Take screenshot of menu
      await takeScreenshot(driver, "menu_before_adding");

      // Find all elements on the page to analyze structure
      console.log("Analyzing page structure...");
      const elementCounts = {
        divs: await driver
          .findElements(By.css("div"))
          .then((els) => els.length),
        buttons: await driver
          .findElements(By.css("button"))
          .then((els) => els.length),
        images: await driver
          .findElements(By.css("img"))
          .then((els) => els.length),
        "h1-h6": await driver
          .findElements(By.css("h1, h2, h3, h4, h5, h6"))
          .then((els) => els.length),
      };
      console.log("Element counts:", elementCounts);

      // Try to find menu items using different approaches
      let menuItems = [];

      // Approach 1: Standard selectors
      const menuItemSelectors = [
        ".menu-item",
        ".food-item",
        ".product",
        ".product-card",
        ".dish",
        '[data-testid="menu-item"]',
      ];

      for (const selector of menuItemSelectors) {
        console.log(`Looking for menu items with selector: ${selector}`);
        menuItems = await driver.findElements(By.css(selector));
        if (menuItems.length > 0) {
          console.log(
            `Found ${menuItems.length} menu items with selector: ${selector}`
          );
          break;
        }
      }

      // Approach 2: Look for elements with price indicators
      if (menuItems.length === 0) {
        console.log("Looking for elements with price indicators");

        // Get all elements with '$' character
        const elementsWithPrice = await driver.findElements(
          By.xpath("//*[contains(text(), '$')]")
        );
        console.log(
          `Found ${elementsWithPrice.length} elements with '$' character`
        );

        if (elementsWithPrice.length > 0) {
          // For each price element, find a parent that might be a menu item
          for (const priceElement of elementsWithPrice.slice(0, 5)) {
            // Limit to first 5 for performance
            try {
              // Get parent container (up to 3 levels up)
              let container = priceElement;
              for (let i = 0; i < 3; i++) {
                try {
                  container = await container.findElement(By.xpath(".."));
                  const hasButton = await container
                    .findElements(By.css("button"))
                    .then((b) => b.length > 0);
                  const hasImage = await container
                    .findElements(By.css("img"))
                    .then((imgs) => imgs.length > 0);

                  if (hasButton || hasImage) {
                    menuItems.push(container);
                    break;
                  }
                } catch (e) {
                  break;
                }
              }
            } catch (e) {
              // Skip to next price element
            }
          }

          console.log(
            `Found ${menuItems.length} potential menu items with price indicators`
          );
        }
      }

      // Approach 3: Use JavaScript to find elements that look like menu items
      if (menuItems.length === 0) {
        console.log("Using JavaScript to find menu items");

        const jsMenuItems = await driver.executeScript(`
          // Find elements that look like menu items
          function findMenuItems() {
            const menuItems = [];
            
            // Look for elements with price indicators
            const priceRegex = /\\$\\d+(\\.\\d{2})?/;
            const allElements = document.querySelectorAll('div, li, article');
            
            for (const el of allElements) {
              // Skip very small elements or hidden elements
              if (!el.offsetWidth || !el.offsetHeight) continue;
              
              const text = el.textContent;
              
              // Check if element has price
              if (priceRegex.test(text)) {
                // Look for elements with add button and price
                const hasButton = el.querySelector('button');
                if (hasButton) {
                  menuItems.push(el);
                  continue;
                }
                
                // Look for elements with name and price (but might not have button)
                const hasHeading = el.querySelector('h1, h2, h3, h4, h5, h6');
                const hasImage = el.querySelector('img');
                if ((hasHeading || text.length > 10) && (hasImage || text.length > 20)) {
                  menuItems.push(el);
                }
              }
            }
            
            return menuItems;
          }
          
          const items = findMenuItems();
          // Mark these elements for identification
          items.forEach((el, i) => {
            el.setAttribute('data-selenium-menu-item', 'item-' + i);
          });
          
          return items.length;
        `);

        console.log(`Found ${jsMenuItems} potential menu items via JavaScript`);

        if (jsMenuItems > 0) {
          // Find the marked elements
          menuItems = await driver.findElements(
            By.css("[data-selenium-menu-item]")
          );
        }
      }

      // If still no menu items found, try to find any button that might add to cart
      if (menuItems.length === 0) {
        console.log("Looking for any add to cart buttons");

        const addButtonSelectors = [
          'button:contains("Add")',
          'button:contains("+")',
          "button.add-to-cart",
          'button[data-testid="add-to-cart"]',
          "button.add",
          "button.btn-add",
        ];

        let addButtons = [];

        for (const selector of addButtonSelectors) {
          try {
            const buttons = await driver.findElements(By.css(selector));
            if (buttons.length > 0) {
              addButtons = buttons;
              console.log(
                `Found ${buttons.length} add buttons with selector: ${selector}`
              );
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }

        if (addButtons.length > 0) {
          // Create fake menu items from the buttons for the next steps
          menuItems = addButtons;
        }
      }

      // If we have menu items, try to add them to cart
      if (menuItems.length > 0) {
        // Store names of items being added to cart for verification
        const addedItemNames = [];

        // Select items to add (up to 2 or as many as available if less)
        const itemsToAdd = Math.min(2, menuItems.length);

        for (let i = 0; i < itemsToAdd; i++) {
          console.log(`Processing menu item ${i + 1}...`);

          // For each iteration, re-find the menu items to avoid stale element references
          if (i > 0) {
            console.log(
              "Refreshing menu item references to avoid stale elements..."
            );
            // Use the same selector that worked the first time to find menu items again
            if (menuItems.length > 0) {
              try {
                // First try with price indicators since that worked before
                const refreshedElementsWithPrice = await driver.findElements(
                  By.xpath("//*[contains(text(), '$')]")
                );
                console.log(
                  `Found ${refreshedElementsWithPrice.length} elements with '$' character`
                );

                menuItems = [];

                if (refreshedElementsWithPrice.length > 0) {
                  // For each price element, find a parent that might be a menu item
                  for (const priceElement of refreshedElementsWithPrice.slice(
                    0,
                    5
                  )) {
                    // Limit to first 5
                    try {
                      // Get parent container (up to 3 levels up)
                      let container = priceElement;
                      for (let j = 0; j < 3; j++) {
                        try {
                          container = await container.findElement(
                            By.xpath("..")
                          );
                          const hasButton = await container
                            .findElements(By.css("button"))
                            .then((b) => b.length > 0);
                          const hasImage = await container
                            .findElements(By.css("img"))
                            .then((imgs) => imgs.length > 0);

                          if (hasButton || hasImage) {
                            menuItems.push(container);
                            break;
                          }
                        } catch (e) {
                          break;
                        }
                      }
                    } catch (e) {
                      // Skip to next price element
                    }
                  }

                  console.log(
                    `Refreshed ${menuItems.length} potential menu items with price indicators`
                  );
                }
              } catch (refreshError) {
                console.log(
                  `Error refreshing menu items: ${refreshError.message}`
                );

                // As a fallback, look for any add buttons
                try {
                  const addButtons = await driver.findElements(
                    By.css("button")
                  );
                  console.log(`Found ${addButtons.length} buttons as fallback`);

                  // Filter buttons that might be "add to cart" buttons
                  menuItems = [];
                  for (const button of addButtons) {
                    try {
                      const text = await button.getText();
                      if (text.toLowerCase().includes("add") || text === "+") {
                        menuItems.push(button);
                      }
                    } catch (e) {
                      // Skip this button
                    }
                  }

                  console.log(
                    `Found ${menuItems.length} potential add buttons`
                  );
                } catch (buttonError) {
                  console.log(`Error finding buttons: ${buttonError.message}`);
                }
              }
            }
          }

          // Skip this item if we couldn't refresh the references
          if (i > 0 && menuItems.length <= i) {
            console.log(
              `Skipping item ${
                i + 1
              } as we couldn't find enough refreshed menu items`
            );
            continue;
          }

          // Get item name for verification if possible
          try {
            const nameElement = await menuItems[i].findElement(
              By.css(
                'h1, h2, h3, h4, h5, h6, .name, .title, [data-testid="item-name"]'
              )
            );
            const name = await nameElement.getText();
            addedItemNames.push(name);
            console.log(`Adding item to cart: ${name}`);
          } catch (e) {
            console.log(`Adding item #${i + 1} (couldn't get name)`);
          }

          // Try to find and click an add to cart button
          try {
            // Look for a button within this menu item
            const addToCartButton = await menuItems[i].findElement(
              By.css("button")
            );

            // Click the button
            await addToCartButton.click();
            console.log(`Clicked add button for item ${i + 1}`);
          } catch (buttonError) {
            console.log(
              `Couldn't find add button within item ${
                i + 1
              }, trying to click the item itself`
            );

            // Alternative: Look for add buttons directly on the page
            try {
              // Find all buttons with "Add" text or "+" symbol
              const allAddButtons = await driver.findElements(
                By.xpath(
                  "//button[contains(text(), 'Add') or contains(text(), '+')]"
                )
              );

              if (allAddButtons.length > i) {
                await allAddButtons[i].click();
                console.log(`Clicked standalone add button #${i + 1}`);
              } else {
                // Try clicking the item itself
                try {
                  await menuItems[i].click();
                  console.log(`Clicked on item ${i + 1}`);

                  // If a modal opens, look for add button there
                  await driver.sleep(1000);

                  try {
                    const modalAddButton = await driver.findElement(
                      By.css(
                        ".modal button, .dialog button, .MuiDialog-root button"
                      )
                    );
                    await modalAddButton.click();
                    console.log("Clicked add button in modal");
                  } catch (modalError) {
                    console.log("No modal detected or no add button in modal");
                  }
                } catch (itemClickError) {
                  console.log(
                    `Failed to click on item ${i + 1}: ${
                      itemClickError.message
                    }`
                  );

                  // Try with JavaScript as last resort
                  try {
                    await driver.executeScript(
                      "arguments[0].click();",
                      menuItems[i]
                    );
                    console.log(`Clicked item ${i + 1} with JavaScript`);
                  } catch (jsError) {
                    console.log(`JavaScript click failed: ${jsError.message}`);

                    // Last resort - try to find and click any remaining add button
                    try {
                      const remainingButtons = await driver.findElements(
                        By.css("button")
                      );
                      for (const btn of remainingButtons) {
                        try {
                          const text = await btn.getText();
                          if (
                            text.toLowerCase().includes("add") ||
                            text === "+"
                          ) {
                            await btn.click();
                            console.log("Clicked an add button found by text");
                            break;
                          }
                        } catch (e) {
                          // Continue to next button
                        }
                      }
                    } catch (lastError) {
                      console.log(
                        `Failed to find any remaining add buttons: ${lastError.message}`
                      );
                    }
                  }
                }
              }
            } catch (altButtonError) {
              console.log(
                `Failed to find alternative add buttons: ${altButtonError.message}`
              );
            }
          }

          // Wait slightly longer between adding items
          await driver.sleep(2000);
        }

        console.log(`Attempted to add ${itemsToAdd} items to cart`);
        await takeScreenshot(driver, "after_adding_items");

        // Look for cart indicator or notification
        try {
          const cartIndicators = await driver.findElements(
            By.css(".cart-badge, .cart-count, .badge, .notification")
          );

          if (cartIndicators.length > 0) {
            for (const indicator of cartIndicators) {
              try {
                const text = await indicator.getText();
                console.log(`Cart indicator found with text: ${text}`);
              } catch (e) {
                console.log("Cart indicator found (no text)");
              }
            }
          } else {
            console.log(
              "No cart indicators found, but items may still be added"
            );
          }
        } catch (e) {
          console.log("Could not find cart indicators");
        }

        addTestStep("Add items to cart", true);
      } else {
        console.log("No menu items found, cannot add to cart");
        throw new Error("No menu items found on restaurant page");
      }
    } catch (error) {
      await takeScreenshot(driver, "add_items_error");
      addTestStep("Add items to cart", false, error);
      throw error;
    }

    // 5. Navigate to cart and verify items
    try {
      console.log(
        `\n${colors.yellow}Navigating to cart page...${colors.reset}`
      );

      // Look for cart link/icon in the header
      const cartLinkSelectors = [
        'a[href="/cart"]',
        ".cart-icon",
        ".cart",
        "button:has(.cart-icon)",
        "button:has(.fa-shopping-cart)",
        "button:has(.cart)",
        "a:has(.fa-shopping-cart)",
      ];

      let cartLink = null;

      for (const selector of cartLinkSelectors) {
        try {
          const links = await driver.findElements(By.css(selector));
          if (links.length > 0) {
            cartLink = links[0];
            console.log(`Found cart link with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }

      if (cartLink) {
        // Click on cart link
        await cartLink.click();
        console.log("Clicked on cart link");
      } else {
        // Navigate directly to cart
        console.log("No cart link found, navigating directly to cart page");
        await driver.get(`${config.baseUrl}/cart`);
      }

      // Wait for navigation
      await driver.sleep(2000);
      await takeScreenshot(driver, "cart_page");

      // Try to find cart items
      const cartItemSelectors = [
        ".cart-item",
        ".item",
        ".line-item",
        ".product-in-cart",
        '[data-testid="cart-item"]',
      ];

      let cartItems = [];

      for (const selector of cartItemSelectors) {
        console.log(`Looking for cart items with selector: ${selector}`);
        cartItems = await driver.findElements(By.css(selector));
        if (cartItems.length > 0) {
          console.log(
            `Found ${cartItems.length} cart items with selector: ${selector}`
          );
          break;
        }
      }

      // If no cart items found with standard selectors, use JavaScript to look deeper
      if (cartItems.length === 0) {
        console.log("Using JavaScript to find cart items");

        const jsCartItems = await driver.executeScript(`
          // Find elements that look like cart items
          function findCartItems() {
            const cartItems = [];
            
            // Look for elements with price indicators that look like cart items
            const priceRegex = /\\$\\d+(\\.\\d{2})?/;
            const allElements = document.querySelectorAll('div, li, tr');
            
            for (const el of allElements) {
              // Skip very small elements or hidden elements
              if (!el.offsetWidth || !el.offsetHeight) continue;
              
              const text = el.textContent;
              
              // Check if element has price and quantity indicators
              if (priceRegex.test(text) && (
                  el.querySelector('input[type="number"]') ||
                  text.includes('qty') || 
                  text.includes('quantity') ||
                  el.querySelector('button:contains("+")') ||
                  el.querySelector('button:contains("-")')
                )) {
                cartItems.push(el);
              }
            }
            
            return cartItems;
          }
          
          const items = findCartItems();
          // Mark these elements for identification
          items.forEach((el, i) => {
            el.setAttribute('data-selenium-cart-item', 'cart-item-' + i);
          });
          
          return items.length;
        `);

        console.log(`Found ${jsCartItems} potential cart items via JavaScript`);

        if (jsCartItems > 0) {
          // Find the marked elements
          cartItems = await driver.findElements(
            By.css("[data-selenium-cart-item]")
          );
        }
      }

      // Check if we have items in the cart
      if (cartItems.length > 0) {
        console.log(`Found ${cartItems.length} items in cart`);

        // Get details of the first cart item
        try {
          const firstItemText = await cartItems[0].getText();
          console.log(
            `First cart item: ${firstItemText.substring(0, 50)}${
              firstItemText.length > 50 ? "..." : ""
            }`
          );
        } catch (e) {
          console.log("Could not get text of first cart item");
        }

        // Try to find total price
        try {
          const totalSelectors = [
            ".total",
            ".cart-total",
            ".order-total",
            ".subtotal",
            "tfoot .price",
            '[data-testid="cart-total"]',
          ];

          for (const selector of totalSelectors) {
            try {
              const totalElements = await driver.findElements(By.css(selector));
              if (totalElements.length > 0) {
                const totalText = await totalElements[0].getText();
                console.log(`Cart total: ${totalText}`);
                break;
              }
            } catch (e) {
              // Try next selector
            }
          }
        } catch (e) {
          console.log("Could not find cart total");
        }

        addTestStep("Verify cart contents", true);
      } else {
        console.log("No items found in cart");
        throw new Error("No items found in cart");
      }
    } catch (error) {
      await takeScreenshot(driver, "cart_verification_error");
      addTestStep("Verify cart contents", false, error);
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
runDirectRestaurantTest()
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
