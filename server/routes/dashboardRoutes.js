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

module.exports = router;
