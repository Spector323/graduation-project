const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { emitToEstablishment } = require('../socket');

exports.getAllUsers = async (req, res) => {
  try {
    const where = {};
    if (req.establishmentId) {
      where.establishmentId = req.establishmentId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        active: true,
        establishmentId: true,
        createdAt: true,
        pinCode: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users.map(u => ({
      ...u,
      hasPin: !!u.pinCode,
      pinCode: u.pinCode ? '****' : null,
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Не удалось загрузить сотрудников' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role,
        establishmentId: req.establishmentId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    emitToEstablishment(req.establishmentId, 'user:created', user);
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Не удалось создать сотрудника' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, role, active } = req.body;

    const user = await prisma.user.findFirst({
      where: { id, establishmentId: req.establishmentId },
    });
    if (!user && req.userRole !== 'ADMIN') {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(fullName && { fullName }),
        ...(role && { role }),
        ...(typeof active === 'boolean' && { active }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        active: true,
      },
    });

    emitToEstablishment(req.establishmentId, 'user:updated', updated);
    res.json(updated);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Не удалось обновить сотрудника' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: { id, establishmentId: req.establishmentId },
    });
    if (!user && req.userRole !== 'ADMIN') {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    await prisma.user.delete({ where: { id } });
    emitToEstablishment(req.establishmentId, 'user:deleted', { id });
    res.json({ message: 'Сотрудник удалён' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Не удалось удалить сотрудника' });
  }
};
