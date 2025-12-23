const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getSalesReport,
  getProfitLossReport,
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

router.get("/dashboard", protect, getDashboardStats);
router.get("/sales", protect, getSalesReport);
router.get("/profit-loss", protect, getProfitLossReport);

module.exports = router;
