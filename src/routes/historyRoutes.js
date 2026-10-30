const express = require("express");
const { listHistory, getHistoryDetail, deleteHistoryItem } = require("../controllers/historyController");

const router = express.Router();

router.get("/", listHistory);
router.get("/:id", getHistoryDetail);
router.delete("/:id", deleteHistoryItem);

module.exports = router;
