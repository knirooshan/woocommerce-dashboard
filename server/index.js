require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Activity Logger (should be after body parser and before routes)
// We need to ensure auth middleware runs first if we want user info, but auth is usually per-route.
// To capture user info globally, we might need a global auth check that doesn't fail but populates req.user if token exists.
// For now, let's place it here. If auth middleware is per-route, req.user won't be populated here for the log creation time unless we attach it later.
// However, our activityLogger logs on 'finish', so by then req.user should be populated if the route was protected.
app.use(require("./middleware/activityLogger"));

// Database Connection
connectDB();

// Routes
app.use("/api/first-run", require("./routes/firstRunRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/quotations", require("./routes/quotationRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/email", require("./routes/emailRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/images", require("./routes/imageRoutes"));
app.use("/api/pdf", require("./routes/pdfRoutes"));
app.use("/api/vendors", require("./routes/vendorRoutes"));
app.use("/api/activity-logs", require("./routes/activityLogRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

app.get("/", (req, res) => {
  res.send("WooCommerce Dashboard API is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
