const db = require('../config/database');

const Log = {
  // Base query with all necessary joins
  getBaseQuery: () => {
    return db('logs')
      .leftJoin('users', 'logs.user_id', 'users.id')
      .leftJoin('products', function() {
        this.on('logs.entity_id', '=', 'products.id')
          .andOn('logs.entity_type', '=', db.raw('?', ['product']));
      })
      .select(
        'logs.*',
        'users.username as user_name',
        'users.email as user_email',
        // Prioritize stored product_name over joined product name
        db.raw('COALESCE(logs.product_name, products.name) as product_name')
      );
  },

  // Get all logs with user and related entity information
  getAll: () => {
    return db('logs')
      .leftJoin('users', 'logs.user_id', 'users.id')
      .leftJoin('products', 'logs.entity_id', 'products.id')
      .select(
        'logs.*',
        'users.username as user_name',
        'users.email as user_email',
        // Prioritize stored product_name over joined product name
        db.raw('COALESCE(logs.product_name, products.name) as product_name')
      )
      .orderBy('logs.created_at', 'desc');
  },

  // Get logs with pagination
  getPaginated: (page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    return db('logs')
      .leftJoin('users', 'logs.user_id', 'users.id')
      .leftJoin('products', 'logs.entity_id', 'products.id')
      .select(
        'logs.*',
        'users.username as user_name',
        'users.email as user_email',
        // Prioritize stored product_name over joined product name
        db.raw('COALESCE(logs.product_name, products.name) as product_name')
      )
      .orderBy('logs.created_at', 'desc')
      .limit(limit)
      .offset(offset);
  },

  // Get total count for pagination
  getCount: () => {
    return db('logs').count('* as count').first();
  },

  // Get logs filtered by action type
  getByAction: (action) => {
    return db('logs')
      .leftJoin('users', 'logs.user_id', 'users.id')
      .leftJoin('products', 'logs.entity_id', 'products.id')
      .select(
        'logs.*',
        'users.username as user_name',
        'users.email as user_email',
        'products.name as product_name'
      )
      .where('logs.action', action)
      .orderBy('logs.created_at', 'desc');
  },

  // Get logs for a specific entity
  getByEntity: (entityType, entityId) => {
    return db('logs')
      .leftJoin('users', 'logs.user_id', 'users.id')
      .leftJoin('products', 'logs.entity_id', 'products.id')
      .select(
        'logs.*',
        'users.username as user_name',
        'users.email as user_email',
        'products.name as product_name'
      )
      .where({
        'logs.entity_type': entityType,
        'logs.entity_id': entityId
      })
      .orderBy('logs.created_at', 'desc');
  },

  // Get logs by user
  getByUser: (userId) => {
    return db('logs')
      .leftJoin('users', 'logs.user_id', 'users.id')
      .leftJoin('products', 'logs.entity_id', 'products.id')
      .select(
        'logs.*',
        'users.username as user_name',
        'users.email as user_email',
        'products.name as product_name'
      )
      .where('logs.user_id', userId)
      .orderBy('logs.created_at', 'desc');
  },

  // Get logs within date range
  getByDateRange: (startDate, endDate) => {
    return db('logs')
      .leftJoin('users', 'logs.user_id', 'users.id')
      .leftJoin('products', 'logs.entity_id', 'products.id')
      .select(
        'logs.*',
        'users.username as user_name',
        'users.email as user_email',
        'products.name as product_name'
      )
      .whereBetween('logs.created_at', [startDate, endDate])
      .orderBy('logs.created_at', 'desc');
  },

  // Helper function to clean data before logging (remove/truncate base64 images)
  cleanDataForLogging: (data) => {
    if (!data || typeof data !== 'object') return data;
    
    const cleaned = JSON.parse(JSON.stringify(data));
    
    const cleanObject = (obj) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'string' && obj[key].startsWith('data:image/')) {
            // Store just the image type and size info instead of full base64
            const imageType = obj[key].split(';')[0].replace('data:image/', '');
            const imageSize = Math.round(obj[key].length / 1024); // Size in KB
            obj[key] = `[BASE64_IMAGE_${imageType.toUpperCase()}_${imageSize}KB]`;
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            cleanObject(obj[key]);
          }
        }
      }
    };
    
    cleanObject(cleaned);
    return cleaned;
  },

  // Create a new log entry
  create: (logData) => {
    const log = {
      user_id: logData.user_id,
      action: logData.action, // 'create', 'update', 'delete', 'restock', 'edit'
      entity_type: logData.entity_type, // 'product', 'category', 'asset', etc.
      entity_id: logData.entity_id,
      old_values: logData.old_values ? JSON.stringify(Log.cleanDataForLogging(logData.old_values)) : null,
      new_values: logData.new_values ? JSON.stringify(Log.cleanDataForLogging(logData.new_values)) : null,
      description: logData.description,
      ip_address: logData.ip_address,
      user_agent: logData.user_agent,
      created_at: new Date()
    };

    return db('logs').insert(log);
  },

  // Get a single log by ID
  getById: (id) => {
    return Log.getBaseQuery()
      .where('logs.id', id)
      .first();
  },

  // Delete old logs (for cleanup)
  deleteOlderThan: (days) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return db('logs')
      .where('created_at', '<', cutoffDate)
      .del();
  },

  // Get activity summary
  getActivitySummary: (days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return db('logs')
      .select('action')
      .count('* as count')
      .where('created_at', '>=', startDate)
      .groupBy('action')
      .orderBy('count', 'desc');
  },

  // Get recent activity for dashboard
  getRecentActivity: (limit = 10) => {
    return db('logs')
      .leftJoin('users', 'logs.user_id', 'users.id')
      .leftJoin('products', 'logs.entity_id', 'products.id')
      .select(
        'logs.*',
        'users.username as user_name',
        'products.name as product_name'
      )
      .orderBy('logs.created_at', 'desc')
      .limit(limit);
  },

  // Get today's activity count
  getTodayActivity: () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return db('logs')
      .count('* as count')
      .whereBetween('created_at', [startOfDay, endOfDay])
      .first();
  }
};

module.exports = Log;
