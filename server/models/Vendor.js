const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    contactPerson: { type: String },
  },
  {
    timestamps: true,
  }
);

// Don't compile model here
module.exports = vendorSchema;
