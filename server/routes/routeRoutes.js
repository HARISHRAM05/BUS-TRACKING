const express = require('express');
const c = require('../controllers/routeController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { routeRules, routeQueryRules, mongoIdParam } = require('../validators');

const router = express.Router();

router.use(protect);

// Read - Admin and User
router.get('/', routeQueryRules, validate, c.getRoutes);
router.get('/:id', mongoIdParam, validate, c.getRoute);

// Write - Admin only
router.post('/', authorize('Admin'), routeRules, validate, c.createRoute);
router.put('/:id', authorize('Admin'), mongoIdParam, routeRules, validate, c.updateRoute);
router.delete('/:id', authorize('Admin'), mongoIdParam, validate, c.deleteRoute);

module.exports = router;
