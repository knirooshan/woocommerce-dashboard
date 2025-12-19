const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const initWooCommerce = (settings) => {
  if (
    !settings ||
    !settings.wooCommerce ||
    !settings.wooCommerce.url ||
    !settings.wooCommerce.consumerKey ||
    !settings.wooCommerce.consumerSecret
  ) {
    console.warn("WooCommerce credentials missing in settings");
    return null;
  }

  return new WooCommerceRestApi({
    url: settings.wooCommerce.url,
    consumerKey: settings.wooCommerce.consumerKey,
    consumerSecret: settings.wooCommerce.consumerSecret,
    version: "wc/v3",
  });
};

const getWooProducts = async (settings, page = 1, perPage = 20) => {
  const woo = initWooCommerce(settings);
  if (!woo) throw new Error("WooCommerce not configured");

  const response = await woo.get("products", {
    page,
    per_page: perPage,
  });
  return response.data;
};

const getWooCustomers = async (settings, page = 1, perPage = 20) => {
  const woo = initWooCommerce(settings);
  if (!woo) throw new Error("WooCommerce not configured");

  const response = await woo.get("customers", {
    page,
    per_page: perPage,
  });
  return response.data;
};

const getWooOrders = async (settings, page = 1, perPage = 20) => {
  const woo = initWooCommerce(settings);
  if (!woo) throw new Error("WooCommerce not configured");

  const response = await woo.get("orders", {
    page,
    per_page: perPage,
  });
  return response.data;
};

module.exports = { getWooProducts, getWooCustomers, getWooOrders };
