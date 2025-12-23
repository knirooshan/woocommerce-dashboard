const { AsyncLocalStorage } = require("async_hooks");

const asyncLocalStorage = new AsyncLocalStorage();

const contextMiddleware = (req, res, next) => {
  const store = new Map();
  asyncLocalStorage.run(store, () => {
    // Extract IP address with proper handling for localhost and proxies
    let ip =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket?.remoteAddress ||
      req.ip;

    // Convert IPv6 localhost to IPv4 for readability
    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
      ip = "127.0.0.1";
    }

    // Handle x-forwarded-for with multiple IPs (take the first one)
    if (ip && typeof ip === "string" && ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    // Remove IPv6 prefix if present
    if (ip && typeof ip === "string" && ip.startsWith("::ffff:")) {
      ip = ip.substring(7);
    }

    // Store initial context if available
    if (req.user) {
      store.set("user", req.user);
    }
    store.set("ip", ip);
    store.set("userAgent", req.headers["user-agent"]);
    store.set("method", req.method);
    store.set("url", req.originalUrl);
    next();
  });
};

const getContext = (key) => {
  const store = asyncLocalStorage.getStore();
  return store ? store.get(key) : undefined;
};

const setContext = (key, value) => {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.set(key, value);
  }
};

module.exports = {
  contextMiddleware,
  getContext,
  setContext,
};
