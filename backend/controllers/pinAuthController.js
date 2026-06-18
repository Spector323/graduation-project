const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Установка PIN-кода для пользователя
exports.setPinCode = async (req, res) => {
  try {
    const { userId } = req.params;
    const { pinCode } = req.body;
    const { userId: currentUserId, establishmentId } = req;

    if (!pinCode || pinCode.length < 4) {
      return res.status(400).json({ error: 'PIN-код должен содержать минимум 4 цифры' });
    }

    if (!/^\d+$/.test(pinCode)) {
      return res.status(400).json({ error: 'PIN-код должен содержать только цифры' });
    }

    const hashedPin = await bcrypt.hash(pinCode, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { pinCode: hashedPin },
    });

    res.json({ message: 'PIN-код установлен' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Этот PIN-код уже используется в этом заведении' });
    }
    console.error('Set PIN error:', error);
    res.status(500).json({ error: 'Не удалось установить PIN-код' });
  }
};

// Аутентификация по PIN-коду
exports.authenticateWithPin = async (req, res) => {
  try {
    const { pinCode, establishmentId } = req.body;

    if (!pinCode) {
      return res.status(400).json({ error: 'Введите PIN-код' });
    }

    if (!establishmentId) {
      return res.status(400).json({ error: 'Укажите ID заведения' });
    }

    const users = await prisma.user.findMany({
      where: {
        establishmentId: establishmentId,
        active: true,
      },
      include: {
        establishment: true,
      },
    });

    let authenticatedUser = null;
    for (const user of users) {
      if (user.pinCode) {
        const isValid = await bcrypt.compare(pinCode, user.pinCode);
        if (isValid) {
          authenticatedUser = user;
          break;
        }
      }
    }

    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Неверный PIN-код' });
    }

    const token = jwt.sign(
      { 
        userId: authenticatedUser.id, 
        role: authenticatedUser.role, 
        establishmentId: authenticatedUser.establishmentId 
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      user: {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        fullName: authenticatedUser.fullName,
        role: authenticatedUser.role,
        establishmentId: authenticatedUser.establishmentId,
        establishment: authenticatedUser.establishment,
      },
      token,
    });
  } catch (error) {
    console.error('PIN auth error:', error);
    res.status(500).json({ error: 'Ошибка аутентификации' });
  }
};

// Получить всех сотрудников с PIN (для админа)
exports.getUsersWithPin = async (req, res) => {
  try {
    const { establishmentId } = req;

    const users = await prisma.user.findMany({
      where: { establishmentId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        pinCode: true,
        active: true,
      },
      orderBy: { fullName: 'asc' },
    });

    res.json(users.map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      hasPin: !!u.pinCode,
      pinCode: u.pinCode || null,
      active: u.active,
    })));
  } catch (error) {
    console.error('Get users with PIN error:', error);
    res.status(500).json({ error: 'Не удалось загрузить сотрудников' });
  }
};

// Удалить PIN-код
exports.deletePinCode = async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.user.update({
      where: { id: userId },
      data: { pinCode: null },
    });

    res.json({ message: 'PIN-код удалён' });
  } catch (error) {
    console.error('Delete PIN error:', error);
    res.status(500).json({ error: 'Не удалось удалить PIN-код' });
  }
};

// Показать PIN-код (для админа при установке)
exports.getPlainPinCode = async (req, res) => {
  try {
    const { pin } = req.body;
    
    if (!pin || pin.length < 4) {
      return res.status(400).json({ error: 'Введите PIN для подтверждения' });
    }

    res.json({ plainPin: pin });
  } catch (error) {
    console.error('Get plain PIN error:', error);
    res.status(500).json({ error: 'Ошибка' });
  }
};
