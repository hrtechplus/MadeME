const { Builder, By, Key, until } = require("selenium-webdriver");
const { expect } = require("chai");
const chrome = require("selenium-webdriver/chrome");

describe("Cart and Checkout Tests", function () {
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

    // Login before running cart tests
    await login(driver);
  });

  after(async function () {
    // Close the browser after tests
    await driver.quit();
  });

  it("should add items to cart from restaurant menu", async function () {
    // Navigate to a restaurant menu page
    await driver.get("http://localhost:5173/restaurant/1");

    // Find menu items
    const addToCartButtons = await driver.findElements(
      By.css(".add-to-cart-btn")
    );

    // Add first two items to cart
    await addToCartButtons[0].click();
    await driver.sleep(1000); // Small delay to ensure item is added
    await addToCartButtons[1].click();

    // Navigate to cart page
    await driver.get("http://localhost:5173/cart");

    // Verify items were added to cart
    const cartItems = await driver.findElements(By.css(".cart-item"));
    expect(cartItems.length).to.equal(2);
  });

  it("should update item quantity in cart", async function () {
    // Navigate to cart page
    await driver.get("http://localhost:5173/cart");

    // Find the quantity input for the first item
    const quantityInput = await driver.findElement(By.css(".quantity-input"));

    // Get initial item total price
    const initialPriceElement = await driver.findElement(
      By.css(".item-total-price")
    );
    const initialPrice = parseFloat(
      await initialPriceElement.getText().replace("$", "")
    );

    // Clear the input and set a new quantity
    await quantityInput.clear();
    await quantityInput.sendKeys("3");
    await quantityInput.sendKeys(Key.ENTER);

    // Wait for price update
    await driver.sleep(1000);

    // Get updated item total price
    const updatedPriceElement = await driver.findElement(
      By.css(".item-total-price")
    );
    const updatedPrice = parseFloat(
      await updatedPriceElement.getText().replace("$", "")
    );

    // Verify price has been updated
    expect(updatedPrice).to.be.greaterThan(initialPrice);
  });

  it("should proceed to checkout", async function () {
    // Navigate to cart page
    await driver.get("http://localhost:5173/cart");

    // Click checkout button
    await driver.findElement(By.css(".checkout-btn")).click();

    // Wait for navigation to checkout page
    await driver.wait(
      until.urlContains("/checkout"),
      5000,
      "Expected URL to contain /checkout"
    );

    // Verify checkout form is displayed
    const checkoutForm = await driver.findElement(By.css(".checkout-form"));
    expect(await checkoutForm.isDisplayed()).to.be.true;
  });

  it("should complete the checkout process", async function () {
    // Navigate to checkout page
    await driver.get("http://localhost:5173/checkout");

    // Fill in delivery address
    await driver.findElement(By.name("address")).sendKeys("123 Test Street");
    await driver.findElement(By.name("city")).sendKeys("Test City");
    await driver.findElement(By.name("zipCode")).sendKeys("12345");

    // Select payment method
    await driver.findElement(By.css('input[value="creditCard"]')).click();

    // Click place order button
    await driver.findElement(By.css(".place-order-btn")).click();

    // Wait for navigation to payment page
    await driver.wait(
      until.urlContains("/payment"),
      5000,
      "Expected URL to contain /payment"
    );

    // Verify payment form is displayed
    const paymentForm = await driver.findElement(By.css(".payment-form"));
    expect(await paymentForm.isDisplayed()).to.be.true;
  });
});

// Helper function to login before tests
async function login(driver) {
  await driver.get("http://localhost:5173/login");

  // Enter valid credentials
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
}
