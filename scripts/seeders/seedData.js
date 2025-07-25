require('dotenv').config();
const knex = require('knex');
const { seedAssets } = require('./seedAssets');
const { seedUsers } = require('./seedUsers');
const seedSuppliers = require('./seedSuppliers');

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

// Category seed data
const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and gadgets',
    icon: 'fas fa-bolt',
    color: '#2563eb',
    is_active: true,
    sort_order: 1
  },
  {
    name: 'Food & Beverages',
    slug: 'food-beverages',
    description: 'Food items and beverages',
    icon: 'fas fa-utensils',
    color: '#16a34a',
    is_active: true,
    sort_order: 2
  },
  {
    name: 'Household',
    slug: 'household',
    description: 'Household items and utilities',
    icon: 'fas fa-home',
    color: '#9333ea',
    is_active: true,
    sort_order: 3
  },
  {
    name: 'Clothing',
    slug: 'clothing',
    description: 'Clothes and accessories',
    icon: 'fas fa-tshirt',
    color: '#db2777',
    is_active: true,
    sort_order: 4
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Books and magazines',
    icon: 'fas fa-book',
    color: '#ca8a04',
    is_active: true,
    sort_order: 5
  }
];

// Product seed data (will be populated after categories are inserted to get their IDs)
let products = [];

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Seed categories
    console.log('Seeding categories...');
    await db.transaction(async (trx) => {
      // Check if categories already exist
      const existingCategories = await trx('categories').select('id');
      
      if (existingCategories.length > 0) {
        console.log(`Found ${existingCategories.length} existing categories, skipping category seeding.`);
      } else {
        const categoryIds = await trx('categories').insert(categories);
        console.log(`Added ${categoryIds.length} categories`);

        // Retrieve inserted categories to get their IDs
        const insertedCategories = await trx('categories').select('*');
        
        // Create product seed data using inserted category IDs
        // Helper function to generate slugs
        const slugify = (text) => {
          return text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
        };

        products = [
          {
            name: 'Smartphone',
            slug: slugify('Smartphone'),
            description: 'Latest smartphone with advanced features',
            price: 799.99,
            stock: 50,
            image: '/uploads/smartphone.jpg',
            category_id: insertedCategories.find(c => c.slug === 'electronics')?.id
          },
          {
            name: 'Laptop',
            slug: slugify('Laptop'),
            description: 'High performance laptop for work and gaming',
            price: 1299.99,
            stock: 25,
            image: '/uploads/laptop.jpg',
            category_id: insertedCategories.find(c => c.slug === 'electronics')?.id
          },
          {
            name: 'Organic Apples',
            slug: slugify('Organic Apples'),
            description: 'Fresh organic apples, 1kg pack',
            price: 4.99,
            stock: 100,
            image: '/uploads/apples.jpg',
            category_id: insertedCategories.find(c => c.slug === 'food-beverages')?.id
          },
          {
            name: 'Coffee Beans',
            slug: slugify('Coffee Beans'),
            description: 'Premium arabica coffee beans, 500g',
            price: 12.99,
            stock: 75,
            image: '/uploads/coffee.jpg',
            category_id: insertedCategories.find(c => c.slug === 'food-beverages')?.id
          },
          {
            name: 'Vacuum Cleaner',
            slug: slugify('Vacuum Cleaner'),
            description: 'Powerful vacuum cleaner with HEPA filter',
            price: 159.99,
            stock: 20,
            image: '/uploads/vacuum.jpg',
            category_id: insertedCategories.find(c => c.slug === 'household')?.id
          },
          {
            name: 'Bedsheet Set',
            slug: slugify('Bedsheet Set'),
            description: 'Cotton bedsheet set with pillowcases',
            price: 49.99,
            stock: 30,
            image: '/uploads/bedsheet.jpg',
            category_id: insertedCategories.find(c => c.slug === 'household')?.id
          },
          {
            name: 'T-Shirt',
            slug: slugify('T-Shirt'),
            description: 'Cotton t-shirt, various sizes',
            price: 19.99,
            stock: 150,
            image: '/uploads/tshirt.jpg',
            category_id: insertedCategories.find(c => c.slug === 'clothing')?.id
          },
          {
            name: 'Jeans',
            slug: slugify('Jeans'),
            description: 'Denim jeans, various sizes',
            price: 39.99,
            stock: 80,
            image: '/uploads/jeans.jpg',
            category_id: insertedCategories.find(c => c.slug === 'clothing')?.id
          },
          {
            name: 'Novel',
            slug: slugify('Novel'),
            description: 'Bestselling fiction novel',
            price: 14.99,
            stock: 45,
            image: '/uploads/novel.jpg',
            category_id: insertedCategories.find(c => c.slug === 'books')?.id
          },
          {
            name: 'Cookbook',
            slug: slugify('Cookbook'),
            description: 'Gourmet recipes cookbook',
            price: 24.99,
            stock: 35,
            image: '/uploads/cookbook.jpg',
            category_id: insertedCategories.find(c => c.slug === 'books')?.id
          }
        ];
        
        // Seed products
        console.log('Seeding products...');
        const productIds = await trx('products').insert(products);
        console.log(`Added ${productIds.length} products`);
      }
    });
    
    // Seed users
    console.log('Seeding users...');
    await seedUsers();
    
    // Seed assets
    console.log('Seeding assets...');
    await seedAssets(db);
    
    // Seed suppliers
    console.log('Seeding suppliers...');
    // Check if suppliers already exist
    const existingSuppliers = await db('suppliers').select('id');
    
    if (existingSuppliers.length > 0) {
      console.log(`Found ${existingSuppliers.length} existing suppliers, skipping supplier seeding.`);
    } else {
      await seedSuppliers(15); // Seed 15 suppliers
      console.log('Suppliers seeded successfully');
    }
    
    console.log('Database seeding completed successfully');
    
    // Close database connection if this file is executed directly
    if (require.main === module) {
      await db.destroy();
    }
    
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

// Export the seedDatabase function
module.exports = seedDatabase;
