const express = require('express');
const path = require('path');
const router = express.Router();

// Logs page route - authentication handled client-side by AuthGuard
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'logs.html'));
});

module.exports = router;
