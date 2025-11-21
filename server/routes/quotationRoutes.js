const express = require("express");
const router = express.Router();
const {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotationStatus,
} = require("../controllers/quotationController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getQuotations).post(protect, createQuotation);
router.route("/:id").get(protect, getQuotationById);
router.route("/:id/status").put(protect, updateQuotationStatus);

module.exports = router;
