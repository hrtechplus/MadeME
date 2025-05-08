/**
 * MadeME Food Delivery App - Restaurant Menu Debug Test
 *
 * This script focuses solely on debugging the restaurant menu page
 * to help identify how menu items are structured in the application.
 */

const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");

// Configuration
const config = {
  baseUrl: "http://localhost:5173",
  screenshotsDir: path.join(__dirname, "../screenshots/debug"),
};

// Ensure screenshots directory exists
if (!fs.existsSync(config.screenshotsDir)) {
  fs.mkdirSync(config.screenshotsDir, { recursive: true });
}

// Take screenshot helper
async function takeScreenshot(driver, name) {
  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const screenshotPath = path.join(
    config.screenshotsDir,
    `${name}_${timestamp}.png`
  );
  const screenshot = await driver.takeScreenshot();
  fs.writeFileSync(screenshotPath, screenshot, "base64");
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function debugRestaurantPage() {
  console.log("Starting Restaurant Menu Debug Test...");
  let driver = null;

  try {
    // Initialize WebDriver
    console.log("Initializing Chrome WebDriver...");
    const options = new chrome.Options();
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    await driver.manage().setTimeouts({ implicit: 5000, pageLoad: 30000 });
    console.log("WebDriver initialized successfully");

    // Navigate directly to restaurant page with ID 1
    console.log("Navigating directly to restaurant/1...");
    await driver.get(`${config.baseUrl}/restaurant/1`);
    await driver.sleep(3000);

    // Take screenshot of the page
    await takeScreenshot(driver, "restaurant_page");

    // Get the page title and URL
    const title = await driver.getTitle();
    const url = await driver.getCurrentUrl();
    console.log(`Page title: "${title}"`);
    console.log(`Current URL: ${url}`);

    // Get page source for analysis
    const pageSource = await driver.getPageSource();
    console.log(`Page source length: ${pageSource.length} characters`);

    // Debug: Save page source to file for inspection
    const sourcePath = path.join(config.screenshotsDir, "page_source.html");
    fs.writeFileSync(sourcePath, pageSource);
    console.log(`Page source saved to: ${sourcePath}`);

    // Analyze the page structure
    console.log("\n----- Page Structure Analysis -----");

    // Try to locate restaurant name or header
    console.log("\nSearching for restaurant name/header:");
    const headerSelectors = [
      "h1",
      "h2",
      ".restaurant-name",
      ".restaurant-header",
      ".header",
      ".title",
    ];

    for (const selector of headerSelectors) {
      try {
        const elements = await driver.findElements(By.css(selector));
        if (elements.length > 0) {
          for (const el of elements) {
            const text = await el.getText();
            console.log(`${selector}: "${text}"`);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }

    // Look for containers that might hold menu items
    console.log("\nSearching for potential menu containers:");
    const containerSelectors = [
      ".menu",
      ".menu-container",
      ".menu-items",
      ".food-items",
      "section",
      ".products",
      "main > div",
    ];

    for (const selector of containerSelectors) {
      try {
        const elements = await driver.findElements(By.css(selector));
        console.log(`${selector}: ${elements.length} elements found`);
      } catch (e) {
        // Ignore errors
      }
    }

    // Generic elements count (to see what's on the page)
    console.log("\nGeneric elements count:");
    const genericSelectors = {
      divs: "div",
      buttons: "button",
      images: "img",
      links: "a",
      headings: "h1, h2, h3, h4, h5, h6",
      paragraphs: "p",
      spans: "span",
      lists: "ul, ol",
      "list items": "li",
      forms: "form",
      inputs: "input",
      labels: "label",
    };

    for (const [name, selector] of Object.entries(genericSelectors)) {
      try {
        const elements = await driver.findElements(By.css(selector));
        console.log(`${name}: ${elements.length}`);
      } catch (e) {
        // Ignore errors
      }
    }

    // Check for error messages on the page
    console.log("\nChecking for error messages:");
    const errorSelectors = [
      ".error",
      ".error-message",
      ".alert",
      ".notification",
      ".toast",
    ];

    for (const selector of errorSelectors) {
      try {
        const elements = await driver.findElements(By.css(selector));
        if (elements.length > 0) {
          for (const el of elements) {
            const text = await el.getText();
            console.log(`${selector}: "${text}"`);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }

    // Use JavaScript to extract potential menu items
    console.log("\nTrying to identify menu items via JavaScript:");

    const jsExtraction = await driver.executeScript(`
      const menuDetails = {
        menuContainers: [],
        potentialMenuItems: [],
        possibleAddButtons: []
      };
      
      // Look for menu containers
      document.querySelectorAll('.menu, .menu-list, section, main > div, [role="main"] > div').forEach(el => {
        menuDetails.menuContainers.push({
          tag: el.tagName,
          className: el.className,
          childElements: el.children.length
        });
      });
      
      // Look for potential menu items
      document.querySelectorAll('div').forEach(div => {
        // If div contains product info (name, price, image, etc.)
        const hasName = div.querySelector('h1, h2, h3, h4, h5, h6, .name, .title');
        const hasPrice = div.textContent.includes('$') || div.textContent.includes('€');
        const hasImage = div.querySelector('img');
        const hasButton = div.querySelector('button');
        
        if (hasName && (hasPrice || hasButton)) {
          menuDetails.potentialMenuItems.push({
            text: div.textContent.trim().substring(0, 50),
            className: div.className,
            hasImage: !!hasImage,
            hasButton: !!hasButton
          });
        }
      });
      
      // Look for add to cart buttons
      document.querySelectorAll('button').forEach(button => {
        const text = button.textContent.toLowerCase().trim();
        if (
          text.includes('add') || 
          text.includes('cart') || 
          text.includes('+') ||
          text === 'buy' ||
          button.className.includes('add') ||
          button.className.includes('cart')
        ) {
          menuDetails.possibleAddButtons.push({
            text: button.textContent.trim(),
            className: button.className
          });
        }
      });
      
      return menuDetails;
    `);

    console.log("Menu containers found:", jsExtraction.menuContainers.length);
    jsExtraction.menuContainers.forEach((container, i) => {
      console.log(
        `  Container ${i + 1}: ${container.tag}, class="${
          container.className
        }", children=${container.childElements}`
      );
    });

    console.log(
      "Potential menu items found:",
      jsExtraction.potentialMenuItems.length
    );
    jsExtraction.potentialMenuItems.forEach((item, i) => {
      console.log(
        `  Item ${i + 1}: "${item.text}...", class="${
          item.className
        }", hasImage=${item.hasImage}, hasButton=${item.hasButton}`
      );
    });

    console.log(
      "Possible add buttons found:",
      jsExtraction.possibleAddButtons.length
    );
    jsExtraction.possibleAddButtons.forEach((button, i) => {
      console.log(
        `  Button ${i + 1}: "${button.text}", class="${button.className}"`
      );
    });

    console.log("\nDebug test completed successfully");
  } catch (error) {
    console.error("Error during execution:", error);
  } finally {
    // Close the browser
    if (driver) {
      console.log("Closing browser...");
      await driver.quit();
      console.log("Browser closed");
    }
  }
}

// Run the test
debugRestaurantPage().catch(console.error);
