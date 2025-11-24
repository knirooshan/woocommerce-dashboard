const { sendEmail } = require("../services/emailService");
const Invoice = require("../models/Invoice");
const Quotation = require("../models/Quotation");
const Settings = require("../models/Settings");

// @desc    Send Invoice via Email
// @route   POST /api/email/send-invoice/:id
// @access  Private
const sendInvoiceEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("customer");
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const customerEmail = invoice.customer.email;
    if (!customerEmail) {
      return res.status(400).json({ message: "Customer has no email address" });
    }

    const settings = await Settings.findOne();

    // Get PDF buffer from request body (sent from frontend)
    const { pdfBase64 } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ message: "PDF data is required" });
    }

    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // Format currency
    const formatCurrency = (amount) => {
      if (!settings?.currency) {
        return `$${parseFloat(amount || 0).toFixed(2)}`;
      }
      const { symbol, position } = settings.currency;
      const formattedAmount = parseFloat(amount || 0).toFixed(2);
      return position === "before"
        ? `${symbol}${formattedAmount}`
        : `${formattedAmount}${symbol}`;
    };

    const subject = `Invoice #${invoice.invoiceNumber} from ${
      settings?.storeName || "Store"
    }`;
    const text = `Dear ${
      invoice.customer.firstName
    },\n\nPlease find attached your invoice #${
      invoice.invoiceNumber
    }.\n\nTotal Due: ${formatCurrency(
      invoice.total
    )}\n\nThank you for your business.\n\nBest regards,\n${
      settings?.storeName || "Store"
    }`;

    const html = `<div style="font-family: Arial, sans-serif; margin: 20px;">
      <h2 style="color: #2563EB;">Invoice #${invoice.invoiceNumber}</h2>
      <p>Dear ${invoice.customer.firstName},</p>
      <p>Please find attached your invoice <strong>#${
        invoice.invoiceNumber
      }</strong>.</p>
      <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Total Due:</strong> <span style="color: #2563EB; font-size: 18px; font-weight: bold;">${formatCurrency(
          invoice.total
        )}</span></p>
        <p style="margin: 5px 0;"><strong>Status:</strong> ${invoice.status
          .replace("_", " ")
          .toUpperCase()}</p>
        ${
          invoice.dueDate
            ? `<p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(
                invoice.dueDate
              ).toLocaleDateString()}</p>`
            : ""
        }
      </div>
      <p>Thank you for your business.</p>
      <p style="color: #6B7280; font-size: 16px; margin-top: 30px;">Best regards,<br>${
        settings?.storeName || "Store"
      }</p>
    </div>`;

    const attachments = [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];

    await sendEmail(customerEmail, subject, text, html, attachments);

    res.json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send Quotation via Email
// @route   POST /api/email/send-quotation/:id
// @access  Private
const sendQuotationEmail = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate(
      "customer"
    );
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const customerEmail = quotation.customer.email;
    if (!customerEmail) {
      return res.status(400).json({ message: "Customer has no email address" });
    }

    const settings = await Settings.findOne();

    // Get PDF buffer from request body (sent from frontend)
    const { pdfBase64 } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ message: "PDF data is required" });
    }

    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // Format currency
    const formatCurrency = (amount) => {
      if (!settings?.currency) {
        return `$${parseFloat(amount || 0).toFixed(2)}`;
      }
      const { symbol, position } = settings.currency;
      const formattedAmount = parseFloat(amount || 0).toFixed(2);
      return position === "before"
        ? `${symbol}${formattedAmount}`
        : `${formattedAmount}${symbol}`;
    };

    const subject = `Quotation #${quotation.quotationNumber} from ${
      settings?.storeName || "Store"
    }`;
    const text = `Dear ${
      quotation.customer.firstName
    },\n\nPlease find attached your quotation #${
      quotation.quotationNumber
    }.\n\nTotal: ${formatCurrency(quotation.total)}\n${
      quotation.validUntil
        ? `Valid Until: ${new Date(
            quotation.validUntil
          ).toLocaleDateString()}\n`
        : ""
    }\nThank you for your interest.\n\nBest regards,\n${
      settings?.storeName || "Store"
    }`;

    const html = `<div style="font-family: Arial, sans-serif; margin: 20px;">
      <h2 style="color: #2563EB;">Quotation #${quotation.quotationNumber}</h2>
      <p>Dear ${quotation.customer.firstName},</p>
      <p>Please find attached your quotation <strong>#${
        quotation.quotationNumber
      }</strong>.</p>
      <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Total:</strong> <span style="color: #2563EB; font-size: 18px; font-weight: bold;">${formatCurrency(
          quotation.total
        )}</span></p>
        ${
          quotation.validUntil
            ? `<p style="margin: 5px 0;"><strong>Valid Until:</strong> ${new Date(
                quotation.validUntil
              ).toLocaleDateString()}</p>`
            : ""
        }
      </div>
      <p>Thank you for your interest. Please review the attached quotation and let us know if you have any questions.</p>
      <p style="color: #6B7280; font-size: 16px; margin-top: 30px;">Best regards,<br>${
        settings?.storeName || "Store"
      }</p>
    </div>`;

    const attachments = [
      {
        filename: `${quotation.quotationNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];

    await sendEmail(customerEmail, subject, text, html, attachments);

    res.json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendInvoiceEmail, sendQuotationEmail };
