require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectCentralDB } = require("./services/connectionManager");
const tenantMiddleware = require("./middleware/tenantMiddleware");
const { contextMiddleware } = require("./utils/requestContext");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(contextMiddleware);
app.use(tenantMiddleware);

// Database Connection
connectCentralDB();

// Routes
app.use("/api/first-run", require("./routes/firstRunRoutes"));
app.use("/api/setup", require("./routes/setupRoutes"));
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
app.use("/api/tenants", require("./routes/tenantRoutes"));
app.use("/api/admin/settings", require("./routes/adminSettingsRoutes"));
app.use("/api/media", require("./routes/mediaRoutes"));

// Serve static files from uploads directory
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("WooCommerce Dashboard API is running");
});

const { initQueueProcessor } = require("./services/emailQueueProcessor");

const PORT = process.env.PORT || 5000;

// Start email queue processor
initQueueProcessor();

app.listen(PORT, () => {});
