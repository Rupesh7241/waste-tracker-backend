// backend/models/Complaint.js
// This defines what a garbage complaint looks like in the database

const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, // Links to a User document
      ref: 'User',                           // Tells Mongoose which model to look in
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Please describe the issue'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
    },
    // Optional: coordinates for Google Maps
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    imageUrl: {
      type: String,   // We'll store the Cloudinary image URL here
      default: '',
    },
    imagePublicId: {
      type: String,   // Cloudinary's ID — needed if we want to delete the image later
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved'], // Only these 3 values allowed
      default: 'Pending',                            // Every new complaint starts as Pending
    },
    assignedTo: {
      type: String,   // Name of the worker/team assigned by admin
      default: '',
    },
    adminNote: {
      type: String,   // Admin can leave a note (e.g., "Team dispatched")
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Complaint', complaintSchema);