const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getTenantModels } = require("../models/tenantModels");

/**
 * Compute UTC start/end dates for a given period.
 * Returns { start, end } where end may be undefined for "all".
 */
function getPeriodRange(period) {
  const now = new Date();
  if (period === "7d") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (period === "month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  if (period === "year") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
    };
  }
  // "all" — no range
  return {};
}

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats?period=7d|month|year|all
// @access  Private
router.get("/stats", protect, async (req, res) => {
  try {
    const { Payment, Invoice, Customer, Product, Expense } = getTenantModels(
      req.dbConnection,
    );

    const { period = "month" } = req.query;
    const { start, end } = getPeriodRange(period);

    const dateFilter = start ? { $gte: start, $lte: end } : undefined;

    const paymentMatch = { status: "active" };
    if (dateFilter) paymentMatch.date = dateFilter;

    const expenseMatch = {};
    if (dateFilter) expenseMatch.date = dateFilter;

    const invoiceMatch = { status: { $ne: "deleted" } };
    if (dateFilter) invoiceMatch.createdAt = dateFilter;

    // Period sales
    const salesResult = await Payment.aggregate([
      { $match: paymentMatch },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const periodSales = salesResult.length > 0 ? salesResult[0].total : 0;

    // Period orders (invoices created in period)
    const periodOrders = await Invoice.countDocuments(invoiceMatch);

    // Period expenses
    const expensesResult = await Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const periodExpenses =
      expensesResult.length > 0 ? expensesResult[0].total : 0;

    const periodNetProfit = periodSales - periodExpenses;

    // All-time counts (not time-filtered)
    const totalCustomers = await Customer.countDocuments();
    const totalProducts = await Product.countDocuments();

    res.json({
      periodSales,
      periodOrders,
      periodExpenses,
      periodNetProfit,
      totalCustomers,
      totalProducts,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get sales chart data
// @route   GET /api/dashboard/chart?period=7d|month|year|all
// @access  Private
router.get("/chart", protect, async (req, res) => {
  try {
    const { Payment } = getTenantModels(req.dbConnection);
    const { period = "month" } = req.query;

    const now = new Date();
    const { start, end } = getPeriodRange(period);

    const matchStage = { status: "active" };
    if (start) matchStage.date = { $gte: start, $lte: end };

    // Choose mongo date format
    const groupFormat =
      period === "year" || period === "all" ? "%Y-%m" : "%Y-%m-%d";

    const sales = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$date" } },
          sales: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const salesMap = {};
    sales.forEach((s) => {
      salesMap[s._id] = s.sales;
    });

    const chartData = [];

    if (period === "7d") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        chartData.push({
          name: label,
          date: dateStr,
          sales: salesMap[dateStr] || 0,
        });
      }
    } else if (period === "month") {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        chartData.push({
          name: d.getDate().toString(),
          date: dateStr,
          sales: salesMap[dateStr] || 0,
        });
      }
    } else if (period === "year") {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      for (let m = 0; m < 12; m++) {
        const key = `${now.getFullYear()}-${String(m + 1).padStart(2, "0")}`;
        chartData.push({
          name: monthNames[m],
          date: key,
          sales: salesMap[key] || 0,
        });
      }
    } else {
      // all — use aggregated results as-is
      sales.forEach((s) => {
        chartData.push({ name: s._id, date: s._id, sales: s.sales });
      });
    }

    res.json(chartData);
  } catch (error) {
    console.error("Dashboard Chart Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get recent activities
// @route   GET /api/dashboard/activities
// @access  Private
router.get("/activities", protect, async (req, res) => {
  try {
    const { ActivityLog } = getTenantModels(req.dbConnection);

    const logs = await ActivityLog.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(logs);
  } catch (error) {
    console.error("Dashboard Activities Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
