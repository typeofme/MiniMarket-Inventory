const db = require('../config/database');

const Product = {
  // Get all products with category information
  getAll: () => {
    return db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .select(
        'products.*',
        'categories.name as category_name',
        'categories.slug as category_slug',
        'categories.icon as category_icon',
        'categories.color as category_color'
      )
      .orderBy('products.created_at', 'desc');
  },

  // Alias for getAllWithCategories (for controller compatibility)
  getAllWithCategories: function() {
    return this.getAll();
  },

  // Get all products without category info (for internal use)
  getAllBasic: () => {
    return db('products').select('*');
  },

  // Get a single product by ID with category information
  getById: (id) => {
    if (!id) {
      console.error('Attempted to get product with undefined ID');
      return Promise.resolve(null);
    }
    return db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .select(
        'products.*',
        'categories.name as category_name',
        'categories.slug as category_slug',
        'categories.icon as category_icon',
        'categories.color as category_color'
      )
      .where('products.id', id)
      .first();
  },

  // Alias for findById (for controller compatibility)
  findById: function(id) {
    return this.getById(id);
  },

  // Create a new product
  create: async (productData) => {
    // Insert the product and return the insertId
    try {
      const result = await db('products').insert({
        ...productData,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });
      
      // Different MySQL drivers might return the insertId differently
      let insertId;
      if (Array.isArray(result)) {
        insertId = result[0];
      } else if (result && typeof result === 'object') {
        insertId = result.insertId;
      } else {
        insertId = result;
      }
      
      return insertId;
    } catch (error) {
      console.error('Error in create method:', error);
      throw error;
    }
  },

  // Update a product
  update: async (id, productData) => {
    const result = await db('products')
      .where('id', id)
      .update({
        ...productData,
        updated_at: db.fn.now()
      });
    
    return result;
  },

  // Delete a product
  delete: (id) => {
    return db('products').where('id', id).del();
  },

  // Get product statistics
  getStats: async () => {
    try {
      const productsCount = await db('products').count('* as count').first();
      const stockSum = await db('products').sum('stock as total').first();
      const valueSum = await db('products').select(db.raw('SUM(price * stock) as total')).first();
      const avgPrice = await db('products').avg('price as average').first();
      
      // Get low stock products (stock <= 10)
      const lowStockCount = await db('products')
        .where('stock', '<=', 10)
        .count('* as count')
        .first();
      
      // Get out of stock products
      const outOfStockCount = await db('products')
        .where('stock', '=', 0)
        .count('* as count')
        .first();
      
      // Get products created in the last 7 days for trend calculation
      const recentProductsCount = await db('products')
        .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 7 DAY)'))
        .count('* as count')
        .first();
      
      // Get products created in the previous 7 days (8-14 days ago)
      const previousPeriodProductsCount = await db('products')
        .whereBetween('created_at', [
          db.raw('DATE_SUB(NOW(), INTERVAL 14 DAY)'),
          db.raw('DATE_SUB(NOW(), INTERVAL 7 DAY)')
        ])
        .count('* as count')
        .first();
      
      // Get value trend by comparing recent vs older products
      const recentValueSum = await db('products')
        .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 7 DAY)'))
        .select(db.raw('SUM(price * stock) as total'))
        .first();
      
      // Handle different MySQL drivers that might name the count column differently
      const count = productsCount?.count || 
                    productsCount?.['count(*)'] || 
                    productsCount?.['COUNT(*)'] || 0;
      
      const lowStock = lowStockCount?.count || 
                       lowStockCount?.['count(*)'] || 
                       lowStockCount?.['COUNT(*)'] || 0;
      
      const outOfStock = outOfStockCount?.count || 
                         outOfStockCount?.['count(*)'] || 
                         outOfStockCount?.['COUNT(*)'] || 0;
      
      const recentProducts = recentProductsCount?.count || 
                             recentProductsCount?.['count(*)'] || 
                             recentProductsCount?.['COUNT(*)'] || 0;
      
      const previousProducts = previousPeriodProductsCount?.count || 
                               previousPeriodProductsCount?.['count(*)'] || 
                               previousPeriodProductsCount?.['COUNT(*)'] || 0;
      
      // Calculate trends
      const productsTrend = previousProducts > 0 
        ? Math.round(((recentProducts - previousProducts) / previousProducts) * 100)
        : recentProducts > 0 ? 100 : 0;
      
      const valueTrend = count > 0 
        ? Math.round(((parseFloat(valueSum?.total || 0) / count) / 1000) * 10) / 10
        : 0;
      
      const stockHealthScore = count > 0 
        ? Math.round(((count - parseInt(lowStock)) / count) * 100)
        : 100;
      
      return {
        totalProducts: parseInt(count),
        totalStock: parseInt(stockSum?.total || 0),
        totalValue: parseFloat(valueSum?.total || 0),
        averagePrice: parseFloat(avgPrice?.average || 0),
        lowStockProducts: parseInt(lowStock),
        outOfStockProducts: parseInt(outOfStock),
        recentProducts: parseInt(recentProducts),
        productsTrend: productsTrend,
        valueTrend: valueTrend,
        stockHealthScore: stockHealthScore
      };
    } catch (error) {
      console.error('Error getting product stats:', error);
      return {
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        averagePrice: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        recentProducts: 0,
        productsTrend: 0,
        valueTrend: 0,
        stockHealthScore: 100
      };
    }
  },

  // Get products by category
  getByCategory: (categoryId) => {
    return db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .select(
        'products.*',
        'categories.name as category_name',
        'categories.slug as category_slug',
        'categories.icon as category_icon',
        'categories.color as category_color'
      )
      .where('products.category_id', categoryId)
      .orderBy('products.created_at', 'desc');
  },

  // Get top products with category information
  getTop: (limit = 5) => {
    try {
      return db('products')
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .select(
          'products.*',
          'categories.name as category_name',
          'categories.slug as category_slug',
          'categories.icon as category_icon',
          'categories.color as category_color'
        )
        .orderBy('price', 'desc')
        .limit(limit);
    } catch (error) {
      console.error('Error getting top products:', error);
      return [];
    }
  },

  // Get low stock products (stock <= threshold)
  getLowStock: (threshold = 10, limit = 10) => {
    return db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .select(
        'products.*',
        'categories.name as category_name',
        'categories.slug as category_slug',
        'categories.icon as category_icon',
        'categories.color as category_color'
      )
      .where('products.stock', '<=', threshold)
      .where('products.stock', '>', 0) // Exclude out of stock items
      .orderBy('products.stock', 'asc') // Show lowest stock first
      .limit(limit);
  },

  // Get out of stock products
  getOutOfStock: (limit = 10) => {
    return db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .select(
        'products.*',
        'categories.name as category_name',
        'categories.slug as category_slug',
        'categories.icon as category_icon',
        'categories.color as category_color'
      )
      .where('products.stock', '=', 0)
      .orderBy('products.created_at', 'desc')
      .limit(limit);
  },

  // Get inventory value by category
  getInventoryValueByCategory: async () => {
    try {
      const result = await db('products')
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .select(
          'categories.name as category_name',
          db.raw('COALESCE(categories.name, "Uncategorized") as category'),
          db.raw('SUM(products.price * products.stock) as total_value'),
          db.raw('COUNT(products.id) as product_count'),
          db.raw('SUM(products.stock) as total_stock')
        )
        .groupBy('products.category_id', 'categories.name')
        .orderBy('total_value', 'desc');

      return result.map(row => ({
        category: row.category || 'Uncategorized',
        totalValue: parseFloat(row.total_value || 0),
        productCount: parseInt(row.product_count || 0),
        totalStock: parseInt(row.total_stock || 0)
      }));
    } catch (error) {
      console.error('Error getting inventory value by category:', error);
      return [];
    }
  }
};

module.exports = Product;