const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware to verify JWT token for API routes
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.getById(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Add user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware to verify JWT token for web pages (redirects to login)
const authenticateWeb = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    // Check for token in cookies (HTTP-only) - this should work across browser windows
    if (!token && req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }
    
    // Also check for token in session if not in cookies
    if (!token && req.session && req.session.token) {
      token = req.session.token;
    }
    
    // Also check for token in custom header (from session storage)
    if (!token && req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }
    
    if (!token) {
      return res.redirect('/login');
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.getById(decoded.userId);
    
    if (!user || !user.is_active) {
      // Clear invalid session and cookies
      if (req.session) {
        req.session.destroy();
      }
      res.clearCookie('authToken');
      return res.redirect('/login');
    }
    
    // Add user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
    
    // Store token in session for future requests
    if (req.session) {
      req.session.token = token;
      req.session.userId = user.id;
    }
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    // Clear invalid session and cookies
    if (req.session) {
      req.session.destroy();
    }
    res.clearCookie('authToken');
    return res.redirect('/login');
  }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Convert single role to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = requireRole(['admin']);

// Middleware to check if user is admin or manager
const requireManager = requireRole(['admin', 'manager']);

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.getById(decoded.userId);
      
      if (user && user.is_active) {
        req.user = {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role
        };
      }
    }
    
    next();
  } catch (error) {
    // Don't fail - just continue without user
    next();
  }
};

module.exports = {
  authenticateToken,
  authenticateWeb,
  requireRole,
  requireAdmin,
  requireManager,
  optionalAuth
};
