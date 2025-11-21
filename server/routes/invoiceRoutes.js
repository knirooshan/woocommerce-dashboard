const express = require("express");
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getInvoices).post(protect, createInvoice);
router.route("/:id").get(protect, getInvoiceById);
router.route("/:id/status").put(protect, updateInvoiceStatus);

module.exports = router;
