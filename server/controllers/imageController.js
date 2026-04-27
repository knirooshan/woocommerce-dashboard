const axios = require("axios");
const sharp = require("sharp");
const dns = require("dns").promises;
const net = require("net");

// ---------------------------------------------------------------------------
// SSRF guard helpers
// ---------------------------------------------------------------------------

/**
 * Convert a dotted-decimal IPv4 string to a 32-bit unsigned integer.
 */
const ipv4ToInt = (ip) =>
  ip.split(".").reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>>
  0;

/**
 * Return true if the IPv4 address falls inside the given CIDR block.
 */
const inCidr = (ip, cidr) => {
  const [range, bits] = cidr.split("/");
  const mask = bits === "32" ? 0xffffffff : (~0 << (32 - Number(bits))) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(range) & mask);
};

// Private / reserved IPv4 ranges that must never be fetched
const BLOCKED_CIDR = [
  "0.0.0.0/8", // "This" network
  "10.0.0.0/8", // Private
  "100.64.0.0/10", // Shared address space (CGN)
  "127.0.0.0/8", // Loopback
  "169.254.0.0/16", // Link-local / cloud metadata
  "172.16.0.0/12", // Private
  "192.0.0.0/24", // IETF protocol assignments
  "192.168.0.0/16", // Private
  "198.18.0.0/15", // Benchmarking
  "198.51.100.0/24", // Documentation
  "203.0.113.0/24", // Documentation
  "240.0.0.0/4", // Reserved
  "255.255.255.255/32",
];

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
]);

/**
 * Validate a URL against SSRF risks:
 *  1. Must be https
 *  2. Must not be an IP literal in a blocked range
 *  3. Resolved DNS address must not be in a blocked range
 * Throws an Error with a safe message if validation fails.
 */
const validateRemoteUrl = async (rawUrl) => {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed");
  }

  const hostname = parsed.hostname;

  // Block IPv6 loopback / link-local literals immediately
  if (net.isIPv6(hostname)) {
    throw new Error("IPv6 addresses are not allowed");
  }

  // If the hostname is already an IPv4 literal, check it directly
  if (net.isIPv4(hostname)) {
    if (BLOCKED_CIDR.some((cidr) => inCidr(hostname, cidr))) {
      throw new Error("URL resolves to a blocked address");
    }
    return; // No DNS lookup needed
  }

  // Resolve hostname and check every returned address
  let addresses;
  try {
    addresses = await dns.resolve4(hostname);
  } catch {
    throw new Error("Unable to resolve hostname");
  }

  if (!addresses || addresses.length === 0) {
    throw new Error("Unable to resolve hostname");
  }

  for (const addr of addresses) {
    if (BLOCKED_CIDR.some((cidr) => inCidr(addr, cidr))) {
      throw new Error("URL resolves to a blocked address");
    }
  }
};

// ---------------------------------------------------------------------------

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

    // Validate URL against SSRF before making any network request
    try {
      await validateRemoteUrl(url);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    // Fetch the image from the validated URL (cap at 15 MB to avoid memory issues)
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 15000,
      maxRedirects: 3,
      maxContentLength: 15 * 1024 * 1024,
    });

    // Ensure the response is actually an image
    const contentType = (response.headers["content-type"] || "")
      .split(";")[0]
      .trim();
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return res
        .status(400)
        .json({ message: "URL does not point to a supported image" });
    }

    // Convert WebP to JPEG for better PDF compatibility, and resize large
    // images so they remain PDF-friendly (react-pdf / pdfkit handle smaller
    // base64 payloads much more reliably).
    let imageBuffer = Buffer.from(response.data);
    let finalContentType = contentType;

    const PDF_MAX_DIM = 1200; // px – enough resolution for A4 print quality

    if (contentType === "image/webp" || contentType.includes("webp")) {
      try {
        const meta = await sharp(imageBuffer).metadata();
        const needsResize =
          (meta.width || 0) > PDF_MAX_DIM || (meta.height || 0) > PDF_MAX_DIM;
        imageBuffer = await sharp(imageBuffer)
          .resize(
            needsResize ? PDF_MAX_DIM : undefined,
            needsResize ? PDF_MAX_DIM : undefined,
            {
              fit: "inside",
              withoutEnlargement: true,
            },
          )
          .jpeg({ quality: 85 })
          .toBuffer();
        finalContentType = "image/jpeg";
      } catch (sharpError) {
        console.log(
          "Sharp conversion failed, using original image:",
          sharpError.message,
        );
      }
    } else {
      // For non-WebP images, still resize if they are very large
      try {
        const meta = await sharp(imageBuffer).metadata();
        if (
          (meta.width || 0) > PDF_MAX_DIM ||
          (meta.height || 0) > PDF_MAX_DIM
        ) {
          imageBuffer = await sharp(imageBuffer)
            .resize(PDF_MAX_DIM, PDF_MAX_DIM, {
              fit: "inside",
              withoutEnlargement: true,
            })
            .jpeg({ quality: 85 })
            .toBuffer();
          finalContentType = "image/jpeg";
        }
      } catch (sharpError) {
        console.log(
          "Sharp resize failed, using original image:",
          sharpError.message,
        );
      }
    }

    // Convert to base64
    const base64 = imageBuffer.toString("base64");

    // Create data URL
    const dataURL = `data:${finalContentType};base64,${base64}`;

    res.json({ base64: dataURL });
  } catch (error) {
    console.error("Error converting image to base64:", error.message);
    res.status(500).json({ message: "Failed to convert image to base64" });
  }
};

module.exports = { urlToBase64 };
