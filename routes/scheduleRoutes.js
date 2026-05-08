const express = require('express');
const router  = express.Router();
const { createSchedule, getMySchedules, deleteSchedule } = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/',      createSchedule);
router.get('/my',     getMySchedules);
router.delete('/:id', deleteSchedule);

module.exports = router;