const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getSalesReport,
  getProfitLossReport,
  getOutstandingSummary,
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

router.get("/dashboard", protect, getDashboardStats);
router.get("/sales", protect, getSalesReport);
router.get("/profit-loss", protect, getProfitLossReport);
router.get("/outstanding", protect, getOutstandingSummary);

module.exports = router;
