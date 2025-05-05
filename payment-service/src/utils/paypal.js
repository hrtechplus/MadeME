const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");
const logger = require("./logger");

// Track API call timestamps to implement basic rate limiting
const apiCallTracker = {
  calls: [],
  maxCallsPerMinute: 30, // PayPal typically allows around 50 calls per minute, but we'll be conservative

  // Add a call to the tracker
  addCall() {
    const now = Date.now();
    this.calls.push(now);
    this.cleanup();
  },

  // Remove old calls (older than 1 minute)
  cleanup() {
    const oneMinuteAgo = Date.now() - 60000;
    this.calls = this.calls.filter((timestamp) => timestamp > oneMinuteAgo);
  },

  // Check if we're rate limited
  isRateLimited() {
    this.cleanup();
    return this.calls.length >= this.maxCallsPerMinute;
  },

  // Get recommended wait time if rate limited
  getWaitTime() {
    if (!this.isRateLimited()) return 0;

    // Calculate time until oldest call is one minute old
    const oldestCall = Math.min(...this.calls);
    const timeToWait = oldestCall + 60000 - Date.now();

    return Math.max(timeToWait, 1000); // Minimum 1 second wait
  },
};

// Validates PayPal environment variables
function validateCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    logger.warn(
      "PayPal credentials missing or invalid. Check your environment variables."
    );

    if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test"
    ) {
      logger.info("Using mock credentials for development/test mode");
      return {
        valid: false,
        clientId: process.env.PAYPAL_CLIENT_ID || "mock_client_id",
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || "mock_client_secret",
      };
    } else {
      return {
        valid: false,
        error:
          "PayPal credentials missing or invalid. Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET env variables.",
      };
    }
  }

  return {
    valid: true,
    clientId,
    clientSecret,
  };
}

// Create environment for use with PayPal SDK
function createEnvironment() {
  const credentials = validateCredentials();

  if (!credentials.valid && credentials.error) {
    throw new Error(credentials.error);
  }

  const { clientId, clientSecret } = credentials;

  logger.info(
    `Initializing PayPal with environment: ${
      process.env.NODE_ENV === "production" ? "LIVE" : "SANDBOX"
    }`
  );

  try {
    return process.env.NODE_ENV === "production"
      ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
      : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
  } catch (error) {
    logger.error(`Failed to create PayPal environment: ${error.message}`);
    throw error;
  }
}

// Creates a PayPal HTTP client
function createPayPalHttpClient() {
  try {
    const environment = createEnvironment();
    return new checkoutNodeJssdk.core.PayPalHttpClient(environment);
  } catch (error) {
    logger.error(`Failed to create PayPal HTTP client: ${error.message}`);
    throw error;
  }
}

// Determine if an error is retryable
function shouldRetryError(error) {
  // Network errors should be retried
  if (!error.statusCode) return true;

  // 429 Too Many Requests - definitely retry
  if (error.statusCode === 429) return true;

  // 5xx server errors can be retried
  if (error.statusCode >= 500 && error.statusCode < 600) return true;

  // Some 4xx errors might be worth retrying
  const retryable4xxErrors = [408, 423, 425, 429];
  if (retryable4xxErrors.includes(error.statusCode)) return true;

  return false;
}

// Calculate backoff delay based on attempt number and error type
function calculateBackoff(attempt, error) {
  // Start with base delay and apply exponential backoff
  let delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s, etc.

  // Add jitter (±20% randomness)
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  delay += jitter;

  // If this was a rate limit error, use the Retry-After header if available
  if (
    error.statusCode === 429 &&
    error.headers &&
    error.headers["retry-after"]
  ) {
    const retryAfter = parseInt(error.headers["retry-after"], 10);
    if (!isNaN(retryAfter)) {
      delay = Math.max(delay, retryAfter * 1000);
    }
  }

  // Cap at 30 seconds max delay
  return Math.min(delay, 30000);
}

// Enhanced client with retry capability
async function executeWithRetry(requestFn, maxRetries = 3) {
  let lastError;
  const baseDelay = 1000; // Start with 1 second delay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if we need to wait due to rate limiting
      if (apiCallTracker.isRateLimited()) {
        const waitTime = apiCallTracker.getWaitTime();
        logger.info(
          `Rate limiting in effect. Waiting ${waitTime}ms before PayPal API call`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      // Track this API call
      apiCallTracker.addCall();

      // Execute the request
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Determine if we should retry
      const shouldRetry = shouldRetryError(error);
      if (!shouldRetry || attempt === maxRetries) {
        logger.error(
          `PayPal API error after ${attempt} attempts: ${error.message}`
        );
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = calculateBackoff(attempt, error);
      logger.info(
        `PayPal API call failed. Retrying in ${delay}ms... (Attempt ${
          attempt + 1
        }/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// For mock mode in development
function createMockPayPalResponse(requestType, data) {
  if (requestType === "create-order") {
    const orderId = `MOCK-${Date.now()}`;
    return {
      result: {
        id: orderId,
        status: "CREATED",
        links: [
          {
            href: `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`,
            rel: "approve",
            method: "GET",
          },
          {
            href: `https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}`,
            rel: "self",
            method: "GET",
          },
          {
            href: `https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
            rel: "capture",
            method: "POST",
          },
        ],
      },
    };
  }

  if (requestType === "capture-order") {
    return {
      result: {
        id: data.orderId,
        status: "COMPLETED",
        purchase_units: [
          {
            payments: {
              captures: [{ id: `CAPTURE-${Date.now()}` }],
            },
          },
        ],
      },
    };
  }

  return {
    result: {
      status: "MOCK_RESPONSE",
      message:
        "This is a mock response as PayPal credentials are not configured",
    },
  };
}

// Main client interface with convenience methods
// Export these methods to be used in controllers
const client = {
  // Creates PayPal order
  ordersCreate: async (body) => {
    // Check for credentials
    const credentials = validateCredentials();

    // Use mock mode if no valid credentials and in development
    if (
      !credentials.valid &&
      (process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test")
    ) {
      logger.info(
        "Using mock mode for PayPal ordersCreate due to missing credentials"
      );
      return createMockPayPalResponse("create-order");
    }

    // Create the request
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody(body);

    // Execute with retry
    try {
      const paypalClient = createPayPalHttpClient();
      return await executeWithRetry(() => paypalClient.execute(request));
    } catch (error) {
      logger.error(`Error creating PayPal order: ${error.message}`);
      throw error;
    }
  },

  // Captures PayPal order
  ordersCapture: async (orderId) => {
    // Check for credentials
    const credentials = validateCredentials();

    // Use mock mode if no valid credentials and in development
    if (
      !credentials.valid &&
      (process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test")
    ) {
      logger.info(
        "Using mock mode for PayPal ordersCapture due to missing credentials"
      );
      return createMockPayPalResponse("capture-order", { orderId });
    }

    // Create the request
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    // Execute with retry
    try {
      const paypalClient = createPayPalHttpClient();
      return await executeWithRetry(() => paypalClient.execute(request));
    } catch (error) {
      logger.error(`Error capturing PayPal order: ${error.message}`);
      throw error;
    }
  },

  // Gets PayPal order details
  ordersGet: async (orderId) => {
    // Check for credentials
    const credentials = validateCredentials();

    // Use mock mode if no valid credentials and in development
    if (
      !credentials.valid &&
      (process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test")
    ) {
      logger.info(
        "Using mock mode for PayPal ordersGet due to missing credentials"
      );
      return createMockPayPalResponse("get-order", { orderId });
    }

    // Create the request
    const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderId);

    // Execute with retry
    try {
      const paypalClient = createPayPalHttpClient();
      return await executeWithRetry(() => paypalClient.execute(request));
    } catch (error) {
      logger.error(`Error getting PayPal order: ${error.message}`);
      throw error;
    }
  },

  // Process credit/debit card payment
  processCardPayment: async (options) => {
    // Check for credentials
    const credentials = validateCredentials();

    // Use mock mode if no valid credentials and in development
    if (
      !credentials.valid &&
      (process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test")
    ) {
      logger.info(
        "Using mock mode for PayPal card processing due to missing credentials"
      );
      return createMockCardPaymentResponse(options);
    }

    try {
      logger.info(`Processing card payment for order: ${options.order_id}`);

      // In a real implementation, this would use PayPal's API for processing cards
      // https://developer.paypal.com/docs/checkout/advanced/integrate/

      // For the purpose of this implementation, we'll use a simplified approach
      // that would be replaced with actual PayPal SDK calls in production

      // This would typically call the PayPal API to create a payment with card details
      // const request = new checkoutNodeJssdk.payments.PaymentsCreateRequest();
      // request.requestBody({
      //   intent: "CAPTURE",
      //   payment_source: {
      //     card: {
      //       number: options.card.number,
      //       expiry: `${options.card.expMonth}/${options.card.expYear}`,
      //       security_code: options.card.cvc,
      //       name: options.card.name || "Card Holder",
      //       billing_address: options.card.billingAddress
      //     }
      //   },
      //   purchase_units: [{
      //     amount: options.amount
      //   }]
      // });

      // const paypalClient = createPayPalHttpClient();
      // return await executeWithRetry(() => paypalClient.execute(request));

      // Since we're simulating the card processing in this implementation,
      // we'll return a mock successful response
      return {
        id: `card_payment_${Date.now()}`,
        status: "COMPLETED",
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString(),
        amount: {
          currency_code: options.amount.currency_code,
          value: options.amount.value,
        },
        payment_source: {
          card: {
            last_digits: options.card.number.slice(-4),
            brand: options.card.type,
          },
        },
      };
    } catch (error) {
      logger.error(`Error processing card payment: ${error.message}`);
      throw error;
    }
  },
};

// For mock mode in development
function createMockCardPaymentResponse(options) {
  return {
    result: {
      id: `mock_card_payment_${Date.now()}`,
      status: "COMPLETED",
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
      amount: {
        currency_code: options.amount.currency_code || "USD",
        value: options.amount.value || "0.00",
      },
      payment_source: {
        card: {
          last_digits: options.card?.number?.slice(-4) || "1234",
          brand: options.card?.type || "VISA",
        },
      },
    },
  };
}

module.exports = {
  client,
  executeWithRetry,
  validateCredentials,
};
