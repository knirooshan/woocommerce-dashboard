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
    const { startDate, endDate } = req.query;

    const allowedStatuses = [
      "paid",
      "partially_paid",
      "overdue",
      "written-off",
    ];

    // Get valid invoice IDs for filtering payments
    const validInvoices = await Invoice.find({
      status: { $in: allowedStatuses },
    }).select("_id");
    const validInvoiceIds = validInvoices.map((inv) => inv._id);

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // Calculate Total Sales (sum of all non-deleted payments related to valid invoices)
    const salesResult = await Payment.aggregate([
      {
        $match: {
          status: "active",
          invoice: { $in: validInvoiceIds },
          ...dateFilter,
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;

    // Calculate Total Expenses
    const expensesResult = await Expense.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpenses =
      expensesResult.length > 0 ? expensesResult[0].total : 0;

    // Calculate Net Profit
    const netProfit = totalSales - totalExpenses;

    // Recent Invoices (filtered by allowed statuses)
    const recentInvoices = await Invoice.find({
      status: { $in: allowedStatuses },
    })
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

// @desc    Get Sales Report (Flexible Timeframe)
// @route   GET /api/reports/sales
// @access  Private
const getSalesReport = async (req, res) => {
  try {
    const { Expense, Payment, Invoice } = getTenantModels(req.dbConnection);
    const { timeframe = "monthly", startDate, endDate } = req.query;

    const allowedStatuses = [
      "paid",
      "partially_paid",
      "overdue",
      "written-off",
    ];

    // Get valid invoice IDs for filtering payments
    const validInvoices = await Invoice.find({
      status: { $in: allowedStatuses },
    }).select("_id");
    const validInvoiceIds = validInvoices.map((inv) => inv._id);

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    let dateFormat;
    switch (timeframe) {
      case "daily":
        dateFormat = "%Y-%m-%d";
        break;
      case "weekly":
        dateFormat = "%Y-W%V"; // Year and Week number
        break;
      case "yearly":
        dateFormat = "%Y";
        break;
      case "monthly":
      default:
        dateFormat = "%Y-%m";
        break;
    }

    // 1. Get Sales (from payments related to valid invoices)
    const sales = await Payment.aggregate([
      {
        $match: {
          status: "active",
          invoice: { $in: validInvoiceIds },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$date" } },
          sales: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 2. Get Expenses
    const expenses = await Expense.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$date" } },
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
    const chartData = Object.values(mergedData)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        ...item,
        profit: item.sales - item.expenses,
      }));

    // 4. Get Raw Sales List (filtered by valid invoices)
    const salesList = await Payment.find({
      status: "active",
      invoice: { $in: validInvoiceIds },
      ...dateFilter,
    })
      .sort({ date: -1 })
      .populate("customer", "firstName lastName")
      .populate("invoice", "invoiceNumber");

    // 5. Product Breakdown (from Invoices in the same period)
    // Adjust dateFilter for Invoice (using invoiceDate)
    const invoiceDateFilter = {};
    if (startDate || endDate) {
      invoiceDateFilter.invoiceDate = {};
      if (startDate) invoiceDateFilter.invoiceDate.$gte = new Date(startDate);
      if (endDate) invoiceDateFilter.invoiceDate.$lte = new Date(endDate);
    }

    const productBreakdown = await Invoice.aggregate([
      { $match: { status: { $in: allowedStatuses }, ...invoiceDateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          sku: { $first: "$items.sku" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.total" },
          avgPrice: { $avg: "$items.price" },
        },
      },
      { $sort: { quantity: -1 } },
    ]);

    res.json({
      chartData,
      salesList,
      productBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Profit & Loss Detailed Report
// @route   GET /api/reports/profit-loss
// @access  Private
const getProfitLossReport = async (req, res) => {
  try {
    const { Expense, Payment, Invoice } = getTenantModels(req.dbConnection);
    const { timeframe = "monthly", startDate, endDate } = req.query;

    const allowedStatuses = [
      "paid",
      "partially_paid",
      "overdue",
      "written-off",
    ];

    // Get valid invoice IDs for filtering payments
    const validInvoices = await Invoice.find({
      status: { $in: allowedStatuses },
    }).select("_id");
    const validInvoiceIds = validInvoices.map((inv) => inv._id);

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // 1. Get Aggregated Data (for chart)
    let dateFormat;
    switch (timeframe) {
      case "daily":
        dateFormat = "%Y-%m-%d";
        break;
      case "weekly":
        dateFormat = "%Y-W%V";
        break;
      case "yearly":
        dateFormat = "%Y";
        break;
      case "monthly":
      default:
        dateFormat = "%Y-%m";
        break;
    }

    const salesAgg = await Payment.aggregate([
      {
        $match: {
          status: "active",
          invoice: { $in: validInvoiceIds },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$date" } },
          sales: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const expensesAgg = await Expense.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$date" } },
          expenses: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const mergedData = {};
    salesAgg.forEach((item) => {
      mergedData[item._id] = { name: item._id, sales: item.sales, expenses: 0 };
    });
    expensesAgg.forEach((item) => {
      if (!mergedData[item._id]) {
        mergedData[item._id] = { name: item._id, sales: 0, expenses: 0 };
      }
      mergedData[item._id].expenses = item.expenses;
    });

    const chartData = Object.values(mergedData)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        ...item,
        profit: item.sales - item.expenses,
      }));

    // 2. Get Raw Lists (filtered by valid invoices)
    const payments = await Payment.find({
      status: "active",
      invoice: { $in: validInvoiceIds },
      ...dateFilter,
    })
      .sort({ date: -1 })
      .populate("customer", "firstName lastName")
      .populate("invoice", "invoiceNumber");

    const expenses = await Expense.find(dateFilter).sort({ date: -1 });

    res.json({
      chartData,
      payments,
      expenses,
      summary: {
        totalSales: chartData.reduce((sum, i) => sum + i.sales, 0),
        totalExpenses: chartData.reduce((sum, i) => sum + i.expenses, 0),
        netProfit: chartData.reduce((sum, i) => sum + i.profit, 0),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getSalesReport,
  getProfitLossReport,
};
