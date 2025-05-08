const { Builder, By, Key, until } = require("selenium-webdriver");
const { expect } = require("chai");
const chrome = require("selenium-webdriver/chrome");

describe("Login Tests", function () {
  let driver;

  before(async function () {
    // Set up Chrome options
    const options = new chrome.Options();
    // Comment the next line out if you want to see the browser
    // options.addArguments('--headless');

    // Initialize the WebDriver
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    // Set implicit wait time
    await driver.manage().setTimeouts({ implicit: 10000 });
  });

  after(async function () {
    // Close the browser after tests
    await driver.quit();
  });

  it("should show error with invalid credentials", async function () {
    // Navigate to login page
    await driver.get("http://localhost:5173/login");

    // Enter invalid credentials
    await driver.findElement(By.name("email")).sendKeys("invalid@example.com");
    await driver.findElement(By.name("password")).sendKeys("wrongpassword");

    // Click login button
    await driver.findElement(By.css('button[type="submit"]')).click();

    // Wait for error message
    const errorElement = await driver.wait(
      until.elementLocated(By.css(".error-message")),
      5000
    );

    // Verify error message
    const errorText = await errorElement.getText();
    expect(errorText).to.include("Invalid email or password");
  });

  it("should login successfully with valid credentials", async function () {
    // Navigate to login page
    await driver.get("http://localhost:5173/login");

    // Enter valid credentials - replace with test user credentials
    await driver.findElement(By.name("email")).sendKeys("user@example.com");
    await driver.findElement(By.name("password")).sendKeys("password123");

    // Click login button
    await driver.findElement(By.css('button[type="submit"]')).click();

    // Wait for navigation to home page
    await driver.wait(
      until.urlContains("/home"),
      5000,
      "Expected URL to change to home page"
    );

    // Verify successful login by checking for user elements
    const userElement = await driver.findElement(By.css(".user-profile"));
    expect(await userElement.isDisplayed()).to.be.true;
  });
});
