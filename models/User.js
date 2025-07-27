const db = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const User = {
  // Get all users
  getAll: () => {
    return db('users').select('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'address', 'role', 'avatar_url', 'last_login', 'is_active', 'created_at').orderBy('created_at', 'desc');
  },

  // Get user by ID
  getById: (id) => {
    return db('users').where({ id }).select('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'address', 'role', 'avatar', 'avatar_url', 'last_login', 'is_active', 'created_at').first();
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
    
    // If avatar is being updated, delete the old one
    if (userData.avatar || userData.avatar_url) {
      const currentUser = await User.getById(id);
      if (currentUser) {
        await User.deleteUserAvatar(currentUser);
      }
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

  // Delete user avatar
  deleteUserAvatar: async (user) => {
    if (!user) return false;
    
    let deleted = false;
    
    // Try to delete from avatar field
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      try {
        const avatarPath = path.join(__dirname, '../public', user.avatar);
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
          console.log(`Deleted avatar from ${avatarPath}`);
          deleted = true;
        }
      } catch (err) {
        console.error('Error deleting avatar:', err);
      }
    }
    
    // Try to delete from avatar_url field if different
    if (!deleted && user.avatar_url && 
        user.avatar_url.startsWith('/uploads/avatars/') && 
        (!user.avatar || user.avatar !== user.avatar_url)) {
      try {
        const avatarUrlPath = path.join(__dirname, '../public', user.avatar_url);
        if (fs.existsSync(avatarUrlPath)) {
          fs.unlinkSync(avatarUrlPath);
          console.log(`Deleted avatar from ${avatarUrlPath}`);
          deleted = true;
        }
      } catch (err) {
        console.error('Error deleting avatar_url:', err);
      }
    }
    
    return deleted;
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
