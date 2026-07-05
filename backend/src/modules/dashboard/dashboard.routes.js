const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const authenticate = require('../../middleware/authenticate');

router.get('/', authenticate, dashboardController.getDashboard);

module.exports = router;
