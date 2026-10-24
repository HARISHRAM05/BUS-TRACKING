const express = require('express');
const { getStats, getActivity } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, authorize('Admin'), getStats);
router.get('/activity', protect, authorize('Admin'), getActivity);

module.exports = router;
