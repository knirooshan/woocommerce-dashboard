const express = require("express");
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  writeOffInvoice,
  deleteInvoice,
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getInvoices).post(protect, createInvoice);
router
  .route("/:id")
  .get(protect, getInvoiceById)
  .put(protect, updateInvoice)
  .delete(protect, deleteInvoice);
router.route("/:id/status").put(protect, updateInvoiceStatus);
router.route("/:id/write-off").put(protect, writeOffInvoice);

module.exports = router;
