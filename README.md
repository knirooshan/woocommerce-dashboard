# Merchpilot

This repository contains a cloud-based multi-tenant Merchpilot application - a lightweight POS / invoicing / reporting system built to work with WooCommerce and Medusa stores, and as a cloud-based small business dashboard.

This README provides a feature-by-feature overview and architecture summary so you can quickly understand how the system works and what each part does.

---

## Quick summary

- Project: Merchpilot
- Stack: React (Vite) client + Node.js server (Express-like), MongoDB for storage.
- Repo layout (top-level):
  - `client/` - React + Vite front-end application.
  - `server/` - Node server, controllers, models, routes, services, and docs.

---

## Features - detailed

The app provides a complete small-business dashboard. Each feature below includes a short explanation of what it does and where to look in the code.

- Authentication & Users

  - Login, logout, and user management. User model lives in `server/models/User.js` and routes/controllers in `server/controllers` and `server/routes/userRoutes.js`.
  - Roles: at least `admin` and regular users - admin-only pages (Users, Settings) appear for admin users.

- Dashboard / Stats

  - High-level metrics and charts on the landing dashboard page (sales totals, recent orders, quick stats). Frontend components under `client/src/components` like `SalesChart.jsx` and `StatsCard.jsx`.

- Point-of-Sale (POS)

  - POS grid and cart experience for in-person sales. Files: `client/src/components/POSProductGrid.jsx`, `POSCart.jsx` and POS page under `client/src/pages/pos` (or `pages/POS.jsx`).

- Products

  - Product CRUD operations, including images/media. Server controller: `server/controllers/productController.js`. Client forms: `ProductForm.jsx` and product pages.

- Customers

  - Customer management (CRUD) with quick search and import/exports. Server: `server/controllers/customerController.js`. Client: `CustomerForm.jsx`, pages under `client/src/pages/Customers.jsx`.

- Vendors

  - Vendor CRUD and management (for purchase/expense tracking). Server: `server/controllers/vendorController.js` and `client/src/components/VendorForm.jsx`.

- Quotations & Invoices

  - Create, send, and manage quotations and invoices. PDF generation for printable documents uses server-side PDF service (`server/services/pdfService.js`) and related controllers (`quotationController.js`, `invoiceController.js`). Client pages include `CreateQuotation.jsx`, `CreateInvoice.jsx` and PDF components in `client/src/components/*PDF.jsx`.

- Orders

  - Basic order handling and integration with external platforms (WooCommerce and Medusa) if configured. Server: `server/controllers/orderController.js`, `server/services/wooService.js` and `server/services/medusaService.js`.

- Deliveries

  - Track and manage deliveries associated with orders. Server: `server/controllers/deliveryController.js`. Client: `DeliveryTracking.jsx` and `DeliveryReceiptPDF.jsx`.

- Multi-Tenancy (Tenants)

  - Support for multiple tenants using a central database for tenant resolution. Server: `server/controllers/tenantController.js` and `server/models/central/Tenant.js`. Client: `Tenants.jsx`.

- Payments

  - Record payments against invoices/orders and mark statuses. Server: `server/controllers/paymentController.js` and `client/src/components/PaymentModal.jsx`.

- Expenses

  - Track business expenses and link to vendors. Server: `server/controllers/expenseController.js` and client expense UI.

- Media Library

  - Upload and manage product/media images and files. Server: `server/controllers/mediaController.js` and `server/uploads/` for stored files; client: `MediaLibraryModal.jsx`, `MediaUpload.jsx`, `MediaGrid.jsx`.

- Activity Log / Audit Trail

  - Record important actions (create/update/delete) for accountability. Server: `activityLogController.js` and model `ActivityLog.js`. Client page: `ActivityLog.jsx`.

- Reporting

  - Sales and expense reports with date filters and aggregates. Server: `server/controllers/reportController.js` and client reports UI.

- Settings & Setup

  - App-level settings (store info, currency, tax settings) managed via `server/controllers/settingsController.js` and client `Settings` page. Also includes a first-time setup wizard (`SetupPage.jsx`, `FirstTimeSetup.jsx`) and admin settings (`adminSettingsController.js`).

- Email & Notifications

  - Server-side email service in `server/services/emailService.js` for sending invoices/quotations and other notifications.

- PDF generation

  - PDF service to create downloadable/printable invoices, quotations, delivery receipts. See `server/services/pdfService.js` and client PDF components: `InvoicePDF.jsx`, `QuotationPDF.jsx`, `DeliveryReceiptPDF.jsx`.

- Reports & Exports
  - Export reports / CSVs for bookkeeping (see `reportController.js`).

---

## Architecture & where code lives

- Client (SPA): `client/` - React with Vite. Main entry in `client/src/main.jsx` and routes/pages in `client/src/pages/`.
- Server: `server/` - Node application with controllers, models, routes and services. Typical files:
  - `server/index.js` - app entry.
  - `server/routes/` - express-style route files.
  - `server/controllers/` - request handlers for resources.
  - `server/models/` - Mongoose models.
  - `server/services/` - helper services (email, PDF, WooCommerce and Medusa integrations).
  - `server/middleware/` - authentication and logging middleware.
