const express = require("express");
const router = express.Router();
const {
  getProducts,
  syncProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  pushToMedusa,
  pushAllToMedusa,
  toggleMedusaSync,
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authMiddleware");

router.route("/").get(protect, getProducts).post(protect, admin, createProduct);
router.route("/sync").post(protect, admin, syncProducts);
router.route("/push-medusa-all").post(protect, admin, pushAllToMedusa);
router
  .route("/:id")
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);
router.route("/:id/push-medusa").post(protect, admin, pushToMedusa);
router.route("/:id/toggle-medusa-sync").patch(protect, admin, toggleMedusaSync);

module.exports = router;
