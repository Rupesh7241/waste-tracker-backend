
const express = require('express');
const router  = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login',    loginUser);
router.get('/me',        protect, getMe);

// ── NEW: refresh token with latest role from DB ───────────────────────────
router.get('/refresh', protect, async (req, res) => {
  try {
    const jwt  = require('jsonwebtoken');
    const User = require('../models/User');

    // Fetch latest user data from DB (has updated role)
    const freshUser = await User.findById(req.user._id).select('-password');

    if (!freshUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a brand new token with updated role
    const newToken = jwt.sign(
      { id: freshUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      _id:   freshUser._id,
      name:  freshUser.name,
      email: freshUser.email,
      role:  freshUser.role,     // ← fresh role from DB
      token: newToken,           // ← new token with updated role
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;