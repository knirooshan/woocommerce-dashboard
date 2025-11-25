const express = require("express");
const router = express.Router();
const {
  uploadMedia,
  getMedia,
  deleteMedia,
} = require("../controllers/mediaController");
const { protect } = require("../middleware/authMiddleware");

// All routes are protected
router.use(protect);

router.post("/upload", protect, uploadMedia);
router.get("/", protect, getMedia);
router.delete("/:id", protect, deleteMedia);

module.exports = router;
