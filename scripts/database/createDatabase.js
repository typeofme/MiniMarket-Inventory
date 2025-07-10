require('dotenv').config();
const knex = require('knex');

async function createDatabase() {
  console.log('🔍 Checking database connection and existence...');
  
  const dbName = process.env.DB_NAME || 'minimarketdb';
  let tempDb = null;
  
  try {
    // Create connection without specifying a database
    tempDb = knex({
      client: 'mysql2',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
      }
    });
    
    console.log(`Checking if database '${dbName}' exists...`);
    
    // Try to create the database (will fail if it already exists)
    await tempDb.raw(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    // Verify database was created
    const databases = await tempDb.raw('SHOW DATABASES');
    const dbList = databases[0].map(db => db[`Database`]);
    
    if (dbList.includes(dbName)) {
      console.log(`✅ Database '${dbName}' is ready to use.`);
      return true;
    } else {
      console.error(`❌ Database '${dbName}' was not created successfully.`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error working with database: ${error.message}`);
    return false;
  } finally {
    if (tempDb) {
      await tempDb.destroy();
    }
  }
}

// Run the script if executed directly
if (require.main === module) {
  createDatabase()
    .then((success) => {
      console.log('Database check completed.');
      if (!success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Database check failed:', err);
      process.exit(1);
    });
}

module.exports = { createDatabase }; 