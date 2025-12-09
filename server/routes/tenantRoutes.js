const express = require("express");
const router = express.Router();
const {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  generatePasskey,
  resendWelcomeEmail,
} = require("../controllers/tenantController");
const { protect } = require("../middleware/authMiddleware");
const { superAdmin } = require("../middleware/superAdminMiddleware");

// All routes are protected and require super admin access
router.use(protect);
router.use(superAdmin);

router.route("/").get(getTenants).post(createTenant);
router.route("/:id").get(getTenantById).put(updateTenant).delete(deleteTenant);
router.route("/:id/passkey").post(generatePasskey);
router.route("/:id/resend-welcome").post(resendWelcomeEmail);

module.exports = router;
