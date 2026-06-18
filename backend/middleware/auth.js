const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Доступ запрещён. Токен не предоставлен' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.establishmentId = decoded.establishmentId;

    // Fetch user info for audit logging (non-blocking)
    prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true, fullName: true },
    }).then(user => {
      if (user) {
        req.userEmail = user.email;
        req.userName = user.fullName;
      }
    }).catch(() => {});

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Срок действия токена истёк' });
    }
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Недостаточно прав доступа' });
    }

    next();
  };
};
