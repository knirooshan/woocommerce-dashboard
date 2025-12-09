// API Configuration
// API Configuration
const getBaseUrl = () => {
  // If running in browser
  if (typeof window !== "undefined") {
    // Development: Vite default port is 5173, Backend is 5000
    if (window.location.port === "5173") {
      return `${window.location.protocol}//${window.location.hostname}:5000/api`;
    }
    // Production: Backend is served via Nginx proxy at /api on the same domain
    return "/api";
  }
  // Fallback for non-browser envs
  return "http://localhost:5000/api";
};

export const API_URL = getBaseUrl();

// API Endpoints
export const ENDPOINTS = {
  // Tenants
  TENANTS: `${API_URL}/tenants`,
  TENANT_BY_ID: (id) => `${API_URL}/tenants/${id}`,
  TENANT_PASSKEY: (id) => `${API_URL}/tenants/${id}/passkey`,
  TENANT_RESEND_WELCOME: (id) => `${API_URL}/tenants/${id}/resend-welcome`,

  // Auth
  AUTH_LOGIN: `${API_URL}/auth/login`,
  AUTH_LOGOUT: `${API_URL}/auth/logout`,
  AUTH_REGISTER: `${API_URL}/auth/register`,

  // First Run / Setup
  FIRST_RUN_CHECK: `${API_URL}/first-run/check`,
  FIRST_RUN_SETUP: `${API_URL}/first-run/setup`,
  SETUP_VALIDATE: `${API_URL}/setup/validate`,
  SETUP_COMPLETE: `${API_URL}/setup/complete`,

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
  ADMIN_SETTINGS: `${API_URL}/admin/settings`,

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

  //Activity Log
  ACTIVITY_LOGS: `${API_URL}/activity-logs`,

  //media
  MEDIA_UPLOAD: `${API_URL}/media/upload`,
  MEDIA: `${API_URL}/media`,
  MEDIA_BY_ID: (id) => `${API_URL}/media/${id}`,
};

export default API_URL;
