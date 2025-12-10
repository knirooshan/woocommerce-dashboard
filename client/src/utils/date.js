/**
 * Format a date string or object based on the provided settings.
 *
 * @param {string|Date} date - The date to format.
 * @param {object} settings - The settings object containing dateTime configuration.
 * @returns {string} - The formatted date string.
 */
export const formatDate = (date, settings) => {
  if (!date) return "";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const format = settings?.dateTime?.dateFormat || "MM/DD/YYYY";

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  // Simple format replacement
  switch (format) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "DD-MM-YYYY":
      return `${day}-${month}-${year}`;
    case "MM/DD/YYYY":
    default:
      return `${month}/${day}/${year}`;
  }
};

/**
 * Format a date object to time string based on settings.
 *
 * @param {string|Date} date - The date to format.
 * @param {object} settings - The settings object containing dateTime configuration.
 * @returns {string} - The formatted time string.
 */
export const formatTime = (date, settings) => {
  if (!date) return "";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const format = settings?.dateTime?.timeFormat || "12h";

  if (format === "24h") {
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    return d.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });
  }
};
