const express = require('express');
const c = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { userRules, userQueryRules, mongoIdParam } = require('../validators');

const router = express.Router();

// The whole user-management API is Admin only
router.use(protect, authorize('Admin'));

router.get('/', userQueryRules, validate, c.getUsers);
router.get('/:id', mongoIdParam, validate, c.getUser);
router.post('/', userRules(false), validate, c.createUser);
router.put('/:id', mongoIdParam, userRules(true), validate, c.updateUser);
router.delete('/:id', mongoIdParam, validate, c.deleteUser);

module.exports = router;
