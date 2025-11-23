const Expense = require("../models/Expense");

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({})
      .populate("vendor", "name")
      .sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    const { description, amount, category, date, vendor, reference, notes } =
      req.body;

    const expense = new Expense({
      description,
      amount,
      category,
      date,
      vendor,
      reference,
      notes,
    });

    const createdExpense = await expense.save();
    res.status(201).json(createdExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (expense) {
      await expense.deleteOne();
      res.json({ message: "Expense removed" });
    } else {
      res.status(404).json({ message: "Expense not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (expense) {
      const { editReason, editedBy, ...updateData } = req.body;

      // Add to edit history if edit reason provided
      if (editReason) {
        expense.editHistory.push({
          editedAt: new Date(),
          editedBy: editedBy || "User",
          reason: editReason,
        });
      }

      // Update expense fields
      Object.keys(updateData).forEach((key) => {
        expense[key] = updateData[key];
      });

      const updatedExpense = await expense.save();
      res.json(updatedExpense);
    } else {
      res.status(404).json({ message: "Expense not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
