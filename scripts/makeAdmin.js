// backend/scripts/makeAdmin.js

require('dotenv').config(); // ← no path needed if you run from backend/ folder
const mongoose = require('mongoose');
const User = require('../models/User');

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'rupeshkesharwani06@gmail.com'; // ← change this to YOUR registered email

    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );

    if (user) {
      console.log(`✅ Success! "${user.name}" (${user.email}) is now an admin.`);
    } else {
      console.log('❌ No user found with that email.');
      console.log('→ Register on the app first, then run this script again.');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    mongoose.disconnect();
  }
};

makeAdmin();