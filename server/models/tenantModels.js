const ActivityLogSchema = require("./ActivityLog");
const CustomerSchema = require("./Customer");
const EmailJobSchema = require("./EmailJob");
const ExpenseSchema = require("./Expense");
const InvoiceSchema = require("./Invoice");
const MediaSchema = require("./Media");
const OrderSchema = require("./Order");
const PaymentSchema = require("./Payment");
const ProductSchema = require("./Product");
const QuotationSchema = require("./Quotation");
const SettingsSchema = require("./Settings");
const UserSchema = require("./User");
const VendorSchema = require("./Vendor");
const auditPlugin = require("./plugins/auditPlugin");

// Apply audit plugin to all schemas except ActivityLog
[
  CustomerSchema,
  EmailJobSchema,
  ExpenseSchema,
  InvoiceSchema,
  MediaSchema,
  OrderSchema,
  PaymentSchema,
  ProductSchema,
  QuotationSchema,
  SettingsSchema,
  UserSchema,
  VendorSchema,
].forEach((schema) => {
  schema.plugin(auditPlugin);
});

const getTenantModels = (connection) => {
  if (!connection) return null;

  return {
    ActivityLog:
      connection.models.ActivityLog ||
      connection.model("ActivityLog", ActivityLogSchema),
    Customer:
      connection.models.Customer ||
      connection.model("Customer", CustomerSchema),
    EmailJob:
      connection.models.EmailJob ||
      connection.model("EmailJob", EmailJobSchema),
    Expense:
      connection.models.Expense || connection.model("Expense", ExpenseSchema),
    Invoice:
      connection.models.Invoice || connection.model("Invoice", InvoiceSchema),
    Media: connection.models.Media || connection.model("Media", MediaSchema),
    Order: connection.models.Order || connection.model("Order", OrderSchema),
    Payment:
      connection.models.Payment || connection.model("Payment", PaymentSchema),
    Product:
      connection.models.Product || connection.model("Product", ProductSchema),
    Quotation:
      connection.models.Quotation ||
      connection.model("Quotation", QuotationSchema),
    Settings:
      connection.models.Settings ||
      connection.model("Settings", SettingsSchema),
    User: connection.models.User || connection.model("User", UserSchema),
    Vendor:
      connection.models.Vendor || connection.model("Vendor", VendorSchema),
  };
};

module.exports = { getTenantModels };
