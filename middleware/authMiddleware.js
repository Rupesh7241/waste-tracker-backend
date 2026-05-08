const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // JWT tokens are sent in the "Authorization" header like:
  // Authorization: Bearer eyJhbGci...
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 1. Extract token (remove the word "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user and attach to request (minus the password)
      req.user = await User.findById(decoded.id).select('-password');

      next(); // All good — continue to the route
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin-only middleware — use AFTER protect
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as admin');
  }
};

module.exports = { protect, adminOnly };