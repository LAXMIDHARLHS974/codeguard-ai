class AppError extends Error {
  constructor(message, status = 500, code = "INTERNAL_ERROR", details = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

class NotFoundError extends AppError {
  constructor(message, details = null) {
    super(message, 404, "NOT_FOUND", details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access", details = null) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden access", details = null) {
    super(message, 403, "FORBIDDEN", details);
  }
}

class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded. Please try again later.", details = null) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", details);
  }
}

class ExternalServiceError extends AppError {
  constructor(message, status = 502, code = "EXTERNAL_SERVICE_ERROR", details = null) {
    super(message, status, code, details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  ExternalServiceError,
};
