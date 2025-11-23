const Invoice = require("../models/Invoice");

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ status: { $ne: "deleted" } })
      .populate("customer", "firstName lastName email")
      .populate("payments")
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("customer")
      .populate("items.product")
      .populate("payments");

    if (invoice) {
      res.json(invoice);
    } else {
      res.status(404).json({ message: "Invoice not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  try {
    const {
      customer,
      items,
      subtotal,
      tax,
      discount,
      total,
      notes,
      invoiceDate,
      dueDate,
      paymentMethod,
      status,
    } = req.body;

    const invoice = new Invoice({
      customer,
      items,
      subtotal,
      tax,
      discount,
      total,
      notes,
      invoiceDate,
      dueDate,
      paymentMethod,
      status: status || "draft",
    });

    const createdInvoice = await invoice.save();
    res.status(201).json(createdInvoice);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

// @desc    Update invoice status
// @route   PUT /api/invoices/:id/status
// @access  Private
const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (invoice) {
      invoice.status = status;
      const updatedInvoice = await invoice.save();
      res.json(updatedInvoice);
    } else {
      res.status(404).json({ message: "Invoice not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Write off an invoice
// @route   PUT /api/invoices/:id/write-off
// @access  Private
const writeOffInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (invoice) {
      invoice.isWrittenOff = true;
      invoice.status = "written-off";
      // balanceDue will be calculated by pre-save hook

      const updatedInvoice = await invoice.save();
      res.json(updatedInvoice);
    } else {
      res.status(404).json({ message: "Invoice not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Update invoice
// @route PUT /api/invoices/:id
// @access Private
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (invoice) {
      const { editReason, editedBy, ...updateData } = req.body;

      // Add to edit history if edit reason provided
      if (editReason) {
        invoice.editHistory.push({
          editedAt: new Date(),
          editedBy: editedBy || "User",
          reason: editReason,
        });
      }

      // Update invoice fields
      Object.keys(updateData).forEach((key) => {
        invoice[key] = updateData[key];
      });

      const updatedInvoice = await invoice.save();
      res.json(updatedInvoice);
    } else {
      res.status(404).json({ message: "Invoice not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Delete invoice (soft delete)
// @route DELETE /api/invoices/:id
// @access Private
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (invoice) {
      // Soft delete the invoice
      invoice.status = "deleted";
      await invoice.save();

      // Soft delete associated payments
      const Payment = require("../models/Payment");
      await Payment.updateMany(
        { invoice: req.params.id },
        { status: "deleted" }
      );

      res.json({ message: "Invoice deleted successfully" });
    } else {
      res.status(404).json({ message: "Invoice not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  writeOffInvoice,
  deleteInvoice,
};
