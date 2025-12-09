const {
  getCentralConnection,
  getTenantConnection,
} = require("../services/connectionManager");
const { setContext } = require("../utils/requestContext");

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || "ccc";

const tenantMiddleware = async (req, res, next) => {
  try {
    const host = req.headers.host;
    const subdomain = host.split(".")[0];

    const centralConn = getCentralConnection();
    const Tenant = centralConn.model("Tenant");

    let tenant;
    let isSuperAdmin = false;

    // 1. Check for Super Admin
    if (subdomain === "app") {
      isSuperAdmin = true;
      req.isSuperAdmin = true;
      // Super admin generally uses Central DB for management,
      // but might "impersonate" a tenant.
      // For now, let's just mark it.
      // If specific logic is needed, we handle it.
      // We might not set 'tenant' here, or set a dummy 'admin' tenant.
    }

    // 2. Resolve Tenant
    if (!isSuperAdmin) {
      if (host.includes("localhost") || !subdomain || subdomain === "www") {
        // Fallback to default
        tenant = await Tenant.findOne({ subdomain: DEFAULT_TENANT_ID });
      } else {
        tenant = await Tenant.findOne({ subdomain: subdomain });
      }

      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
    }

    // 3. Setup Context
    if (tenant) {
      req.tenant = tenant;
      setContext("tenantId", tenant._id.toString()); // Store ID in context

      // Connect to Tenant DB
      // We defer this? Or do it now?
      // Doing it now ensures `req.dbConnection` is available.
      const dbConn = await getTenantConnection(tenant._id.toString());
      req.dbConnection = dbConn;

      // Passkey Flow Check
      if (!tenant.isSetupComplete && !req.path.startsWith("/api/setup")) {
        // Allow static files?
        return res.status(403).json({
          code: "SETUP_REQUIRED",
          message: "Tenant setup required",
        });
      }
    } else if (isSuperAdmin) {
      // Super admin runs on Central DB?
      req.dbConnection = centralConn;
    }

    next();
  } catch (error) {
    console.error("Tenant Middleware Error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error during tenant resolution" });
  }
};

module.exports = tenantMiddleware;
