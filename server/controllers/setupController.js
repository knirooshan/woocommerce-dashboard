const { getTenantModels } = require("../models/tenantModels");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Validate setup passkey
// @route   POST /api/setup/validate
// @access  Public (Tenant-scoped)
const validatePasskey = async (req, res) => {
  try {
    const { passkey } = req.body;

    // Fetch Tenant model from Central DB Connection
    const { getCentralConnection } = require("../services/connectionManager");
    const centralConn = getCentralConnection();
    const TenantModel = centralConn.model("Tenant");

    const tenant = await TenantModel.findById(req.tenant._id).select(
      "+setupPasskey"
    );

    if (!tenant) {
      return res.status(404).json({ message: "Tenant context missing" });
    }

    if (tenant.isSetupComplete) {
      return res.status(400).json({ message: "Setup already complete" });
    }

    if (passkey === tenant.setupPasskey) {
      res.json({ valid: true });
    } else {
      res.status(401).json({ valid: false, message: "Invalid passkey" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete first-time setup
// @route   POST /api/setup/complete
// @access  Public (Tenant-scoped)
const completeSetup = async (req, res) => {
  try {
    const { passkey, user: userData, organization } = req.body;

    // Fetch Tenant from Central DB to get passkey
    const { getCentralConnection } = require("../services/connectionManager");
    const centralConn = getCentralConnection();
    const TenantModel = centralConn.model("Tenant");

    const tenant = await TenantModel.findById(req.tenant._id).select(
      "+setupPasskey"
    );

    if (!tenant) {
      return res.status(404).json({ message: "Tenant context missing" });
    }

    if (tenant.isSetupComplete) {
      return res.status(400).json({ message: "Setup already complete" });
    }

    if (passkey !== tenant.setupPasskey) {
      return res.status(401).json({ message: "Invalid passkey" });
    }

    // 1. Create Admin User in Tenant DB
    const { User, Settings } = getTenantModels(req.dbConnection);

    // Check if user already exists (unlikely for fresh DB but good safety)
    const userExists = await User.findOne({ email: userData.email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: "admin",
    });

    // 2. Initialize Settings with Organization Details
    if (organization) {
      // Create or update settings
      // We might want to clear existing settings if any default ones exist
      await Settings.deleteMany({});

      await Settings.create({
        storeName: organization.name,
        email: organization.email,
        contact: {
          phone: organization.phone,
          email: organization.email,
        },
        address: organization.address, // formatted object
        currency: {
          symbol: "$",
          code: "USD",
          position: "before",
        },
        // Defaults for other fields
      });
    }

    // 3. Update Tenant Status in Central DB
    tenant.isSetupComplete = true;
    tenant.organizationDetails = organization;
    // We can clear passkey now or keep it for recovery?
    // Secure approach: clear it.
    tenant.setupPasskey = undefined;

    await tenant.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      message: "Setup complete",
    });
  } catch (error) {
    console.error("Setup Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  validatePasskey,
  completeSetup,
};
