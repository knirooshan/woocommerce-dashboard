const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Order = require("../models/Order");

// @desc    Create a new payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
  try {
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
    const pageSize = 20;
    const page = Number(req.query.pageNumber) || 1;

    const count = await Payment.countDocuments({});
    const payments = await Payment.find({})
      .populate("customer", "firstName lastName email")
      .populate("invoice", "invoiceNumber")
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

      // Update invoice balance if amount changed
      if (payment.invoice && difference !== 0) {
        const invoice = await Invoice.findById(payment.invoice);
        if (invoice) {
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

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (payment) {
      // Revert invoice balance
      if (payment.invoice) {
        const invoice = await Invoice.findById(payment.invoice);
        if (invoice) {
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

      await payment.deleteOne();
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
