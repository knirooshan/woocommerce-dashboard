const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    wooId: { type: Number, unique: true, sparse: true },
    email: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    role: { type: String },
    username: { type: String },
    billing: {
      first_name: String,
      last_name: String,
      company: String,
      address_1: String,
      address_2: String,
      city: String,
      state: String,
      postcode: String,
      country: String,
      email: String,
      phone: String,
    },
    shipping: {
      first_name: String,
      last_name: String,
      company: String,
      address_1: String,
      address_2: String,
      city: String,
      state: String,
      postcode: String,
      country: String,
    },
    avatar_url: String,
  },
  {
    timestamps: true,
  }
);

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
