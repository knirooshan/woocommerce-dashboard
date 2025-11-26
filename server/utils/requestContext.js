const { AsyncLocalStorage } = require("async_hooks");

const asyncLocalStorage = new AsyncLocalStorage();

const contextMiddleware = (req, res, next) => {
  const store = new Map();
  asyncLocalStorage.run(store, () => {
    // Store initial context if available
    if (req.user) {
      store.set("user", req.user);
    }
    store.set("ip", req.ip);
    store.set("userAgent", req.headers["user-agent"]);
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
