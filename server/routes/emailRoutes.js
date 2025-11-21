const express = require("express");
const router = express.Router();
const { sendInvoiceEmail } = require("../controllers/emailController");
const { protect } = require("../middleware/authMiddleware");

router.post("/send-invoice/:id", protect, sendInvoiceEmail);

module.exports = router;
