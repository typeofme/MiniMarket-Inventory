const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/products.html'));
});

// Add debug route
router.get('/debug', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/debug.html'));
});

module.exports = router;
