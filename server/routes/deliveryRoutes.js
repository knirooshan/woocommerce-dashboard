const express = require("express");
const router = express.Router();
const {
  updateDelivery,
  getDeliveryQueue,
  searchDeliveryByInvoice,
} = require("../controllers/deliveryController");
const { protect } = require("../middleware/authMiddleware");

router.route("/queue").get(protect, getDeliveryQueue);
router.route("/search/:invoiceNumber").get(protect, searchDeliveryByInvoice);
router.route("/invoice/:invoiceId").put(protect, updateDelivery);

module.exports = router;
