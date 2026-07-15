const { getTenantModels } = require("../models/tenantModels");

// @desc Update or create delivery status and tracking
// @route PUT /api/deliveries/invoice/:invoiceId
// @access Private
const updateDelivery = async (req, res) => {
  try {
    const { Delivery, Invoice } = getTenantModels(req.dbConnection);
    const invoiceId = req.params.invoiceId;

    // Verify invoice exists
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    let delivery = await Delivery.findOne({ invoice: invoiceId });

    const { status, trackingNumbers, note, updatedBy } = req.body;

    if (!delivery) {
      delivery = new Delivery({
        invoice: invoiceId,
        status: status || "pending",
        trackingNumbers: trackingNumbers || [],
        lifecycle: [],
      });
    } else {
      if (status) delivery.status = status;
      if (trackingNumbers !== undefined) delivery.trackingNumbers = trackingNumbers;
    }

    // Add to lifecycle
    delivery.lifecycle.push({
      status: status || delivery.status,
      note: note || "",
      updatedBy: updatedBy || "System",
      timestamp: new Date(),
    });

    const savedDelivery = await delivery.save();
    res.json(savedDelivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Get active delivery queue
// @route GET /api/deliveries/queue
// @access Private
const getDeliveryQueue = async (req, res) => {
  try {
    const { Delivery, Invoice } = getTenantModels(req.dbConnection);

    // Find active deliveries
    const deliveries = await Delivery.find({
      status: { $in: ["pending", "preparing", "dispatched"] },
    }).populate({
      path: "invoice",
      match: { status: { $nin: ["deleted", "cancelled", "written-off"] } },
      populate: { path: "customer", select: "firstName lastName email phone company" }
    });

    // Filter out deliveries where invoice is null (due to match condition)
    const validDeliveries = deliveries.filter(d => d.invoice != null);

    // Sort by invoice date (oldest first for queue management)
    validDeliveries.sort((a, b) => new Date(a.invoice.invoiceDate) - new Date(b.invoice.invoiceDate));

    res.json(validDeliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Search delivery by invoice number
// @route GET /api/deliveries/search/:invoiceNumber
// @access Private
const searchDeliveryByInvoice = async (req, res) => {
  try {
    const { Delivery, Invoice } = getTenantModels(req.dbConnection);
    const invoiceNumber = req.params.invoiceNumber;

    const invoice = await Invoice.findOne({ invoiceNumber })
      .populate("customer", "firstName lastName email phone company");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const delivery = await Delivery.findOne({ invoice: invoice._id }).populate({
      path: "invoice",
      populate: { path: "customer", select: "firstName lastName email phone company" }
    });

    if (delivery) {
      res.json(delivery);
    } else {
      // Return a mocked pending delivery if none exists yet
      res.json({
        invoice: invoice,
        status: "pending",
        trackingNumbers: [],
        lifecycle: []
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateDelivery,
  getDeliveryQueue,
  searchDeliveryByInvoice,
};
