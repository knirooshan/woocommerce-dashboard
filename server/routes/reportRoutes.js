const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getSalesReport,
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

router.get("/dashboard", protect, getDashboardStats);
router.get("/sales", protect, getSalesReport);

module.exports = router;
