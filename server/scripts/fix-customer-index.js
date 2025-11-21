// Script to drop the old wooId index and recreate it as sparse
require("dotenv").config();
const mongoose = require("mongoose");

const dropIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Get the customers collection
    const db = mongoose.connection.db;
    const collection = db.collection("customers");

    // Drop the old wooId_1 index
    try {
      await collection.dropIndex("wooId_1");
      console.log("✓ Dropped old wooId_1 index");
    } catch (error) {
      if (error.code === 27) {
        console.log("Index wooId_1 does not exist, skipping...");
      } else {
        throw error;
      }
    }

    // Create new sparse unique index
    await collection.createIndex({ wooId: 1 }, { unique: true, sparse: true });
    console.log("✓ Created new sparse unique index on wooId");

    console.log("\nIndex migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

dropIndex();
