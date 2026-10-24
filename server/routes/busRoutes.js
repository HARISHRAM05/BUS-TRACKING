const express = require('express');
const c = require('../controllers/busController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { busRules, busQueryRules, locationRules, mongoIdParam } = require('../validators');

const router = express.Router();

router.use(protect); // every bus endpoint needs a logged-in user

// Read - Admin and User
router.get('/', busQueryRules, validate, c.getBuses);
router.get('/:id', mongoIdParam, validate, c.getBus);

// Write - Admin only (Users get 403)
router.post('/', authorize('Admin'), busRules, validate, c.createBus);
router.put('/:id', authorize('Admin'), mongoIdParam, busRules, validate, c.updateBus);
router.put('/:id/location', authorize('Admin'), mongoIdParam, locationRules, validate, c.updateLocation);
router.delete('/:id', authorize('Admin'), mongoIdParam, validate, c.deleteBus);

module.exports = router;
