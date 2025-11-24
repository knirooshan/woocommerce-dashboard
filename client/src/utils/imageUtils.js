import { ENDPOINTS } from "../config/api";

/**
 * Convert image URL to base64 data URL using backend API to avoid CORS issues
 * @param {string} url - The image URL to convert
 * @param {string} token - Authentication token
 * @returns {Promise<string>} - Base64 data URL
 */
export const urlToBase64 = async (url, token) => {
  if (!url) return null;

  // If already base64, return as is
  if (url.startsWith("data:")) {
    return url;
  }

  try {
    // Use backend API to convert image (bypasses CORS)
    const response = await fetch(ENDPOINTS.IMAGES_TO_BASE64, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Failed to convert image: ${response.status}`);
    }

    const data = await response.json();
    return data.base64;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    // Return original URL as fallback
    return url;
  }
};
