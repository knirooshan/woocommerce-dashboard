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
    let page = 1;
    let wooProducts = [];

    // Loop to fetch all products from WooCommerce
    while (true) {
      const products = await getWooProducts(page, 100);
      if (!products || products.length === 0) break;
      wooProducts = [...wooProducts, ...products];
      page++;
    }

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

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      price,
      regularPrice,
      salePrice,
      costPrice,
      stockQuantity,
      images,
      categories,
      description,
      shortDescription,
      status,
    } = req.body;

    const product = new Product({
      name,
      sku,
      price,
      regularPrice,
      salePrice,
      costPrice,
      stockQuantity,
      images,
      categories,
      description,
      shortDescription,
      status,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      price,
      regularPrice,
      salePrice,
      costPrice,
      stockQuantity,
      images,
      categories,
      description,
      shortDescription,
      status,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.sku = sku || product.sku;
      product.price = price !== undefined ? price : product.price;
      product.regularPrice =
        regularPrice !== undefined ? regularPrice : product.regularPrice;
      product.salePrice =
        salePrice !== undefined ? salePrice : product.salePrice;
      product.costPrice =
        costPrice !== undefined ? costPrice : product.costPrice;
      product.stockQuantity =
        stockQuantity !== undefined ? stockQuantity : product.stockQuantity;
      product.images = images || product.images;
      product.categories = categories || product.categories;
      product.description = description || product.description;
      product.shortDescription = shortDescription || product.shortDescription;
      product.status = status || product.status;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  syncProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
