const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    wooId: { type: Number, unique: true, sparse: true },
    name: { type: String, required: true },
    sku: { type: String },
    price: { type: Number },
    regularPrice: { type: Number },
    salePrice: { type: Number },
    costPrice: { type: Number },
    stockQuantity: { type: Number },
    images: [{ type: String }],
    categories: [
      {
        id: Number,
        name: String,
        slug: String,
      },
    ],
    description: { type: String },
    shortDescription: { type: String },
    status: { type: String },
  },
  {
    timestamps: true,
  }
);

// Don't compile model here
module.exports = productSchema;
