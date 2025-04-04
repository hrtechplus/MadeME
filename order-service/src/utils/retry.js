const axios = require("axios");

const retry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, i))
        );
      }
    }
  }

  throw lastError;
};

const axiosWithRetry = async (config, maxRetries = 3) => {
  return retry(async () => {
    const response = await axios(config);
    return response.data;
  }, maxRetries);
};

module.exports = {
  retry,
  axiosWithRetry,
};
