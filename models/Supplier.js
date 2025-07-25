const db = require('../config/database');

const Supplier = {
  // Get all suppliers
  getAll: () => {
    return db('suppliers')
      .select('*')
      .orderBy('name', 'asc');
  },

  // Get supplier by ID
  getById: (id) => {
    return db('suppliers')
      .where({ id })
      .first();
  },

  // Create new supplier
  create: (data) => {
    return db('suppliers')
      .insert({
        ...data,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });
  },

  // Update supplier
  update: (id, data) => {
    return db('suppliers')
      .where({ id })
      .update({
        ...data,
        updated_at: db.fn.now()
      });
  },

  // Delete supplier
  delete: (id) => {
    return db('suppliers')
      .where({ id })
      .del();
  },

  // Get suppliers by status
  getByStatus: (status) => {
    return db('suppliers')
      .where({ status })
      .orderBy('name', 'asc');
  },

  // Get suppliers by category
  getByCategory: (category) => {
    return db('suppliers')
      .where({ category })
      .orderBy('name', 'asc');
  },

  // Search suppliers
  search: (query) => {
    return db('suppliers')
      .where('name', 'like', `%${query}%`)
      .orWhere('contact_person', 'like', `%${query}%`)
      .orWhere('email', 'like', `%${query}%`)
      .orWhere('phone', 'like', `%${query}%`)
      .orderBy('name', 'asc');
  },

  // Get supplier statistics
  getStats: async () => {
    const totalCount = await db('suppliers').count('* as count').first();
    const activeCount = await db('suppliers').where({ status: 'Active' }).count('* as count').first();
    const pendingCount = await db('suppliers').where({ status: 'Pending' }).count('* as count').first();
    
    // Get category distribution
    const categoryDistribution = await db('suppliers')
      .select('category')
      .count('* as count')
      .groupBy('category');
    
    // Get recent orders
    const recentOrders = await db('restock_orders')
      .join('suppliers', 'restock_orders.supplier_id', 'suppliers.id')
      .select(
        'restock_orders.id',
        'restock_orders.supplier_id',
        'suppliers.name as supplier_name',
        'restock_orders.order_date',
        'restock_orders.total_price',
        'restock_orders.status'
      )
      .orderBy('restock_orders.order_date', 'desc')
      .limit(5);
    
    return {
      total: parseInt(totalCount.count),
      active: parseInt(activeCount.count),
      pending: parseInt(pendingCount.count),
      categoryDistribution,
      recentOrders
    };
  },

  // Update supplier product count and last order date
  updateOrderInfo: async (supplierId, productCount = null, orderDate = null) => {
    const updates = {};
    
    if (productCount !== null) {
      updates.product_count = productCount;
    }
    
    if (orderDate !== null) {
      updates.last_order_date = orderDate;
    }
    
    if (Object.keys(updates).length > 0) {
      updates.updated_at = db.fn.now();
      
      await db('suppliers')
        .where({ id: supplierId })
        .update(updates);
    }
  },

  // Get supplier with order history
  getWithOrderHistory: async (id) => {
    const supplier = await db('suppliers')
      .where({ id })
      .first();
    
    if (!supplier) return null;
    
    const orders = await db('restock_orders')
      .where({ supplier_id: id })
      .orderBy('order_date', 'desc');
    
    return {
      ...supplier,
      orders
    };
  }
};

module.exports = Supplier; 