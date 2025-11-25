# WooCommerce Dashboard

This repository contains a self-hosted WooCommerce dashboard application — a lightweight POS / invoicing / reporting system built to work with WooCommerce stores and as a standalone small business dashboard.

This README explains the project, architecture, installation, deployment, and a feature-by-feature overview so you (or other contributors) can quickly understand how the system works and what each part does.

---

## Quick summary

- Project: WooCommerce Dashboard
- Stack: React (Vite) client + Node.js server (Express-like), MongoDB for storage. Hosted on an Ubuntu VPS in production.
- Repo layout (top-level):
  - `client/` — React + Vite front-end application.
  - `server/` — Node server, controllers, models, routes, services, and docs.
  - `server/docs/` — deployment and hosting documentation (including `AUTOMATED-DEPLOYMENT.md`).

See `server/docs/AUTOMATED-DEPLOYMENT.md` for recommended automated deploy setup (GitHub Actions → VPS).

---

## Features — detailed

The app provides a complete small-business dashboard. Each feature below includes a short explanation of what it does and where to look in the code.

- Authentication & Users
  - Login, logout, and user management. User model lives in `server/models/User.js` and routes/controllers in `server/controllers` and `server/routes/userRoutes.js`.
  - Roles: at least `admin` and regular users — admin-only pages (Users, Settings) appear for admin users.

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
  - Basic order handling and integration with WooCommerce (if configured). Server: `server/controllers/orderController.js` and `server/services/wooService.js`.

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

- Settings
  - App-level settings (store info, currency, tax settings) managed via `server/controllers/settingsController.js` and client `Settings` page.

- Email & Notifications
  - Server-side email service in `server/services/emailService.js` for sending invoices/quotations and other notifications.

- PDF generation
  - PDF service to create downloadable/printable invoices, quotations, delivery receipts. See `server/services/pdfService.js` and client PDF components: `InvoicePDF.jsx`, `QuotationPDF.jsx`, `DeliveryReceiptPDF.jsx`.

- Reports & Exports
  - Export reports / CSVs for bookkeeping (see `reportController.js`).

---

## Architecture & where code lives

- Client (SPA): `client/` — React with Vite. Main entry in `client/src/main.jsx` and routes/pages in `client/src/pages/`.
- Server: `server/` — Node application with controllers, models, routes and services. Typical files:
  - `server/index.js` — app entry.
  - `server/routes/` — express-style route files.
  - `server/controllers/` — request handlers for resources.
  - `server/models/` — Mongoose models.
  - `server/services/` — helper services (email, PDF, WooCommerce integration).
  - `server/middleware/` — authentication and logging middleware.

---

## Installation — local development

Prerequisites:
- Node.js (LTS, e.g. 18+)
- npm or yarn
- MongoDB (local or Atlas connection)

Clone the repo and install dependencies:

```bash
git clone https://github.com/<your-org>/woocommerce-dashboard.git
cd woocommerce-dashboard

# Server deps
cd server
npm install

# In a separate terminal: client deps
cd ../client
npm install
```

Create environment files. The project expects environment variables for DB, JWT and optionally SMTP. Create `server/.env` with at least:

```
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
# Optional SMTP vars used by email service
SMTP_HOST=... 
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

Also create client environment if needed (check `client/.env.example`), for example to set API base URL.

Running locally:

```bash
# From server/
npm run dev      # or `npm start` depending on package.json

# From client/
npm run dev      # runs Vite dev server (usually http://localhost:5173)
```

Open the client app (Vite) in the browser and ensure the server API endpoint is reachable.

---

## Deployment summary

See `server/docs/AUTOMATED-DEPLOYMENT.md` for a complete A→Z guide covering:
- Creating a `deploy` user on your Ubuntu VPS
- Generating an SSH key and storing it in GitHub Secrets
- A `deploy.sh` script example that pulls latest code, installs deps, builds the client and restarts the service
- A sample `systemd` unit and a GitHub Actions workflow to run the remote deploy script on push to `main`.

Short commands to deploy manually on VPS (example):

```bash
# as deploy user on VPS (after cloning into ~/woocommerce-dashboard)
cd ~/woocommerce-dashboard
git fetch origin main
git reset --hard origin/main
cd server
npm ci
cd ../client
npm ci
npm run build
# copy dist/ to server/public (or let nginx serve client)
cp -r dist/* ../server/public/
sudo systemctl restart woocommerce-dashboard.service
```

---

## Environment variables (common)

Use the example above; these are common keys — check `server` code and `server/.env.example` (if present) for exact names.

- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret for authentication
- `PORT` — server port
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — email sending credentials
- Any other app-specific keys should be in `server/.env` and not committed to Git.

---

## Backups, rollback & monitoring

- Backup your MongoDB regularly — use `mongodump` or managed snapshots in Atlas.
- The deploy script in `server/docs/AUTOMATED-DEPLOYMENT.md` writes a log. Keep logs in a persistent location if needed.
- Rollback: on the VPS `git reset --hard <previous-commit>` and restart service. Use tags/releases for safer rollbacks.
- Add a simple health-check endpoint (e.g. `/health`) to allow uptime checks.

---

## Troubleshooting

- If Actions cannot SSH: check public key in `/home/deploy/.ssh/authorized_keys`, check `KNOWN_HOSTS` entry or allow interactive host verification then update secret.
- If service fails to start: `sudo journalctl -u woocommerce-dashboard.service -n 200` and `sudo systemctl status woocommerce-dashboard.service`.
- If client doesn’t load after build: verify `client/dist` was copied to the server directory served by the Node server or nginx.

---

## Contributing

Contributions are welcome. Common tasks:
- Bug fixes and tests
- Improve documentation
- Add features or improve UI components in `client/src/components`

Please open an issue describing the feature or bug before sending a big pull request.

---

## Security notes

- Never commit secrets or `.env` files to git. Use GitHub Secrets for CI/CD.
- Restrict SSH access on your VPS (use keys, `ufw`, and optionally `fail2ban`).

---

If you want, I can also:
- Add a short `CONTRIBUTING.md` with contribution guidelines and branching rules.
- Create a `server/.env.example` based on the variables used in server code (I can scan the repo and list all env keys).

If you want me to create either of the above, say which one and I'll add it.
