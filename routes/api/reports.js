const express = require("express");
const router = express.Router();
const reportController = require("../../controllers/reportController");

// @route   GET api/reports/inventory-turnover
// @desc    Get inventory turnover data by category
// @access  Public
router.get("/inventory-turnover", reportController.getInventoryTurnover);

// @route   GET api/reports/market-trends
// @desc    Get market trends by category
// @access  Public
router.get("/market-trends", reportController.getMarketTrends);

// @route   GET api/reports/today-stats
// @desc    Get today's sales and orders statistics
// @access  Public
router.get("/today-stats", reportController.getTodayStats);

// @route   GET api/reports
// @desc    Get all reports
// @access  Public
router.get("/", reportController.getAllReports);

// @route   POST api/reports
// @desc    Create a report
// @access  Public
router.post("/", reportController.createReport);

// @route   GET api/reports/:id
// @desc    Get a single report
// @access  Public
router.get("/:id", reportController.getReportById);

// @route   PUT api/reports/:id
// @desc    Update a report
// @access  Public
router.put("/:id", reportController.updateReport);

// @route   DELETE api/reports/:id
// @desc    Delete a report
// @access  Public
router.delete("/:id", reportController.deleteReport);

module.exports = router;