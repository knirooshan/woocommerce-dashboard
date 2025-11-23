const Customer = require("../models/Customer");
const { getWooCustomers } = require("../services/wooService");

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({});
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const { salutation, email, firstName, lastName, billing, shipping } =
      req.body;

    // Check if customer with email already exists
    const customerExists = await Customer.findOne({ email });

    if (customerExists) {
      return res
        .status(400)
        .json({ message: "Customer with this email already exists" });
    }

    const customer = await Customer.create({
      salutation,
      email,
      firstName,
      lastName,
      billing,
      shipping,
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sync customers from WooCommerce
// @route   POST /api/customers/sync
// @access  Private/Admin
const syncCustomers = async (req, res) => {
  try {
    const wooCustomers = await getWooCustomers(1, 100);

    const syncedCustomers = [];

    for (const c of wooCustomers) {
      const customerData = {
        wooId: c.id,
        email: c.email,
        firstName: c.first_name,
        lastName: c.last_name,
        role: c.role,
        username: c.username,
        billing: c.billing,
        shipping: c.shipping,
        avatar_url: c.avatar_url,
      };

      const customer = await Customer.findOneAndUpdate(
        { wooId: c.id },
        customerData,
        { new: true, upsert: true }
      );
      syncedCustomers.push(customer);
    }

    res.json({
      message: `Synced ${syncedCustomers.length} customers`,
      customers: syncedCustomers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  syncCustomers,
};
