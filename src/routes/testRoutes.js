const express = require("express");
const { z } = require("zod");
const { generateTestsForAnalysis, getGeneratedTestsByAnalysis } = require("../controllers/testController");
const validateRequest = require("../middleware/validateRequest");
const { aiActionLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

const testGenSchema = z.object({
  analysisId: z.string().optional(),
  diff: z.string().optional(),
  findings: z.array(z.any()).optional(),
  language: z.string().optional(),
});

router.post("/generate", aiActionLimiter, validateRequest({ body: testGenSchema }), generateTestsForAnalysis);
router.get("/:analysisId", getGeneratedTestsByAnalysis);

module.exports = router;
