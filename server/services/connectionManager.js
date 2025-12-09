const mongoose = require("mongoose");
const tenantSchema = require("../models/central/Tenant");

let connectionMap;
let centralConnection;

const connectCentralDB = async () => {
  if (centralConnection) return centralConnection;

  try {
    const conn = await mongoose
      .createConnection(process.env.CENTRAL_DB_URI)
      .asPromise();

    // Register Tenant model on central connection
    conn.model("Tenant", tenantSchema);

    centralConnection = conn;
    connectionMap = new Map();

    return centralConnection;
  } catch (error) {
    console.error(`Error connecting to Central DB: ${error.message}`);
    process.exit(1);
  }
};

const getCentralConnection = () => {
  if (!centralConnection) {
    throw new Error("Central DB is not connected");
  }
  return centralConnection;
};

const getTenantConnection = async (tenantId) => {
  if (connectionMap.has(tenantId)) {
    return connectionMap.get(tenantId);
  }

  // Get Tenant details from Central DB
  const Tenant = centralConnection.model("Tenant");
  const tenant = await Tenant.findById(tenantId);

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  // Identify tenant DB Name
  // If we are strictly using dbName from tenant record:
  const dbName = tenant.dbName;

  // Construct URI. Assuming localhost or same cluster.
  // If URI is full string, use it. If not, build it.
  let dbUri = process.env.MONGO_URI_BASE || process.env.MONGO_URI;
  // We need a base URI strategy.
  // For local: mongodb://localhost:27017/dbname
  // For Atlas: mongodb+srv://...?

  // Simplest strategy: Replace database name in connection string if possible,
  // or use a configured URI pattern.
  // For this local setup, and generally:
  const baseUri = process.env.CENTRAL_DB_URI.substring(
    0,
    process.env.CENTRAL_DB_URI.lastIndexOf("/")
  );
  const tenantUri = `${baseUri}/${dbName}`;

  try {
    const conn = await mongoose.createConnection(tenantUri).asPromise();
    connectionMap.set(tenantId, conn);

    // Handle connection events to remove from map on close?
    conn.on("close", () => {
      connectionMap.delete(tenantId);
    });

    return conn;
  } catch (error) {
    console.error(`Error connecting to Tenant DB ${dbName}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  connectCentralDB,
  getCentralConnection,
  getTenantConnection,
};
