const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    wooOrderId: {
      type: Number,
      unique: true,
      sparse: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
    customerInfo: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
    },
    items: [
      {
        productId: Number,
        name: String,
        sku: String,
        quantity: Number,
        price: Number,
        total: Number,
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    shippingTotal: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "on-hold",
        "completed",
        "cancelled",
        "refunded",
        "failed",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
    },
    paymentMethodTitle: {
      type: String,
    },
    shippingAddress: {
      firstName: String,
      lastName: String,
      company: String,
      address1: String,
      address2: String,
      city: String,
      state: String,
      postcode: String,
      country: String,
    },
    billingAddress: {
      firstName: String,
      lastName: String,
      company: String,
      address1: String,
      address2: String,
      city: String,
      state: String,
      postcode: String,
      country: String,
      email: String,
      phone: String,
    },
    dateCreated: {
      type: Date,
      default: Date.now,
    },
    datePaid: {
      type: Date,
    },
    dateCompleted: {
      type: Date,
    },
    currency: {
      type: String,
      default: "USD",
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
