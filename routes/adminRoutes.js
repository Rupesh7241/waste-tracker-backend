// backend/routes/adminRoutes.js

const express = require('express');
const router  = express.Router();
const {
  getAllComplaints,
  updateComplaintStatus,
  getAllSchedules,
  getDashboardStats,
  getAllUsers,
  updateUserRole,        // ← ADD this import
  getAnalytics
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All routes require valid token AND admin role
router.use(protect, adminOnly);

router.get('/stats',                getDashboardStats);
router.get('/complaints',           getAllComplaints);
router.put('/complaints/:id',       updateComplaintStatus);
router.get('/schedules',            getAllSchedules);
router.get('/users',                getAllUsers);
router.put('/users/:id/role',       updateUserRole);   // ← NEW route
router.get('/analytics', getAnalytics);

module.exports = router;