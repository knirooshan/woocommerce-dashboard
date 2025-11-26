require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { contextMiddleware } = require("./utils/requestContext");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(contextMiddleware);

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
app.use("/api/media", require("./routes/mediaRoutes"));

// Serve static files from uploads directory
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("WooCommerce Dashboard API is running");
});

const { initQueueProcessor } = require("./services/emailQueueService");

const PORT = process.env.PORT || 5000;

// Start email queue processor
initQueueProcessor();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
