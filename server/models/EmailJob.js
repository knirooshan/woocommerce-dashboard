const mongoose = require("mongoose");

const emailJobSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  html: {
    type: String,
    required: true,
  },
  attachments: {
    type: Array,
    default: [],
  },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  },
  attempts: {
    type: Number,
    default: 0,
  },
  error: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Don't compile model here
module.exports = emailJobSchema;
