const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    customerInfo: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        sku: String,
        price: Number,
        quantity: Number,
        total: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    deliveryNote: { type: String },
    total: { type: Number, required: true },
    paymentMethod: String,
    payments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number },
    isWrittenOff: { type: Boolean, default: false },
    status: {
      type: String,
      enum: [
        "draft",
        "sent",
        "paid",
        "partially_paid",
        "overdue",
        "cancelled",
        "written-off",
        "deleted",
      ],
      default: "draft",
    },
    editHistory: [
      {
        editedAt: { type: Date, default: Date.now },
        editedBy: { type: String },
        reason: { type: String },
      },
    ],
    invoiceDate: { type: Date, default: Date.now },
    dueDate: Date,
    notes: String,
    woocommerceOrderId: Number,
  },
  {
    timestamps: true,
  }
);

// Auto-generate invoice number
invoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1)
      .toString()
      .padStart(4, "0")}`;
  }

  // Calculate balance due
  if (this.total !== undefined) {
    this.balanceDue = this.total - (this.amountPaid || 0);
    if (this.isWrittenOff) {
      this.balanceDue = 0;
    }
  }

  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
