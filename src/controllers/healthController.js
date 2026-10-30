const config = require("../config/env");

function getHealth(req, res) {
  res.json({
    ok: true,
    status: "healthy",
    geminiConfigured: Boolean(config.GEMINI_API_KEY),
    geminiModel: config.GEMINI_MODEL,
    githubTokenConfigured: Boolean(config.GITHUB_TOKEN),
    databaseConfigured: Boolean(config.DATABASE_URL),
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  });
}

function getReadiness(req, res) {
  res.status(200).json({
    ready: true,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  getHealth,
  getReadiness,
};
