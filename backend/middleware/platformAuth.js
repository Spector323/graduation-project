exports.platformOwner = (req, res, next) => {
  if (!req.userRole) {
    return res.status(401).json({ error: 'Требуется аутентификация' });
  }

  if (req.userRole !== 'PLATFORM_OWNER') {
    return res.status(403).json({ error: 'Требуется роль Platform Owner' });
  }

  next();
};
