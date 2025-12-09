const express = require("express");
const router = express.Router();
const {
  validatePasskey,
  completeSetup,
} = require("../controllers/setupController");

// These routes are technically "public" but guarded by tenantMiddleware's subdomain logic
// and the controller's passkey validation.
router.post("/validate", validatePasskey);
router.post("/complete", completeSetup);

module.exports = router;
