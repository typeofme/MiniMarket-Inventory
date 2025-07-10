const path = require('path');
require('dotenv').config();

// Import the database creation script
const { createDatabase } = require('./database/createDatabase');

// Import the unified migration script
const { createAllTables } = require('./database/unifiedMigration');

// Import seed functions
const { seedUsers } = require('./seeders/seedUsers');
const seedData = require('./seeders/seedData'); // Import the entire seedData module
const { seedLogs } = require('./seeders/seedLogs');
const seedReports = require('./seeders/seedReports'); // Import the entire seedReports module
const { seedAssets } = require('./seeders/seedAssets');

// Helper function to wait for a specified time
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

console.log('🔧 MiniMarket Database Initialization\n');

// Run the entire setup process
async function initializeDatabase() {
  try {
    // Step 0: Create database if it doesn't exist
    console.log('Step 0: Creating database if needed...');
    const dbCreated = await createDatabase();
    
    if (!dbCreated) {
      throw new Error('Failed to create or verify database. Please check your database configuration.');
    }
    
    // Step 1: Create all tables
    console.log('\nStep 1: Creating database tables...');
    const tablesCreated = await createAllTables();
    
    if (!tablesCreated) {
      throw new Error('Failed to create database tables. Please check the error messages above.');
    }
    
    // Small delay to ensure tables are ready
    await sleep(1000);
    
    // Step 2: Seed initial data
    console.log('\nStep 2: Seeding initial data...');
    
    let seedingSuccess = true;
    
    try {
      console.log('  - Seeding users...');
      await seedUsers();
    } catch (error) {
      console.error('    ❌ Error seeding users:', error.message);
      console.log('    Continuing with other seeds...');
      seedingSuccess = false;
    }
    
    try {
      console.log('  - Seeding categories and products...');
      // Call the seedDatabase function directly
      await seedData();
    } catch (error) {
      console.error('    ❌ Error seeding categories and products:', error.message);
      console.log('    Continuing with other seeds...');
      seedingSuccess = false;
    }
    
    try {
      console.log('  - Seeding logs...');
      await seedLogs();
    } catch (error) {
      console.error('    ❌ Error seeding logs:', error.message);
      console.log('    Continuing with other seeds...');
      seedingSuccess = false;
    }
    
    try {
      console.log('  - Seeding reports...');
      // Call the seedReports function directly
      await seedReports();
    } catch (error) {
      console.error('    ❌ Error seeding reports:', error.message);
      console.log('    Continuing with other seeds...');
      seedingSuccess = false;
    }
    
    try {
      console.log('  - Seeding assets...');
      await seedAssets();
    } catch (error) {
      console.error('    ❌ Error seeding assets:', error.message);
      console.log('    Continuing with other seeds...');
      seedingSuccess = false;
    }
    
    if (seedingSuccess) {
      console.log('\n✅ Database initialization completed successfully!');
    } else {
      console.log('\n⚠️ Database tables were created, but some seeding operations failed.');
      console.log('   You may need to manually seed some data or fix the issues.');
    }
    
    console.log('\n🚀 MiniMarket is ready to use.');
    console.log('   - Default admin user: admin@minimarket.com');
    console.log('   - Default password: admin123');
    console.log('\n   You can change these credentials in the profile section after login.');
    
    return true;
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    return false;
  }
}

// exit proccess if finished and success
// Run the initialization
initializeDatabase()
  .then(success => {
    if (success) {
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
