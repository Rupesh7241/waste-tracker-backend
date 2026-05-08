
const asyncHandler = require('express-async-handler');
const Schedule = require('../models/Schedule');

// POST /api/schedules  →  Book a new pickup
const createSchedule = asyncHandler(async (req, res) => {
  const { address, pickupDate, timeSlot, wasteType, notes } = req.body;

  if (!address || !pickupDate || !timeSlot) {
    res.status(400);
    throw new Error('Address, date, and time slot are required');
  }

  const schedule = await Schedule.create({
    user: req.user._id,
    address,
    pickupDate,
    timeSlot,
    wasteType,
    notes,
  });

  res.status(201).json(schedule);
});

// GET /api/schedules/my  →  See my own pickups
const getMySchedules = asyncHandler(async (req, res) => {
  const schedules = await Schedule.find({ user: req.user._id })
    .sort({ pickupDate: 1 });
  res.json(schedules);
});

// DELETE /api/schedules/:id  →  Cancel a pickup
const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);

  if (!schedule) {
    res.status(404);
    throw new Error('Schedule not found');
  }

  if (schedule.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  await schedule.deleteOne();
  res.json({ message: 'Schedule cancelled' });
});

module.exports = { createSchedule, getMySchedules, deleteSchedule };