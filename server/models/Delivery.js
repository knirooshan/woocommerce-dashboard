const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      unique: true, // Assuming one delivery record per invoice
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "dispatched", "delivered", "picked_up"],
      default: "pending",
    },
    trackingNumbers: [String],
    lifecycle: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
        updatedBy: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Don't compile model here (tenant-based architecture)
module.exports = deliverySchema;
