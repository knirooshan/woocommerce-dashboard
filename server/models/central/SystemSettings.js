const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    smtp: {
      host: { type: String, default: "" },
      port: { type: Number, default: 587 },
      user: { type: String, default: "" },
      pass: { type: String, default: "" },
      secure: { type: Boolean, default: false },
      fromName: { type: String, default: "MerchPilot Admin" },
      fromEmail: { type: String, default: "" },
    },
    general: {
      appName: { type: String, default: "MerchPilot" },
      supportEmail: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = systemSettingsSchema;
