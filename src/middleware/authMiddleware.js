const crypto = require("crypto");
const { verifyToken } = require("../services/cryptoService");
const { UnauthorizedError } = require("../utils/errors");

function getGuestId(req) {
  // Check for client-provided session header
  const customSession = req.headers["x-session-id"];
  if (customSession && typeof customSession === "string" && customSession.length <= 64) {
    return customSession;
  }
  // Fall back to hashed client IP + user agent
  const raw = `${req.ip || "unknown"}-${req.headers["user-agent"] || "default"}`;
  return "guest-" + crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      req.userId = decoded.id || decoded.userId;
      return next();
    } catch {
      // Invalid token, fall through to guest session
    }
  }

  const guestId = getGuestId(req);
  req.user = { id: guestId, isGuest: true };
  req.userId = guestId;
  next();
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authentication token is required"));
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    req.userId = decoded.id || decoded.userId;
    next();
  } catch (err) {
    next(new UnauthorizedError("Invalid or expired authentication token"));
  }
}

module.exports = {
  optionalAuth,
  requireAuth,
};
