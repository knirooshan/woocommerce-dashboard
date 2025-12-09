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
    deliveryCharge: { type: Number, default: 0 },
    deliveryNote: { type: String },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "deleted"],
      default: "draft",
    },
    notes: String,
    quotationDate: { type: Date, default: Date.now },
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

// Don't compile model here
module.exports = quotationSchema;
