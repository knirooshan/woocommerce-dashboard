const { getTenantModels } = require("../models/tenantModels");

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const { Invoice } = getTenantModels(req.dbConnection);
    const { search, status, customer, startDate, endDate } = req.query;

    // Build filter object
    const filter = { status: { $ne: "deleted" } };

    // Search in invoice number or notes
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status && status !== "all") {
      filter.status = status;
    }

    // Filter by customer
    if (customer && customer !== "all") {
      filter.customer = customer;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(filter)
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
    const { Invoice } = getTenantModels(req.dbConnection);
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
    const { Invoice, Customer, Payment } = getTenantModels(req.dbConnection);

    let {
      customer,
      items,
      subtotal,
      tax,
      discount,
      deliveryCharge,
      deliveryNote,
      total,
      notes,
      invoiceDate,
      dueDate,
      paymentMethod,
      status,
    } = req.body;

    // Check if this is a walk-in customer invoice
    if (customer === "walk-in") {
      // Find or create walk-in customer
      let walkInCustomer = await Customer.findOne({
        email: "walkin@pos.local",
        firstName: "Walk-in",
      });

      if (!walkInCustomer) {
        walkInCustomer = await Customer.create({
          firstName: "Walk-in",
          lastName: "Customer",
          email: "walkin@pos.local",
          billing: {
            first_name: "Walk-in",
            last_name: "Customer",
            phone: "",
          },
        });
      }

      customer = walkInCustomer._id;
    }

    const invoice = new Invoice({
      customer,
      items,
      subtotal,
      tax,
      discount,
      deliveryCharge,
      deliveryNote,
      total,
      notes,
      invoiceDate,
      dueDate,
      paymentMethod,
      status: status || "draft",
    });

    const createdInvoice = await invoice.save();

    // If invoice status is paid, create a payment record
    if (status === "paid") {
      const payment = new Payment({
        invoice: createdInvoice._id,
        customer: customer,
        amount: total,
        method: paymentMethod || "cash",
        paymentDate: invoiceDate || new Date(),
        notes: "Payment recorded upon invoice creation",
      });

      await payment.save();

      // Update invoice with payment information
      createdInvoice.amountPaid = total;
      createdInvoice.balanceDue = 0;
      createdInvoice.payments = [payment._id];
      await createdInvoice.save();
    }

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
    const { Invoice } = getTenantModels(req.dbConnection);
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
    const { Invoice } = getTenantModels(req.dbConnection);
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
    const { Invoice } = getTenantModels(req.dbConnection);
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
    const { Invoice, Payment } = getTenantModels(req.dbConnection);
    const invoice = await Invoice.findById(req.params.id);

    if (invoice) {
      // Soft delete associated payments
      await Payment.updateMany(
        { invoice: req.params.id },
        { status: "deleted" }
      );

      // Soft delete the invoice
      invoice.status = "deleted";
      await invoice.save();

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
