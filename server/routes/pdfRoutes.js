const express = require("express");
const router = express.Router();
const { getInvoicePDF, getQuotationPDF } = require("../controllers/pdfController");
const { protect } = require("../middleware/authMiddleware");

router.get("/invoice/:id", protect, getInvoicePDF);
router.get("/quotation/:id", protect, getQuotationPDF);

module.exports = router;
