require("dotenv").config({ path: "./server/.env" });
const mongoose = require("mongoose");
const {
  connectCentralDB,
  getCentralConnection,
} = require("../services/connectionManager");

const seedDefaultTenant = async () => {
  try {
    await connectCentralDB();
    const conn = getCentralConnection();

    // Wait for connection to be ready
    if (conn.readyState !== 1) {
      await new Promise((resolve) => conn.once("open", resolve));
    }

    const Tenant = conn.model("Tenant");

    const defaultTenantId = process.env.DEFAULT_TENANT_ID || "ccc";

    const existing = await Tenant.findOne({ subdomain: defaultTenantId });
    if (existing) {
      console.log(`Default tenant '${defaultTenantId}' already exists.`);
    } else {
      await Tenant.create({
        name: "Default Dev Tenant",
        subdomain: defaultTenantId,
        email: "admin@local.test",
        dbName: `tenant_${defaultTenantId}`,
        isActive: true,
        isSetupComplete: true, // Mark as complete so we don't get blocked by setup flow on localhost
        setupPasskey: "DEV-PASS-KEY",
      });
      console.log(`Created default tenant '${defaultTenantId}'.`);
    }

    // Also verify Super Admin tenant logic if needed?
    // Usually Super Admin doesn't need a Tenant record if we handle it by subdomain 'app' only.
    // But if we want to login as super admin on 'app.merchpilot.xyz', we need users in Central DB.
    // TenantMiddleware uses centralConn for 'app'.
    // getTenantModels uses 'User' on that connection.
    // Does 'User' collection exist in 'merchpilot_central'?
    // Likely empty.

    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDefaultTenant();
