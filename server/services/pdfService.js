const PDFDocument = require("pdfkit");
const axios = require("axios");

// Helper to format currency
const formatCurrency = (amount, settings) => {
  if (!settings?.currency) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  }

  const { symbol, position } = settings.currency;
  const formattedAmount = parseFloat(amount || 0).toFixed(2);

  if (position === "before") {
    return `${symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount}${symbol}`;
  }
};

// Helper to fetch and embed logo
const embedLogo = async (
  doc,
  logoUrl,
  x,
  y,
  maxWidth = 100,
  maxHeight = 50
) => {
  try {
    if (!logoUrl) return;

    const response = await axios.get(logoUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
    });

    const imageBuffer = Buffer.from(response.data, "binary");
    doc.image(imageBuffer, x, y, {
      fit: [maxWidth, maxHeight],
      align: "right",
    });
  } catch (error) {
    console.error("Error embedding logo:", error.message);
    // Continue without logo if fetch fails
  }
};

// Helper to draw a horizontal line
const drawLine = (doc, y, color = "#E5E7EB", lineWidth = 1) => {
  doc
    .strokeColor(color)
    .lineWidth(lineWidth)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
};

// Helper to add table header
const addTableHeader = (doc, y, settings) => {
  doc
    .rect(50, y, 500, 25)
    .fill("#F3F4F6")
    .fillColor("#4B5563")
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("ITEM DESCRIPTION", 55, y + 8, { width: 225, align: "left" })
    .text("PRICE", 280, y + 8, { width: 80, align: "right" })
    .text("QTY", 360, y + 8, { width: 60, align: "right" })
    .text("TOTAL", 420, y + 8, { width: 125, align: "right" });

  return y + 25;
};

// Helper to add table row
const addTableRow = (doc, y, item, settings, isLast = false) => {
  const startY = y;

  doc
    .fillColor("#1F2937")
    .fontSize(10)
    .font("Helvetica")
    .text(item.name, 55, y + 5, { width: 225, align: "left" });

  if (item.product?.shortDescription) {
    doc
      .fillColor("#6B7280")
      .fontSize(8)
      .font("Helvetica")
      .text(item.product.shortDescription, 55, y + 17, {
        width: 225,
        align: "left",
      });
  }

  doc
    .fillColor("#1F2937")
    .fontSize(10)
    .font("Helvetica")
    .text(formatCurrency(item.price, settings), 280, y + 5, {
      width: 80,
      align: "right",
    })
    .text(item.quantity.toString(), 360, y + 5, { width: 60, align: "right" })
    .font("Helvetica-Bold")
    .text(formatCurrency(item.total, settings), 420, y + 5, {
      width: 125,
      align: "right",
    });

  const rowHeight = item.product?.shortDescription ? 40 : 30;

  if (!isLast) {
    drawLine(doc, y + rowHeight - 5, "#E5E7EB", 0.5);
  }

  return y + rowHeight;
};

// Generate Invoice PDF
const generateInvoicePDF = async (invoice, settings) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
      });

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on("error", reject);

      // Header Section
      doc
        .fillColor("#2563EB")
        .fontSize(32)
        .font("Helvetica-Bold")
        .text("INVOICE", 50, 50);

      // Logo (top right)
      if (settings?.logo) {
        await embedLogo(doc, settings.logo, 450, 50, 100, 50);
      }

      // Invoice Number & Status
      doc
        .fillColor("#6B7280")
        .fontSize(12)
        .font("Helvetica")
        .text(`#${invoice.invoiceNumber}`, 50, 90);

      // Status Badge
      doc
        .roundedRect(50, 110, 80, 20, 10)
        .fill("#EFF6FF")
        .fillColor("#2563EB")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(invoice.status.replace("_", " ").toUpperCase(), 50, 115, {
          width: 80,
          align: "center",
        });

      // Company Info (right side)
      let companyY = 110;
      doc
        .fillColor("#111827")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(settings?.storeName || "Company Name", 350, companyY, {
          width: 200,
          align: "right",
        });

      companyY += 15;
      doc
        .fillColor("#4B5563")
        .fontSize(9)
        .font("Helvetica")
        .text(settings?.address?.street || "", 350, companyY, {
          width: 200,
          align: "right",
        });

      if (settings?.address?.city || settings?.address?.zip) {
        companyY += 12;
        doc.text(
          `${settings?.address?.city || ""}${
            settings?.address?.city && settings?.address?.zip ? ", " : ""
          }${settings?.address?.zip || ""}`,
          350,
          companyY,
          { width: 200, align: "right" }
        );
      }

      if (settings?.contact?.phone) {
        companyY += 12;
        doc.text(`Phone: ${settings.contact.phone}`, 350, companyY, {
          width: 200,
          align: "right",
        });
      }

      if (settings?.contact?.email) {
        companyY += 12;
        doc.text(settings.contact.email, 350, companyY, {
          width: 200,
          align: "right",
        });
      }

      // Blue header line (moved down to accommodate company info)
      const headerLineY = Math.max(companyY + 15, 175);
      drawLine(doc, headerLineY, "#2563EB", 2);

      // Bill To & Invoice Details
      let detailsY = headerLineY + 20;

      // Bill To (Left)
      doc
        .fillColor("#9CA3AF")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("BILL TO", 50, detailsY);

      detailsY += 18;
      doc
        .fillColor("#111827")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(
          `${invoice.customer?.salutation || ""}${
            invoice.customer?.salutation ? " " : ""
          }${invoice.customer?.firstName || ""} ${
            invoice.customer?.lastName || ""
          }`,
          50,
          detailsY
        );

      if (invoice.customer?.billing?.company) {
        detailsY += 15;
        doc
          .fillColor("#1F2937")
          .font("Helvetica")
          .text(invoice.customer.billing.company, 50, detailsY);
      }

      if (invoice.customer?.billing?.address_1) {
        detailsY += 15;
        doc
          .fillColor("#1F2937")
          .font("Helvetica")
          .text(invoice.customer.billing.address_1, 50, detailsY);
      }

      if (
        invoice.customer?.billing?.city ||
        invoice.customer?.billing?.postcode
      ) {
        detailsY += 12;
        doc.text(
          `${invoice.customer?.billing?.city || ""}${
            invoice.customer?.billing?.city &&
            invoice.customer?.billing?.postcode
              ? ", "
              : ""
          }${invoice.customer?.billing?.postcode || ""}`,
          50,
          detailsY
        );
      }

      if (invoice.customer?.email) {
        detailsY += 12;
        doc.text(invoice.customer.email, 50, detailsY);
      }

      if (invoice.customer?.billing?.phone) {
        detailsY += 12;
        doc.text(invoice.customer.billing.phone, 50, detailsY);
      }

      // Invoice Details (Right)
      let invoiceDetailsY = detailsY;
      doc
        .fillColor("#9CA3AF")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("INVOICE DETAILS", 350, invoiceDetailsY);

      invoiceDetailsY += 18;
      doc
        .fillColor("#1F2937")
        .fontSize(10)
        .font("Helvetica")
        .text("Date Issued:", 350, invoiceDetailsY, {
          width: 100,
          align: "left",
        });
      doc
        .font("Helvetica-Bold")
        .text(
          new Date(invoice.createdAt).toLocaleDateString(),
          450,
          invoiceDetailsY,
          { width: 100, align: "right" }
        );

      if (invoice.dueDate) {
        invoiceDetailsY += 15;
        doc.font("Helvetica").text("Due Date:", 350, invoiceDetailsY, {
          width: 100,
          align: "left",
        });
        doc
          .font("Helvetica-Bold")
          .text(
            new Date(invoice.dueDate).toLocaleDateString(),
            450,
            invoiceDetailsY,
            { width: 100, align: "right" }
          );
      }

      // Items Table
      let tableY = Math.max(detailsY, invoiceDetailsY) + 40;

      // Check if we need a new page
      if (tableY > 650) {
        doc.addPage();
        tableY = 50;
      }

      tableY = addTableHeader(doc, tableY, settings);

      invoice.items.forEach((item, index) => {
        // Check if we need a new page for this item
        if (tableY > 700) {
          doc.addPage();
          tableY = 50;
          tableY = addTableHeader(doc, tableY, settings);
        }

        tableY = addTableRow(
          doc,
          tableY,
          item,
          settings,
          index === invoice.items.length - 1
        );
      });

      // Totals Section
      tableY += 20;
      drawLine(doc, tableY - 10, "#E5E7EB", 1);

      const totalsX = 420;

      // Subtotal
      doc
        .fillColor("#6B7280")
        .fontSize(10)
        .font("Helvetica")
        .text("Subtotal", totalsX - 100, tableY, {
          width: 100,
          align: "right",
        });
      doc
        .fillColor("#111827")
        .font("Helvetica")
        .text(formatCurrency(invoice.subtotal, settings), totalsX, tableY, {
          width: 125,
          align: "right",
        });

      // Tax
      if (invoice.tax > 0) {
        tableY += 20;
        doc
          .fillColor("#6B7280")
          .text(settings?.tax?.label || "Tax", totalsX - 100, tableY, {
            width: 100,
            align: "right",
          });
        doc
          .fillColor("#111827")
          .text(formatCurrency(invoice.tax, settings), totalsX, tableY, {
            width: 125,
            align: "right",
          });
      }

      // Discount
      if (invoice.discount > 0) {
        tableY += 20;
        doc.fillColor("#6B7280").text("Discount", totalsX - 100, tableY, {
          width: 100,
          align: "right",
        });
        doc
          .fillColor("#EF4444")
          .text(
            `-${formatCurrency(invoice.discount, settings)}`,
            totalsX,
            tableY,
            {
              width: 125,
              align: "right",
            }
          );
      }

      // Grand Total
      tableY += 25;
      drawLine(doc, tableY - 5, "#2563EB", 2);
      doc
        .fillColor("#111827")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Total", totalsX - 100, tableY, { width: 100, align: "right" });
      doc
        .fillColor("#2563EB")
        .fontSize(14)
        .text(formatCurrency(invoice.total, settings), totalsX, tableY, {
          width: 125,
          align: "right",
        });

      // Amount Paid & Balance Due
      const amountPaid = invoice.amountPaid || 0;
      const balanceDue =
        invoice.balanceDue !== undefined
          ? invoice.balanceDue
          : invoice.total - amountPaid;

      if (amountPaid > 0 || invoice.status === "paid") {
        tableY += 25;
        doc
          .fillColor("#6B7280")
          .fontSize(10)
          .font("Helvetica")
          .text("Amount Paid", totalsX - 100, tableY, {
            width: 100,
            align: "right",
          });
        doc
          .fillColor("#111827")
          .text(formatCurrency(amountPaid, settings), totalsX, tableY, {
            width: 125,
            align: "right",
          });

        tableY += 20;
        doc.font("Helvetica-Bold").text("Balance Due", totalsX - 100, tableY, {
          width: 100,
          align: "right",
        });
        doc
          .font("Helvetica-Bold")
          .text(formatCurrency(balanceDue, settings), totalsX, tableY, {
            width: 125,
            align: "right",
          });
      }

      // Notes
      if (invoice.notes) {
        tableY += 40;

        // Check if we need a new page for notes
        if (tableY > 650) {
          doc.addPage();
          tableY = 50;
        }

        doc
          .roundedRect(50, tableY, 500, 60, 4)
          .fill("#F9FAFB")
          .fillColor("#9CA3AF")
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("NOTES", 60, tableY + 10);

        doc
          .fillColor("#1F2937")
          .fontSize(10)
          .font("Helvetica")
          .text(invoice.notes, 60, tableY + 25, {
            width: 480,
            align: "left",
          });

        tableY += 70;
      }

      // Check if we need a new page for footer (needs ~80 points)
      if (tableY > 670) {
        doc.addPage();
      }

      // Footer (only once at the bottom)
      drawLine(doc, 750, "#E5E7EB", 1);

      doc
        .fillColor("#9CA3AF")
        .fontSize(8)
        .font("Helvetica")
        .text("Thank you for your business!", 50, 760, {
          width: 500,
          align: "center",
        });

      // Bank Details
      if (settings?.bank?.accountName) {
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("Bank Details:", 50, 775, { width: 500, align: "center" });

        doc
          .font("Helvetica")
          .text(
            `${settings.bank.bankName || ""}${
              settings.bank.branch ? `, ${settings.bank.branch}` : ""
            }`,
            50,
            787,
            { width: 500, align: "center" }
          );

        doc.text(
          `Account Name: ${settings.bank.accountName} | Account No: ${settings.bank.accountNumber}`,
          50,
          797,
          { width: 500, align: "center" }
        );

        if (settings.bank.swiftCode) {
          doc.text(`Swift Code: ${settings.bank.swiftCode}`, 50, 807, {
            width: 500,
            align: "center",
          });
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate Quotation PDF
const generateQuotationPDF = async (quotation, settings) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
      });

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on("error", reject);

      // Header Section
      doc
        .fillColor("#2563EB")
        .fontSize(32)
        .font("Helvetica-Bold")
        .text("QUOTATION", 50, 50);

      // Logo (top right)
      if (settings?.logo) {
        await embedLogo(doc, settings.logo, 450, 50, 100, 50);
      }

      // Quotation Number
      doc
        .fillColor("#6B7280")
        .fontSize(12)
        .font("Helvetica")
        .text(`#${quotation.quotationNumber}`, 50, 90);

      // Company Info (right side)
      let companyY = 110;
      doc
        .fillColor("#111827")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(settings?.storeName || "Company Name", 350, companyY, {
          width: 200,
          align: "right",
        });

      companyY += 15;
      doc
        .fillColor("#4B5563")
        .fontSize(9)
        .font("Helvetica")
        .text(settings?.address?.street || "", 350, companyY, {
          width: 200,
          align: "right",
        });

      if (settings?.address?.city || settings?.address?.zip) {
        companyY += 12;
        doc.text(
          `${settings?.address?.city || ""}${
            settings?.address?.city && settings?.address?.zip ? ", " : ""
          }${settings?.address?.zip || ""}`,
          350,
          companyY,
          { width: 200, align: "right" }
        );
      }

      if (settings?.contact?.phone) {
        companyY += 12;
        doc.text(`Phone: ${settings.contact.phone}`, 350, companyY, {
          width: 200,
          align: "right",
        });
      }

      if (settings?.contact?.email) {
        companyY += 12;
        doc.text(settings.contact.email, 350, companyY, {
          width: 200,
          align: "right",
        });
      }

      // Blue header line (moved down to accommodate company info)
      const headerLineY = Math.max(companyY + 15, 175);
      drawLine(doc, headerLineY, "#2563EB", 2);

      // Bill To & Quotation Details
      let detailsY = headerLineY + 20;

      // Bill To (Left)
      doc
        .fillColor("#9CA3AF")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("BILL TO", 50, detailsY);

      detailsY += 18;
      doc
        .fillColor("#111827")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(
          `${quotation.customer?.salutation || ""}${
            quotation.customer?.salutation ? " " : ""
          }${quotation.customer?.firstName || ""} ${
            quotation.customer?.lastName || ""
          }`,
          50,
          detailsY
        );

      if (quotation.customer?.billing?.company) {
        detailsY += 15;
        doc
          .fillColor("#1F2937")
          .font("Helvetica")
          .text(quotation.customer.billing.company, 50, detailsY);
      }

      if (quotation.customer?.billing?.address_1) {
        detailsY += 15;
        doc
          .fillColor("#1F2937")
          .font("Helvetica")
          .text(quotation.customer.billing.address_1, 50, detailsY);
      }

      if (
        quotation.customer?.billing?.city ||
        quotation.customer?.billing?.postcode
      ) {
        detailsY += 12;
        doc.text(
          `${quotation.customer?.billing?.city || ""}${
            quotation.customer?.billing?.city &&
            quotation.customer?.billing?.postcode
              ? ", "
              : ""
          }${quotation.customer?.billing?.postcode || ""}`,
          50,
          detailsY
        );
      }

      if (quotation.customer?.email) {
        detailsY += 12;
        doc.text(quotation.customer.email, 50, detailsY);
      }

      if (quotation.customer?.billing?.phone) {
        detailsY += 12;
        doc.text(quotation.customer.billing.phone, 50, detailsY);
      }

      // Quotation Details (Right)
      let quotationDetailsY = detailsY;
      doc
        .fillColor("#9CA3AF")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("QUOTATION DETAILS", 350, quotationDetailsY);

      quotationDetailsY += 18;
      doc
        .fillColor("#1F2937")
        .fontSize(10)
        .font("Helvetica")
        .text("Date Issued:", 350, quotationDetailsY, {
          width: 100,
          align: "left",
        });
      doc
        .font("Helvetica-Bold")
        .text(
          new Date(quotation.createdAt).toLocaleDateString(),
          450,
          quotationDetailsY,
          { width: 100, align: "right" }
        );

      if (quotation.validUntil) {
        quotationDetailsY += 15;
        doc.font("Helvetica").text("Valid Until:", 350, quotationDetailsY, {
          width: 100,
          align: "left",
        });
        doc
          .font("Helvetica-Bold")
          .text(
            new Date(quotation.validUntil).toLocaleDateString(),
            450,
            quotationDetailsY,
            { width: 100, align: "right" }
          );
      }

      // Items Table
      let tableY = Math.max(detailsY, quotationDetailsY) + 40;

      // Check if we need a new page
      if (tableY > 650) {
        doc.addPage();
        tableY = 50;
      }

      tableY = addTableHeader(doc, tableY, settings);

      quotation.items.forEach((item, index) => {
        // Check if we need a new page for this item
        if (tableY > 700) {
          doc.addPage();
          tableY = 50;
          tableY = addTableHeader(doc, tableY, settings);
        }

        tableY = addTableRow(
          doc,
          tableY,
          item,
          settings,
          index === quotation.items.length - 1
        );
      });

      // Totals Section
      tableY += 20;
      drawLine(doc, tableY - 10, "#E5E7EB", 1);

      const totalsX = 420;

      // Subtotal
      doc
        .fillColor("#6B7280")
        .fontSize(10)
        .font("Helvetica")
        .text("Subtotal", totalsX - 100, tableY, {
          width: 100,
          align: "right",
        });
      doc
        .fillColor("#111827")
        .font("Helvetica")
        .text(formatCurrency(quotation.subtotal, settings), totalsX, tableY, {
          width: 125,
          align: "right",
        });

      // Tax
      if (quotation.tax > 0) {
        tableY += 20;
        doc
          .fillColor("#6B7280")
          .text(settings?.tax?.label || "Tax", totalsX - 100, tableY, {
            width: 100,
            align: "right",
          });
        doc
          .fillColor("#111827")
          .text(formatCurrency(quotation.tax, settings), totalsX, tableY, {
            width: 125,
            align: "right",
          });
      }

      // Discount
      if (quotation.discount > 0) {
        tableY += 20;
        doc.fillColor("#6B7280").text("Discount", totalsX - 100, tableY, {
          width: 100,
          align: "right",
        });
        doc
          .fillColor("#EF4444")
          .text(
            `-${formatCurrency(quotation.discount, settings)}`,
            totalsX,
            tableY,
            { width: 125, align: "right" }
          );
      }

      // Grand Total
      tableY += 25;
      drawLine(doc, tableY - 5, "#2563EB", 2);
      doc
        .fillColor("#111827")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Total", totalsX - 100, tableY, { width: 100, align: "right" });
      doc
        .fillColor("#2563EB")
        .fontSize(14)
        .text(formatCurrency(quotation.total, settings), totalsX, tableY, {
          width: 125,
          align: "right",
        });

      // Notes
      if (quotation.notes) {
        tableY += 40;

        // Check if we need a new page for notes
        if (tableY > 650) {
          doc.addPage();
          tableY = 50;
        }

        doc
          .roundedRect(50, tableY, 500, 60, 4)
          .fill("#F9FAFB")
          .fillColor("#9CA3AF")
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("NOTES", 60, tableY + 10);

        doc
          .fillColor("#1F2937")
          .fontSize(10)
          .font("Helvetica")
          .text(quotation.notes, 60, tableY + 25, {
            width: 480,
            align: "left",
          });

        tableY += 70;
      }

      // Check if we need a new page for footer (needs ~80 points)
      if (tableY > 670) {
        doc.addPage();
      }

      // Footer (only once at the bottom)
      drawLine(doc, 750, "#E5E7EB", 1);

      doc
        .fillColor("#9CA3AF")
        .fontSize(8)
        .font("Helvetica")
        .text("Thank you for your interest!", 50, 760, {
          width: 500,
          align: "center",
        });

      // Bank Details
      if (settings?.bank?.accountName) {
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("Bank Details:", 50, 775, { width: 500, align: "center" });

        doc
          .font("Helvetica")
          .text(
            `${settings.bank.bankName || ""}${
              settings.bank.branch ? `, ${settings.bank.branch}` : ""
            }`,
            50,
            787,
            { width: 500, align: "center" }
          );

        doc.text(
          `Account Name: ${settings.bank.accountName} | Account No: ${settings.bank.accountNumber}`,
          50,
          797,
          { width: 500, align: "center" }
        );

        if (settings.bank.swiftCode) {
          doc.text(`Swift Code: ${settings.bank.swiftCode}`, 50, 807, {
            width: 500,
            align: "center",
          });
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  generateQuotationPDF,
};
