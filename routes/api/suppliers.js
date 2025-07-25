const express = require('express');
const router = express.Router();
const supplierController = require('../../controllers/supplierController');
const { authenticateToken, optionalAuth } = require('../../middleware/auth');

// Get all suppliers
router.get('/', optionalAuth, supplierController.getAllSuppliers);

// Get supplier statistics
router.get('/stats', optionalAuth, supplierController.getSupplierStats);

// Search suppliers
router.get('/search', optionalAuth, supplierController.searchSuppliers);

// Get suppliers by status
router.get('/status/:status', optionalAuth, supplierController.getSuppliersByStatus);

// Get suppliers by category
router.get('/category/:category', optionalAuth, supplierController.getSuppliersByCategory);

// Get supplier with order history
router.get('/:id/orders', optionalAuth, supplierController.getSupplierWithOrders);

// Get supplier by ID
router.get('/:id', optionalAuth, supplierController.getSupplier);

// Create supplier
router.post('/', authenticateToken, supplierController.createSupplier);

// Update supplier
router.put('/:id', authenticateToken, supplierController.updateSupplier);

// Delete supplier
router.delete('/:id', authenticateToken, supplierController.deleteSupplier);

module.exports = router; 