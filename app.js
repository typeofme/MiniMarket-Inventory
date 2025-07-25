const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const app = express();

// Database configuration
const db = require('./config/database');

// Authentication middleware
const { authenticateToken, authenticateWeb, optionalAuth } = require('./middleware/auth');

dotenv.config();

// Trust proxy for IP address detection
app.set('trust proxy', true);

app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Middleware to extract token from session storage and add to headers
app.use((req, res, next) => {
  // For web page requests, check if we can get token from client-side
  const token = req.headers['x-auth-token'] || req.headers['authorization'];
  if (token && !req.headers['authorization']) {
    req.headers['authorization'] = `Bearer ${token.replace('Bearer ', '')}`;
  }
  next();
});

app.use('/components', express.static(path.join(__dirname, 'components'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Import routes
const suppliersRoute = require('./routes/suppliers');
const authRoute = require('./routes/auth');
const productsRoute = require('./routes/products');
const reportRoute = require('./routes/report');
const templateRoute = require('./routes/template');
const assetRoute = require('./routes/asset');
const logsRoute = require('./routes/logs');
const apiProductsRoute = require('./routes/api/products');
const apiCategoriesRoute = require('./routes/api/categories');
const apiReportsRoute = require("./routes/api/reports");
const apiSupportRoute = require("./routes/api/support");
const apiAssetRoute = require('./routes/api/asset');
const apiLogsRoute = require('./routes/api/logs');
const apiRestockOrdersRoute = require('./routes/api/restock_orders');
const apiSuppliersRoute = require('./routes/api/suppliers');

// Authentication routes (public)
app.use('/api/auth', authRoute);

// Public login page - check if already authenticated
app.get('/login', async (req, res) => {
  try {
    // Check if user is already authenticated via cookies
    let token = req.cookies && req.cookies.authToken;
    
    // Also check session
    if (!token && req.session && req.session.token) {
      token = req.session.token;
    }
    
    if (token) {
      // Verify token
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET;
      const User = require('./models/User');
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.getById(decoded.userId);
        
        if (user && user.is_active) {
          // User is already authenticated, redirect to dashboard
          return res.redirect('/');
        }
      } catch (error) {
        // Invalid token, clear it
        if (req.session) {
          req.session.destroy();
        }
        res.clearCookie('authToken');
      }
    }
    
    // Not authenticated, show login page
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
  } catch (error) {
    console.error('Login page error:', error);
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
  }
});

// Dashboard route (main page) - protected
app.get('/', authenticateWeb, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// Other protected routes - require authentication

app.use('/suppliers', authenticateWeb, suppliersRoute);
app.use('/reports', authenticateWeb, reportRoute);
app.use('/temp', authenticateWeb, templateRoute);
app.use('/products', authenticateWeb, productsRoute);
app.use('/asset', authenticateWeb, assetRoute);
app.use('/logs', authenticateWeb, logsRoute);
app.get('/restock', authenticateWeb, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'restock.html'));
});
app.get('/categories', authenticateWeb, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'categories.html'));
});
app.get('/profile', authenticateWeb, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

// Protected API routes
app.use('/api/asset', authenticateToken, apiAssetRoute);
app.use("/api/reports", authenticateToken, apiReportsRoute);
app.use("/api/support", authenticateToken, apiSupportRoute);
app.use('/api/products', authenticateToken, apiProductsRoute);
app.use('/api/categories', authenticateToken, apiCategoriesRoute);
app.use('/api/logs', authenticateToken, apiLogsRoute);
app.use('/api/restock_orders', authenticateToken, apiRestockOrdersRoute);
app.use('/api/suppliers', authenticateToken, apiSuppliersRoute);

app.get('/api/status', async (req, res) => {
  let dbStatus = 'disconnected';
  
  try {
    // Check if DB is connected by running a simple query
    await db.raw('SELECT 1+1 as result');
    dbStatus = 'connected';
  } catch (error) {
    console.error('Database connection error:', error);
  }
  
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus
  });
});

app.post('/api/debug', (req, res) => {
  res.json({
    message: 'Request received',
    body: req.body,
    headers: req.headers,
    method: req.method,
    url: req.url,
    time: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});