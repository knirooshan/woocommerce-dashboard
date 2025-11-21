const express = require("express");
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  syncCustomers,
} = require("../controllers/customerController");
const { protect, admin } = require("../middleware/authMiddleware");

router.route("/").get(protect, getCustomers).post(protect, createCustomer);
router
  .route("/:id")
  .get(protect, getCustomerById)
  .put(protect, updateCustomer)
  .delete(protect, admin, deleteCustomer);
router.route("/sync").post(protect, admin, syncCustomers);

module.exports = router;
