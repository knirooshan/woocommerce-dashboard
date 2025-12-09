const express = require("express");
const router = express.Router();
const {
  getSystemSettings,
  updateSystemSettings,
} = require("../controllers/adminSettingsController");
const { protect } = require("../middleware/authMiddleware");
const { superAdmin } = require("../middleware/superAdminMiddleware");

// All routes here are protected and require Super Admin
router.use(protect);
router.use(superAdmin);

router.route("/").get(getSystemSettings).put(updateSystemSettings);

module.exports = router;
