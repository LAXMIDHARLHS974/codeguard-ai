const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");

const config = require("./src/config/env");
const { initDb } = require("./src/services/dbService");
const requestLogger = require("./src/middleware/requestLogger");
const { globalLimiter } = require("./src/middleware/rateLimiter");
const { optionalAuth } = require("./src/middleware/authMiddleware");
const errorHandler = require("./src/middleware/errorHandler");
const apiRoutes = require("./src/routes");

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows fonts, CDN styles & scripts
    crossOriginEmbedderPolicy: false,
  })
);

// Restricted CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g. curl, server-to-server, tests)
    if (!origin) return callback(null, true);
    if (config.allowedOrigins.includes("*") || config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow localhost during development
    if (!config.isProduction && origin.includes("localhost")) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "X-Session-Id", "X-GitHub-Token"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(requestLogger);
app.use("/api", globalLimiter);
app.use("/api", optionalAuth);

// Mount API routes
app.use("/api", apiRoutes);

// Static assets: serve React frontend from client/dist if built, otherwise root directory
const clientDistPath = path.join(__dirname, "client", "dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
} else {
  app.use(express.static(path.join(__dirname)));
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });
}

// Centralized Error Handling
app.use(errorHandler);

// Start server if executed directly
if (require.main === module) {
  (async () => {
    try {
      await initDb();
      const PORT = config.PORT;
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`CodeGuard AI Production Server running on port ${PORT} [${config.NODE_ENV}]`);
      });
    } catch (err) {
      console.error("Failed to start CodeGuard server:", err);
      process.exit(1);
    }
  })();
}

module.exports = app;
