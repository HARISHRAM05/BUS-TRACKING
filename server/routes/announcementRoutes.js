const express = require('express');
const c = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { announcementRules, announcementQueryRules, mongoIdParam } = require('../validators');

const router = express.Router();

router.use(protect);

// Read - Admin and User
router.get('/', announcementQueryRules, validate, c.getAnnouncements);

// Write - Admin only
router.post('/', authorize('Admin'), announcementRules, validate, c.createAnnouncement);
router.put('/:id', authorize('Admin'), mongoIdParam, announcementRules, validate, c.updateAnnouncement);
router.delete('/:id', authorize('Admin'), mongoIdParam, validate, c.deleteAnnouncement);

module.exports = router;
