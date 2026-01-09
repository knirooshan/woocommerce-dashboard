const jwt = require("jsonwebtoken");
const { getTenantModels } = require("../models/tenantModels");
const { setContext } = require("../utils/requestContext");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { User } = getTenantModels(req.dbConnection);
      req.user = await User.findById(decoded.id).select("-password");
      setContext("user", req.user);

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({
        message: "Not authorized, token failed",
        code: "INVALID_TOKEN",
      });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token", code: "NO_TOKEN" });
  }
};

const admin = (req, res, next) => {
  // Only enforce admin for DELETE requests or activity-log routes
  const isActivityRoute =
    req.originalUrl && req.originalUrl.includes("/activity");
  const requiresAdmin = req.method === "DELETE" || isActivityRoute;

  if (!requiresAdmin) {
    // allow non-admin authenticated users for non-admin routes
    return next();
  }

  if (req.user && req.user.role === "admin") {
    return next();
  }

  res.status(401).json({ message: "Not authorized as an admin" });
};

module.exports = { protect, admin };
