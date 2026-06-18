const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const pwd = await bcrypt.hash('admin123', 10);

  // ==================== RESTAURANT ====================
  const rest = await prisma.establishment.upsert({
    where: { id: 'est-rest-001' },
    update: {},
    create: { id: 'est-rest-001', name: 'Ресторан «Гастроном»', type: 'RESTAURANT', address: 'ул. Пушкина, 10', phone: '+7 (495) 123-45-67' },
  });

  const restAdmin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: { email: 'admin@restaurant.com', password: pwd, fullName: 'Ахмед', role: 'ADMIN', pinCode: '1111', establishmentId: rest.id },
  });

  await prisma.user.upsert({
    where: { email: 'waiter1@restaurant.com' },
    update: {},
    create: { email: 'waiter1@restaurant.com', password: pwd, fullName: 'Мага', role: 'WAITER', pinCode: '2222', establishmentId: rest.id },
  });

  await prisma.user.upsert({
    where: { email: 'cook1@restaurant.com' },
    update: {},
    create: { email: 'cook1@restaurant.com', password: pwd, fullName: 'Муса', role: 'COOK', pinCode: '3333', establishmentId: rest.id },
  });

  // Categories
  const restCat = async (id, name, desc) =>
    prisma.menuCategory.upsert({ where: { id }, update: {}, create: { id, name, description: desc, establishmentId: rest.id } });

  const restStarters = await restCat('rest-starters', 'Закуски', 'Холодные и горячие закуски');
  const restSoups = await restCat('rest-soups', 'Супы', 'Первые блюда');
  const restMains = await restCat('rest-mains', 'Основные блюда', 'Горячие блюда из мяса и рыбы');
  const restDesserts = await restCat('rest-desserts', 'Десерты', 'Сладкие десерты');
  const restDrinks = await restCat('rest-drinks', 'Напитки', 'Чай, кофе, лимонады');

  // Menu items
  const restItem = async (id, name, desc, price, catId) =>
    prisma.menuItem.upsert({ where: { id }, update: {}, create: { id, name, description: desc, price, categoryId: catId, available: true } });

  const restItem1 = await restItem('rest-bruschetta', 'Брускетта с томатами', 'Тосты с помидорами, базиликом и оливковым маслом', 390, restStarters.id);
  const restItem2 = await restItem('rest-tartar', 'Тартар из лосося', 'Свежий лосось с авокадо и соусом понзу', 650, restStarters.id);
  const restItem3 = await restItem('rest-borscht', 'Борщ с пампушками', 'Классический красный борщ с говядиной', 420, restSoups.id);
  const restItem4 = await restItem('rest-cream-soup', 'Крем-суп из тыквы', 'Тыквенный суп с семенами тыквы', 370, restSoups.id);
  const restItem5 = await restItem('rest-sturgeon', 'Стейк из осетра', 'Сочный стейк из осетра с овощами гриль', 1290, restMains.id);
  const restItem6 = await restItem('rest-beef', 'Рибай стейк', 'Мраморная говядина с трюфельным пюре', 1890, restMains.id);
  const restItem7 = await restItem('rest-pasta', 'Паста Карбонара', 'Спагетти с беконом и пармезаном', 590, restMains.id);
  const restItem8 = await restItem('rest-tiramisu', 'Тирамису', 'Классический итальянский десерт', 450, restDesserts.id);
  const restItem9 = await restItem('rest-panna-cotta', 'Панна-котта', 'С ванилью и ягодным соусом', 390, restDesserts.id);
  const restItem10 = await restItem('rest-coffee', 'Американо', 'Черный кофе 300мл', 200, restDrinks.id);
  const restItem11 = await restItem('rest-tea', 'Чай (ассорти)', 'Зеленый, черный, травяной', 180, restDrinks.id);
  const restItem12 = await restItem('rest-lemonade', 'Лимонад', 'Домашний лимонад со свежей мятой', 250, restDrinks.id);

  // Ingredients
  const ing = (estId) => async (id, name, unit, cost, stock, min) =>
    prisma.ingredient.upsert({ where: { id }, update: {}, create: { id, name, unit, costPerUnit: cost, stock, minStock: min, establishmentId: estId } });

  const restIng = ing(rest.id);
  const ingTomato = await restIng('rest-ing-tomato', 'Помидоры', 'кг', 150, 10, 2);
  const ingBeef = await restIng('rest-ing-beef', 'Говядина', 'кг', 600, 15, 3);
  const ingSalmon = await restIng('rest-ing-salmon', 'Лосось', 'кг', 1200, 5, 1);
  const ingPasta = await restIng('rest-ing-pasta', 'Спагетти', 'кг', 80, 8, 2);
  const ingCream = await restIng('rest-ing-cream', 'Сливки (33%)', 'л', 200, 6, 2);
  const ingCheese = await restIng('rest-ing-cheese', 'Пармезан', 'кг', 900, 3, 1);
  const ingFlour = await restIng('rest-ing-flour', 'Мука пшеничная', 'кг', 50, 20, 5);
  const ingButter = await restIng('rest-ing-butter', 'Масло сливочное', 'кг', 400, 5, 1);
  const ingCoffee = await restIng('rest-ing-coffee', 'Кофе зерновой', 'кг', 1500, 3, 1);
  const ingOliveOil = await restIng('rest-ing-olive-oil', 'Масло оливковое', 'л', 800, 4, 1);
  const ingChicken = await restIng('rest-ing-chicken', 'Куриное филе', 'кг', 350, 12, 3);
  const ingPotato = await restIng('rest-ing-potato', 'Картофель', 'кг', 40, 30, 5);
  const ingOnion = await restIng('rest-ing-onion', 'Лук репчатый', 'кг', 35, 15, 3);
  const ingGarlic = await restIng('rest-ing-garlic', 'Чеснок', 'кг', 200, 2, 1);
  const ingEggs = await restIng('rest-ing-eggs', 'Яйца', 'шт', 8, 120, 20);
  const ingSugar = await restIng('rest-ing-sugar', 'Сахар', 'кг', 60, 10, 3);
  const ingSalt = await restIng('rest-ing-salt', 'Соль', 'кг', 25, 5, 1);
  const ingLemon = await restIng('rest-ing-lemon', 'Лимоны', 'кг', 120, 5, 2);
  const ingMilk = await restIng('rest-ing-milk', 'Молоко', 'л', 80, 15, 5);

  // Recipes
  const recipeItem = async (menuItemId, ingredientId, quantity) =>
    prisma.recipeItem.create({ data: { menuItemId, ingredientId, quantity } }).catch(() => {});

  await recipeItem(restItem5.id, ingSalmon.id, 0.3);
  await recipeItem(restItem6.id, ingBeef.id, 0.35);
  await recipeItem(restItem7.id, ingPasta.id, 0.2);
  await recipeItem(restItem7.id, ingCream.id, 0.1);
  await recipeItem(restItem7.id, ingCheese.id, 0.05);
  await recipeItem(restItem1.id, ingTomato.id, 0.15);

  // Modifier Groups
  const modGroup = async (id, name, minS, maxS) =>
    prisma.modifierGroup.upsert({ where: { id }, update: {}, create: { id, name, minSelect: minS, maxSelect: maxS, establishmentId: rest.id } });

  const restModSize = await modGroup('rest-mod-size', 'Размер порции', 1, 1);
  const restModExtra = await modGroup('rest-mod-extra', 'Добавки', 0, 3);

  await prisma.modifier.upsert({ where: { id: 'rest-mod-small' }, update: {}, create: { id: 'rest-mod-small', name: 'Малая', price: 0, groupId: restModSize.id } });
  await prisma.modifier.upsert({ where: { id: 'rest-mod-large' }, update: {}, create: { id: 'rest-mod-large', name: 'Большая', price: 150, groupId: restModSize.id } });
  await prisma.modifier.upsert({ where: { id: 'rest-mod-cheese' }, update: {}, create: { id: 'rest-mod-cheese', name: 'Доп. сыр', price: 100, groupId: restModExtra.id } });
  await prisma.modifier.upsert({ where: { id: 'rest-mod-bacon' }, update: {}, create: { id: 'rest-mod-bacon', name: 'Бекон', price: 120, groupId: restModExtra.id } });

  // Connect modifiers to menu items
  await prisma.$executeRawUnsafe(`INSERT INTO "_MenuItemModifierGroups" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`, restItem7.id, restModSize.id);
  await prisma.$executeRawUnsafe(`INSERT INTO "_MenuItemModifierGroups" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`, restItem7.id, restModExtra.id);

  // Tables
  for (let i = 1; i <= 8; i++) {
    await prisma.restaurantTable.upsert({
      where: { id: `rest-table-${i}` },
      update: {},
      create: { id: `rest-table-${i}`, number: i, capacity: i <= 2 ? 2 : i <= 5 ? 4 : 6, location: i <= 3 ? 'У окна' : i <= 6 ? 'Зал' : 'Терраса', status: i <= 2 ? 'OCCUPIED' : 'FREE', establishmentId: rest.id },
    });
  }

  // Orders
  const now = new Date();
  const order1 = await prisma.order.upsert({
    where: { id: 'rest-order-1' },
    update: {},
    create: { id: 'rest-order-1', tableId: 'rest-table-1', waiterId: restAdmin.id, status: 'COOKING', total: 2990, createdAt: new Date(now.getTime() - 3600000) },
  });

  await prisma.orderItem.createMany({ data: [
    { orderId: 'rest-order-1', menuItemId: restItem2.id, quantity: 1, unitPrice: 650 },
    { orderId: 'rest-order-1', menuItemId: restItem8.id, quantity: 1, unitPrice: 450, notes: 'Без какао' },
    { orderId: 'rest-order-1', menuItemId: restItem6.id, quantity: 1, unitPrice: 1890 },
  ], skipDuplicates: true });

  // Reservations
  await prisma.reservation.upsert({
    where: { id: 'rest-res-1' },
    update: {},
    create: { id: 'rest-res-1', tableId: 'rest-table-5', customerName: 'Иван Петров', customerPhone: '+7 (999) 111-22-33', reservedAt: new Date(now + 7200000), partySize: 4, status: 'CONFIRMED', establishmentId: rest.id },
  });

  await prisma.reservation.upsert({
    where: { id: 'rest-res-2' },
    update: {},
    create: { id: 'rest-res-2', customerName: 'Анна Смирнова', customerPhone: '+7 (999) 444-55-66', reservedAt: new Date(now + 10800000), partySize: 2, notes: 'День рождения', status: 'PENDING', establishmentId: rest.id },
  });

  // Shift
  const restShiftTime = new Date();
  restShiftTime.setHours(9, 0, 0, 0);
  await prisma.shift.upsert({
    where: { id: 'rest-shift-1' },
    update: {},
    create: { id: 'rest-shift-1', openedAt: restShiftTime, openedById: restAdmin.id, cashStart: 5000, status: 'OPEN', establishmentId: rest.id },
  });

  // ==================== CAFE ====================
  const cafe = await prisma.establishment.upsert({
    where: { id: 'est-cafe-001' },
    update: {},
    create: { id: 'est-cafe-001', name: 'Кафе «Уют»', type: 'CAFE', address: 'ул. Ленина, 25', phone: '+7 (495) 987-65-43' },
  });

  await prisma.user.upsert({
    where: { email: 'admin@cafe.com' },
    update: {},
    create: { email: 'admin@cafe.com', password: pwd, fullName: 'Лейла', role: 'ADMIN', pinCode: '4444', establishmentId: cafe.id },
  });

  await prisma.user.upsert({
    where: { email: 'waiter@cafe.com' },
    update: {},
    create: { email: 'waiter@cafe.com', password: pwd, fullName: 'Мага', role: 'WAITER', pinCode: '5555', establishmentId: cafe.id },
  });

  await prisma.user.upsert({
    where: { email: 'cook@cafe.com' },
    update: {},
    create: { email: 'cook@cafe.com', password: pwd, fullName: 'Ислам', role: 'COOK', pinCode: '6666', establishmentId: cafe.id },
  });

  const cafeCat = async (id, name, desc) =>
    prisma.menuCategory.upsert({ where: { id }, update: {}, create: { id, name, description: desc, establishmentId: cafe.id } });

  const cafeDrinks = await cafeCat('cafe-drinks', 'Кофе и напитки', 'Кофе, чай, лимонады');
  const cafeBreakfast = await cafeCat('cafe-breakfast', 'Завтраки', 'Завтраки весь день');
  const cafeDesserts = await cafeCat('cafe-desserts', 'Десерты и выпечка', 'Сладкое и свежая выпечка');

  const cafeItem = async (id, name, desc, price, catId) =>
    prisma.menuItem.upsert({ where: { id }, update: {}, create: { id, name, description: desc, price, categoryId: catId, available: true } });

  await cafeItem('cafe-espresso', 'Эспрессо', 'Крепкий кофе 40мл', 150, cafeDrinks.id);
  await cafeItem('cafe-latte', 'Латте', 'Кофе с молоком 300мл', 250, cafeDrinks.id);
  await cafeItem('cafe-cappuccino', 'Капучино', 'Кофе с молочной пеной 250мл', 230, cafeDrinks.id);
  await cafeItem('cafe-mocha', 'Моккачино', 'Кофе с шоколадом 300мл', 290, cafeDrinks.id);
  await cafeItem('cafe-tea', 'Чай', 'Чай на выбор 400мл', 150, cafeDrinks.id);
  await cafeItem('cafe-lemonade', 'Лимонад', 'Домашний лимонад 400мл', 220, cafeDrinks.id);
  await cafeItem('cafe-oatmeal', 'Овсяная каша', 'С ягодами и медом', 320, cafeBreakfast.id);
  await cafeItem('cafe-scramble', 'Скрэмбл', 'Яйца с тостом и авокадо', 380, cafeBreakfast.id);
  await cafeItem('cafe-pancakes', 'Блинчики', 'С творогом и сметаной', 290, cafeBreakfast.id);
  await cafeItem('cafe-croissant', 'Круассан с шоколадом', 'Свежая выпечка', 180, cafeDesserts.id);
  await cafeItem('cafe-cheesecake', 'Чизкейк', 'Нью-Йорк чизкейк с ягодным соусом', 350, cafeDesserts.id);
  await cafeItem('cafe-brownie', 'Брауни', 'Шоколадный брауни с мороженым', 320, cafeDesserts.id);

  // Ingredients for cafe
  const cafeIng = ing(cafe.id);
  await cafeIng('cafe-ing-coffee', 'Кофе зерновой', 'кг', 1500, 5, 1);
  await cafeIng('cafe-ing-milk', 'Молоко', 'л', 80, 20, 5);
  await cafeIng('cafe-ing-cream', 'Сливки', 'л', 200, 5, 2);
  await cafeIng('cafe-ing-chocolate', 'Шоколад', 'кг', 500, 3, 1);
  await cafeIng('cafe-ing-sugar', 'Сахар', 'кг', 60, 8, 2);
  await cafeIng('cafe-ing-flour', 'Мука', 'кг', 50, 10, 3);
  await cafeIng('cafe-ing-butter', 'Масло сливочное', 'кг', 400, 5, 1);
  await cafeIng('cafe-ing-eggs', 'Яйца', 'шт', 8, 60, 20);
  await cafeIng('cafe-ing-cheese', 'Сыр творожный', 'кг', 600, 3, 1);
  await cafeIng('cafe-ing-berries', 'Ягоды замороженные', 'кг', 350, 5, 2);
  await cafeIng('cafe-ing-avocado', 'Авокадо', 'кг', 250, 4, 1);
  await cafeIng('cafe-ing-lemon', 'Лимоны', 'кг', 120, 5, 2);
  await cafeIng('cafe-ing-mint', 'Мята свежая', 'шт', 50, 20, 5);
  await cafeIng('cafe-ing-oat', 'Овсяные хлопья', 'кг', 100, 5, 2);

  for (let i = 1; i <= 4; i++) {
    await prisma.restaurantTable.upsert({
      where: { id: `cafe-table-${i}` },
      update: {},
      create: { id: `cafe-table-${i}`, number: i, capacity: 2, location: 'У окна', status: i === 1 ? 'RESERVED' : 'FREE', establishmentId: cafe.id },
    });
  }

  const cafeShiftTime = new Date();
  cafeShiftTime.setHours(8, 0, 0, 0);
  await prisma.shift.upsert({
    where: { id: 'cafe-shift-1' },
    update: {},
    create: { id: 'cafe-shift-1', openedAt: cafeShiftTime, openedById: (await prisma.user.findFirst({ where: { establishmentId: cafe.id, role: 'ADMIN' } })).id, cashStart: 3000, status: 'OPEN', establishmentId: cafe.id },
  });

  // ==================== CANTEEN ====================
  const cant = await prisma.establishment.upsert({
    where: { id: 'est-cant-001' },
    update: {},
    create: { id: 'est-cant-001', name: 'Столовая №5', type: 'CANTEEN', address: 'ул. Советская, 5', phone: '+7 (495) 555-55-55' },
  });

  await prisma.user.upsert({
    where: { email: 'admin@canteen.com' },
    update: {},
    create: { email: 'admin@canteen.com', password: pwd, fullName: 'Милана', role: 'ADMIN', pinCode: '7777', establishmentId: cant.id },
  });

  await prisma.user.upsert({
    where: { email: 'cook@canteen.com' },
    update: {},
    create: { email: 'cook@canteen.com', password: pwd, fullName: 'Муса', role: 'COOK', pinCode: '8888', establishmentId: cant.id },
  });

  const cantCat = async (id, name, desc) =>
    prisma.menuCategory.upsert({ where: { id }, update: {}, create: { id, name, description: desc, establishmentId: cant.id } });

  const cantSoups = await cantCat('cant-soups', 'Супы', 'Первые блюда');
  const cantMains = await cantCat('cant-mains', 'Основные блюда', 'Горячие блюда и гарниры');
  const cantSalads = await cantCat('cant-salads', 'Салаты', 'Свежие салаты');
  const cantDrinks = await cantCat('cant-drinks', 'Напитки', 'Компоты, чай, соки');

  const cantItem = async (id, name, desc, price, catId) =>
    prisma.menuItem.upsert({ where: { id }, update: {}, create: { id, name, description: desc, price, categoryId: catId, available: true } });

  await cantItem('cant-borscht', 'Борщ', 'С бородинским хлебом и сметаной', 120, cantSoups.id);
  await cantItem('cant-solyanka', 'Солянка мясная', 'С каперсами и оливками', 150, cantSoups.id);
  await cantItem('cant-cutlet', 'Котлета с пюре', 'Куриная котлета, картофельное пюре', 180, cantMains.id);
  await cantItem('cant-goulash', 'Гуляш с рисом', 'Говяжий гуляш с рассыпчатым рисом', 220, cantMains.id);
  await cantItem('cant-fish', 'Рыба жареная', 'Минтай с овощным рагу', 190, cantMains.id);
  await cantItem('cant-olivier', 'Салат Оливье', 'Классический рецепт', 100, cantSalads.id);
  await cantItem('cant-vinegret', 'Винегрет', 'Овощной салат', 80, cantSalads.id);
  await cantItem('cant-compote', 'Компот', 'Из сухофруктов', 40, cantDrinks.id);
  await cantItem('cant-tea', 'Чай с лимоном', 'Черный чай', 30, cantDrinks.id);
  await cantItem('cant-juice', 'Сок яблочный', 'Восстановленный сок', 60, cantDrinks.id);

  for (let i = 1; i <= 10; i++) {
    await prisma.restaurantTable.upsert({
      where: { id: `cant-table-${i}` },
      update: {},
      create: { id: `cant-table-${i}`, number: i, capacity: 4, location: 'Основной зал', establishmentId: cant.id },
    });
  }

  // Ingredients for canteen
  const cantIng = ing(cant.id);
  await cantIng('cant-ing-potato', 'Картофель', 'кг', 40, 50, 10);
  await cantIng('cant-ing-chicken', 'Курица', 'кг', 250, 20, 5);
  await cantIng('cant-ing-beet', 'Свёкла', 'кг', 50, 15, 5);
  await cantIng('cant-ing-cabbage', 'Капуста белокочанная', 'кг', 45, 20, 5);
  await cantIng('cant-ing-rice', 'Рис круглозёрный', 'кг', 80, 30, 5);
  await cantIng('cant-ing-fish', 'Минтай', 'кг', 200, 15, 3);
  await cantIng('cant-ing-carrot', 'Морковь', 'кг', 35, 15, 5);
  await cantIng('cant-ing-onion', 'Лук репчатый', 'кг', 35, 20, 5);
  await cantIng('cant-ing-oil', 'Масло подсолнечное', 'л', 100, 10, 3);
  await cantIng('cant-ing-sour-cream', 'Сметана', 'кг', 180, 8, 2);

  console.log('Seed complete!');
  console.log('Login: admin@restaurant.com / admin123');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
