const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    reference: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;
