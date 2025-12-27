const { getTenantModels } = require("../models/tenantModels");

// @desc    Create a new payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
  try {
    const { Payment, Invoice } = getTenantModels(req.dbConnection);
    const {
      amount,
      date,
      method,
      reference,
      source,
      invoiceId,
      orderId,
      customerId,
      notes,
    } = req.body;

    const payment = new Payment({
      amount,
      date,
      method,
      reference,
      source,
      invoice: invoiceId,
      order: orderId,
      customer: customerId,
      notes,
    });

    const savedPayment = await payment.save();

    // If linked to an invoice, update invoice status and balance
    if (invoiceId) {
      const invoice = await Invoice.findById(invoiceId);
      if (invoice) {
        invoice.payments.push(savedPayment._id);
        invoice.amountPaid = (invoice.amountPaid || 0) + parseFloat(amount);

        // Status update logic handled by pre-save hook in Invoice model (calculating balanceDue)
        // But we need to explicitly set status based on new balance
        const total = invoice.total;
        const paid = invoice.amountPaid;

        if (paid >= total) {
          invoice.status = "paid";
        } else if (paid > 0) {
          invoice.status = "partially_paid";
        }

        await invoice.save();
      }
    }

    res.status(201).json(savedPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const { Payment } = getTenantModels(req.dbConnection);
    const { search, method, source, customer, startDate, endDate } = req.query;
    const pageSize = 20;
    const page = Number(req.query.pageNumber) || 1;

    // Build filter object
    const filter = { status: { $ne: "deleted" } };

    // Search in reference or notes
    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by payment method
    if (method && method !== "all") {
      filter.method = method;
    }

    // Filter by source
    if (source && source !== "all") {
      filter.source = source;
    }

    // Filter by customer
    if (customer && customer !== "all") {
      filter.customer = customer;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const count = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .populate("customer", "firstName lastName email billing")
      .populate("invoice", "invoiceNumber")
      .populate("order", "orderNumber")
      .sort({ date: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      payments,
      page,
      pages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
const updatePayment = async (req, res) => {
  try {
    const { Payment, Invoice } = getTenantModels(req.dbConnection);
    const payment = await Payment.findById(req.params.id);

    if (payment) {
      const { editReason, editedBy, ...updateData } = req.body;

      // Add to edit history if edit reason provided
      if (editReason) {
        payment.editHistory.push({
          editedAt: new Date(),
          editedBy: editedBy || "User",
          reason: editReason,
        });
      }

      const oldAmount = payment.amount;
      const newAmount = updateData.amount || oldAmount;
      const difference = parseFloat(newAmount) - oldAmount;

      // Update payment fields
      Object.keys(updateData).forEach((key) => {
        payment[key] = updateData[key];
      });

      const updatedPayment = await payment.save();

      // Update invoice balance if amount changed and invoice is not deleted
      if (payment.invoice && difference !== 0) {
        const invoice = await Invoice.findById(payment.invoice);
        if (invoice && invoice.status !== "deleted") {
          invoice.amountPaid = (invoice.amountPaid || 0) + difference;

          // Update status based on new balance
          const total = invoice.total;
          const paid = invoice.amountPaid;

          if (paid >= total) {
            invoice.status = "paid";
          } else if (paid > 0) {
            invoice.status = "partially_paid";
          } else {
            invoice.status = "sent"; // Revert to sent if no payment
          }

          await invoice.save();
        }
      }

      res.json(updatedPayment);
    } else {
      res.status(404).json({ message: "Payment not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete payment (soft delete)
// @route   DELETE /api/payments/:id
// @access  Private
const deletePayment = async (req, res) => {
  try {
    const { Payment, Invoice } = getTenantModels(req.dbConnection);
    const payment = await Payment.findById(req.params.id);

    if (payment) {
      // Revert invoice balance only if invoice is not deleted
      if (payment.invoice) {
        const invoice = await Invoice.findById(payment.invoice);
        if (invoice && invoice.status !== "deleted") {
          invoice.amountPaid = (invoice.amountPaid || 0) - payment.amount;

          // Remove payment from invoice's payments array
          invoice.payments = invoice.payments.filter(
            (p) => p.toString() !== payment._id.toString()
          );

          // Update status based on new balance
          const total = invoice.total;
          const paid = invoice.amountPaid;

          if (paid >= total) {
            invoice.status = "paid";
          } else if (paid > 0) {
            invoice.status = "partially_paid";
          } else {
            invoice.status = "sent"; // Revert to sent if no payment
          }

          await invoice.save();
        }
      }

      // Soft delete the payment
      payment.status = "deleted";
      await payment.save();

      res.json({ message: "Payment removed" });
    } else {
      res.status(404).json({ message: "Payment not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPayment,
  getPayments,
  updatePayment,
  deletePayment,
};
