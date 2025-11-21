const express = require("express");
const router = express.Router();
const { urlToBase64 } = require("../controllers/imageController");
const { protect } = require("../middleware/authMiddleware");

router.post("/to-base64", protect, urlToBase64);

module.exports = router;
