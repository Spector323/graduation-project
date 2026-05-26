const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

exports.register = async (req, res) => {
  try {
    const { email, password, fullName, role, establishmentName, establishmentType } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль минимум 6 символов' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email уже используется' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let establishmentId = null;
    if (establishmentName && establishmentType) {
      const est = await prisma.establishment.create({
        data: { name: establishmentName, type: establishmentType },
      });
      establishmentId = est.id;
    }

    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        fullName: fullName,
        role: role || 'WAITER',
        establishmentId: establishmentId,
      },
      select: {
        id: true, email: true, fullName: true,
        role: true, establishmentId: true, createdAt: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, establishmentId: user.establishmentId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    console.log('Register error:', error);
    res.status(500).json({ error: error.message || 'Ошибка' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { establishment: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // проверяем пароль
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, establishmentId: user.establishmentId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        establishmentId: user.establishmentId,
        establishment: user.establishment || undefined,
      },
      token,
    });
  } catch (error) {
    console.log('Login error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, fullName: true, role: true, establishmentId: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    console.log('Profile error:', error);
    res.status(500).json({ error: 'Ошибка' });
  }
};
