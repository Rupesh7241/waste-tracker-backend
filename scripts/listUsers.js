// backend/scripts/listUsers.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}).select('name email role createdAt');
    
    if (users.length === 0) {
      console.log('❌ No users found. Register on the app first.');
    } else {
      console.log(`\n✅ Found ${users.length} user(s):\n`);
      users.forEach((u, i) => {
        console.log(`  ${i + 1}. Name  : ${u.name}`);
        console.log(`     Email : ${u.email}`);
        console.log(`     Role  : ${u.role}`);
        console.log(`     Joined: ${u.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    mongoose.disconnect();
  }
};

listUsers();