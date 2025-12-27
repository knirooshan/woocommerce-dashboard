const { getTenantModels } = require("../models/tenantModels");

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
const getVendors = async (req, res) => {
  try {
    const { Vendor } = getTenantModels(req.dbConnection);
    const vendors = await Vendor.find({}).sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a vendor
// @route   POST /api/vendors
// @access  Private/Admin
const createVendor = async (req, res) => {
  try {
    const { Vendor } = getTenantModels(req.dbConnection);
    const { name, email, phone, address, contactPerson } = req.body;

    const vendor = new Vendor({
      name,
      email,
      phone,
      address,
      contactPerson,
    });

    const createdVendor = await vendor.save();
    res.status(201).json(createdVendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a vendor
// @route   PUT /api/vendors/:id
// @access  Private/Admin
const updateVendor = async (req, res) => {
  try {
    const { Vendor } = getTenantModels(req.dbConnection);
    const { name, email, phone, address, contactPerson } = req.body;

    const vendor = await Vendor.findById(req.params.id);

    if (vendor) {
      vendor.name = name || vendor.name;
      vendor.email = email || vendor.email;
      vendor.phone = phone || vendor.phone;
      vendor.address = address || vendor.address;
      vendor.contactPerson = contactPerson || vendor.contactPerson;

      const updatedVendor = await vendor.save();
      res.json(updatedVendor);
    } else {
      res.status(404).json({ message: "Vendor not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a vendor
// @route   DELETE /api/vendors/:id
// @access  Private/Admin
const deleteVendor = async (req, res) => {
  try {
    const { Vendor } = getTenantModels(req.dbConnection);
    const vendor = await Vendor.findById(req.params.id);

    if (vendor) {
      await vendor.deleteOne();
      res.json({ message: "Vendor removed" });
    } else {
      res.status(404).json({ message: "Vendor not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
};
