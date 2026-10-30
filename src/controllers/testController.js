const { generateTests } = require("../services/testGenService");
const dbService = require("../services/dbService");
const { ValidationError, NotFoundError } = require("../utils/errors");

async function generateTestsForAnalysis(req, res, next) {
  try {
    const { analysisId, diff: bodyDiff, findings: bodyFindings, language } = req.body || {};

    let targetDiff = bodyDiff;
    let targetFindings = bodyFindings;

    if (analysisId) {
      const record = await dbService.getAnalysisById(analysisId, req.userId);
      if (!record) {
        throw new NotFoundError(`Analysis ${analysisId} not found or you are not authorized to access it.`);
      }
      targetDiff = targetDiff || record.diff;
      targetFindings = targetFindings || record.findings;
    }

    if (!targetDiff || typeof targetDiff !== "string" || !targetDiff.trim()) {
      throw new ValidationError(
        "No diff available for test generation. Provide an 'analysisId' or include 'diff' in the request body."
      );
    }

    const { language: detectedLang, framework, testNames, code, executed, status } = await generateTests(
      targetDiff,
      targetFindings || [],
      language
    );

    if (analysisId) {
      await dbService.saveGeneratedTests({
        analysisId,
        language: detectedLang,
        framework,
        testNames,
        code,
      });
    }

    res.json({
      analysisId: analysisId || null,
      language: detectedLang,
      framework,
      testNames,
      code,
      executed,
      status,
    });
  } catch (err) {
    next(err);
  }
}

async function getGeneratedTestsByAnalysis(req, res, next) {
  try {
    const { analysisId } = req.params;
    const tests = await dbService.getTestsByAnalysisId(analysisId);
    res.json({ tests });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generateTestsForAnalysis,
  getGeneratedTestsByAnalysis,
};
