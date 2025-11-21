const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: "My Store" },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      zip: { type: String, default: "" },
      country: { type: String, default: "" },
    },
    contact: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    logo: { type: String, default: "" }, // URL or Base64
    smtp: {
      host: { type: String, default: "" },
      port: { type: Number, default: 587 },
      user: { type: String, default: "" },
      pass: { type: String, default: "" },
      secure: { type: Boolean, default: false },
    },
    bank: {
      accountName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      bankName: { type: String, default: "" },
      branch: { type: String, default: "" },
    },
    currency: {
      code: { type: String, default: "USD" }, // e.g., USD, EUR, GBP, INR
      symbol: { type: String, default: "$" }, // e.g., $, €, £, ₹
      position: { type: String, default: "before", enum: ["before", "after"] }, // Symbol position
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;
