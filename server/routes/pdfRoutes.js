const express = require("express");
const router = express.Router();
const {
  getInvoicePDF,
  getQuotationPDF,
  getSalesReportPDF,
  getProfitLossReportPDF,
} = require("../controllers/pdfController");
const { protect } = require("../middleware/authMiddleware");

router.post("/invoice/:id", protect, getInvoicePDF);
router.post("/quotation/:id", protect, getQuotationPDF);
router.post("/sales-report", protect, getSalesReportPDF);
router.post("/profit-loss-report", protect, getProfitLossReportPDF);

module.exports = router;
