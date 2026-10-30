const express = require("express");
const {
  getProfile,
  updateProfile,
  getSessions,
  revokeSession,
  logout,
} = require("../controllers/userController");

const router = express.Router();

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/sessions", getSessions);
router.delete("/sessions/:sessionId", revokeSession);
router.post("/logout", logout);

module.exports = router;
