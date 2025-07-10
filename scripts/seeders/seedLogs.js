const db = require('../../config/database');

const sampleLogs = [
  {
    user_id: 1,
    action: 'create',
    entity_type: 'product',
    entity_id: 1,
    new_values: JSON.stringify({
      name: 'Sample Product',
      price: 29.99,
      stock: 100
    }),
    description: 'Created new product: Sample Product',
    created_at: new Date(Date.now() - 86400000) // 1 day ago
  },
  {
    user_id: 1,
    action: 'update',
    entity_type: 'product',
    entity_id: 1,
    old_values: JSON.stringify({
      name: 'Sample Product',
      price: 29.99,
      stock: 100
    }),
    new_values: JSON.stringify({
      name: 'Sample Product',
      price: 24.99,
      stock: 100
    }),
    description: 'Updated product price: Sample Product',
    created_at: new Date(Date.now() - 43200000) // 12 hours ago
  },
  {
    user_id: 1,
    action: 'restock',
    entity_type: 'product',
    entity_id: 1,
    old_values: JSON.stringify({
      stock: 100
    }),
    new_values: JSON.stringify({
      stock: 150,
      quantity_added: 50
    }),
    description: 'Restocked product: Sample Product (+50 units)',
    created_at: new Date(Date.now() - 21600000) // 6 hours ago
  },
  {
    user_id: 1,
    action: 'edit',
    entity_type: 'product',
    entity_id: 1,
    old_values: JSON.stringify({
      description: 'Old description'
    }),
    new_values: JSON.stringify({
      description: 'Updated product description'
    }),
    description: 'Edited product description: Sample Product',
    created_at: new Date(Date.now() - 10800000) // 3 hours ago
  },
  {
    user_id: 1,
    action: 'delete',
    entity_type: 'product',
    entity_id: 2,
    old_values: JSON.stringify({
      name: 'Deleted Product',
      price: 19.99,
      stock: 25
    }),
    description: 'Deleted product: Deleted Product',
    created_at: new Date(Date.now() - 3600000) // 1 hour ago
  }
];

const seedLogs = async () => {
  try {
    // Check if logs already exist
    const existingLogs = await db('logs').count('* as count').first();
    
    if (existingLogs.count > 0) {
      console.log('ℹ️ Sample logs already exist, skipping seeding');
      return;
    }
    
    // Check if users exist before inserting logs (to satisfy foreign key constraint)
    const usersExist = await db('users').count('* as count').first();
    
    if (usersExist.count === 0) {
      console.log('⚠️ No users found in the database. Creating logs without user_id references.');
      
      // Create modified logs without user_id
      const logsWithoutUserId = sampleLogs.map(log => {
        const { user_id, ...logWithoutUserId } = log;
        return logWithoutUserId;
      });
      
      await db('logs').insert(logsWithoutUserId);
      console.log('✅ Sample logs seeded successfully (without user_id references)');
      console.log(`📊 Inserted ${logsWithoutUserId.length} log entries`);
    } else {
      // Insert sample logs with user_id references
      await db('logs').insert(sampleLogs);
      console.log('✅ Sample logs seeded successfully');
      console.log(`📊 Inserted ${sampleLogs.length} log entries`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding logs:', error);
    throw error;
  }
};

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedLogs()
    .then(() => {
      console.log('Log seeding completed');
      db.destroy();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Log seeding failed:', error);
      db.destroy();
      process.exit(1);
    });
}

module.exports = { seedLogs };
