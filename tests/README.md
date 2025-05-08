# MadeME Food Delivery App - Selenium Tests

This directory contains automated end-to-end tests using Selenium WebDriver for the MadeME food delivery application.

## Prerequisites

Before running the tests, make sure you have:

1. Node.js installed (v12 or higher)
2. Chrome browser installed
3. The frontend application running on `http://localhost:5173`
4. All microservices (cart, order, payment, restaurant, user) running

## Setup

1. Install dependencies:

```bash
cd tests
npm install
```

2. Make sure the ChromeDriver version matches your Chrome browser version. If you need to update:

```bash
npm uninstall chromedriver
npm install chromedriver@<version-number>
```

## Running Tests

Make sure your frontend application and all microservices are running before executing tests.

### Run all tests

```bash
npm test
```

### Run a specific test file

```bash
npx mocha selenium/<test-file>.js --timeout 60000
```

For example:

```bash
npx mocha selenium/login.test.js --timeout 60000
```

## Test Files

- `login.test.js`: Tests for login functionality
- `restaurant.test.js`: Tests for restaurant listing and menu viewing
- `cart.test.js`: Tests for shopping cart and checkout process
- `testUtils.js`: Helper functions for tests

## Customizing Tests

You may need to adjust the selectors in the test files to match your actual HTML structure. Look for CSS selectors like `.restaurant-card`, `.menu-item`, etc., and update them as needed.

## Troubleshooting

1. **Timeout errors**: Increase the timeout value (e.g., `--timeout 120000`)
2. **Element not found errors**: Check if the selectors match your actual HTML elements
3. **Browser not starting**: Make sure ChromeDriver version matches your Chrome browser
4. **Connection refused**: Make sure the frontend application is running at http://localhost:5173

## Taking Screenshots

The `TestUtils` class includes a method to take screenshots during test execution:

```javascript
const TestUtils = require("./testUtils");
// In your test
await TestUtils.takeScreenshot(driver, "test-name");
```

Screenshots are saved in the `tests/screenshots` directory.
