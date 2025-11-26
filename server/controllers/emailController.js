const { addToQueue } = require("../services/emailQueueService");
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

    const customerEmail = invoice.customer?.email;
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
    // Build a comma-joined address
    const addressParts = [
      settings?.address?.street,
      settings?.address?.city,
      settings?.address?.zip,
      settings?.address?.country,
    ].filter(Boolean);
    const joinedAddress = addressParts.join(", ");

    const footerTextParts = [];
    footerTextParts.push(settings?.storeName || "Store");
    if (joinedAddress) footerTextParts.push(joinedAddress);
    if (settings?.contact?.phone)
      footerTextParts.push(`Phone: ${settings.contact.phone}`);
    if (settings?.website) footerTextParts.push(`Website: ${settings.website}`);
    const footerText = `\n--\n${footerTextParts.join("\n")}`;

    // Plain-text details block for invoice
    const detailsText = `\n\nInvoice: ${
      invoice.invoiceNumber
    }\nDate: ${new Date(
      invoice.invoiceDate || invoice.createdAt
    ).toLocaleDateString()}\nDue: ${
      invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"
    }\nTotal: ${formatCurrency(invoice.total)}\n`;

    const text = `Dear ${
      invoice.customer.firstName
    },\n\nPlease find attached your invoice #${
      invoice.invoiceNumber
    }.${detailsText}\nThank you for your business.\n\nBest regards,\n${
      settings?.storeName || "Store"
    }${footerText}`;

    const logoImg = settings?.logo
      ? `<img src="${settings.logo}" alt="${
          settings?.storeName || "Store"
        } logo" style="max-height:40px; display:block; margin:0 0 8px 0;"/>`
      : "";

    const websiteLink = settings?.website
      ? `<a href="${
          settings.website
        }" style="color:#2563EB; text-decoration:none;">${settings.website.replace(
          /^https?:\/\//,
          ""
        )}</a>`
      : "";
    const phoneLink = settings?.contact?.phone
      ? `<a href="tel:${settings.contact.phone}" style="color:#2563EB; text-decoration:none;">${settings.contact.phone}</a>`
      : "";

    const footerHtml = `
      <div style="margin-top:28px; padding-top:18px; border-top:1px solid #e6e9ee; font-size:12px; color:#6b7280;">
        <div style="margin:0 auto; text-align:left;">
          ${logoImg}
          <div style="font-weight:700; color:#111827;">${
            settings?.storeName || "Store"
          }</div>
          ${
            joinedAddress
              ? `<div style="margin-top:6px;">${joinedAddress}</div>`
              : ""
          }
          <div style="margin-top:6px;">${phoneLink}${
      phoneLink && websiteLink ? ` • ${websiteLink}` : websiteLink
    }</div>
          <div style="margin-top:8px; font-size:11px; color:#9CA3AF;">Need assistance? Visit our website or call our support team.</div>
        </div>
      </div>`;

    // HTML details table
    const detailsTable = `
      <table style="width:100%; border-collapse:collapse; margin: 14px 0; max-width:680px;">
        <tr>
          <td style="padding:8px; border:1px solid #e6e9ee;"><strong>Invoice</strong></td>
          <td style="padding:8px; border:1px solid #e6e9ee;">${
            invoice.invoiceNumber
          }</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #e6e9ee;"><strong>Date</strong></td>
          <td style="padding:8px; border:1px solid #e6e9ee;">${new Date(
            invoice.invoiceDate || invoice.createdAt
          ).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #e6e9ee;"><strong>Due</strong></td>
          <td style="padding:8px; border:1px solid #e6e9ee;">${
            invoice.dueDate
              ? new Date(invoice.dueDate).toLocaleDateString()
              : "-"
          }</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #e6e9ee;"><strong>Total</strong></td>
          <td style="padding:8px; border:1px solid #e6e9ee;">${formatCurrency(
            invoice.total
          )}</td>
        </tr>
      </table>`;

    const html = `<div style="font-family: Arial, sans-serif; margin: 20px;">
      <h2 style="color: #2563EB;">Invoice #${invoice.invoiceNumber}</h2>
      <p>Dear ${invoice.customer.firstName},</p>
      <p>Please find attached your invoice <strong>#${
        invoice.invoiceNumber
      }</strong>.</p>
      ${detailsTable}
      <p>Thank you for your business.</p>
      <p style="color: #6B7280; font-size: 16px; margin-top: 30px;">Best regards,<br>${
        settings?.storeName || "Store"
      }</p>
      ${footerHtml}
    </div>`;

    const attachments = [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];

    await addToQueue({
      to: customerEmail,
      subject,
      text,
      html,
      attachments,
    });

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
    // Build comma-joined address for quotation footer (reuse)
    const addressPartsQ = [
      settings?.address?.street,
      settings?.address?.city,
      settings?.address?.zip,
      settings?.address?.country,
    ].filter(Boolean);
    const joinedAddressQ = addressPartsQ.join(", ");

    const footerTextPartsQ = [];
    footerTextPartsQ.push(settings?.storeName || "Store");
    if (joinedAddressQ) footerTextPartsQ.push(joinedAddressQ);
    if (settings?.contact?.phone)
      footerTextPartsQ.push(`Phone: ${settings.contact.phone}`);
    if (settings?.website)
      footerTextPartsQ.push(`Website: ${settings.website}`);
    const footerTextQ = `\n--\n${footerTextPartsQ.join("\n")}`;

    const detailsTextQ = `\n\nQuotation: ${
      quotation.quotationNumber
    }\nDate: ${new Date(
      quotation.quotationDate || quotation.createdAt
    ).toLocaleDateString()}\nValid Until: ${
      quotation.validUntil
        ? new Date(quotation.validUntil).toLocaleDateString()
        : "-"
    }\nTotal: ${formatCurrency(quotation.total)}\n`;

    const text = `Dear ${
      quotation.customer.firstName
    },\n\nPlease find attached your quotation #${
      quotation.quotationNumber
    }.${detailsTextQ}\nThank you for your interest.\n\nBest regards,\n${
      settings?.storeName || "Store"
    }${footerTextQ}`;

    const logoImgQ = settings?.logo
      ? `<img src="${settings.logo}" alt="${
          settings?.storeName || "Store"
        } logo" style="max-height:40px; display:block; margin:0 0 8px 0;"/>`
      : "";

    const websiteLinkQ = settings?.website
      ? `<a href="${
          settings.website
        }" style="color:#2563EB; text-decoration:none;">${settings.website.replace(
          /^https?:\/\//,
          ""
        )}</a>`
      : "";
    const phoneLinkQ = settings?.contact?.phone
      ? `<a href="tel:${settings.contact.phone}" style="color:#2563EB; text-decoration:none;">${settings.contact.phone}</a>`
      : "";

    const footerHtmlQ = `
      <div style="margin-top:28px; padding-top:18px; border-top:1px solid #e6e9ee; font-size:12px; color:#6b7280;">
        <div style="margin:0 auto; text-align:left;">
          ${logoImgQ}
          <div style="font-weight:700; color:#111827;">${
            settings?.storeName || "Store"
          }</div>
          ${
            joinedAddressQ
              ? `<div style="margin-top:6px;">${joinedAddressQ}</div>`
              : ""
          }
          <div style="margin-top:6px;">${phoneLinkQ}${
      phoneLinkQ && websiteLinkQ ? ` • ${websiteLinkQ}` : websiteLinkQ
    }</div>
          <div style="margin-top:8px; font-size:11px; color:#9CA3AF;">Need assistance? Visit our website or call our support team.</div>
        </div>
      </div>`;

    const detailsTableQ = `
      <table style="width:100%; border-collapse:collapse; margin: 14px 0; max-width:680px;">
        <tr>
          <td style="padding:8px; border:1px solid #e6e9ee;"><strong>Quotation</strong></td>
          <td style="padding:8px; border:1px solid #e6e9ee;">${
            quotation.quotationNumber
          }</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #e6e9ee;"><strong>Date</strong></td>
          <td style="padding:8px; border:1px solid #e6e9ee;">${new Date(
            quotation.quotationDate || quotation.createdAt
          ).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #e6e9ee;"><strong>Valid Until</strong></td>
          <td style="padding:8px; border:1px solid #e6e9ee;">${
            quotation.validUntil
              ? new Date(quotation.validUntil).toLocaleDateString()
              : "-"
          }</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #e6e9ee;"><strong>Total</strong></td>
          <td style="padding:8px; border:1px solid #e6e9ee;">${formatCurrency(
            quotation.total
          )}</td>
        </tr>
      </table>`;

    const html = `<div style="font-family: Arial, sans-serif; margin: 20px;">
      <h2 style="color: #2563EB;">Quotation #${quotation.quotationNumber}</h2>
      <p>Dear ${quotation.customer.firstName},</p>
      <p>Please find attached your quotation <strong>#${
        quotation.quotationNumber
      }</strong>.</p>
      ${detailsTableQ}
      <p>Thank you for your interest. Please review the attached quotation and let us know if you have any questions.</p>
      <p style="color: #6B7280; font-size: 16px; margin-top: 30px;">Best regards,<br>${
        settings?.storeName || "Store"
      }</p>
      ${footerHtmlQ}
    </div>`;

    const attachments = [
      {
        filename: `${quotation.quotationNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];

    await addToQueue({
      to: customerEmail,
      subject,
      text,
      html,
      attachments,
    });

    res.json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendInvoiceEmail, sendQuotationEmail };
