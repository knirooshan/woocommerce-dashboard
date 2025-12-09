const { getCentralConnection } = require("../services/connectionManager");
const SystemSettingsSchema = require("../models/central/SystemSettings");

const getSystemSettingsModel = () => {
  const conn = getCentralConnection();
  // Register or retrieve model
  return (
    conn.models.SystemSettings ||
    conn.model("SystemSettings", SystemSettingsSchema)
  );
};

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Super Admin
const getSystemSettings = async (req, res) => {
  try {
    const SystemSettings = getSystemSettingsModel();
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({});
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Super Admin
const updateSystemSettings = async (req, res) => {
  try {
    const SystemSettings = getSystemSettingsModel();
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = new SystemSettings();
    }

    if (req.body.smtp) settings.smtp = { ...settings.smtp, ...req.body.smtp };
    if (req.body.general)
      settings.general = { ...settings.general, ...req.body.general };

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings,
};
