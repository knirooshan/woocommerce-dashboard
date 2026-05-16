const mongoose = require("mongoose");

// ─── Product Variant Sub-schema ────────────────────────────────────────────
// Mirrors Medusa's ProductVariant data model so variants can be pushed to
// Medusa without field transformation.
const productVariantSchema = new mongoose.Schema(
  {
    medusaVariantId: { type: String, sparse: true }, // Medusa variant ID after sync
    title: { type: String, required: true }, // e.g. "Black / M"
    sku: { type: String },
    barcode: { type: String },
    ean: { type: String },
    upc: { type: String },

    // Pricing (kept per-variant; also stored at product level for simple products)
    price: { type: Number },
    regularPrice: { type: Number },
    salePrice: { type: Number },

    // Inventory
    stockQuantity: { type: Number, default: 0 },
    allowBackorder: { type: Boolean, default: false },
    manageInventory: { type: Boolean, default: true },

    // Shipping / fulfilment (Medusa variant-level overrides)
    weight: { type: Number }, // in grams
    length: { type: Number }, // in mm/cm depending on store setting
    height: { type: Number },
    width: { type: Number },

    // Customs / compliance
    hsCode: { type: String },
    originCountry: { type: String },
    midCode: { type: String },
    material: { type: String },

    // Option values – key/value pairs, e.g. { Color: "Black", Size: "M" }
    options: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Image URLs specific to this variant
    images: [{ type: String }],
    thumbnail: { type: String },

    variantRank: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true },
);

// ─── Product Option Sub-schema ─────────────────────────────────────────────
// Medusa requires options defined at the product level, e.g. Color, Size.
const productOptionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g. "Color"
    values: [{ type: String }], // e.g. ["Black", "White"]
  },
  { _id: true },
);

// ─── Main Product Schema ───────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    // ── Legacy WooCommerce ID (kept for WC sync) ──────────────────────────
    wooId: { type: Number, unique: true, sparse: true },

    // ── Medusa sync ID ────────────────────────────────────────────────────
    medusaId: { type: String, sparse: true }, // Set after first push to Medusa

    // ── Core fields (map directly to Medusa Product) ─────────────────────
    name: { type: String, required: true }, // Medusa: title
    handle: { type: String }, // Medusa: handle (URL slug)
    subtitle: { type: String },
    description: { type: String },
    shortDescription: { type: String }, // Stored in metadata on Medusa side
    thumbnail: { type: String }, // Main thumbnail URL
    status: {
      type: String,
      enum: [
        "draft",
        "published",
        "rejected",
        "proposed",
        "publish",
        "pending",
        "private",
      ],
      default: "draft",
    },
    discountable: { type: Boolean, default: true },
    isGiftcard: { type: Boolean, default: false },

    // ── Pricing (for simple / non-variant products) ───────────────────────
    sku: { type: String },
    price: { type: Number },
    regularPrice: { type: Number },
    salePrice: { type: Number },
    costPrice: { type: Number }, // Internal cost; not sent to Medusa
    stockQuantity: { type: Number, default: 0 },

    // ── Images ───────────────────────────────────────────────────────────
    images: [{ type: String }],

    // ── Shipping / physical attributes (Medusa Product level) ─────────────
    weight: { type: Number }, // in grams
    length: { type: Number }, // cm
    height: { type: Number }, // cm
    width: { type: Number }, // cm

    // ── Customs / compliance ──────────────────────────────────────────────
    hsCode: { type: String }, // Harmonized System code
    midCode: { type: String }, // MID code
    originCountry: { type: String }, // ISO 3166-1 alpha-2, e.g. "LK"
    material: { type: String }, // e.g. "Rattan, Bamboo"

    // ── Medusa organisation ───────────────────────────────────────────────
    categories: [
      {
        id: Number,
        name: String,
        slug: String,
        medusaCategoryId: String, // Medusa category ID
      },
    ],
    tags: [{ value: String }], // Medusa-style tags [{value: "handmade"}]
    type: {
      // Medusa product type
      value: { type: String },
      medusaTypeId: { type: String },
    },
    collection: {
      // Medusa collection reference
      title: { type: String },
      handle: { type: String },
      medusaCollectionId: { type: String },
    },

    // ── Variant options definition (e.g. Color, Size) ─────────────────────
    // These are the option titles and their possible values at the product level.
    options: [productOptionSchema],

    // ── Variants ─────────────────────────────────────────────────────────
    variants: [productVariantSchema],

    // ── Free-form metadata (synced as-is to Medusa) ───────────────────────
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── External ID for 3rd-party integrations ────────────────────────────
    externalId: { type: String },
  },
  {
    timestamps: true,
  },
);

// Don't compile model here
module.exports = productSchema;
