const Product = require("../models/Product");
const { getWooProducts } = require("../services/wooService");

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sync products from WooCommerce
// @route   POST /api/products/sync
// @access  Private/Admin
const syncProducts = async (req, res) => {
  try {
    // Fetch page 1 for now. In production, we'd loop through all pages.
    const wooProducts = await getWooProducts(1, 100);

    const syncedProducts = [];

    for (const p of wooProducts) {
      const productData = {
        wooId: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price ? parseFloat(p.price) : 0,
        regularPrice: p.regular_price ? parseFloat(p.regular_price) : 0,
        salePrice: p.sale_price ? parseFloat(p.sale_price) : 0,
        stockQuantity: p.stock_quantity || 0,
        images: p.images.map((img) => img.src),
        categories: p.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        })),
        description: p.description,
        shortDescription: p.short_description,
        status: p.status,
      };

      const product = await Product.findOneAndUpdate(
        { wooId: p.id },
        productData,
        { new: true, upsert: true }
      );
      syncedProducts.push(product);
    }

    res.json({
      message: `Synced ${syncedProducts.length} products`,
      products: syncedProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, syncProducts };
