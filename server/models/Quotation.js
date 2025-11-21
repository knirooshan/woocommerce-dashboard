const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, unique: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
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
      enum: ["draft", "sent", "accepted", "rejected"],
      default: "draft",
    },
    notes: String,
    validUntil: Date,
  },
  {
    timestamps: true,
  }
);

// Auto-generate quotation number
quotationSchema.pre("save", async function (next) {
  if (!this.quotationNumber) {
    const count = await this.constructor.countDocuments();
    this.quotationNumber = `QT-${new Date().getFullYear()}-${(count + 1)
      .toString()
      .padStart(4, "0")}`;
  }
  next();
});

const Quotation = mongoose.model("Quotation", quotationSchema);

module.exports = Quotation;
