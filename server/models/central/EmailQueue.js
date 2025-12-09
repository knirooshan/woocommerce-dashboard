const mongoose = require("mongoose");

const emailQueueSchema = new mongoose.Schema(
  {
    to: { type: String, required: true },
    subject: { type: String, required: true },
    text: { type: String },
    html: { type: String },
    attachments: { type: Array, default: [] }, // Store attachment metadata/paths
    smtpConfig: { type: Object }, // Optional: specific SMTP settings for this email
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    attempts: { type: Number, default: 0 },
    error: { type: String },
    nextAttempt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Index for efficient polling
emailQueueSchema.index({ status: 1, nextAttempt: 1 });

module.exports = emailQueueSchema;
