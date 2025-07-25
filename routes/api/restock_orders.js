const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { logProductAction } = require('../../controllers/logController');

// Create new restock order
router.post('/', async (req, res) => {
  try {
    const { supplier_name, order_date, total_products, total_price, products } = req.body;
    if (!supplier_name || !order_date || !total_products || !total_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Start a transaction
    const trx = await db.transaction();

    try {
      // Insert the main order
      const [orderId] = await trx('restock_orders').insert({
        supplier_name,
        order_date,
        total_products,
        total_price,
        status: 'Pending',
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });

      // If products array is provided, store the order details
      if (Array.isArray(products) && products.length > 0) {
        const orderDetails = products.map(product => {
          // Ensure product_id is a valid integer
          const productId = parseInt(product.id);
          if (isNaN(productId) || productId <= 0) {
            throw new Error(`Invalid product ID: ${product.id}`);
          }
          
          return {
            restock_order_id: orderId,
            product_id: productId,
            product_name: product.name || 'Unknown Product',
            quantity: parseInt(product.quantity) || 1,
            price_per_unit: parseFloat(product.price) || 0,
            total_price: parseFloat(product.total) || 0,
            created_at: trx.fn.now(),
            updated_at: trx.fn.now()
          };
        });

        // Validate that all product IDs exist in the products table
        const productIds = orderDetails.map(detail => detail.product_id);
        const existingProducts = await trx('products')
          .whereIn('id', productIds)
          .select('id');
        
        const existingIds = existingProducts.map(p => p.id);
        const missingIds = productIds.filter(id => !existingIds.includes(id));
        
        if (missingIds.length > 0) {
          throw new Error(`Products with IDs ${missingIds.join(', ')} do not exist`);
        }

        await trx('restock_order_details').insert(orderDetails);
      }

      // Commit the transaction
      await trx.commit();
      res.status(201).json({ id: orderId });
    } catch (error) {
      // Rollback the transaction in case of error
      await trx.rollback();
      throw error;
    }
  } catch (err) {
    console.error('Error creating restock order:', err);
    res.status(500).json({ error: 'Failed to create restock order', details: err.message });
  }
});

// Get all restock orders
router.get('/', async (req, res) => {
  try {
    const orders = await db('restock_orders').orderBy('created_at', 'desc');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch restock orders', details: err.message });
  }
});

// Get a specific restock order with its details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the main order
    const order = await db('restock_orders').where({ id }).first();
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get the order details
    const details = await db('restock_order_details')
      .where({ restock_order_id: id })
      .select('*');
    
    res.json({
      ...order,
      details
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch restock order', details: err.message });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Received', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const { id } = req.params;
    
    // Get current order to check previous status
    const currentOrder = await db('restock_orders').where({ id }).first();
    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Start a transaction
    const trx = await db.transaction();
    
    try {
      // Update the order status
      await trx('restock_orders')
        .where({ id })
        .update({ 
          status,
          updated_at: trx.fn.now()
        });
      
      // If status is changing to "Received", update product stock
      if (status === 'Received' && currentOrder.status !== 'Received') {
        // Get order details with product information
        const orderDetails = await trx('restock_order_details')
          .where({ restock_order_id: id })
          .select('*');
        
        // If we have order details, update each product's stock
        if (orderDetails && orderDetails.length > 0) {
          for (const detail of orderDetails) {
            // Get current product stock
            const product = await trx('products')
              .where({ id: detail.product_id })
              .select('stock', 'name')
              .first();
            
            if (product) {
              const newStock = parseInt(product.stock || 0) + parseInt(detail.quantity || 0);
              
              // Update product stock
              await trx('products')
                .where({ id: detail.product_id })
                .update({ 
                  stock: newStock,
                  updated_at: trx.fn.now()
                });
              
              // Log the stock update
              try {
                await logProductAction(
                  'restock',
                  req.user?.id || null, // User ID from auth middleware
                  'product',
                  detail.product_id,
                  { stock: product.stock },
                  { stock: newStock, quantity_added: detail.quantity },
                  `Restocked from order #${id}: ${product.name} (+${detail.quantity} units)`,
                  req,
                  product.name
                );
              } catch (logError) {
                console.error('Error logging restock action:', logError);
                // Continue even if logging fails
              }
            }
          }
        }
      }
      
      // Commit the transaction
      await trx.commit();
      
      res.json({ 
        success: true,
        message: `Order status updated to ${status}`,
        stockUpdated: status === 'Received' && currentOrder.status !== 'Received'
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await trx.rollback();
      throw error;
    }
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
});

// Delete restock order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db('restock_orders').where({ id }).first();
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Start a transaction
    const trx = await db.transaction();
    
    try {
      // Delete order details first (to maintain referential integrity)
      await trx('restock_order_details').where({ restock_order_id: id }).delete();
      
      // Then delete the main order
      await trx('restock_orders').where({ id }).delete();
      
      // Commit the transaction
      await trx.commit();
      
      res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
      // Rollback the transaction in case of error
      await trx.rollback();
      throw error;
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order', details: err.message });
  }
});

module.exports = router;