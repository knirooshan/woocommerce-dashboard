const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

let api;

const initWooCommerce = () => {
  if (
    !process.env.WOO_URL ||
    !process.env.WOO_CONSUMER_KEY ||
    !process.env.WOO_CONSUMER_SECRET
  ) {
    console.warn("WooCommerce credentials missing in .env");
    return null;
  }

  if (!api) {
    api = new WooCommerceRestApi({
      url: process.env.WOO_URL,
      consumerKey: process.env.WOO_CONSUMER_KEY,
      consumerSecret: process.env.WOO_CONSUMER_SECRET,
      version: "wc/v3",
    });
  }
  return api;
};

const getWooProducts = async (page = 1, perPage = 20) => {
  const woo = initWooCommerce();
  if (!woo) throw new Error("WooCommerce not configured");

  const response = await woo.get("products", {
    page,
    per_page: perPage,
  });
  return response.data;
};

const getWooCustomers = async (page = 1, perPage = 20) => {
  const woo = initWooCommerce();
  if (!woo) throw new Error("WooCommerce not configured");

  const response = await woo.get("customers", {
    page,
    per_page: perPage,
  });
  return response.data;
};

module.exports = { getWooProducts, getWooCustomers };
