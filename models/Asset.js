const db = require('../config/database');

const Asset = {
  // Get all assets
  getAll: () => {
    return db('asset').select('*').orderBy('created_at', 'desc');
  },

  // Get asset by ID
  getById: (id) => {
    return db('asset').where({ id }).first();
  },

  // Create new asset (auto timestamp)
  create: (data) => {
    const now = new Date();
    return db('asset').insert({
      ...data,
      created_at: now,
      updated_at: now
    });
  },

  // Update asset (auto updated_at)
  update: (id, data) => {
    return db('asset').where({ id }).update({
      ...data,
      updated_at: new Date()
    });
  },

  // Delete asset
  delete: (id) => {
    return db('asset').where({ id }).del();
  },

  // Get asset statistics
  getStats: async () => {
    const total = await db('asset').count('id as count').first();
    const active = await db('asset').whereRaw('LOWER(status) = ?', ['active']).count('id as count').first();
    const maintenance = await db('asset').whereRaw('LOWER(status) = ?', ['maintenance']).count('id as count').first();
    const retired = await db('asset').whereRaw('LOWER(status) = ?', ['retired']).count('id as count').first();
    return {
      total: Number(total.count),
      active: Number(active.count),
      maintenance: Number(maintenance.count),
      retired: Number(retired.count)
    };
  },

  // Get assets by status
  getByStatus: (status) => {
    return db('asset').whereRaw('LOWER(status) = ?', [status.toLowerCase()]).orderBy('created_at', 'desc');
  },

  // Get assets by condition
  getByCondition: (condition) => {
    return db('asset').whereRaw('LOWER(condition) = ?', [condition.toLowerCase()]).orderBy('created_at', 'desc');
  }
};

module.exports = Asset;
