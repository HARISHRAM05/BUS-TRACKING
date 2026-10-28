const express = require('express');
const c = require('../controllers/issueController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { reportRules, issueUpdateRules, issueQueryRules, mongoIdParam } = require('../validators');

const router = express.Router();

router.use(protect);

// Any logged-in rider
router.post('/', reportRules, validate, c.createIssue);
router.get('/mine', c.getMyIssues); // must come before '/:id' routes

// Admin only: the inbox
router.get('/', authorize('Admin'), issueQueryRules, validate, c.getIssues);
router.put('/:id', authorize('Admin'), mongoIdParam, issueUpdateRules, validate, c.updateIssue);
router.delete('/:id', authorize('Admin'), mongoIdParam, validate, c.deleteIssue);

module.exports = router;
