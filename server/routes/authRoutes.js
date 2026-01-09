const express = require("express");
const router = express.Router();
const {
  loginUser,
  registerUser,
  logoutUser,
  verifyToken,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/logout", protect, logoutUser);
router.get("/verify", protect, verifyToken);

module.exports = router;
