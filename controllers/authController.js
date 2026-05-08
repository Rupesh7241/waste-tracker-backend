

const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Helper: Create a JWT token ───────────────────────────────────────────
// Takes a user's ID and wraps it in a signed token that expires in 30 days
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ─── @route  POST /api/auth/register ──────────────────────────────────────
// @desc   Register a new user
// @access Public (anyone can register)
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Check all fields are present
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please fill in all fields');
  }

  // 2. Check if email already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  // 3. Create new user (password gets hashed automatically by our model middleware)
  const user = await User.create({ name, email, password });

  // 4. Send back user info + token
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id), // JWT token
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// ─── @route  POST /api/auth/login ─────────────────────────────────────────
// @desc   Login existing user
// @access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user by email
  const user = await User.findOne({ email });

  // 2. Check user exists AND password matches
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// ─── @route  GET /api/auth/me ─────────────────────────────────────────────
// @desc   Get current logged-in user's profile
// @access Private (requires JWT token)
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by our auth middleware (we'll build that next)
  const user = await User.findById(req.user.id).select('-password'); // hide password
  res.json(user);
});

module.exports = { registerUser, loginUser, getMe };