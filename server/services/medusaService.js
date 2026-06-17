/**
 * medusaService.js
 * Push / sync products from MerchPilot to a Medusa v2 backend.
 *
 * Medusa Admin API docs: https://docs.medusajs.com/api/admin#tag/products
 */

const axios = require("axios");

/**
 * Build an axios instance pre-configured for the Medusa Admin API.
 * @param {{ url: string, apiKey: string }} config
 */
const buildClient = ({ url, apiKey }) => {
  if (!url || !apiKey) throw new Error("Medusa URL and API key are required");
  return axios.create({
    baseURL: url.replace(/\/$/, "") + "/admin",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
};

/**
 * Map a MerchPilot product document to a Medusa v2 CreateProductDTO body.
 * @param {object} product  - Mongoose Product document (plain object or doc)
 */
const toMedusaProduct = (product) => {
  const p = product.toObject ? product.toObject() : product;

  return {
    title: p.name,
    handle: p.handle || undefined,
    subtitle: p.subtitle || undefined,
    description: p.description || undefined,
    status: normaliseMedusaStatus(p.status),
    is_giftcard: p.isGiftcard || false,
    discountable: p.discountable !== false,
    thumbnail: p.thumbnail || undefined,

    // Shipping
    weight: p.weight || undefined,
    length: p.length || undefined,
    height: p.height || undefined,
    width: p.width || undefined,

    // Customs
    hs_code: p.hsCode || undefined,
    mid_code: p.midCode || undefined,
    origin_country: p.originCountry || undefined,
    material: p.material || undefined,

    external_id: p.externalId || String(p._id),

    metadata: {
      ...(p.metadata || {}),
      ...(p.shortDescription ? { short_description: p.shortDescription } : {}),
      ...(p.costPrice !== undefined ? { cost_price: p.costPrice } : {}),
      merchpilot_id: String(p._id),
    },

    // Images: Medusa expects [{url}]
    images: (p.images || []).map((src) => ({ url: src })),

    // Tags: [{value}]
    tags: (p.tags || []).filter((t) => t.value),

    // Type
    type: p.type?.value ? { value: p.type.value } : undefined,

    // Collection handle (Medusa links by handle)
    collection_id: p.collection?.medusaCollectionId || undefined,

    // Options e.g. [{title: "Color", values: ["Black","White"]}]
    options: (p.options || []).map((o) => ({
      title: o.title,
      values: o.values || [],
    })),

    // Variants
    variants: buildVariants(p),
  };
};

/**
 * Normalise MerchPilot/WooCommerce status values to Medusa's enum.
 * Medusa: draft | published | proposed | rejected
 */
const normaliseMedusaStatus = (status) => {
  const map = {
    publish: "published",
    published: "published",
    draft: "draft",
    pending: "proposed",
    private: "draft",
    proposed: "proposed",
    rejected: "rejected",
  };
  return map[status] || "draft";
};

/**
 * Build Medusa variant objects from a MerchPilot product.
 * If the product has no explicit variants, create one default variant.
 */
const buildVariants = (p) => {
  if (p.variants && p.variants.length > 0) {
    return p.variants.map((v, idx) => ({
      title: v.title || `Default`,
      sku: v.sku || undefined,
      barcode: v.barcode || undefined,
      ean: v.ean || undefined,
      upc: v.upc || undefined,
      hs_code: v.hsCode || undefined,
      origin_country: v.originCountry || undefined,
      mid_code: v.midCode || undefined,
      material: v.material || undefined,
      weight: v.weight || undefined,
      length: v.length || undefined,
      height: v.height || undefined,
      width: v.width || undefined,
      allow_backorder: v.allowBackorder || false,
      manage_inventory: v.manageInventory !== false,
      variant_rank: v.variantRank ?? idx,
      // Option values e.g. { Color: "Black", Size: "M" }
      options: v.options || {},
      metadata: v.metadata || {},
    }));
  }

  // Simple product → single default variant
  return [
    {
      title: "Default",
      sku: p.sku || undefined,
      manage_inventory: true,
      allow_backorder: false,
      weight: p.weight || undefined,
      length: p.length || undefined,
      height: p.height || undefined,
      width: p.width || undefined,
      hs_code: p.hsCode || undefined,
      origin_country: p.originCountry || undefined,
      material: p.material || undefined,
    },
  ];
};

/**
 * Push a single product to Medusa.
 * Creates if no medusaId is set, updates if one exists.
 *
 * @param {object} product  - MerchPilot Product mongoose doc
 * @param {{ url, apiKey }} medusaConfig
 * @returns {{ medusaId: string, medusaVariantIds: object }}
 */
const pushProduct = async (product, medusaConfig) => {
  const client = buildClient(medusaConfig);
  const body = toMedusaProduct(product);
  const externalId = body.external_id; // always String(product._id)

  let medusaProduct;

  if (product.medusaId) {
    // ── Known Medusa ID: update in place ─────────────────────────────────
    const { data } = await client.post(`/products/${product.medusaId}`, body);
    medusaProduct = data.product;
  } else {
    // ── No stored ID: check if Medusa already has this product by external_id
    // This prevents duplicates when medusaId was lost (e.g. after a DB restore).
    let existingId = null;
    try {
      const { data } = await client.get("/products", {
        params: { external_id: externalId, limit: 1 },
      });
      existingId = data.products?.[0]?.id || null;
    } catch {
      // If the query fails (older Medusa version, network blip) fall through to create
    }

    if (existingId) {
      // Re-link and update
      const { data } = await client.post(`/products/${existingId}`, body);
      medusaProduct = data.product;
    } else {
      // Truly new - create
      const { data } = await client.post("/products", body);
      medusaProduct = data.product;
    }
  }

  // Build a variantTitle → medusaVariantId map for local storage
  const medusaVariantIds = {};
  (medusaProduct.variants || []).forEach((v) => {
    medusaVariantIds[v.title] = v.id;
  });

  return {
    medusaId: medusaProduct.id,
    medusaVariantIds,
  };
};

module.exports = { pushProduct, toMedusaProduct, buildClient };
