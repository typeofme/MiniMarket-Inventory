const db = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  // Get all users
  getAll: () => {
    return db('users').select('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'address', 'role', 'avatar_url', 'last_login', 'is_active', 'created_at').orderBy('created_at', 'desc');
  },

  // Get user by ID
  getById: (id) => {
    return db('users').where({ id }).select('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'address', 'role', 'avatar_url', 'last_login', 'is_active', 'created_at').first();
  },

  // Get user by email for authentication
  getByEmail: (email) => {
    return db('users').where({ email }).first();
  },

  // Get user by username for authentication
  getByUsername: (username) => {
    return db('users').where({ username }).first();
  },

  // Create new user
  create: async (userData) => {
    const now = new Date();
    
    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(userData.password, saltRounds);
    
    const user = {
      username: userData.username,
      email: userData.email,
      password_hash,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone || null,
      address: userData.address || null,
      role: userData.role || 'user',
      avatar_url: userData.avatar_url || null,
      is_active: true,
      created_at: now,
      updated_at: now
    };
    
    const [id] = await db('users').insert(user);
    return User.getById(id);
  },

  // Update user
  update: async (id, userData) => {
    const updateData = {
      ...userData,
      updated_at: new Date()
    };
    
    // If password is being updated, hash it
    if (userData.password) {
      const saltRounds = 12;
      updateData.password_hash = await bcrypt.hash(userData.password, saltRounds);
      delete updateData.password;
    }
    
    await db('users').where({ id }).update(updateData);
    return User.getById(id);
  },

  // Delete user
  delete: (id) => {
    return db('users').where({ id }).del();
  },

  // Verify password
  verifyPassword: async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  // Update last login
  updateLastLogin: (id) => {
    return db('users').where({ id }).update({ last_login: new Date() });
  },

  // Get user statistics
  getStats: async () => {
    const total = await db('users').count('id as count').first();
    const active = await db('users').where('is_active', true).count('id as count').first();
    const admins = await db('users').where('role', 'admin').count('id as count').first();
    const managers = await db('users').where('role', 'manager').count('id as count').first();
    const regularUsers = await db('users').where('role', 'user').count('id as count').first();
    
    return {
      total: total.count,
      active: active.count,
      admins: admins.count,
      managers: managers.count,
      users: regularUsers.count
    };
  },

  // Get users by role
  getByRole: (role) => {
    return db('users').where('role', role).select('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role', 'avatar_url', 'last_login', 'is_active', 'created_at').orderBy('created_at', 'desc');
  }
};

module.exports = User;
