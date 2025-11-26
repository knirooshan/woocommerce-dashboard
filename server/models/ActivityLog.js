const mongoose = require("mongoose");

const activityLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    action: {
      type: String,
      required: true,
      enum: ["create", "update", "delete", "api_call"],
    },
    collectionName: {
      type: String,
      required: false,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    changes: {
      type: Object,
      required: false,
    },
    method: {
      type: String,
      required: false,
    },
    url: {
      type: String,
      required: false,
    },
    ip: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
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
