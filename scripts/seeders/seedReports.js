// scripts/database/seeders/seedReports.js
require('dotenv').config();
const knex = require('knex');

const config = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'minimarketdb',
    charset: 'utf8mb4',
  },
};

const db = knex(config);

async function seedReports() {
  try {
    // Get all products
    const products = await db('products').select('id');
    if (!products.length) throw new Error('No products found');
    const today = new Date();
    const year = today.getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    let reports = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      for (const product of products) {
        reports.push({
          product_id: product.id,
          sold: Math.floor(Math.random() * 20),
          damaged: Math.floor(Math.random() * 3),
          missing: Math.floor(Math.random() * 2),
          created_at: new Date(d),
          updated_at: new Date(d),
        });
      }
    }
    await db('reports').del(); // Clear existing
    await db.batchInsert('reports', reports, 1000);
    console.log('Seeded reports for the entire year.');
  } catch (err) {
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    // Only close the connection if this file is executed directly
    if (require.main === module) {
      await db.destroy();
    }
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedReports()
    .then(() => {
      console.log('Report seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Report seeding failed:', error);
      process.exit(1);
    });
}

// Export the seedReports function
module.exports = seedReports;