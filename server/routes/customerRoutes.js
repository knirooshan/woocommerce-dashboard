const express = require("express");
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  syncCustomers,
  getCustomerSummary,
} = require("../controllers/customerController");
const { protect, admin } = require("../middleware/authMiddleware");

router.route("/").get(protect, getCustomers).post(protect, createCustomer);
router.route("/sync").post(protect, admin, syncCustomers);
router.route("/:id/summary").get(protect, getCustomerSummary);
router
  .route("/:id")
  .get(protect, getCustomerById)
  .put(protect, updateCustomer)
  .delete(protect, admin, deleteCustomer);

module.exports = router;
