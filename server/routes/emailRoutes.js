const express = require("express");
const router = express.Router();
const { sendInvoiceEmail, sendQuotationEmail } = require("../controllers/emailController");
const { protect } = require("../middleware/authMiddleware");

router.post("/send-invoice/:id", protect, sendInvoiceEmail);
router.post("/send-quotation/:id", protect, sendQuotationEmail);

module.exports = router;
