const db = require('../../config/database');
const { faker } = require('@faker-js/faker');

// Seed suppliers
async function seedSuppliers(count = 10) {
  console.log(`Seeding ${count} suppliers...`);
  
  // Statuses for suppliers
  const statuses = ['active', 'inactive'];
  
  // Generate suppliers
  const suppliers = [];
  
  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const name = faker.company.name();
    const contactPerson = faker.person.fullName();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    
    suppliers.push({
      name,
      contact_person: contactPerson,
      email: faker.internet.email({ firstName, lastName, provider: name.replace(/[^a-zA-Z0-9]/g, '') + '.com' }).toLowerCase(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      country: faker.location.country(),
      postal_code: faker.location.zipCode(),
      contact_info: Math.random() > 0.5 ? `${faker.phone.number()} / ${faker.internet.email()}` : null,
      status,
      notes: Math.random() > 0.7 ? faker.lorem.paragraph() : null,
      created_at: faker.date.past({ years: 2 }),
      updated_at: faker.date.recent()
    });
  }
  
  // Insert suppliers in batches
  const batchSize = 10;
  for (let i = 0; i < suppliers.length; i += batchSize) {
    const batch = suppliers.slice(i, i + batchSize);
    await db('suppliers').insert(batch);
  }
  
  console.log(`Successfully seeded ${count} suppliers`);
  
  // Now add product_count and last_order_date in a separate update
  // This is done separately because these columns might be added after the initial table creation
  for (let i = 0; i < suppliers.length; i++) {
    const supplierId = i + 1;
    const productCount = Math.floor(Math.random() * 50);
    const lastOrderDate = Math.random() > 0.5 ? faker.date.past({ years: 1 }) : null;
    
    await db('suppliers')
      .where('id', supplierId)
      .update({
        product_count: productCount,
        last_order_date: lastOrderDate
      });
  }
  
  console.log(`Updated product_count and last_order_date for ${count} suppliers`);
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  const count = process.argv[2] ? parseInt(process.argv[2]) : 10;
  
  seedSuppliers(count)
    .then(() => {
      console.log('Supplier seeding completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error seeding suppliers:', err);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = seedSuppliers;
} 