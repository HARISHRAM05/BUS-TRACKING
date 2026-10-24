const express = require('express');
const { signup, login, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupRules, loginRules, changePasswordRules } = require('../validators');

const router = express.Router();

router.post('/signup', signupRules, validate, signup);
router.post('/login', loginRules, validate, login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePasswordRules, validate, changePassword);

module.exports = router;
