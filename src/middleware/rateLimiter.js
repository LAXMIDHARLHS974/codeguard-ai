const rateLimit = require("express-rate-limit");
const config = require("../config/env");

const isTest = config.isTest;

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP. Please try again after 15 minutes.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

const aiActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isTest ? 10000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "AI analysis rate limit reached. Please wait a few minutes before starting new analyses.",
    code: "AI_RATE_LIMIT_EXCEEDED",
  },
});

module.exports = {
  globalLimiter,
  aiActionLimiter,
};
