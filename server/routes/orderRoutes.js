const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getOrders,
  syncOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  refundOrder,
} = require("../controllers/orderController");

// Routes
router.route("/").get(protect, getOrders).post(protect, createOrder);
router.route("/sync").post(protect, admin, syncOrders);
router
  .route("/:id")
  .get(protect, getOrderById)
  .put(protect, updateOrder)
  .delete(protect, deleteOrder);

router.route("/:id/refund").put(protect, refundOrder);

module.exports = router;
