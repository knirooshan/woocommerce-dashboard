// Schema consumed by both the runtime (config/env.js) and the compose-env CLI
// (npx compose-env generate / validate / docker-env)
const schema = {
  PORT: {
    type: "port",
    default: 5000,
    description: "HTTP server port",
  },
  NODE_ENV: {
    type: "enum",
    values: ["development", "production", "test"],
    default: "development",
  },
  MONGO_URI: {
    type: "string",
    required: false,
    secret: true,
    description: "Tenant MongoDB connection string (use MONGO_URI_BASE in production)",
    validate: (v) =>
      v.startsWith("mongodb://") ||
      v.startsWith("mongodb+srv://") ||
      "MONGO_URI must be a valid MongoDB connection string",
  },
  CENTRAL_DB_URI: {
    type: "string",
    required: true,
    secret: true,
    description: "Central MongoDB connection string",
    validate: (v) =>
      v.startsWith("mongodb://") ||
      v.startsWith("mongodb+srv://") ||
      "CENTRAL_DB_URI must be a valid MongoDB connection string",
  },
  MONGO_URI_BASE: {
    type: "string",
    required: false,
    secret: true,
    description: "Optional base URI for multi-tenant DB connections",
    validate: (v) =>
      v.startsWith("mongodb://") ||
      v.startsWith("mongodb+srv://") ||
      "MONGO_URI_BASE must be a valid MongoDB connection string",
  },
  DEFAULT_TENANT_ID: {
    type: "string",
    required: true,
    description: "Default tenant slug",
  },
  JWT_SECRET: {
    type: "string",
    required: true,
    secret: true,
    description: "JWT signing secret - must be at least 16 characters",
    validate: (v) =>
      v.length >= 16 || "JWT_SECRET must be at least 16 characters",
  },
  WOO_URL: {
    type: "url",
    required: false,
    description: "WooCommerce store base URL (stored per-tenant in DB for multi-tenant)",
  },
  WOO_CONSUMER_KEY: {
    type: "string",
    required: false,
    secret: true,
    description: "WooCommerce REST API consumer key (stored per-tenant in DB)",
  },
  WOO_CONSUMER_SECRET: {
    type: "string",
    required: false,
    secret: true,
    description: "WooCommerce REST API consumer secret (stored per-tenant in DB)",
  },
};

module.exports = { schema };
