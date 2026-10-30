const { AppError } = require("../utils/errors");
const config = require("../config/env");

function errorHandler(err, req, res, next) {
  const requestId = req.id || req.headers["x-request-id"] || "unknown";

  // Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      requestId,
      details: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  // Bad JSON body syntax
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Malformed JSON payload in request body",
      code: "INVALID_JSON",
      requestId,
    });
  }

  // Custom AppErrors
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      details: err.details,
      requestId,
    });
  }

  // Fallback for unexpected internal errors
  const status = err.status || 500;
  console.error(`[${requestId}] Unhandled Error:`, err);

  res.status(status).json({
    error: config.isProduction ? "An unexpected internal server error occurred" : err.message,
    code: "INTERNAL_ERROR",
    requestId,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
}

module.exports = errorHandler;
