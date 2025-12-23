const { getTenantModels } = require("../models/tenantModels");
const { getContext } = require("../utils/requestContext");

const activityLogger = async (req, res, next) => {
  // Capture the original end function to log after response is sent
  res.on("finish", async () => {
    try {
      // Skip logging for OPTIONS requests, GET requests, or health checks
      if (req.method === "OPTIONS" || req.method === "GET") return;

      // Skip noisy utility routes or routes already handled by auditPlugin
      const skipRoutes = [
        "/api/images/to-base64",
        "/api/media/upload",
        "/api/products/sync",
        "/api/orders/sync",
        "/api/dashboard",
        // Data routes handled by auditPlugin
        "/api/products",
        "/api/customers",
        "/api/orders",
        "/api/quotations",
        "/api/invoices",
        "/api/expenses",
        "/api/vendors",
        "/api/settings",
        "/api/users",
        "/api/payments",
        "/api/activity-logs",
        "/api/first-run",
      ];

      if (skipRoutes.some((route) => req.originalUrl.startsWith(route))) {
        return;
      }

      const ip = getContext("ip");
      const userAgent = getContext("userAgent");

      // Sanitize body
      const body = { ...req.body };
      if (body.password) body.password = "***";
      if (body.token) body.token = "***";
      if (body.confirmPassword) body.confirmPassword = "***";
      if (body.pdfBase64) body.pdfBase64 = "[PDF Data]";
      if (body.image) body.image = "[Image Data]";
      if (body.logo) body.logo = "[Logo Data]";

      // Get tenant models
      if (!req.dbConnection) return;
      const { ActivityLog } = getTenantModels(req.dbConnection);

      // Determine a more descriptive action name
      let action = "api_call";
      const url = req.originalUrl.split("?")[0];

      if (url.includes("/api/pdf/invoice")) action = "Generate Invoice PDF";
      else if (url.includes("/api/pdf/quotation"))
        action = "Generate Quotation PDF";
      else if (url.includes("/api/pdf/sales-report"))
        action = "Generate Sales Report";
      else if (url.includes("/api/pdf/profit-loss-report"))
        action = "Generate P&L Report";
      else if (url.includes("/api/email/send-invoice")) action = "Email Invoice";
      else if (url.includes("/api/email/send-quotation"))
        action = "Email Quotation";
      else if (url.includes("/api/auth/login")) action = "User Login";
      else if (url.includes("/api/auth/logout")) action = "User Logout";
      else if (url.includes("/api/auth/register")) action = "User Registration";
      else if (url.includes("/api/auth/forgot-password"))
        action = "Password Reset Request";
      else if (url.includes("/api/auth/reset-password"))
        action = "Password Reset";
      else if (url.includes("/api/setup/init")) action = "System Initialization";
      else if (url.includes("/api/setup/complete")) action = "Setup Completion";

      // Prepare detailed changes object for the UI
      const changes = {
        url: req.originalUrl,
        method: req.method,
      };

      if (Object.keys(body).length > 0) changes.body = body;
      if (Object.keys(req.query).length > 0) changes.query = req.query;
      if (Object.keys(req.params).length > 0) changes.params = req.params;

      // Extract collection name and document ID from URL if possible
      const parts = url.split("/");
      const collectionName = parts[2] || undefined;
      const documentId =
        parts[3] && parts[3].match(/^[0-9a-fA-Z]{24}$/) ? parts[3] : undefined;

      await ActivityLog.create({
        user: req.user ? req.user._id : null,
        action,
        collectionName,
        documentId,
        method: req.method,
        url: req.originalUrl,
        ip,
        userAgent,
        changes,
      });
    } catch (error) {
      console.error("Activity Logger Error:", error);
    }
  });

  next();
};

module.exports = activityLogger;
