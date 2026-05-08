// backend/config/db.js
// This file connects our app to MongoDB database

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Try to connect using the URL from .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1); // Stop the server if DB connection fails
  }
};

module.exports = connectDB;