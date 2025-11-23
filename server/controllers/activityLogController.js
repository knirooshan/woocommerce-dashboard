const ActivityLog = require("../models/ActivityLog");

// @desc    Get activity logs
// @route   GET /api/activity-logs
// @access  Private/Admin
const getLogs = async (req, res) => {
  try {
    const pageSize = 20;
    const page = Number(req.query.pageNumber) || 1;

    const count = await ActivityLog.countDocuments({});
    const logs = await ActivityLog.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ logs, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLogs };
