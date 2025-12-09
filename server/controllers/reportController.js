const { getTenantModels } = require("../models/tenantModels");

// @desc    Get Dashboard Stats
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    if (!req.dbConnection) {
      return res.status(500).json({ message: "No Database Connection" });
    }

    const { Invoice, Expense, Payment } = getTenantModels(req.dbConnection);
    // Calculate Total Sales (sum of all non-deleted payments)
    const salesResult = await Payment.aggregate([
      { $match: { status: { $ne: "deleted" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;

    // Calculate Total Expenses
    const expensesResult = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpenses =
      expensesResult.length > 0 ? expensesResult[0].total : 0;

    // Calculate Net Profit
    const netProfit = totalSales - totalExpenses;

    // Recent Invoices (non-deleted)
    const recentInvoices = await Invoice.find({ status: { $ne: "deleted" } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customer", "firstName lastName");

    res.json({
      totalSales,
      totalExpenses,
      netProfit,
      recentInvoices,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Sales Report (Monthly)
// @route   GET /api/reports/sales
// @access  Private
const getSalesReport = async (req, res) => {
  try {
    const { Expense, Payment } = getTenantModels(req.dbConnection);
    // 1. Get Monthly Sales (from payments)
    const sales = await Payment.aggregate([
      { $match: { status: { $ne: "deleted" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          sales: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 2. Get Monthly Expenses
    const expenses = await Expense.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          expenses: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 3. Merge Data
    const mergedData = {};

    sales.forEach((item) => {
      if (!mergedData[item._id]) {
        mergedData[item._id] = { name: item._id, sales: 0, expenses: 0 };
      }
      mergedData[item._id].sales = item.sales;
    });

    expenses.forEach((item) => {
      if (!mergedData[item._id]) {
        mergedData[item._id] = { name: item._id, sales: 0, expenses: 0 };
      }
      mergedData[item._id].expenses = item.expenses;
    });

    // Convert to array and calculate profit
    const reportData = Object.values(mergedData)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        ...item,
        profit: item.sales - item.expenses,
      }));

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getSalesReport };
