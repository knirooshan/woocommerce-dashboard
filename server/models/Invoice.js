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
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "partially_paid", "overdue", "cancelled"],
      default: "draft",
    },
    dueDate: Date,
    notes: String,
    paymentMethod: String,
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
  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
