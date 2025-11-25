const Media = require("../models/Media");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const uploadPath = path.join(
      __dirname,
      "..",
      "uploads",
      String(year),
      month
    );

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Keep original filename but ensure uniqueness if needed, or just overwrite?
    // User asked for WordPress style, which usually appends number if exists.
    // For simplicity, we'll append a timestamp to avoid conflicts.
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Upload Media
exports.uploadMedia = [
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");

      // Construct URL (assuming server serves 'uploads' statically)
      // We need to know the base URL or just store relative path
      // Storing full URL as requested by user "directly use image url"
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const relativePath = `/uploads/${year}/${month}/${req.file.filename}`;
      const fullUrl = `${baseUrl}${relativePath}`;

      const newMedia = new Media({
        filename: req.file.filename,
        path: req.file.path,
        url: fullUrl,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      await newMedia.save();

      res.status(201).json(newMedia);
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ message: "Server error during upload" });
    }
  },
];

// Get All Media
exports.getMedia = async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 });
    res.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({ message: "Server error fetching media" });
  }
};

// Delete Media
exports.deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Delete file from filesystem
    if (fs.existsSync(media.path)) {
      fs.unlinkSync(media.path);
    }

    await Media.findByIdAndDelete(req.params.id);

    res.json({ message: "Media deleted successfully" });
  } catch (error) {
    console.error("Error deleting media:", error);
    res.status(500).json({ message: "Server error deleting media" });
  }
};
