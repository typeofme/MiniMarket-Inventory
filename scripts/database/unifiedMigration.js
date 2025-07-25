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

async function createAllTables() {
  try {
    console.log('Starting unified database migration...');
    
    // 1. Create users table
    const usersExists = await db.schema.hasTable('users');
    
    if (!usersExists) {
      console.log('Creating users table...');
      await db.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('username').notNullable().unique();
        table.string('email').notNullable().unique();
        table.string('password_hash').notNullable();
        table.string('first_name').notNullable();
        table.string('last_name').notNullable();
        table.string('phone').nullable();
        table.text('address').nullable();
        table.string('role').defaultTo('user'); // 'admin', 'manager', 'user'
        table.string('avatar').nullable();
        table.string('avatar_url').nullable(); // Added avatar_url field
        table.boolean('email_verified').defaultTo(false); // Added email_verified field
        table.timestamp('last_login').nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('Users table created successfully');
    } else {
      console.log('Users table already exists');
    }
    
    // 2. Create categories table
    const categoriesExists = await db.schema.hasTable('categories');
    
    if (!categoriesExists) {
      console.log('Creating categories table...');
      await db.schema.createTable('categories', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('slug').notNullable().unique();
        table.text('description');
        table.string('icon');
        table.string('color', 7);
        table.boolean('is_active').defaultTo(true);
        table.integer('sort_order').defaultTo(0);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('Categories table created successfully');
    } else {
      console.log('Categories table already exists');
    }

    // 3. Create products table
    const productsExists = await db.schema.hasTable('products');
    
    if (!productsExists) {
      console.log('Creating products table...');
      await db.schema.createTable('products', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('slug').notNullable().unique();
        table.text('description');
        table.decimal('price', 10, 2).notNullable();
        table.integer('stock').notNullable().defaultTo(0);
        table.specificType('image', 'LONGTEXT');
        table.integer('category_id').unsigned();
        table.foreign('category_id').references('categories.id').onDelete('SET NULL');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('Products table created successfully');
    } else {
      console.log('Products table already exists');
    }

    // 4. Create assets table
    const assetExists = await db.schema.hasTable('asset');
    
    if (!assetExists) {
      console.log('Creating assets table...');
      await db.schema.createTable('asset', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('type').notNullable();
        table.string('placement_location');
        table.date('purchase_date');
        table.enum('condition', ['excellent', 'good', 'fair', 'poor', 'needs_repair']).defaultTo('good');
        table.enum('status', ['active', 'inactive', 'maintenance', 'retired']).defaultTo('active');
        table.decimal('purchase_price', 10, 2);
        table.text('description');
        table.text('notes');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('Assets table created successfully');
    } else {
      console.log('Assets table already exists');
    }
    
    // 5. Create logs table
    const logsExists = await db.schema.hasTable('logs');
    
    if (!logsExists) {
      console.log('Creating logs table...');
      await db.schema.createTable('logs', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().nullable();
        table.string('action', 50).notNullable(); // create, update, edit, restock, delete
        table.string('entity_type', 50).notNullable(); // product, category, asset, etc.
        table.integer('entity_id').unsigned().notNullable();
        table.text('old_values').nullable(); // JSON string of old values
        table.text('new_values').nullable(); // JSON string of new values
        table.text('description').nullable(); // Human readable description
        table.string('ip_address', 45).nullable();
        table.text('user_agent').nullable();
        table.string('product_name').nullable(); // For easier querying
        table.string('user_name').nullable(); // For easier querying
        table.string('user_email').nullable(); // For easier querying
        table.timestamp('created_at').defaultTo(db.fn.now());
        
        // Indexes for better performance
        table.index(['user_id']);
        table.index(['action']);
        table.index(['entity_type', 'entity_id']);
        table.index(['created_at']);
        
        // Foreign key constraint
        table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
      });
      console.log('Logs table created successfully');
    } else {
      console.log('Logs table already exists');
    }

    // 6. Create reports table
    const reportsExists = await db.schema.hasTable('reports');
    
    if (!reportsExists) {
      console.log('Creating reports table...');
      await db.schema.createTable('reports', (table) => {
        table.increments('id').primary();
        table.integer('product_id').unsigned().notNullable();
        table.integer('sold').defaultTo(0);
        table.integer('damaged').defaultTo(0);
        table.integer('missing').defaultTo(0);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
        table.foreign('product_id').references('products.id').onDelete('CASCADE');
      });
      console.log('Reports table created successfully');
    } else {
      console.log('Reports table already exists');
    }

    // 7. Create restock_orders table
    const restockOrdersExists = await db.schema.hasTable('restock_orders');
    
    if (!restockOrdersExists) {
      console.log('Creating restock_orders table...');
      await db.schema.createTable('restock_orders', (table) => {
        table.increments('id').primary();
        table.date('order_date').notNullable();
        table.string('supplier_name', 128).notNullable();
        table.integer('total_products').unsigned().notNullable();
        table.decimal('total_price', 12, 2).notNullable();
        table.enum('status', ['Pending', 'Received', 'Cancelled']).defaultTo('Pending');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
      });
      console.log('Restock orders table created successfully');
    } else {
      console.log('Restock orders table already exists');
    }

    // 8. Create support_requests table
    const supportRequestsExists = await db.schema.hasTable('support_requests');
    
    if (!supportRequestsExists) {
      console.log('Creating support_requests table...');
      await db.schema.createTable('support_requests', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('email').notNullable();
        table.text('message').notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('Support requests table created successfully');
    } else {
      console.log('Support requests table already exists');
    }

    // Create restock_order_details table if it doesn't exist
    if (!await db.schema.hasTable('restock_order_details')) {
      await db.schema.createTable('restock_order_details', (table) => {
        table.increments('id').primary();
        table.integer('restock_order_id').unsigned().notNullable();
        table.integer('product_id').unsigned().notNullable();
        table.string('product_name').notNullable();
        table.integer('quantity').unsigned().notNullable();
        table.decimal('price_per_unit', 10, 2).notNullable();
        table.decimal('total_price', 10, 2).notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        
        // Foreign key relationships
        table.foreign('restock_order_id').references('id').inTable('restock_orders').onDelete('CASCADE');
        table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
      });
      console.log('Created restock_order_details table');
    }

    // Create suppliers table if it doesn't exist
    if (!await db.schema.hasTable('suppliers')) {
      await db.schema.createTable('suppliers', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('contact_person');
        table.string('category');
        table.string('email');
        table.string('phone', 50);
        table.text('address');
        table.string('city', 100);
        table.string('country', 100);
        table.string('postal_code', 20);
        table.enum('status', ['Active', 'Pending', 'Inactive']).defaultTo('Active');
        table.text('notes');
        table.integer('product_count').defaultTo(0);
        table.date('last_order_date').nullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('Created suppliers table');
    }

    // Add product_count and last_order_date to suppliers if they don't exist
    const hasProductCountColumn = await db.schema.hasColumn('suppliers', 'product_count');
    if (!hasProductCountColumn) {
      await db.schema.table('suppliers', (table) => {
        table.integer('product_count').defaultTo(0);
        table.date('last_order_date').nullable();
      });
      console.log('Added product_count and last_order_date columns to suppliers table');
    }

    // Update restock_orders table to add supplier_id if it doesn't exist
    const hasSupplierIdColumn = await db.schema.hasColumn('restock_orders', 'supplier_id');
    if (!hasSupplierIdColumn) {
      await db.schema.table('restock_orders', (table) => {
        table.integer('supplier_id').unsigned().nullable();
        table.foreign('supplier_id').references('id').inTable('suppliers').onDelete('SET NULL');
      });
      console.log('Added supplier_id column to restock_orders table');
    }

    console.log('Unified database migration completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  } finally {
    await db.destroy();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  createAllTables();
}

// Export the function for use in other scripts
module.exports = { createAllTables }; 