// routes/api/support.js
const express = require("express");
const router = express.Router();
const supportController = require("../../controllers/supportController");

router.post("/", supportController.submitSupportRequest);

module.exports = router;