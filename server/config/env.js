const path = require("path");
const { schema } = require("../env-compose.config");

async function loadConfig() {
  const { defineConfig, source } = await import("compose-env");

  const config = await defineConfig(schema, {
    sources: [
      source.envFile(path.resolve(__dirname, "../.env")),
      source.env(),
    ],
  });

  // Populate process.env so all existing modules continue to work
  const raw = config.toUnsafeObject();
  Object.assign(process.env, raw);

  return config;
}

module.exports = loadConfig();
