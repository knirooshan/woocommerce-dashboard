const mongoose = require("mongoose");

const activityLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    method: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    body: {
      type: Object,
      required: false,
    },
    query: {
      type: Object,
      required: false,
    },
    params: {
      type: Object,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

module.exports = ActivityLog;
