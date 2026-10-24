const express = require('express');
const { getTracking } = require('../controllers/trackingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getTracking);

module.exports = router;
