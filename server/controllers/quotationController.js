const { getTenantModels } = require("../models/tenantModels");

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = async (req, res) => {
  try {
    const { Quotation } = getTenantModels(req.dbConnection);
    const { search, status, customer, startDate, endDate } = req.query;

    // Build filter object
    const filter = { status: { $ne: "deleted" } };

    // Search in quotation number or notes
    if (search) {
      filter.$or = [
        { quotationNumber: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status (in addition to not deleted)
    if (status && status !== "all") {
      filter.status = status;
    }

    // Filter by customer
    if (customer && customer !== "all") {
      filter.customer = customer;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.quotationDate = {};
      if (startDate) filter.quotationDate.$gte = new Date(startDate);
      if (endDate) filter.quotationDate.$lte = new Date(endDate);
    }

    const quotations = await Quotation.find(filter)
      .populate("customer", "firstName lastName email billing")
      .sort({ createdAt: -1 });
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
const getQuotationById = async (req, res) => {
  try {
    const { Quotation } = getTenantModels(req.dbConnection);
    const quotation = await Quotation.findById(req.params.id)
      .populate("customer")
      .populate("items.product");

    if (quotation) {
      res.json(quotation);
    } else {
      res.status(404).json({ message: "Quotation not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new quotation
// @route   POST /api/quotations
// @access  Private
const createQuotation = async (req, res) => {
  try {
    const { Quotation } = getTenantModels(req.dbConnection);
    const {
      customer,
      items,
      subtotal,
      tax,
      discount,
      deliveryCharge,
      deliveryNote,
      total,
      notes,
      terms,
      quotationDate,
      validUntil,
    } = req.body;

    const quotation = new Quotation({
      customer,
      items,
      subtotal,
      tax,
      discount,
      deliveryCharge,
      deliveryNote,
      total,
      notes,
      terms,
      quotationDate,
      validUntil,
    });

    const createdQuotation = await quotation.save();
    res.status(201).json(createdQuotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update quotation status
// @route   PUT /api/quotations/:id/status
// @access  Private
const updateQuotationStatus = async (req, res) => {
  try {
    const { Quotation } = getTenantModels(req.dbConnection);
    const { status } = req.body;
    const quotation = await Quotation.findById(req.params.id);

    if (quotation) {
      quotation.status = status;
      const updatedQuotation = await quotation.save();
      res.json(updatedQuotation);
    } else {
      res.status(404).json({ message: "Quotation not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
const updateQuotation = async (req, res) => {
  try {
    const { Quotation } = getTenantModels(req.dbConnection);
    const quotation = await Quotation.findById(req.params.id);

    if (quotation) {
      const updateData = req.body;

      // Update quotation fields
      Object.keys(updateData).forEach((key) => {
        quotation[key] = updateData[key];
      });

      const updatedQuotation = await quotation.save();
      res.json(updatedQuotation);
    } else {
      res.status(404).json({ message: "Quotation not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Delete quotation (soft delete)
// @route DELETE /api/quotations/:id
// @access Private
const deleteQuotation = async (req, res) => {
  try {
    const { Quotation } = getTenantModels(req.dbConnection);
    const quotation = await Quotation.findById(req.params.id);

    if (quotation) {
      quotation.status = "deleted";
      await quotation.save();
      res.json({ message: "Quotation deleted successfully" });
    } else {
      res.status(404).json({ message: "Quotation not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotationStatus,
  updateQuotation,
  deleteQuotation,
};
