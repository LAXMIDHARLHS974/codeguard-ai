const dbService = require("../services/dbService");
const cryptoService = require("../services/cryptoService");
const { ValidationError, UnauthorizedError } = require("../utils/errors");

async function getProfile(req, res, next) {
  try {
    const profile = await dbService.getUserProfile(req.userId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, email, role, company, bio, avatarUrl, githubUsername, githubToken } = req.body;

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = String(name).trim();
    if (email !== undefined) updatePayload.email = String(email).trim().toLowerCase();
    if (role !== undefined) updatePayload.role = String(role).trim();
    if (company !== undefined) updatePayload.company = String(company).trim();
    if (bio !== undefined) updatePayload.bio = String(bio).trim();
    if (avatarUrl !== undefined) updatePayload.avatarUrl = String(avatarUrl).trim();
    if (githubUsername !== undefined) updatePayload.githubUsername = String(githubUsername).trim();

    if (githubToken) {
      updatePayload.hasGitHubToken = true;
    }

    const updated = await dbService.updateUserProfile(req.userId, updatePayload);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function getSessions(req, res, next) {
  try {
    const sessions = await dbService.getUserSessions(req.userId);
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

async function revokeSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    if (!sessionId) throw new ValidationError("Session ID is required");
    await dbService.revokeUserSession(sessionId, req.userId);
    res.json({ success: true, sessionId });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await dbService.logActivity({
      userId: req.userId,
      action: "user_logout",
      targetType: "session",
    });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getSessions,
  revokeSession,
  logout,
};
