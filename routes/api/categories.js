const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/categoryController');

// GET /api/categories - Get all categories
router.get('/', categoryController.getCategories);

// GET /api/categories/active - Get only active categories
router.get('/active', categoryController.getActiveCategories);

// GET /api/categories/with-counts - Get categories with product counts
router.get('/with-counts', categoryController.getCategoriesWithProductCounts);

// GET /api/categories/:id - Get a single category
router.get('/:id', categoryController.getCategory);

// POST /api/categories - Create a new category
router.post('/', categoryController.createCategory);

// PUT /api/categories/:id - Update a category
router.put('/:id', categoryController.updateCategory);

// PATCH /api/categories/:id/toggle - Toggle category active status
router.patch('/:id/toggle', categoryController.toggleCategoryStatus);

// DELETE /api/categories/:id/soft - Soft delete a category
router.delete('/:id/soft', categoryController.softDeleteCategory);

// DELETE /api/categories/:id - Hard delete a category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
