const express = require('express');
const c = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { scheduleRules, scheduleQueryRules, mongoIdParam } = require('../validators');

const router = express.Router();

router.use(protect);

// Read - Admin and User
router.get('/', scheduleQueryRules, validate, c.getSchedules);
router.get('/:id', mongoIdParam, validate, c.getSchedule);

// Write - Admin only
router.post('/', authorize('Admin'), scheduleRules, validate, c.createSchedule);
router.put('/:id', authorize('Admin'), mongoIdParam, scheduleRules, validate, c.updateSchedule);
router.delete('/:id', authorize('Admin'), mongoIdParam, validate, c.deleteSchedule);

module.exports = router;
