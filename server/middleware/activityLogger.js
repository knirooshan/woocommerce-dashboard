const { getTenantModels } = require("../models/tenantModels");
const { getContext } = require("../utils/requestContext");

const activityLogger = async (req, res, next) => {
  // Capture the original end function to log after response is sent
  res.on("finish", async () => {
    try {
      // Skip logging for OPTIONS requests, GET requests, or health checks
      if (req.method === "OPTIONS" || req.method === "GET") return;

      const ip = getContext("ip");
      const userAgent = getContext("userAgent");

      // Sanitize body
      const body = { ...req.body };
      if (body.password) body.password = "***";
      if (body.token) body.token = "***";
      if (body.confirmPassword) body.confirmPassword = "***";

      // Get tenant models
      if (!req.dbConnection) return;
      const { ActivityLog } = getTenantModels(req.dbConnection);

      // Prepare detailed changes object for the UI
      const changes = {
        url: req.originalUrl,
        method: req.method,
      };

      if (Object.keys(body).length > 0) changes.body = body;
      if (Object.keys(req.query).length > 0) changes.query = req.query;
      if (Object.keys(req.params).length > 0) changes.params = req.params;

      await ActivityLog.create({
        user: req.user ? req.user._id : null,
        action: "api_call",
        method: req.method,
        url: req.originalUrl,
        ip,
        userAgent,
        changes,
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
