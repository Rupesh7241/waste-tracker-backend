const asyncHandler = require('express-async-handler');
const Complaint    = require('../models/Complaint');
const Schedule     = require('../models/Schedule');
const User         = require('../models/User');
const { sendEmail }             = require('../services/emailService');
const { statusUpdatedTemplate } = require('../services/emailTemplates');

// ─── GET /api/admin/complaints ────────────────────────────────────────────
const getAllComplaints = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const complaints = await Complaint.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json(complaints);
});

// ─── PUT /api/admin/complaints/:id ────────────────────────────────────────
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, assignedTo, adminNote } = req.body;

  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name email');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  const previousStatus = complaint.status;

  if (status)                   complaint.status     = status;
  if (assignedTo !== undefined) complaint.assignedTo = assignedTo;
  if (adminNote  !== undefined) complaint.adminNote  = adminNote;

  const updated = await complaint.save();

  if (status && status !== previousStatus) {
    // Feature 1: Socket.io
    const io = req.app.get('io');
    if (io) {
      const userRoom = `user-${complaint.user._id}`;
      io.to(userRoom).emit('status-updated', {
        message:     `Your complaint status changed to "${status}"`,
        complaintId: complaint._id,
        description: complaint.description,
        status,
        assignedTo:  complaint.assignedTo,
        adminNote:   complaint.adminNote,
      });
      console.log(`📡 Emitted status-updated to room: ${userRoom}`);
    }

    // Feature 3: Email
    try {
      const { subject, html } = statusUpdatedTemplate({
        userName:    complaint.user.name,
        description: complaint.description,
        location:    complaint.location,
        complaintId: complaint._id,
        oldStatus:   previousStatus,
        newStatus:   status,
        assignedTo:  complaint.assignedTo,
        adminNote:   complaint.adminNote,
      });
      sendEmail({ to: complaint.user.email, subject, html });
    } catch (emailErr) {
      console.error('Email trigger error:', emailErr.message);
    }
  }

  res.json(updated);
});

// ─── GET /api/admin/schedules ─────────────────────────────────────────────
const getAllSchedules = asyncHandler(async (req, res) => {
  const schedules = await Schedule.find({})
    .populate('user', 'name email')
    .sort({ pickupDate: 1 });
  res.json(schedules);
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalComplaints, pendingCount, inProgressCount,
    resolvedCount, totalUsers, totalSchedules,
  ] = await Promise.all([
    Complaint.countDocuments(),
    Complaint.countDocuments({ status: 'Pending' }),
    Complaint.countDocuments({ status: 'In Progress' }),
    Complaint.countDocuments({ status: 'Resolved' }),
    User.countDocuments({ role: 'user' }),
    Schedule.countDocuments(),
  ]);

  res.json({
    totalComplaints, pendingCount, inProgressCount,
    resolvedCount, totalUsers, totalSchedules,
  });
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select('-password')
    .sort({ createdAt: -1 });

  const usersWithStats = await Promise.all(
    users.map(async (u) => {
      const complaintCount = await Complaint.countDocuments({ user: u._id });
      return {
        _id:            u._id,
        name:           u.name,
        email:          u.email,
        role:           u.role,
        createdAt:      u.createdAt,
        complaintCount,
      };
    })
  );

  res.json(usersWithStats);
});

// ─── PUT /api/admin/users/:id/role ────────────────────────────────────────
// ✅ Uses findByIdAndUpdate — completely bypasses pre-save hook
// ✅ Emits role-changed socket event so user's UI updates instantly
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    console.log('📝 updateUserRole called');
    console.log('   Target ID:', req.params.id);
    console.log('   New role :', role);

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Role must be either "user" or "admin"',
      });
    }

    // Prevent self-role-change BEFORE updating
    if (req.user && req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        message: 'You cannot change your own role',
      });
    }

    // ✅ findByIdAndUpdate skips pre-save hooks — no "next is not a function"
    const targetUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true, runValidators: false }
    ).select('-password');

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Notify promoted/demoted user via Socket.io so their UI updates instantly
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${targetUser._id}`).emit('role-changed', {
        newRole: role,
        message: role === 'admin'
          ? '👑 You have been promoted to Admin!'
          : '👤 Your role has been updated to User.',
      });
      console.log(`📡 Emitted role-changed to user-${targetUser._id}`);
    }

    console.log(`✅ Role updated: ${targetUser.email} → ${role}`);

    return res.status(200).json({
      _id:     targetUser._id,
      name:    targetUser.name,
      email:   targetUser.email,
      role:    targetUser.role,
      message: `${targetUser.name} is now a${role === 'admin' ? 'n admin' : ' user'}`,
    });

  } catch (err) {
    console.error('❌ updateUserRole error:', err.message);
    return res.status(500).json({
      message: err.message || 'Server error updating role',
    });
  }
};

// ─── GET /api/admin/analytics ─────────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const [pendingCount, inProgressCount, resolvedCount] = await Promise.all([
    Complaint.countDocuments({ status: 'Pending' }),
    Complaint.countDocuments({ status: 'In Progress' }),
    Complaint.countDocuments({ status: 'Resolved' }),
  ]);

  const statusData = [
    { name: 'Pending',     value: pendingCount,    color: '#eab308' },
    { name: 'In Progress', value: inProgressCount, color: '#3b82f6' },
    { name: 'Resolved',    value: resolvedCount,   color: '#22c55e' },
  ];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyRaw = await Complaint.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year:  { $year:  '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthNames = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
  ];

  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d     = new Date();
    d.setMonth(d.getMonth() - i);
    const year  = d.getFullYear();
    const month = d.getMonth() + 1;
    const found = monthlyRaw.find(
      r => r._id.year === year && r._id.month === month
    );
    monthlyData.push({
      month:      monthNames[month - 1],
      year,
      complaints: found ? found.count : 0,
    });
  }

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const weeklyRaw = await Complaint.aggregate([
    { $match: { createdAt: { $gte: fourWeeksAgo } } },
    {
      $group: {
        _id:   { $week: '$createdAt' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id': 1 } },
  ]);

  res.json({
    statusData,
    monthlyData,
    weeklyData: weeklyRaw,
    totals: {
      total:      pendingCount + inProgressCount + resolvedCount,
      pending:    pendingCount,
      inProgress: inProgressCount,
      resolved:   resolvedCount,
    },
  });
});

// ─── Exports ──────────────────────────────────────────────────────────────
module.exports = {
  getAllComplaints,
  updateComplaintStatus,
  getAllSchedules,
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getAnalytics,
};