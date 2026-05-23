const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      email: 'admin@restaurant.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: 'ADMIN',
    },
  });

  const waiter = await prisma.user.upsert({
    where: { email: 'waiter1@restaurant.com' },
    update: {},
    create: {
      email: 'waiter1@restaurant.com',
      password: hashedPassword,
      fullName: 'John Smith',
      role: 'WAITER',
    },
  });

  console.log('✅ Users created');

  // Create categories
  const starters = await prisma.menuCategory.upsert({
    where: { name: 'Starters' },
    update: {},
    create: {
      name: 'Starters',
      description: 'Appetizers',
    },
  });

  const mains = await prisma.menuCategory.upsert({
    where: { name: 'Main Course' },
    update: {},
    create: {
      name: 'Main Course',
      description: 'Main dishes',
    },
  });

  console.log('✅ Categories created');

  // Create menu items
  await prisma.menuItem.upsert({
    where: { id: 'item-caesar-salad' },
    update: {},
    create: {
      id: 'item-caesar-salad',
      name: 'Caesar Salad',
      description: 'Fresh salad',
      price: 8.99,
      categoryId: starters.id,
      available: true,
    },
  });

  await prisma.menuItem.upsert({
    where: { id: 'item-salmon' },
    update: {},
    create: {
      id: 'item-salmon',
      name: 'Grilled Salmon',
      description: 'Delicious fish',
      price: 24.99,
      categoryId: mains.id,
      available: true,
    },
  });

  console.log('✅ Menu items created');

  // Create tables
  await prisma.restaurantTable.upsert({
    where: { number: 1 },
    update: {},
    create: {
      number: 1,
      capacity: 4,
      location: 'Window',
    },
  });

  await prisma.restaurantTable.upsert({
    where: { number: 2 },
    update: {},
    create: {
      number: 2,
      capacity: 6,
      location: 'Center',
    },
  });

  console.log('✅ Tables created');
  console.log('\n📋 Demo Credentials:');
  console.log('Admin: admin@restaurant.com / admin123');
  console.log('Waiter: waiter1@restaurant.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
