const express = require("express");
const {
  checkFirstRun,
  setupFirstUser,
} = require("../controllers/authController");
const router = express.Router();

router.get("/check", checkFirstRun);
router.post("/setup", setupFirstUser);

module.exports = router;
