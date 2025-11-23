const Quotation = require("../models/Quotation");

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find({ status: { $ne: "deleted" } })
      .populate("customer", "firstName lastName email")
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
    const {
      customer,
      items,
      subtotal,
      tax,
      discount,
      total,
      notes,
      quotationDate,
      validUntil,
    } = req.body;

    const quotation = new Quotation({
      customer,
      items,
      subtotal,
      tax,
      discount,
      total,
      notes,
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
