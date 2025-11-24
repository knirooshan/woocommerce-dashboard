const axios = require("axios");
const sharp = require("sharp");

// @desc    Convert image URL to base64
// @route   POST /api/images/to-base64
// @access  Private
const urlToBase64 = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    // If already base64, return as is
    if (url.startsWith("data:")) {
      return res.json({ base64: url });
    }

    // Fetch the image from the URL
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 10000,
    });

    // Get content type from response headers
    const contentType = response.headers["content-type"] || "image/png";

    // Convert WebP to JPEG for better PDF compatibility
    let imageBuffer = Buffer.from(response.data);
    let finalContentType = contentType;

    if (contentType === "image/webp" || contentType.includes("webp")) {
      try {
        imageBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 85 })
          .toBuffer();
        finalContentType = "image/jpeg";
      } catch (sharpError) {
        console.log(
          "Sharp conversion failed, using original image:",
          sharpError.message
        );
        // If sharp fails, use original image
      }
    }

    // Convert to base64
    const base64 = imageBuffer.toString("base64");

    // Create data URL
    const dataURL = `data:${finalContentType};base64,${base64}`;

    res.json({ base64: dataURL });
  } catch (error) {
    console.error("Error converting image to base64:", error.message);
    res.status(500).json({
      message: "Failed to convert image to base64",
      error: error.message,
    });
  }
};

module.exports = { urlToBase64 };
