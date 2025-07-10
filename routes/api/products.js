const express = require('express');
const router = express.Router();
const productController = require('../../controllers/productController');
const db = require('../../config/database');

// Configure express to handle larger payloads for base64 images
const bodyParserOptions = {
  limit: '10mb', // Increased limit for base64 images
  extended: true
};

// Apply the body parser options to this route
router.use(express.json(bodyParserOptions));
router.use(express.urlencoded(bodyParserOptions));

// GET /api/products - Get all products
router.get('/', productController.getProducts);

// GET /api/products/stats - Get product statistics for dashboard
router.get('/stats', productController.getProductStats);

// GET /api/products/inventory-value - Get inventory value data for dashboard widget
router.get('/inventory-value', productController.getInventoryValueData);

// GET /api/products/top - Get top products for dashboard
router.get('/top', productController.getTopProducts);

// GET /api/products/low-stock - Get low stock products for dashboard alerts
router.get('/low-stock', productController.getLowStockProducts);

// GET /api/products/inventory-status - Get inventory status distribution
router.get('/inventory-status', productController.getInventoryStatus);

// GET /api/products/debug/connection - Debug database connection
router.get('/debug/connection', async (req, res) => {
  try {
    // Check connection
    const connectionTest = await db.raw('SELECT 1 as test');
    
    // Get table structure
    const tableInfo = await db.raw('DESCRIBE products');
    
    // Count products
    const count = await db('products').count('* as count').first();
    
    // Sample product
    const sampleProduct = await db('products').first();
    
    res.json({
      connection: 'ok',
      connectionResult: connectionTest[0],
      tableStructure: tableInfo[0],
      productCount: count,
      sampleProduct: sampleProduct,
      columnNames: sampleProduct ? Object.keys(sampleProduct) : []
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// GET /api/products/:id - Get a single product
router.get('/:id', productController.getProduct);

// POST /api/products - Create a new product with base64 image
router.post('/', productController.createProduct);

// PUT /api/products/:id - Update a product with base64 image
router.put('/:id', productController.updateProduct);

// DELETE /api/products/:id - Delete a product
router.delete('/:id', productController.deleteProduct);

// PUT /api/products/:id/restock - Restock a product
router.put('/:id/restock', productController.restockProduct);

module.exports = router;