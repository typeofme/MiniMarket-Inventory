const Log = require('../models/Log');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Helper function to get user ID from token
const getUserIdFromToken = (req) => {
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

// Get all logs with pagination and filtering
exports.getAllLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const action = req.query.action;
    const search = req.query.search;
    const entityType = req.query.entity_type;
    const userId = req.query.user_id;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    // Always use the same base query to ensure consistent data structure
    let query = Log.getBaseQuery();

    // Apply filters
    if (action && action !== '') {
      query = query.where('logs.action', action);
    }

    if (search && search !== '') {
      query = query.where(function() {
        this.where('logs.description', 'like', `%${search}%`)
          .orWhere('users.username', 'like', `%${search}%`)
          .orWhere('products.name', 'like', `%${search}%`);
      });
    }

    if (entityType && req.query.entity_id) {
      query = query.where({
        'logs.entity_type': entityType,
        'logs.entity_id': req.query.entity_id
      });
    }

    if (userId) {
      query = query.where('logs.user_id', userId);
    }

    if (startDate && endDate) {
      query = query.whereBetween('logs.created_at', [startDate, endDate]);
    }

    // Get total count for pagination
    const totalQuery = query.clone();
    const totalResult = await totalQuery.count('* as count').first();
    const totalCount = totalResult.count;

    // Apply pagination and get results
    const offset = (page - 1) * limit;
    const logs = await query
      .orderBy('logs.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Parse JSON fields with error handling
    const logsWithParsedData = logs.map(log => {
      let oldValues = null;
      let newValues = null;
      
      // Safely parse old_values
      if (log.old_values) {
        try {
          oldValues = JSON.parse(log.old_values);
        } catch (error) {
          console.warn(`Failed to parse old_values for log ${log.id}:`, error.message);
          oldValues = { error: 'Failed to parse JSON data' };
        }
      }
      
      // Safely parse new_values
      if (log.new_values) {
        try {
          newValues = JSON.parse(log.new_values);
        } catch (error) {
          console.warn(`Failed to parse new_values for log ${log.id}:`, error.message);
          newValues = { error: 'Failed to parse JSON data' };
        }
      }
      
      return {
        ...log,
        old_values: oldValues,
        new_values: newValues
      };
    });

    res.json({
      logs: logsWithParsedData,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

// Get a single log by ID
exports.getLog = async (req, res) => {
  try {
    const log = await Log.getById(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    // Parse JSON fields with error handling
    let oldValues = null;
    let newValues = null;
    
    // Safely parse old_values
    if (log.old_values) {
      try {
        oldValues = JSON.parse(log.old_values);
      } catch (error) {
        console.warn(`Failed to parse old_values for log ${log.id}:`, error.message);
        oldValues = { error: 'Failed to parse JSON data' };
      }
    }
    
    // Safely parse new_values
    if (log.new_values) {
      try {
        newValues = JSON.parse(log.new_values);
      } catch (error) {
        console.warn(`Failed to parse new_values for log ${log.id}:`, error.message);
        newValues = { error: 'Failed to parse JSON data' };
      }
    }

    const logWithParsedData = {
      ...log,
      old_values: oldValues,
      new_values: newValues
    };

    res.json(logWithParsedData);
  } catch (error) {
    console.error('Error fetching log:', error);
    res.status(500).json({ error: 'Failed to fetch log' });
  }
};

// Create a new log entry (used internally by other controllers)
exports.createLog = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate action
    const validActions = ['create', 'update', 'delete', 'restock', 'edit'];
    if (!validActions.includes(req.body.action)) {
      return res.status(400).json({ error: 'Invalid action. Must be one of: ' + validActions.join(', ') });
    }

    const logData = {
      user_id: userId,
      action: req.body.action,
      entity_type: req.body.entity_type,
      entity_id: req.body.entity_id,
      old_values: req.body.old_values,
      new_values: req.body.new_values,
      description: req.body.description,
      ip_address: normalizeIpAddress(req),
      user_agent: req.get('User-Agent')
    };

    await Log.create(logData);
    res.status(201).json({ message: 'Log created successfully' });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: 'Failed to create log' });
  }
};

// Get activity summary
exports.getActivitySummary = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const summary = await Log.getActivitySummary(days);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    res.status(500).json({ error: 'Failed to fetch activity summary' });
  }
};

// Get recent activity for dashboard
exports.getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    // Get recent logs with user and product information
    const logs = await Log.getBaseQuery()
      .orderBy('logs.created_at', 'desc')
      .limit(limit);

    // Format logs for dashboard display
    const activities = logs.map(log => {
      // Determine activity color based on action
      let dotClass = 'bg-blue-500';
      let icon = 'fas fa-info';
      
      switch (log.action) {
        case 'create':
          dotClass = 'bg-green-500';
          icon = 'fas fa-plus';
          break;
        case 'update':
          dotClass = 'bg-blue-500';
          icon = 'fas fa-edit';
          break;
        case 'delete':
          dotClass = 'bg-red-500';
          icon = 'fas fa-trash';
          break;
        case 'restock':
          dotClass = 'bg-purple-500';
          icon = 'fas fa-boxes';
          break;
        default:
          dotClass = 'bg-gray-500';
          icon = 'fas fa-info';
      }

      // Format timestamp
      const timeAgo = formatTimeAgo(new Date(log.created_at));
      
      // Create activity description
      let action = log.description || `${log.action} ${log.entity_type}`;
      let details = log.product_name || `${log.entity_type} #${log.entity_id}`;
      
      if (log.user_name) {
        details += ` by ${log.user_name}`;
      }

      return {
        id: log.id,
        action,
        details,
        timestamp: timeAgo,
        dotClass,
        icon,
        created_at: log.created_at
      };
    });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
};

// Helper function to log product actions (used by productController)
exports.logProductAction = async (action, userId, entityType, entityId, oldValues, newValues, description, req, productName = null) => {
  try {
    // Clean and format the data for better readability
    const cleanOldValues = oldValues ? cleanLogData(oldValues) : null;
    const cleanNewValues = newValues ? cleanLogData(newValues) : null;
    
    const logData = {
      user_id: userId,
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      product_name: productName,
      old_values: cleanOldValues ? JSON.stringify(cleanOldValues) : null,
      new_values: cleanNewValues ? JSON.stringify(cleanNewValues) : null,
      description: description,
      ip_address: normalizeIpAddress(req),
      user_agent: req?.get('User-Agent') || null
    };

    await Log.create(logData);
  } catch (error) {
    console.error('Error logging product action:', error);
  }
};

// Helper function to clean log data for better readability
function cleanLogData(data) {
  if (!data) return null;
  
  const cleaned = { ...data };
  
  // Handle image data - replace with placeholder for readability
  if (cleaned.image && typeof cleaned.image === 'string' && cleaned.image.startsWith('data:image/')) {
    const imageType = cleaned.image.substring(5, cleaned.image.indexOf(';'));
    const imageSize = Math.round(cleaned.image.length / 1024);
    cleaned.image = `[${imageType.toUpperCase()} Image - ${imageSize}KB]`;
  }
  
  // Remove undefined/null values for cleaner display
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined || cleaned[key] === null) {
      delete cleaned[key];
    }
  });
  
  return cleaned;
}

// Helper function to normalize IP addresses
function normalizeIpAddress(req) {
  if (!req) return null;
  
  let ip = req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           'unknown';
  
  // Handle IPv6 mapped IPv4 addresses
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return 'localhost';
  }
  
  // Remove IPv6 prefix for IPv4 addresses
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  return ip;
}

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

module.exports = { 
  getAllLogs: exports.getAllLogs,
  getLog: exports.getLog,
  createLog: exports.createLog,
  getActivitySummary: exports.getActivitySummary,
  getRecentActivity: exports.getRecentActivity,
  logProductAction: exports.logProductAction
};
