const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken, authenticateWeb } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Check authentication status (uses web authentication to check cookies)
router.get('/check', authenticateWeb, AuthController.checkAuth);

// Protected routes (for web pages using cookies)
router.post('/logout', authenticateWeb, AuthController.logout);
router.get('/profile', authenticateWeb, AuthController.profile);
router.put('/profile', authenticateWeb, AuthController.updateProfile);
router.put('/change-password', authenticateWeb, AuthController.changePassword);

// Avatar upload route
router.post('/upload-avatar', authenticateWeb, uploadAvatar, AuthController.uploadAvatar);

module.exports = router;
