const express = require("express");
const {
  listHistory,
  getHistoryDetail,
  deleteHistoryItem,
  getDashboardMetrics,
} = require("../controllers/historyController");

const router = express.Router();

router.get("/stats", getDashboardMetrics);
router.get("/", listHistory);
router.get("/:id", getHistoryDetail);
router.delete("/:id", deleteHistoryItem);

module.exports = router;
