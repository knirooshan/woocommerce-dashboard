const express = require("express");
const router = express.Router();
const {
  getProducts,
  syncProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authMiddleware");

router.route("/").get(protect, getProducts).post(protect, admin, createProduct);
router.route("/sync").post(protect, admin, syncProducts);
router
  .route("/:id")
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
