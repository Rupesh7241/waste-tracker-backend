// backend/routes/complaintRoutes.js

const express = require('express');
const router  = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  deleteComplaint,
} = require('../controllers/complaintController');
const { protect }  = require('../middleware/authMiddleware');
const { upload }   = require('../middleware/uploadMiddleware');

// All routes below require the user to be logged in
router.use(protect);

// POST   /api/complaints        → submit new complaint (with optional image)
// upload.single('image') means we expect ONE file in a field called "image"
router.post('/',      upload.single('image'), createComplaint);

// GET    /api/complaints/my     → get my own complaints
router.get('/my',     getMyComplaints);

// GET    /api/complaints/:id    → get one complaint
router.get('/:id',    getComplaintById);

// DELETE /api/complaints/:id    → delete a complaint
router.delete('/:id', deleteComplaint);

module.exports = router;