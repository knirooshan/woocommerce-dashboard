const express = require("express");
const router = express.Router();
const {
  getProducts,
  syncProducts,
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authMiddleware");

router.route("/").get(protect, getProducts);
router.route("/sync").post(protect, admin, syncProducts);

module.exports = router;
