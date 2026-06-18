const prisma = require('../config/database');
const { emitToEstablishment } = require('../socket');

exports.getAll = async (req, res) => {
  try {
    const establishments = await prisma.establishment.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(establishments);
  } catch (error) {
    console.error('Get establishments error:', error);
    res.status(500).json({ error: 'Ошибка загрузки заведений' });
  }
};

// TODO: добавить валидацию на дубликаты

exports.create = async (req, res) => {
  try {
    const { name, type, address, phone } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Название и тип обязательны' });
    }

    if (!['RESTAURANT', 'CAFE', 'CANTEEN', 'COFFEE_SHOP', 'BAKERY', 'FAST_FOOD', 'PUB', 'OTHER'].includes(type)) {
      return res.status(400).json({ error: 'Неправильный тип заведения' });
    }

    const establishment = await prisma.establishment.create({
      data: {
        name: name,
        type: type,
        address: address || '',
        phone: phone || '',
      },
    });

    // делаем пользователя админом этого заведения
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        establishmentId: establishment.id,
        role: 'ADMIN',
      },
    });

    console.log('Создано заведение:', establishment.id);
    res.status(201).json(establishment);
  } catch (error) {
    console.log('Ошибка создания заведения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.getCurrent = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { establishment: true },
    });

    if (!user || !user.establishment) {
      return res.status(404).json({ error: 'Заведение не найдено' });
    }

    res.json(user.establishment);
  } catch (error) {
    console.log('Ошибка:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.update = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { establishmentId: true },
    });

    if (!user || !user.establishmentId) {
      return res.status(404).json({ error: 'Заведение не найдено' });
    }

    const data = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.type) data.type = req.body.type;
    if (req.body.address !== undefined) data.address = req.body.address;
    if (req.body.phone !== undefined) data.phone = req.body.phone;

    const establishment = await prisma.establishment.update({
      where: { id: user.establishmentId },
      data: data,
    });

    emitToEstablishment(user.establishmentId, 'establishment:updated', establishment);
    res.json(establishment);
  } catch (error) {
    console.log('Ошибка обновления:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.getTypes = async (req, res) => {
  // типы заведений для выбора при регистрации
  const types = [
    { value: 'RESTAURANT', label: 'Ресторан', icon: '🍽️', description: 'Полноценный ресторан' },
    { value: 'CAFE', label: 'Кафе', icon: '☕', description: 'Уютное кафе' },
    { value: 'CANTEEN', label: 'Столовая', icon: '🍲', description: 'Столовая с обедами' },
    { value: 'COFFEE_SHOP', label: 'Кофейня', icon: '☕', description: 'Кофейня' },
    { value: 'BAKERY', label: 'Пекарня', icon: '🥐', description: 'Пекарня' },
    { value: 'FAST_FOOD', label: 'Фастфуд', icon: '🍔', description: 'Быстрое питание' },
    { value: 'PUB', label: 'Бар/Паб', icon: '🍺', description: 'Бар' },
    { value: 'OTHER', label: 'Другое', icon: '🏪', description: 'Другое' },
  ];
  res.json(types);
};
