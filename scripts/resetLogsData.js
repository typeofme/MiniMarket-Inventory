const db = require('../config/database');

async function resetLogsData() {
  try {
    // Clear existing logs
    await db('logs').truncate();
    console.log('Cleared existing logs');
    
    // Insert proper sample logs
    const sampleLogs = [
      {
        user_id: 1,
        action: 'create',
        entity_type: 'product',
        entity_id: 1,
        new_values: JSON.stringify({
          name: 'Wireless Headphones',
          price: 99.99,
          stock: 50
        }),
        description: 'Created new product: Wireless Headphones',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        user_id: 1,
        action: 'update',
        entity_type: 'product',
        entity_id: 1,
        old_values: JSON.stringify({
          price: 99.99
        }),
        new_values: JSON.stringify({
          price: 89.99
        }),
        description: 'Updated product price: Wireless Headphones',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: new Date(Date.now() - 43200000) // 12 hours ago
      },
      {
        user_id: 1,
        action: 'restock',
        entity_type: 'product',
        entity_id: 1,
        old_values: JSON.stringify({
          stock: 50
        }),
        new_values: JSON.stringify({
          stock: 100,
          quantity_added: 50
        }),
        description: 'Restocked product: Wireless Headphones (+50 units)',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: new Date(Date.now() - 21600000) // 6 hours ago
      },
      {
        user_id: 1,
        action: 'create',
        entity_type: 'product',
        entity_id: 2,
        new_values: JSON.stringify({
          name: 'Gaming Mouse',
          price: 49.99,
          stock: 25
        }),
        description: 'Created new product: Gaming Mouse',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: new Date(Date.now() - 10800000) // 3 hours ago
      },
      {
        user_id: 1,
        action: 'edit',
        entity_type: 'product',
        entity_id: 2,
        old_values: JSON.stringify({
          description: 'Old description'
        }),
        new_values: JSON.stringify({
          description: 'High precision gaming mouse with RGB lighting'
        }),
        description: 'Edited product description: Gaming Mouse',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: new Date(Date.now() - 3600000) // 1 hour ago
      }
    ];
    
    await db('logs').insert(sampleLogs);
    console.log('✅ Sample logs inserted successfully');
    
    // Verify the data
    const count = await db('logs').count('* as count').first();
    console.log(`Total logs in database: ${count.count}`);
    
    const logs = await db('logs').orderBy('created_at', 'desc');
    console.log('\nSample logs:');
    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.action} on ${log.entity_type} #${log.entity_id}: ${log.description}`);
    });
    
  } catch (error) {
    console.error('❌ Error resetting logs data:', error);
  } finally {
    await db.destroy();
  }
}

resetLogsData();
