// API Configuration
export const API_URL = "http://localhost:5000/api";

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `${API_URL}/auth/login`,
  AUTH_LOGOUT: `${API_URL}/auth/logout`,
  AUTH_REGISTER: `${API_URL}/auth/register`,

  // First Run
  FIRST_RUN_CHECK: `${API_URL}/first-run/check`,
  FIRST_RUN_SETUP: `${API_URL}/first-run/setup`,

  // Users
  USERS: `${API_URL}/users`,
  USER_BY_ID: (id) => `${API_URL}/users/${id}`,

  // Dashboard
  DASHBOARD_STATS: `${API_URL}/dashboard/stats`,
  DASHBOARD_CHART: `${API_URL}/dashboard/chart`,
  DASHBOARD_ACTIVITIES: `${API_URL}/dashboard/activities`,

  // Products
  PRODUCTS: `${API_URL}/products`,
  PRODUCT_BY_ID: (id) => `${API_URL}/products/${id}`,
  PRODUCTS_SYNC: `${API_URL}/products/sync`,

  // Customers
  CUSTOMERS: `${API_URL}/customers`,
  CUSTOMER_BY_ID: (id) => `${API_URL}/customers/${id}`,

  // Invoices
  INVOICES: `${API_URL}/invoices`,
  INVOICE_BY_ID: (id) => `${API_URL}/invoices/${id}`,

  // Quotations
  QUOTATIONS: `${API_URL}/quotations`,
  QUOTATION_BY_ID: (id) => `${API_URL}/quotations/${id}`,

  // Orders
  ORDERS: `${API_URL}/orders`,
  ORDERS_SYNC: `${API_URL}/orders/sync`,

  // Expenses
  EXPENSES: `${API_URL}/expenses`,
  EXPENSE_BY_ID: (id) => `${API_URL}/expenses/${id}`,

  // Payments
  PAYMENTS: `${API_URL}/payments`,
  PAYMENT_BY_ID: (id) => `${API_URL}/payments/${id}`,

  // Vendors
  VENDORS: `${API_URL}/vendors`,
  VENDOR_BY_ID: (id) => `${API_URL}/vendors/${id}`,

  // Settings
  SETTINGS: `${API_URL}/settings`,

  // Reports
  REPORTS: `${API_URL}/reports`,
  REPORTS_DASHBOARD: `${API_URL}/reports/dashboard`,
  REPORTS_SALES: `${API_URL}/reports/sales`,

  // Images
  IMAGES_TO_BASE64: `${API_URL}/images/to-base64`,

  // Email
  EMAIL_SEND: `${API_URL}/email/send`,
  EMAIL_SEND_INVOICE: (id) => `${API_URL}/email/send-invoice/${id}`,
  EMAIL_SEND_QUOTATION: (id) => `${API_URL}/email/send-quotation/${id}`,
  
  // Invoice specific
  INVOICE_WRITE_OFF: (id) => `${API_URL}/invoices/${id}/write-off`,
};

export default API_URL;
