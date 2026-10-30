const express = require("express");
const {
  listRepositories,
  addRepository,
  deleteRepository,
  listNotifications,
  markNotificationRead,
  listRepoPullRequests,
  getSession,
} = require("../controllers/repoController");

const router = express.Router();

router.get("/repositories", listRepositories);
router.post("/repositories", addRepository);
router.delete("/repositories/:id", deleteRepository);

router.get("/pull-requests", listRepoPullRequests);

router.get("/notifications", listNotifications);
router.patch("/notifications/:id/read", markNotificationRead);

router.get("/session", getSession);

module.exports = router;
