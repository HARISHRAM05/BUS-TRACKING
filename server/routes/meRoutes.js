const express = require('express');
const c = require('../controllers/meController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { myRouteRules } = require('../validators');

const router = express.Router();

router.use(protect);

router.put('/route', myRouteRules, validate, c.setMyRoute);
router.delete('/route', c.clearMyRoute);
router.get('/next-bus', c.getNextBus);

module.exports = router;
