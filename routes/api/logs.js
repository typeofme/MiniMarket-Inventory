const express = require('express');
const router = express.Router();
const logController = require('../../controllers/logController');

// Get all logs with filtering and pagination
router.get('/', logController.getAllLogs);

// Get a single log by ID
router.get('/:id', logController.getLog);

// Create a new log entry
router.post('/', logController.createLog);

// Get activity summary
router.get('/summary/activity', logController.getActivitySummary);

// Get recent activity
router.get('/summary/recent', logController.getRecentActivity);

module.exports = router;
