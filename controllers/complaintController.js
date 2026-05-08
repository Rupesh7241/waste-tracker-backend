const asyncHandler = require('express-async-handler');
const Complaint    = require('../models/Complaint');
const { cloudinary }                = require('../middleware/uploadMiddleware');
const { sendEmail }                 = require('../services/emailService');
const { complaintReceivedTemplate } = require('../services/emailTemplates');

// ─── Create a new complaint ───────────────────────────────────────────────
const createComplaint = asyncHandler(async (req, res) => {
  const { description, location, lat, lng } = req.body;

  if (!description || !location) {
    res.status(400);
    throw new Error('Description and location are required');
  }

  const imageUrl      = req.file ? req.file.path    : '';
  const imagePublicId = req.file ? req.file.filename : '';

  const complaint = await Complaint.create({
    user: req.user._id,
    description,
    location,
    coordinates: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
    imageUrl,
    imagePublicId,
  });

  // ── Feature 1: Socket.io — notify admin room in real time ─────────────
  const io = req.app.get('io');
  if (io) {
    io.to('admin-room').emit('new-complaint', {
      message: `New complaint from ${req.user.name}`,
      complaint: {
        _id:         complaint._id,
        description: complaint.description,
        location:    complaint.location,
        userName:    req.user.name,
        createdAt:   complaint.createdAt,
      },
    });
  }

  // ── Feature 3: Email — send confirmation to user (fire and forget) ────
  // We do NOT await so the API response stays instant
  try {
    const { subject, html } = complaintReceivedTemplate({
      userName:    req.user.name,
      description: complaint.description,
      location:    complaint.location,
      complaintId: complaint._id,
      status:      complaint.status,
    });

    sendEmail({ to: req.user.email, subject, html });
  } catch (emailErr) {
    // Email error must never crash the main request
    console.error('Email trigger error:', emailErr.message);
  }

  res.status(201).json(complaint);
});

// ─── Get logged-in user's own complaints ─────────────────────────────────
const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ user: req.user._id })
    .sort({ createdAt: -1 });
  res.json(complaints);
});

// ─── Get a single complaint by ID ────────────────────────────────────────
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name email');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (
    complaint.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to view this complaint');
  }

  res.json(complaint);
});

// ─── Delete a complaint + its Cloudinary image ───────────────────────────
const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (complaint.imagePublicId) {
    await cloudinary.uploader.destroy(complaint.imagePublicId);
  }

  await complaint.deleteOne();
  res.json({ message: 'Complaint removed' });
});

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  deleteComplaint,
};