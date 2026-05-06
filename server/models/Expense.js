const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "Bank Transfer", "Cheque", "Other"],
      default: "Cash",
    },
    reference: { type: String },
    notes: { type: String },
    editHistory: [
      {
        editedAt: { type: Date, default: Date.now },
        editedBy: { type: String },
        reason: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Don't compile model here
module.exports = expenseSchema;
