// backend/models/Schedule.js
// This defines a garbage pickup schedule request

const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide your address'],
    },
    pickupDate: {
      type: Date,
      required: [true, 'Please select a pickup date'],
    },
    timeSlot: {
      type: String,
      enum: ['Morning (6am–10am)', 'Afternoon (12pm–4pm)', 'Evening (5pm–8pm)'],
      required: [true, 'Please select a time slot'],
    },
    wasteType: {
      type: String,
      enum: ['General', 'Recyclable', 'Hazardous', 'Organic'],
      default: 'General',
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    notes: {
      type: String,  // Any extra info from the user
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Schedule', scheduleSchema);
