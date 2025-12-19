const { getTenantModels } = require("../models/tenantModels");

// @desc    Get store settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    const { Settings } = getTenantModels(req.dbConnection);
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update store settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    const { Settings } = getTenantModels(req.dbConnection);
    const settings = await Settings.findOne();

    if (settings) {
      settings.storeName = req.body.storeName || settings.storeName;
      settings.website = req.body.website || settings.website;
      settings.address = req.body.address || settings.address;
      settings.contact = req.body.contact || settings.contact;
      settings.logo = req.body.logo || settings.logo;
      settings.smtp = req.body.smtp || settings.smtp;
      settings.bank = req.body.bank || settings.bank;
      settings.currency = req.body.currency || settings.currency;
      settings.tax = req.body.tax || settings.tax;
      settings.terms = req.body.terms || settings.terms;
      settings.wooCommerce = req.body.wooCommerce || settings.wooCommerce;
      // support updating modules toggles
      if (req.body.modules) {
        settings.modules = {
          ...settings.modules,
          ...req.body.modules,
        };
      }

      const updatedSettings = await settings.save();
      res.json(updatedSettings);
    } else {
      // Should not happen if getSettings is called first, but handle anyway
      const newSettings = await Settings.create(req.body);
      res.json(newSettings);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
