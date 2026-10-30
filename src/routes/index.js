const express = require("express");
const healthRoutes = require("./healthRoutes");
const analyzeRoutes = require("./analyzeRoutes");
const testRoutes = require("./testRoutes");
const historyRoutes = require("./historyRoutes");
const repoRoutes = require("./repoRoutes");
const userRoutes = require("./userRoutes");
const assistantRoutes = require("./assistantRoutes");

const router = express.Router();

router.use("/", healthRoutes);
router.use("/analyze", analyzeRoutes);
router.use("/tests", testRoutes);
router.use("/history", historyRoutes);
router.use("/workspace", repoRoutes);
router.use("/user", userRoutes);
router.use("/assistant", assistantRoutes);

module.exports = router;
