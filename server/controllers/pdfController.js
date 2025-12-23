const { getTenantModels } = require("../models/tenantModels");
const {
  generateInvoicePDF,
  generateQuotationPDF,
  generateSalesReportPDF,
  generateProfitLossReportPDF,
} = require("../services/pdfService");

// @desc    Generate and stream Invoice PDF
// @route   POST /api/pdf/invoice/:id
// @access  Private
const getInvoicePDF = async (req, res) => {
  try {
    const { Invoice, Settings } = getTenantModels(req.dbConnection);
    const invoice = await Invoice.findById(req.params.id)
      .populate("customer")
      .populate("items.product");
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const settings = await Settings.findOne();

    const pdfBuffer = await generateInvoicePDF(invoice, settings);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${invoice.invoiceNumber}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate and stream Quotation PDF
// @route   POST /api/pdf/quotation/:id
// @access  Private
const getQuotationPDF = async (req, res) => {
  try {
    const { Quotation, Settings } = getTenantModels(req.dbConnection);
    const quotation = await Quotation.findById(req.params.id)
      .populate("customer")
      .populate("items.product");
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const settings = await Settings.findOne();

    const pdfBuffer = await generateQuotationPDF(quotation, settings);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${quotation.quotationNumber}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating quotation PDF:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate and stream Sales Report PDF
// @route   POST /api/pdf/sales-report
// @access  Private
const getSalesReportPDF = async (req, res) => {
  try {
    const { Payment, Settings } = getTenantModels(req.dbConnection);
    const {
      timeframe = "monthly",
      startDate,
      endDate,
    } = { ...req.query, ...req.body };

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    const salesResult = await Payment.aggregate([
      { $match: { status: "active", ...dateFilter } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;

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

    const salesBreakdown = await Payment.aggregate([
      { $match: { status: "active", ...dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$date" } },
          sales: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const reportData = salesBreakdown.map((item) => ({
      name: item._id,
      sales: item.sales,
    }));

    const salesList = await Payment.find({ status: "active", ...dateFilter })
      .sort({ date: -1 })
      .populate("customer", "firstName lastName")
      .populate("invoice", "invoiceNumber");

    // Product Breakdown
    const { Invoice } = getTenantModels(req.dbConnection);
    const invoiceDateFilter = {};
    if (startDate || endDate) {
      invoiceDateFilter.createdAt = {};
      if (startDate) invoiceDateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) invoiceDateFilter.createdAt.$lte = new Date(endDate);
    }

    const productBreakdown = await Invoice.aggregate([
      { $match: { status: { $ne: "deleted" }, ...invoiceDateFilter } },
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

    const settings = await Settings.findOne();

    const pdfBuffer = await generateSalesReportPDF(
      reportData,
      salesList,
      { totalSales },
      settings,
      timeframe,
      { startDate, endDate },
      productBreakdown
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Sales_Report_${timeframe}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate and stream Profit & Loss Report PDF
// @route   POST /api/pdf/profit-loss-report
// @access  Private
const getProfitLossReportPDF = async (req, res) => {
  try {
    const { Expense, Payment, Settings } = getTenantModels(req.dbConnection);
    const {
      timeframe = "monthly",
      startDate,
      endDate,
    } = { ...req.query, ...req.body };

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // 1. Aggregated Data
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
      { $match: { status: "active", ...dateFilter } },
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
      if (!mergedData[item._id])
        mergedData[item._id] = { name: item._id, sales: 0, expenses: 0 };
      mergedData[item._id].expenses = item.expenses;
    });

    const chartData = Object.values(mergedData)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({ ...item, profit: item.sales - item.expenses }));

    // 2. Raw Lists
    const payments = await Payment.find({ status: "active", ...dateFilter })
      .sort({ date: -1 })
      .populate("customer", "firstName lastName")
      .populate("invoice", "invoiceNumber");

    const expenses = await Expense.find(dateFilter).sort({ date: -1 });

    const stats = {
      totalSales: chartData.reduce((sum, i) => sum + i.sales, 0),
      totalExpenses: chartData.reduce((sum, i) => sum + i.expenses, 0),
      netProfit: chartData.reduce((sum, i) => sum + i.profit, 0),
    };

    const settings = await Settings.findOne();

    const pdfBuffer = await generateProfitLossReportPDF(
      chartData,
      payments,
      expenses,
      stats,
      settings,
      timeframe,
      { startDate, endDate }
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Profit_Loss_Report_${timeframe}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInvoicePDF,
  getQuotationPDF,
  getSalesReportPDF,
  getProfitLossReportPDF,
};
