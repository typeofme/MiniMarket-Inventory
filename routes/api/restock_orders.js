const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { logProductAction } = require('../../controllers/logController');
const { authenticateToken, optionalAuth } = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const Supplier = require('../../models/Supplier');

const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to get user ID from token
const getUserIdFromRequest = (req) => {
  // First check if user is already in req (from auth middleware)
  if (req.user && req.user.userId) {
    return req.user.userId;
  }
  
  // Otherwise try to extract from token
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
};

// Create new restock order - apply authentication
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { supplier_id, supplier_name, order_date, total_products, total_price, products } = req.body;
    
    // Validate required fields
    if (!order_date || !total_products || !total_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Either supplier_id or supplier_name must be provided
    if (!supplier_id && !supplier_name) {
      return res.status(400).json({ error: 'Either supplier_id or supplier_name must be provided' });
    }

    // Start a transaction
    const trx = await db.transaction();

    try {
      let finalSupplierId = supplier_id;
      let finalSupplierName = supplier_name;
      
      // If supplier_id is provided, verify it exists
      if (supplier_id) {
        const supplier = await trx('suppliers').where({ id: supplier_id }).first();
        if (!supplier) {
          throw new Error(`Supplier with ID ${supplier_id} not found`);
        }
        finalSupplierName = supplier.name;
      }
      // If only supplier_name is provided, try to find or create supplier
      else if (supplier_name) {
        // Check if supplier with this name already exists
        const existingSupplier = await trx('suppliers')
          .where('name', 'like', supplier_name)
          .first();
          
        if (existingSupplier) {
          finalSupplierId = existingSupplier.id;
        } else {
          // Create a new supplier
          const [newSupplierId] = await trx('suppliers').insert({
            name: supplier_name,
            status: 'Active',
            created_at: trx.fn.now(),
            updated_at: trx.fn.now()
          });
          finalSupplierId = newSupplierId;
        }
      }

      // Insert the main order
      const [orderId] = await trx('restock_orders').insert({
        supplier_id: finalSupplierId,
        supplier_name: finalSupplierName,
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

      // Log the creation of the restock order
      const userId = req.user.userId;
      try {
        await logProductAction(
          'create',
          userId,
          'restock_order',
          orderId,
          null,
          { 
            supplier_id: finalSupplierId,
            supplier_name: finalSupplierName,
            order_date,
            total_products,
            total_price,
            status: 'Pending'
          },
          `Created restock order for supplier: ${finalSupplierName}`,
          req,
          finalSupplierName
        );
      } catch (logError) {
        console.error('Error logging restock order creation:', logError);
        // Continue even if logging fails
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

// Get all restock orders - apply optional auth to get user info if available
router.get('/', optionalAuth, async (req, res) => {
  try {
    // Get query parameters for filtering
    const { status, supplier_id, start_date, end_date } = req.query;
    
    // Start with base query
    let query = db('restock_orders')
      .select(
        'restock_orders.*',
        'suppliers.name as supplier_name',
        'suppliers.contact_person',
        'suppliers.phone'
      )
      .leftJoin('suppliers', 'restock_orders.supplier_id', 'suppliers.id');
    
    // Apply filters if provided
    if (status) {
      query = query.where('restock_orders.status', status);
    }
    
    if (supplier_id) {
      query = query.where('restock_orders.supplier_id', supplier_id);
    }
    
    if (start_date && end_date) {
      query = query.whereBetween('restock_orders.order_date', [start_date, end_date]);
    } else if (start_date) {
      query = query.where('restock_orders.order_date', '>=', start_date);
    } else if (end_date) {
      query = query.where('restock_orders.order_date', '<=', end_date);
    }
    
    // Execute query with ordering
    const orders = await query.orderBy('restock_orders.created_at', 'desc');
    
    res.json(orders);
  } catch (err) {
    console.error('Error fetching restock orders:', err);
    res.status(500).json({ error: 'Failed to fetch restock orders', details: err.message });
  }
});

// Get a specific restock order with its details - apply optional auth
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the main order with supplier info
    const order = await db('restock_orders')
      .select(
        'restock_orders.*',
        'suppliers.name as supplier_name',
        'suppliers.contact_person',
        'suppliers.phone',
        'suppliers.email',
        'suppliers.address'
      )
      .leftJoin('suppliers', 'restock_orders.supplier_id', 'suppliers.id')
      .where('restock_orders.id', id)
      .first();
    
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

// Update order status - apply authentication
router.patch('/:id/status', authenticateToken, async (req, res) => {
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
      
      // Get user ID from request
      const userId = req.user.userId;
      
      // Log the status update
      try {
        await logProductAction(
          'update',
          userId,
          'restock_order',
          id,
          { status: currentOrder.status },
          { status },
          `Updated restock order #${id} status from ${currentOrder.status} to ${status}`,
          req,
          currentOrder.supplier_name
        );
      } catch (logError) {
        console.error('Error logging restock order status update:', logError);
        // Continue even if logging fails
      }
      
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
                  userId,
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

// Delete restock order - apply authentication
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db('restock_orders').where({ id }).first();
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Start a transaction
    const trx = await db.transaction();
    
    try {
      // Log the deletion
      const userId = req.user.userId;
      try {
        await logProductAction(
          'delete',
          userId,
          'restock_order',
          id,
          order,
          null,
          `Deleted restock order #${id} from supplier: ${order.supplier_name}`,
          req,
          order.supplier_name
        );
      } catch (logError) {
        console.error('Error logging restock order deletion:', logError);
        // Continue even if logging fails
      }
      
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

// Get all suppliers for dropdown selection
router.get('/suppliers/list', optionalAuth, async (req, res) => {
  try {
    const suppliers = await db('suppliers')
      .select('id', 'name', 'category')
      .where({ status: 'Active' })
      .orderBy('name', 'asc');
    
    res.json(suppliers);
  } catch (err) {
    console.error('Error fetching suppliers list:', err);
    res.status(500).json({ error: 'Failed to fetch suppliers list', details: err.message });
  }
});

module.exports = router;