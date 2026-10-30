const crypto = require("crypto");
const { fetchPullRequest } = require("../githubService");
const { parseDiffStats } = require("../diffUtils");
const { analyzeDiff } = require("../services/analysisService");
const dbService = require("../services/dbService");
const { ValidationError, NotFoundError } = require("../utils/errors");

async function analyzePr(req, res, next) {
  try {
    const { prUrl, githubToken } = req.body;
    if (!prUrl) {
      throw new ValidationError("prUrl is required");
    }

    // Custom user token or configured token
    const token = githubToken || req.headers["x-github-token"] || null;
    const { pr, stats: ghStats, files, diff } = await fetchPullRequest(prUrl, token);

    const fallbackStats = parseDiffStats(diff);
    const stats = {
      filesChanged: ghStats.filesChanged ?? fallbackStats.filesChanged,
      linesAdded: ghStats.linesAdded ?? fallbackStats.linesAdded,
      linesRemoved: ghStats.linesRemoved ?? fallbackStats.linesRemoved,
    };

    const { findings, riskScore, riskLevel, riskBreakdown } = await analyzeDiff(diff, stats);

    const analysisId = crypto.randomUUID();
    await dbService.saveAnalysis({
      id: analysisId,
      userId: req.userId,
      prUrl,
      title: pr.title,
      source: "github",
      riskScore,
      riskLevel,
      riskBreakdown,
      stats,
      diffText: diff,
      findings,
    });

    res.json({
      analysisId,
      pr,
      stats,
      riskScore,
      riskLevel,
      riskBreakdown,
      findings,
      files,
      source: "github",
    });
  } catch (err) {
    next(err);
  }
}

async function analyzePastedDiff(req, res, next) {
  try {
    const { diff, title } = req.body;
    if (!diff || !diff.trim()) {
      throw new ValidationError("diff text is required");
    }

    const stats = parseDiffStats(diff);
    const { findings, riskScore, riskLevel, riskBreakdown } = await analyzeDiff(diff, stats);

    const analysisId = crypto.randomUUID();
    const prTitle = title || "Pasted Diff Review";

    await dbService.saveAnalysis({
      id: analysisId,
      userId: req.userId,
      prUrl: null,
      title: prTitle,
      source: "diff",
      riskScore,
      riskLevel,
      riskBreakdown,
      stats,
      diffText: diff,
      findings,
    });

    res.json({
      analysisId,
      pr: { number: null, title: prTitle },
      stats,
      riskScore,
      riskLevel,
      riskBreakdown,
      findings,
      source: "diff",
    });
  } catch (err) {
    next(err);
  }
}

async function getAnalysis(req, res, next) {
  try {
    const { id } = req.params;
    const analysis = await dbService.getAnalysisById(id, req.userId);
    if (!analysis) {
      throw new NotFoundError("Analysis record not found or unauthorized");
    }
    res.json(analysis);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  analyzePr,
  analyzePastedDiff,
  getAnalysis,
};
