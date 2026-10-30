const dbService = require("../services/dbService");
const { ValidationError, NotFoundError } = require("../utils/errors");

async function listRepositories(req, res, next) {
  try {
    const repos = await dbService.listRepositories(req.userId);
    res.json({ repositories: repos });
  } catch (err) {
    next(err);
  }
}

async function addRepository(req, res, next) {
  try {
    const { owner, name, isPrivate, defaultBranch } = req.body || {};
    if (!owner || !name) {
      throw new ValidationError("owner and name are required to register a repository");
    }

    const cleanOwner = String(owner).trim().replace(/[^a-zA-Z0-9._-]/g, "");
    const cleanName = String(name).trim().replace(/[^a-zA-Z0-9._-]/g, "");

    const repo = await dbService.saveRepository({
      userId: req.userId,
      owner: cleanOwner,
      name: cleanName,
      isPrivate: Boolean(isPrivate),
      defaultBranch: defaultBranch || "main",
    });

    res.status(201).json(repo);
  } catch (err) {
    next(err);
  }
}

async function deleteRepository(req, res, next) {
  try {
    const { id } = req.params;
    const ok = await dbService.deleteRepository(id, req.userId);
    if (!ok) {
      throw new NotFoundError("Repository not found or unauthorized");
    }
    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
}

async function listNotifications(req, res, next) {
  try {
    const notifications = await dbService.listNotifications(req.userId);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    await dbService.markNotificationRead(id, req.userId);
    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
}

function getSession(req, res) {
  res.json({
    userId: req.userId,
    isGuest: Boolean(req.user?.isGuest),
    role: req.user?.role || "developer",
  });
}

module.exports = {
  listRepositories,
  addRepository,
  deleteRepository,
  listNotifications,
  markNotificationRead,
  getSession,
};
