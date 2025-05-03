const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const chromedriver = require("chromedriver");

console.log("ChromeDriver Path:", chromedriver.path);
console.log("ChromeDriver Version:", chromedriver.version);

async function testDriverSetup() {
  console.log("Attempting to create a new Chrome browser instance...");

  try {
    const options = new chrome.Options();
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");

    console.log("Creating WebDriver...");
    const driver = await new webdriver.Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    console.log("WebDriver created successfully!");
    console.log("Closing browser...");
    await driver.quit();
    console.log("Browser closed successfully");
    return true;
  } catch (error) {
    console.error("Error creating WebDriver:", error.message);
    console.error("Stack trace:", error.stack);
    return false;
  }
}

// Run the test
testDriverSetup()
  .then((success) => {
    console.log("Test complete. Success:", success);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
