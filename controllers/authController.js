const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const AuthController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { username, email, password, first_name, last_name, phone, address, role } = req.body;
      
      // Check if user already exists
      const existingUser = await User.getByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      
      const existingUsername = await User.getByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      // Create user
      const user = await User.create({
        username,
        email,
        password,
        first_name,
        last_name,
        phone,
        address,
        role
      });
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        }
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      // Find user by username or email
      let user = await User.getByUsername(username);
      if (!user) {
        user = await User.getByEmail(username);
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      if (!user.is_active) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }
      
      // Verify password
      const isValidPassword = await User.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Update last login
      await User.updateLastLogin(user.id);
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      // Set token in HTTP-only cookie for server-side authentication
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
      });
      
      // Also store in session for backup
      req.session.token = token;
      req.session.userId = user.id;
      
      res.json({
        success: true,
        message: 'Login successful',
        token, // Still send token for client-side API calls
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          avatar: user.avatar
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  // Logout user (clear cookies and session)
  logout: async (req, res) => {
    try {
      // Clear HTTP-only cookie
      res.clearCookie('authToken');
      
      // Clear session
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destroy error:', err);
          }
        });
      }
      
      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  },

  // Get current user profile
  profile: async (req, res) => {
    try {
      const user = await User.getById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          address: user.address,
          role: user.role,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          last_login: user.last_login
        }
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { first_name, last_name, phone, address, avatar } = req.body;
      
      const updatedUser = await User.update(userId, {
        first_name,
        last_name,
        phone,
        address,
        avatar
      });
      
      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
      
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }
      
      // Get user with password hash
      const user = await User.getByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Verify current password
      const isValidPassword = await User.verifyPassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      // Update password
      await User.update(userId, { password: newPassword });
      
      res.json({ message: 'Password changed successfully' });
      
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  },

  // Check authentication status
  checkAuth: async (req, res) => {
    try {
      // If we reach here, the user is authenticated (middleware passed)
      res.json({ 
        authenticated: true, 
        user: {
          id: req.user.userId,
          username: req.user.username,
          email: req.user.email,
          role: req.user.role
        }
      });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(401).json({ authenticated: false, error: 'Authentication failed' });
    }
  }
};

module.exports = AuthController;
