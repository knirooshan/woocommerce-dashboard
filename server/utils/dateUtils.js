const { getTenantModels } = require("../models/tenantModels");

/**
 * Returns the UTC offset in milliseconds for a given IANA timezone at a specific date.
 * Positive value means the timezone is ahead of UTC (e.g., +05:30 = +19800000).
 */
function getTimezoneOffsetMs(timezone, date) {
  try {
    const tzStr = date.toLocaleString("en-US", { timeZone: timezone });
    const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
    // Both strings are parsed as if they are local time (server runs UTC, so they're UTC)
    return new Date(tzStr) - new Date(utcStr);
  } catch {
    return 0; // fallback to UTC
  }
}

/**
 * Parse a "YYYY-MM-DD" date string as the start of that day (00:00:00.000)
 * in the given IANA timezone. Returns a UTC Date object.
 */
function parseStartOfDay(dateStr, timezone) {
  if (!dateStr) return null;
  const tz = timezone || "UTC";
  // Use noon UTC as reference to avoid DST edge cases at midnight
  const refDate = new Date(`${dateStr}T12:00:00.000Z`);
  const offsetMs = getTimezoneOffsetMs(tz, refDate);
  // UTC midnight - offset = local midnight expressed in UTC
  return new Date(new Date(`${dateStr}T00:00:00.000Z`).getTime() - offsetMs);
}

/**
 * Parse a "YYYY-MM-DD" date string as the end of that day (23:59:59.999)
 * in the given IANA timezone. Returns a UTC Date object.
 */
function parseEndOfDay(dateStr, timezone) {
  if (!dateStr) return null;
  const tz = timezone || "UTC";
  const refDate = new Date(`${dateStr}T12:00:00.000Z`);
  const offsetMs = getTimezoneOffsetMs(tz, refDate);
  return new Date(new Date(`${dateStr}T23:59:59.999Z`).getTime() - offsetMs);
}

/**
 * Load the configured timezone from the tenant's Settings document.
 * Falls back to "UTC" if not set or on any error.
 */
async function getTenantTimezone(dbConnection) {
  try {
    const { Settings } = getTenantModels(dbConnection);
    const settings = await Settings.findOne().lean();
    return settings?.dateTime?.timezone || "UTC";
  } catch {
    return "UTC";
  }
}

module.exports = { parseStartOfDay, parseEndOfDay, getTenantTimezone };
