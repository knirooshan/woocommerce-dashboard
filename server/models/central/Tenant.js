const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subdomain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    dbName: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    email: {
      type: String,
      required: false, // Required for setup
    },
    setupPasskey: {
      type: String,
      select: false, // Hide by default
    },
    isSetupComplete: {
      type: Boolean,
      default: false,
    },
    organizationDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// We don't export a model bound to a connection here because the connection
// might change or we might want to bind it to the central connection dynamically.
// But for simplicty in a single-central-db context, we can export the schema
// or a function that takes the central connection.

module.exports = tenantSchema;
