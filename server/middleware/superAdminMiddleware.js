const superAdmin = (req, res, next) => {
  if (req.isSuperAdmin) {
    return next();
  }
  // Also allow if the user role is explicitly 'superadmin' (if we add that later)
  // For now, relies on domain detection from tenantMiddleware
  res.status(403).json({ message: "Not authorized as Super Admin" });
};

module.exports = { superAdmin };
