/**
 * Asset Seeder
 * Populates the asset table with sample data
 */

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
    charset: 'utf8mb4'
  }
};

const db = knex(config);

const sampleAssets = [
  {
    name: 'Point of Sale Terminal',
    type: 'Electronics',
    placement_location: 'Checkout Counter 1',
    purchase_date: '2023-01-15',
    condition: 'excellent',
    status: 'active',
    purchase_price: 1299.99,
    description: 'Modern POS terminal with touchscreen and receipt printer',
    notes: 'Purchased from TechVendor Inc. Warranty expires Jan 2026'
  },
  {
    name: 'Refrigerator Unit A',
    type: 'Equipment',
    placement_location: 'Beverages Section',
    purchase_date: '2022-08-10',
    condition: 'good',
    status: 'active',
    purchase_price: 2499.00,
    description: 'Commercial refrigerator for beverages and dairy products',
    notes: 'Energy efficient model. Last maintenance: March 2024'
  },
  {
    name: 'Shopping Cart Set',
    type: 'Equipment',
    placement_location: 'Store Entrance',
    purchase_date: '2023-03-20',
    condition: 'good',
    status: 'active',
    purchase_price: 1800.00,
    description: 'Set of 20 shopping carts for customer use',
    notes: '2 carts currently need wheel repairs'
  },
  {
    name: 'Security Camera System',
    type: 'Electronics',
    placement_location: 'Store-wide',
    purchase_date: '2023-06-05',
    condition: 'excellent',
    status: 'active',
    purchase_price: 3500.00,
    description: '16-channel security camera system with cloud storage',
    notes: 'Installed by SecureTech. Monthly cloud storage fee applies'
  },
  {
    name: 'Delivery Van',
    type: 'Vehicles',
    placement_location: 'Parking Lot',
    purchase_date: '2021-11-30',
    condition: 'fair',
    status: 'maintenance',
    purchase_price: 28000.00,
    description: 'Commercial delivery van for local deliveries',
    notes: 'Currently in shop for brake repairs. Expected back next week'
  },
  {
    name: 'Office Desk Set',
    type: 'Furniture',
    placement_location: 'Back Office',
    purchase_date: '2022-05-15',
    condition: 'good',
    status: 'active',
    purchase_price: 800.00,
    description: 'Ergonomic office desk with matching chair',
    notes: 'Manager workstation'
  },
  {
    name: 'Barcode Scanner',
    type: 'Electronics',
    placement_location: 'Checkout Counter 2',
    purchase_date: '2023-09-12',
    condition: 'excellent',
    status: 'active',
    purchase_price: 199.99,
    description: 'Wireless barcode scanner with charging dock',
    notes: 'Backup scanner for busy periods'
  },
  {
    name: 'Freezer Unit B',
    type: 'Equipment',
    placement_location: 'Frozen Foods Section',
    purchase_date: '2020-12-01',
    condition: 'needs_repair',
    status: 'inactive',
    purchase_price: 3200.00,
    description: 'Commercial freezer for frozen foods',
    notes: 'Compressor failure. Waiting for parts. Using backup freezer'
  },
  {
    name: 'Office Printer',
    type: 'Electronics',
    placement_location: 'Back Office',
    purchase_date: '2019-08-20',
    condition: 'poor',
    status: 'retired',
    purchase_price: 450.00,
    description: 'Laser printer for office documents',
    notes: 'Replaced with newer model. Scheduled for disposal'
  },
  {
    name: 'Display Shelving Unit',
    type: 'Furniture',
    placement_location: 'Center Aisle',
    purchase_date: '2023-02-28',
    condition: 'excellent',
    status: 'active',
    purchase_price: 1200.00,
    description: 'Modular display shelving for promotional items',
    notes: 'Easy to reconfigure for different products'
  }
];

async function seedAssets(database = null) {
  // Use provided database connection or create new one
  const db = database || knex(config);
  const shouldCloseConnection = !database;
  
  try {
    console.log('Seeding assets table...');
    
    // Check if assets already exist
    const existingAssets = await db('asset').select('id').limit(1);
    
    if (existingAssets.length > 0) {
      console.log('Assets table already has data. Skipping seed.');
      return;
    }
    
    // Insert sample assets
    await db('asset').insert(sampleAssets);
    
    console.log(`Successfully seeded ${sampleAssets.length} assets`);
    
  } catch (error) {
    console.error('Error seeding assets:', error);
    throw error;
  } finally {
    if (shouldCloseConnection) {
      await db.destroy();
    }
  }
}

// Run the seeder if called directly
if (require.main === module) {
  seedAssets()
    .then(() => {
      console.log('Asset seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Asset seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAssets };
