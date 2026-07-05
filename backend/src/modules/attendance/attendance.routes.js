const express = require('express');
const router = express.Router();
const attendanceController = require('./attendance.controller');
const authenticate = require('../../middleware/authenticate');

router.post('/check-in', authenticate, attendanceController.checkIn);
router.post('/check-out', authenticate, attendanceController.checkOut);

module.exports = router;
