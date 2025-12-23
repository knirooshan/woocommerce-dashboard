const { getTenantModels } = require("../models/tenantModels");

const activityLogger = async (req, res, next) => {
  // Only log in production environment
  // if (process.env.NODE_ENV !== "production") {
  //   return next();
  // }

  // Capture the original end function to log after response is sent (optional, but good for status codes)
  // For now, we log the request as it comes in or finishes.
  // Logging on finish ensures we capture user if auth middleware ran.

  res.on("finish", async () => {
    try {
      // Skip logging for OPTIONS requests, GET requests, or health checks
      if (req.method === "OPTIONS" || req.method === "GET") return;

      // Extract IP address with proper handling for localhost and proxies
      let ip =
        req.headers["x-forwarded-for"] ||
        req.headers["x-real-ip"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket?.remoteAddress;

      // Convert IPv6 localhost to IPv4 for readability
      if (ip === "::1" || ip === "::ffff:127.0.0.1") {
        ip = "127.0.0.1";
      }

      // Handle x-forwarded-for with multiple IPs (take the first one)
      if (ip && ip.includes(",")) {
        ip = ip.split(",")[0].trim();
      }

      // Remove IPv6 prefix if present
      if (ip && ip.startsWith("::ffff:")) {
        ip = ip.substring(7);
      }

      const userAgent = req.headers["user-agent"];

      // Sanitize body
      const body = { ...req.body };
      if (body.password) body.password = "***";
      if (body.token) body.token = "***";
      if (body.confirmPassword) body.confirmPassword = "***";

      // Get tenant models
      if (!req.dbConnection) return;
      const { ActivityLog } = getTenantModels(req.dbConnection);

      await ActivityLog.create({
        user: req.user ? req.user._id : null, // req.user populated by authMiddleware
        action: "api_call",
        method: req.method,
        url: req.originalUrl,
        ip,
        userAgent,
        body: Object.keys(body).length > 0 ? body : undefined,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        params: Object.keys(req.params).length > 0 ? req.params : undefined,
      });
    } catch (error) {
      console.error("Activity Logger Error:", error);
    }
  });

  next();
};

module.exports = activityLogger;
