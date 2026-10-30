const dbService = require("../services/dbService");
const { NotFoundError } = require("../utils/errors");

async function listHistory(req, res, next) {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const history = await dbService.listAnalyses(req.userId, limit, offset);
    res.json({ history, limit, offset });
  } catch (err) {
    next(err);
  }
}

async function getHistoryDetail(req, res, next) {
  try {
    const { id } = req.params;
    const detail = await dbService.getAnalysisById(id, req.userId);
    if (!detail) {
      throw new NotFoundError("Analysis history item not found");
    }
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

async function deleteHistoryItem(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await dbService.deleteAnalysis(id, req.userId);
    if (!deleted) {
      throw new NotFoundError("History item not found or unauthorized");
    }
    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
}

async function getDashboardMetrics(req, res, next) {
  try {
    const stats = await dbService.getDashboardStats(req.userId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listHistory,
  getHistoryDetail,
  deleteHistoryItem,
  getDashboardMetrics,
};
