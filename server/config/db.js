const mongoose = require("mongoose");

const auditPlugin = require("../models/plugins/auditPlugin");

const connectDB = async () => {
  try {
    mongoose.plugin(auditPlugin);
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
