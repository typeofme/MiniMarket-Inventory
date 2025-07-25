const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// Create new restock order
router.post('/', async (req, res) => {
  try {
    const { supplier_name, order_date, total_products, total_price } = req.body;
    if (!supplier_name || !order_date || !total_products || !total_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const [id] = await db('restock_orders').insert({
      supplier_name,
      order_date,
      total_products,
      total_price,
      status: 'Pending',
    });
    res.status(201).json({ id });
  } catch (err) {
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

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Received', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const { id } = req.params;
    await db('restock_orders').where({ id }).update({ status });
    res.json({ success: true });
  } catch (err) {
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

    await db('restock_orders').where({ id }).delete();
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order', details: err.message });
  }
});

module.exports = router;