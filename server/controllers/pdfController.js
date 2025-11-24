const Invoice = require("../models/Invoice");
const Quotation = require("../models/Quotation");
const Settings = require("../models/Settings");
const {
  generateInvoicePDF,
  generateQuotationPDF,
} = require("../services/pdfService");

// @desc    Generate and stream Invoice PDF
// @route   GET /api/pdf/invoice/:id
// @access  Private
const getInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("customer");
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
// @route   GET /api/pdf/quotation/:id
// @access  Private
const getQuotationPDF = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate(
      "customer"
    );
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

module.exports = {
  getInvoicePDF,
  getQuotationPDF,
};
