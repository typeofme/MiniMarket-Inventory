const db = require('../config/database');

async function checkLogsData() {
  try {
    // Check if logs table exists and has data
    const tableExists = await db.schema.hasTable('logs');
    console.log('Logs table exists:', tableExists);
    
    if (tableExists) {
      const count = await db('logs').count('* as count').first();
      console.log('Number of logs in database:', count.count);
      
      if (count.count === 0) {
        console.log('No logs found, inserting sample data...');
        
        // Insert sample logs
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
              price: 29.99
            }),
            new_values: JSON.stringify({
              price: 24.99
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
          }
        ];
        
        await db('logs').insert(sampleLogs);
        console.log('✅ Sample logs inserted successfully');
      } else {
        console.log('Sample logs already exist');
        
        // Show some sample data
        const logs = await db('logs').limit(3);
        console.log('Sample logs:');
        logs.forEach(log => {
          console.log(`- ${log.action} on ${log.entity_type} #${log.entity_id}: ${log.description}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking logs data:', error);
  } finally {
    await db.destroy();
  }
}

checkLogsData();
