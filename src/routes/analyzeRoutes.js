const express = require("express");
const { z } = require("zod");
const { analyzePr, analyzePastedDiff, getAnalysis } = require("../controllers/analyzeController");
const validateRequest = require("../middleware/validateRequest");
const { aiActionLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

const analyzePrSchema = z.object({
  prUrl: z.string().url("Must be a valid URL").min(5),
  githubToken: z.string().optional(),
});

const analyzeDiffSchema = z.object({
  diff: z.string().trim().min(1, "Diff text cannot be empty"),
  title: z.string().optional(),
});

router.post("/pr", aiActionLimiter, validateRequest({ body: analyzePrSchema }), analyzePr);
router.post("/diff", aiActionLimiter, validateRequest({ body: analyzeDiffSchema }), analyzePastedDiff);
router.get("/:id", getAnalysis);

module.exports = router;
