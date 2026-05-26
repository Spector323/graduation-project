const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Начало заполнения базы данных...');
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // --- Ресторан ---
  const restaurant = await prisma.establishment.upsert({
    where: { id: 'est-restaurant-001' },
    update: {},
    create: {
      id: 'est-restaurant-001',
      name: 'Ресторан «Гастроном»',
      type: 'RESTAURANT',
      address: 'ул. Пушкина, 10',
      phone: '+7 (495) 123-45-67',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      email: 'admin@restaurant.com',
      password: hashedPassword,
      fullName: 'Администратор Иванов',
      role: 'ADMIN',
      establishmentId: restaurant.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'waiter1@restaurant.com' },
    update: {},
    create: {
      email: 'waiter1@restaurant.com',
      password: hashedPassword,
      fullName: 'Официант Алексей',
      role: 'WAITER',
      establishmentId: restaurant.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'cook1@restaurant.com' },
    update: {},
    create: {
      email: 'cook1@restaurant.com',
      password: hashedPassword,
      fullName: 'Повар Дмитрий',
      role: 'COOK',
      establishmentId: restaurant.id,
    },
  });

  // Категории ресторана
  const restStarters = await prisma.menuCategory.upsert({
    where: { id: 'cat-rest-starters' },
    update: {},
    create: { id: 'cat-rest-starters', name: 'Закуски', description: 'Холодные и горячие закуски', establishmentId: restaurant.id },
  });

  const restMains = await prisma.menuCategory.upsert({
    where: { id: 'cat-rest-mains' },
    update: {},
    create: { id: 'cat-rest-mains', name: 'Основные блюда', description: 'Горячие блюда из мяса и рыбы', establishmentId: restaurant.id },
  });

  const restDesserts = await prisma.menuCategory.upsert({
    where: { id: 'cat-rest-desserts' },
    update: {},
    create: { id: 'cat-rest-desserts', name: 'Десерты', description: 'Сладкие десерты', establishmentId: restaurant.id },
  });

  // Блюда ресторана
  await prisma.menuItem.upsert({
    where: { id: 'item-rest-bruschetta' },
    update: {},
    create: { id: 'item-rest-bruschetta', name: 'Брускетта с томатами', description: 'Тосты с помидорами, базиликом и оливковым маслом', price: 390, categoryId: restStarters.id, available: true },
  });

  await prisma.menuItem.upsert({
    where: { id: 'item-rest-sturgeon' },
    update: {},
    create: { id: 'item-rest-sturgeon', name: 'Стейк из осетра', description: 'Сочный стейк из осетра с овощами гриль', price: 1290, categoryId: restMains.id, available: true },
  });

  await prisma.menuItem.upsert({
    where: { id: 'item-rest-tiramisu' },
    update: {},
    create: { id: 'item-rest-tiramisu', name: 'Тирамису', description: 'Классический итальянский десерт', price: 450, categoryId: restDesserts.id, available: true },
  });

  // Столы ресторана
  for (let i = 1; i <= 8; i++) {
    await prisma.restaurantTable.upsert({
      where: { id: `table-rest-${i}` },
      update: {},
      create: {
        id: `table-rest-${i}`,
        number: i,
        capacity: i <= 2 ? 2 : i <= 5 ? 4 : 6,
        location: i <= 3 ? 'Окно' : i <= 6 ? 'Зал' : 'Терраса',
        establishmentId: restaurant.id,
      },
    });
  }

  // --- Кафе ---
  const cafe = await prisma.establishment.upsert({
    where: { id: 'est-cafe-001' },
    update: {},
    create: {
      id: 'est-cafe-001',
      name: 'Кафе «Уют»',
      type: 'CAFE',
      address: 'ул. Ленина, 25',
      phone: '+7 (495) 987-65-43',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@cafe.com' },
    update: {},
    create: {
      email: 'admin@cafe.com',
      password: hashedPassword,
      fullName: 'Мария Петрова',
      role: 'ADMIN',
      establishmentId: cafe.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'waiter@cafe.com' },
    update: {},
    create: {
      email: 'waiter@cafe.com',
      password: hashedPassword,
      fullName: 'Официант Елена',
      role: 'WAITER',
      establishmentId: cafe.id,
    },
  });

  const cafeDrinks = await prisma.menuCategory.upsert({
    where: { id: 'cat-cafe-drinks' },
    update: {},
    create: { id: 'cat-cafe-drinks', name: 'Напитки', description: 'Кофе, чай, лимонады', establishmentId: cafe.id },
  });

  const cafeFood = await prisma.menuCategory.upsert({
    where: { id: 'cat-cafe-food' },
    update: {},
    create: { id: 'cat-cafe-food', name: 'Еда', description: 'Завтраки и десерты', establishmentId: cafe.id },
  });

  await prisma.menuItem.upsert({
    where: { id: 'item-cafe-latte' },
    update: {},
    create: { id: 'item-cafe-latte', name: 'Латте', description: 'Кофе с молоком 300мл', price: 250, categoryId: cafeDrinks.id, available: true },
  });

  await prisma.menuItem.upsert({
    where: { id: 'item-cafe-croissant' },
    update: {},
    create: { id: 'item-cafe-croissant', name: 'Круассан с шоколадом', description: 'Свежая выпечка', price: 180, categoryId: cafeFood.id, available: true },
  });

  await prisma.menuItem.upsert({
    where: { id: 'item-cafe-cheesecake' },
    update: {},
    create: { id: 'item-cafe-cheesecake', name: 'Чизкейк', description: 'Нью-Йорк чизкейк с ягодным соусом', price: 350, categoryId: cafeFood.id, available: true },
  });

  for (let i = 1; i <= 4; i++) {
    await prisma.restaurantTable.upsert({
      where: { id: `table-cafe-${i}` },
      update: {},
      create: { id: `table-cafe-${i}`, number: i, capacity: 2, location: 'У окна', establishmentId: cafe.id },
    });
  }

  // --- Столовая ---
  const canteen = await prisma.establishment.upsert({
    where: { id: 'est-canteen-001' },
    update: {},
    create: {
      id: 'est-canteen-001',
      name: 'Столовая №5',
      type: 'CANTEEN',
      address: 'ул. Советская, 5',
      phone: '+7 (495) 555-55-55',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@canteen.com' },
    update: {},
    create: {
      email: 'admin@canteen.com',
      password: hashedPassword,
      fullName: 'Заведующая Ольга',
      role: 'ADMIN',
      establishmentId: canteen.id,
    },
  });

  const canteenSoup = await prisma.menuCategory.upsert({
    where: { id: 'cat-cant-soup' },
    update: {},
    create: { id: 'cat-cant-soup', name: 'Супы', description: 'Первые блюда', establishmentId: canteen.id },
  });

  const canteenMain = await prisma.menuCategory.upsert({
    where: { id: 'cat-cant-main' },
    update: {},
    create: { id: 'cat-cant-main', name: 'Основное', description: 'Горячие блюда и гарниры', establishmentId: canteen.id },
  });

  const canteenCompote = await prisma.menuCategory.upsert({
    where: { id: 'cat-cant-compote' },
    update: {},
    create: { id: 'cat-cant-compote', name: 'Напитки', description: 'Компоты и чай', establishmentId: canteen.id },
  });

  await prisma.menuItem.upsert({
    where: { id: 'item-cant-borscht' },
    update: {},
    create: { id: 'item-cant-borscht', name: 'Борщ', description: 'С бородина и сметана', price: 120, categoryId: canteenSoup.id, available: true },
  });

  await prisma.menuItem.upsert({
    where: { id: 'item-cant-cutlet' },
    update: {},
    create: { id: 'item-cant-cutlet', name: 'Котлета с пюре', description: 'Куриная котлета, картофельное пюре', price: 180, categoryId: canteenMain.id, available: true },
  });

  await prisma.menuItem.upsert({
    where: { id: 'item-cant-compote' },
    update: {},
    create: { id: 'item-cant-compote', name: 'Компот', description: 'Из сухофруктов', price: 40, categoryId: canteenCompote.id, available: true },
  });

  for (let i = 1; i <= 10; i++) {
    await prisma.restaurantTable.upsert({
      where: { id: `table-cant-${i}` },
      update: {},
      create: { id: `table-cant-${i}`, number: i, capacity: 4, location: 'Основной зал', establishmentId: canteen.id },
    });
  }

  console.log('База данных успешно заполнена!');
  console.log('\n--- Демо-данные ---');
  console.log('Ресторан: admin@restaurant.com / admin123 (админ)');
  console.log('Ресторан: waiter1@restaurant.com / admin123 (официант)');
  console.log('Ресторан: cook1@restaurant.com / admin123 (повар)');
  console.log('Кафе: admin@cafe.com / admin123 (админ)');
  console.log('Столовая: admin@canteen.com / admin123 (админ)');
  console.log('Пароль для всех: admin123');
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
