const User = require('../../models/User');

async function seedUsers() {
  try {
    console.log('Seeding users...');
    
    // Check if users already exist
    const existingUsers = await User.getAll();
    if (existingUsers.length > 0) {
      console.log('Users already exist, skipping seeding');
      return;
    }
    
    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@minimarket.com',
      password: 'admin123',
      first_name: 'Admin',
      last_name: 'User',
      phone: '+1234567890',
      address: '123 Main Street, City, Country',
      role: 'admin'
    });
    console.log('Admin user created:', adminUser.username);
    
    // Create manager user
    const managerUser = await User.create({
      username: 'manager',
      email: 'manager@minimarket.com',
      password: 'manager123',
      first_name: 'Store',
      last_name: 'Manager',
      phone: '+1234567891',
      address: '456 Oak Avenue, City, Country',
      role: 'manager'
    });
    console.log('Manager user created:', managerUser.username);
    
    // Create regular user
    const regularUser = await User.create({
      username: 'user',
      email: 'user@minimarket.com',
      password: 'user123',
      first_name: 'Regular',
      last_name: 'User',
      phone: '+1234567892',
      address: '789 Pine Street, City, Country',
      role: 'user'
    });
    console.log('Regular user created:', regularUser.username);
    
    console.log('Users seeded successfully!');
    console.log('Default login credentials:');
    console.log('Admin: admin / admin123');
    console.log('Manager: manager / manager123');
    console.log('User: user / user123');
    
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

module.exports = { seedUsers };
