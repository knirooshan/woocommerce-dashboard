# WooCommerce Dashboard & POS System

A comprehensive dashboard and Point of Sale system that integrates with WooCommerce.

## Features

- **Authentication**: Secure JWT-based admin login
- **Product Management**: One-way sync from WooCommerce
- **Sales & POS**:
  - Quotation generation (PDF)
  - Invoice generation (PDF)
  - Delivery receipt generation (PDF)
  - Point of Sale interface
- **Operations**:
  - Expense tracking
  - Email service (send invoices via email)
- **Reporting**:
  - Sales vs expenses visualization
  - Net profit calculation

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB (Atlas)
- **PDF Generation**: @react-pdf/renderer
- **Charts**: Recharts

## Installation

### Server Setup

1. Navigate to server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables in `.env`:

```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
WOO_CONSUMER_KEY=your_woocommerce_consumer_key
WOO_CONSUMER_SECRET=your_woocommerce_consumer_secret
WOO_URL=https://your-woocommerce-site.com
```

4. Start the server:

```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Client Setup

1. Navigate to client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The client will run on `http://localhost:5173`

## Usage

1. **First Time Setup**:

   - Register an admin account at `/login`
   - Configure store settings at `/settings`
   - Add WooCommerce API credentials
   - Sync products and customers

2. **POS Usage**:

   - Navigate to `/pos`
   - Select customer
   - Add products to cart
   - Process checkout (creates invoice automatically)

3. **Generate Documents**:
   - Create quotations at `/quotations/create`
   - Create invoices at `/invoices/create`
   - Download PDFs from detail pages
   - Send invoices via email

## Deployment

This application is ready for deployment on cPanel with MongoDB Atlas as the database.

## License

ISC
