const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: {
      type: String,
      required: true,
      enum: ["Cash", "Card", "Bank Transfer", "Check", "WooCommerce", "Other"],
    },
    reference: { type: String },
    source: {
      type: String,
      required: true,
      enum: ["Invoice", "POS", "WooCommerce", "Manual"],
      default: "Manual",
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    notes: { type: String },
    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },
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
module.exports = paymentSchema;
