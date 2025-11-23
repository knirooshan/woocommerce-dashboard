const ActivityLog = require("../models/ActivityLog");

const activityLogger = async (req, res, next) => {
  // Only log in production environment
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  // Capture the original end function to log after response is sent (optional, but good for status codes)
  // For now, we log the request as it comes in or finishes.
  // Logging on finish ensures we capture user if auth middleware ran.

  res.on("finish", async () => {
    try {
      // Skip logging for OPTIONS requests or health checks if needed
      if (req.method === "OPTIONS") return;

      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      // Sanitize body
      const body = { ...req.body };
      if (body.password) body.password = "***";
      if (body.token) body.token = "***";
      if (body.confirmPassword) body.confirmPassword = "***";

      await ActivityLog.create({
        user: req.user ? req.user._id : null, // req.user populated by authMiddleware
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
