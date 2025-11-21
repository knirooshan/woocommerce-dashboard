const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Expense = require("../models/Expense");

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
router.get("/stats", protect, async (req, res) => {
  try {
    // Get current month date range
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Total sales (sum of all paid invoices)
    const salesResult = await Invoice.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;

    // This month's sales
    const monthlySalesResult = await Invoice.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const monthlySales =
      monthlySalesResult.length > 0 ? monthlySalesResult[0].total : 0;

    // Total orders (invoices)
    const totalOrders = await Invoice.countDocuments();

    // Total customers
    const totalCustomers = await Customer.countDocuments();

    // Total products
    const totalProducts = await Product.countDocuments();

    // Total expenses
    const expensesResult = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpenses =
      expensesResult.length > 0 ? expensesResult[0].total : 0;

    // This month's expenses
    const monthlyExpensesResult = await Expense.aggregate([
      {
        $match: {
          date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const monthlyExpenses =
      monthlyExpensesResult.length > 0 ? monthlyExpensesResult[0].total : 0;

    // Net profit (sales - expenses)
    const netProfit = totalSales - totalExpenses;
    const monthlyNetProfit = monthlySales - monthlyExpenses;

    res.json({
      totalSales,
      monthlySales,
      totalOrders,
      totalCustomers,
      totalProducts,
      totalExpenses,
      monthlyExpenses,
      netProfit,
      monthlyNetProfit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get weekly sales for chart
// @route   GET /api/dashboard/chart
// @access  Private
router.get("/chart", protect, async (req, res) => {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6); // Last 7 days

    const sales = await Invoice.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days
    const chartData = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayData = sales.find((s) => s._id === dateStr);
      chartData.push({
        name: dayName,
        date: dateStr,
        sales: dayData ? dayData.sales : 0,
      });
    }

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
