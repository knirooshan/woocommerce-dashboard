const express = require("express");
const router = express.Router();
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadExpenseAttachment,
} = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getExpenses).post(protect, createExpense);
router.post("/upload", protect, uploadExpenseAttachment);
router.route("/:id").put(protect, updateExpense).delete(protect, deleteExpense);

module.exports = router;
