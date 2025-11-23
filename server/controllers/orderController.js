const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");
const { getWooOrders } = require("../services/wooService");

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer")
      .sort({ dateCreated: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sync orders from WooCommerce
// @route   POST /api/orders/sync
// @access  Private/Admin
const syncOrders = async (req, res) => {
  try {
    // Fetch orders from WooCommerce (first 100 for now)
    const wooOrders = await getWooOrders(1, 100);

    const syncedOrders = [];

    for (const order of wooOrders) {
      // Try to find matching customer by email, or create if doesn't exist
      let customer = null;
      if (order.billing && order.billing.email) {
        customer = await Customer.findOne({ email: order.billing.email });

        // If customer doesn't exist, create one
        if (!customer) {
          customer = await Customer.create({
            firstName: order.billing.first_name || "",
            lastName: order.billing.last_name || "",
            email: order.billing.email,
            billing: {
              first_name: order.billing.first_name || "",
              last_name: order.billing.last_name || "",
              company: order.billing.company || "",
              address_1: order.billing.address_1 || "",
              address_2: order.billing.address_2 || "",
              city: order.billing.city || "",
              state: order.billing.state || "",
              postcode: order.billing.postcode || "",
              country: order.billing.country || "",
              email: order.billing.email || "",
              phone: order.billing.phone || "",
            },
            shipping: {
              first_name: order.shipping?.first_name || "",
              last_name: order.shipping?.last_name || "",
              company: order.shipping?.company || "",
              address_1: order.shipping?.address_1 || "",
              address_2: order.shipping?.address_2 || "",
              city: order.shipping?.city || "",
              state: order.shipping?.state || "",
              postcode: order.shipping?.postcode || "",
              country: order.shipping?.country || "",
            },
          });
        }
      }

      const orderData = {
        wooOrderId: order.id,
        orderNumber: order.number || `#${order.id}`,
        customer: customer ? customer._id : null,
        customerInfo: {
          firstName: order.billing?.first_name || "",
          lastName: order.billing?.last_name || "",
          email: order.billing?.email || "",
          phone: order.billing?.phone || "",
        },
        items: order.line_items.map((item) => ({
          productId: item.product_id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.total),
        })),
        subtotal: parseFloat(order.total) - parseFloat(order.total_tax || 0),
        tax: parseFloat(order.total_tax || 0),
        shippingTotal: parseFloat(order.shipping_total || 0),
        discount: parseFloat(order.discount_total || 0),
        total: parseFloat(order.total),
        status: order.status,
        paymentMethod: order.payment_method,
        paymentMethodTitle: order.payment_method_title,
        shippingAddress: {
          firstName: order.shipping?.first_name || "",
          lastName: order.shipping?.last_name || "",
          company: order.shipping?.company || "",
          address1: order.shipping?.address_1 || "",
          address2: order.shipping?.address_2 || "",
          city: order.shipping?.city || "",
          state: order.shipping?.state || "",
          postcode: order.shipping?.postcode || "",
          country: order.shipping?.country || "",
        },
        billingAddress: {
          firstName: order.billing?.first_name || "",
          lastName: order.billing?.last_name || "",
          company: order.billing?.company || "",
          address1: order.billing?.address_1 || "",
          address2: order.billing?.address_2 || "",
          city: order.billing?.city || "",
          state: order.billing?.state || "",
          postcode: order.billing?.postcode || "",
          country: order.billing?.country || "",
          email: order.billing?.email || "",
          phone: order.billing?.phone || "",
        },
        dateCreated: order.date_created
          ? new Date(order.date_created)
          : new Date(),
        datePaid: order.date_paid ? new Date(order.date_paid) : null,
        dateCompleted: order.date_completed
          ? new Date(order.date_completed)
          : null,
        currency: order.currency || "USD",
        notes: order.customer_note || "",
      };

      const savedOrder = await Order.findOneAndUpdate(
        { wooOrderId: order.id },
        orderData,
        { new: true, upsert: true }
      );

      // Create or update corresponding invoice
      const invoiceData = {
        customer: customer ? customer._id : null,
        customerInfo: {
          firstName: order.billing?.first_name || "",
          lastName: order.billing?.last_name || "",
          email: order.billing?.email || "",
          phone: order.billing?.phone || "",
        },
        items: order.line_items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.total),
        })),
        subtotal: parseFloat(order.total) - parseFloat(order.total_tax || 0),
        tax: parseFloat(order.total_tax || 0),
        discount: parseFloat(order.discount_total || 0),
        total: parseFloat(order.total),
        status:
          order.status === "completed" || order.status === "processing"
            ? "paid"
            : "pending",
        paymentMethod:
          order.payment_method_title || order.payment_method || "WooCommerce",
        dueDate: order.date_paid ? new Date(order.date_paid) : null,
        notes: `WooCommerce Order #${order.number || order.id}${
          order.customer_note ? "\n" + order.customer_note : ""
        }`,
      };

      // Check if invoice already exists for this order
      let invoice;
      if (savedOrder.invoice) {
        // Update existing invoice
        invoice = await Invoice.findByIdAndUpdate(
          savedOrder.invoice,
          invoiceData,
          { new: true }
        );
      } else {
        // Create new invoice
        invoice = await Invoice.create(invoiceData);
        // Link invoice to order
        savedOrder.invoice = invoice._id;
        await savedOrder.save();
      }

      syncedOrders.push(savedOrder);

      // Create Payment record if order is paid and doesn't have one (simplified check)
      // In a real scenario, we'd check if a payment for this order already exists to avoid duplicates
      // For now, we'll assume if it's being synced and is 'completed' or 'processing', we record it.
      // Better approach: Check if Payment exists for this order.

      if (order.status === "completed" || order.status === "processing") {
        const Payment = require("../models/Payment");
        const existingPayment = await Payment.findOne({
          order: savedOrder._id,
        });

        if (!existingPayment) {
          const mapWooPaymentMethod = (title) => {
            if (!title) return "WooCommerce";
            const lower = title.toLowerCase();
            if (lower.includes("bank transfer") || lower.includes("bacs"))
              return "Bank Transfer";
            if (lower.includes("check") || lower.includes("cheque"))
              return "Check";
            if (lower.includes("cash")) return "Cash";
            if (
              lower.includes("card") ||
              lower.includes("stripe") ||
              lower.includes("credit")
            )
              return "Card";
            return "Other";
          };

          await Payment.create({
            amount: parseFloat(order.total),
            date: order.date_paid ? new Date(order.date_paid) : new Date(),
            method: mapWooPaymentMethod(order.payment_method_title),
            reference: order.transaction_id || `WOO-${order.id}`,
            source: "WooCommerce",
            order: savedOrder._id,
            invoice: invoice._id, // Link to the invoice we just created/updated
            customer: customer ? customer._id : null,
            notes: `Auto-created from WooCommerce Order #${
              order.number || order.id
            }. Method: ${order.payment_method_title || "Unknown"}`,
          });

          // Update invoice status/paid amount since we just added a payment
          invoice.amountPaid = parseFloat(order.total);
          invoice.status = "paid";
          await invoice.save();
        }
      }
    }

    res.json({
      message: `Synced ${syncedOrders.length} orders and created/updated invoices`,
      orders: syncedOrders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("customer");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrders,
  syncOrders,
  getOrderById,
};
