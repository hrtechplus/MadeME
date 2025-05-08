const { Builder, By, Key, until } = require("selenium-webdriver");
const { expect } = require("chai");
const chrome = require("selenium-webdriver/chrome");

describe("Restaurant Tests", function () {
  let driver;

  before(async function () {
    // Set up Chrome options
    const options = new chrome.Options();
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

  it("should display restaurant list", async function () {
    // Navigate to restaurant list page
    await driver.get("http://localhost:5173/restaurants");

    // Verify restaurants are displayed
    const restaurantCards = await driver.findElements(
      By.css(".restaurant-card")
    );
    expect(restaurantCards.length).to.be.greaterThan(0);
  });

  it("should navigate to restaurant detail page when a restaurant is clicked", async function () {
    // Navigate to restaurant list page
    await driver.get("http://localhost:5173/restaurants");

    // Click on the first restaurant
    const firstRestaurant = await driver.findElement(
      By.css(".restaurant-card")
    );

    // Get restaurant name for later verification
    const restaurantName = await firstRestaurant
      .findElement(By.css(".restaurant-name"))
      .getText();

    // Click on the restaurant card
    await firstRestaurant.click();

    // Wait for navigation to restaurant detail page
    await driver.wait(
      until.urlContains("/restaurant/"),
      5000,
      "Expected URL to contain /restaurant/"
    );

    // Verify the restaurant detail page shows the correct restaurant
    const detailPageTitle = await driver
      .findElement(By.css(".restaurant-detail-name"))
      .getText();
    expect(detailPageTitle).to.equal(restaurantName);
  });

  it("should display menu items for a restaurant", async function () {
    // Navigate directly to a restaurant detail page
    // You might need to adjust this URL based on your actual restaurant IDs
    await driver.get("http://localhost:5173/restaurant/1");

    // Verify menu items are displayed
    const menuItems = await driver.findElements(By.css(".menu-item"));
    expect(menuItems.length).to.be.greaterThan(0);

    // Verify each menu item has a name and price
    const firstMenuItem = menuItems[0];
    const itemName = await firstMenuItem
      .findElement(By.css(".item-name"))
      .getText();
    const itemPrice = await firstMenuItem
      .findElement(By.css(".item-price"))
      .getText();

    expect(itemName).to.not.be.empty;
    expect(itemPrice).to.not.be.empty;
  });
});
