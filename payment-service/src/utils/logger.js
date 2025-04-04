const winston = require("winston");
const { format } = winston;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: "payment-service" },
  transports: [
    new winston.transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

// Create a stream object with a 'write' function that will be used by Morgan
logger.stream = {
  write: function (message) {
    logger.info(message.trim());
  },
};

module.exports = logger;
