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
            phone: order.billing.phone || "",
            address: order.billing.address_1 || "",
            city: order.billing.city || "",
            state: order.billing.state || "",
            zipCode: order.billing.postcode || "",
            country: order.billing.country || "",
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
