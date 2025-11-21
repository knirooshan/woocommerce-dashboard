const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getOrders,
  syncOrders,
  getOrderById,
} = require("../controllers/orderController");

// Routes
router.route("/").get(protect, getOrders);
router.route("/sync").post(protect, admin, syncOrders);
router.route("/:id").get(protect, getOrderById);

module.exports = router;
