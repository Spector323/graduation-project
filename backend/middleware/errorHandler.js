exports.errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Запись с такими данными уже существует' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    return res.status(400).json({ error: 'Ошибка базы данных' });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Недействительный токен' });
  }

  const status = err.status || 500;
  const message = err.status ? err.message : 'Внутренняя ошибка сервера';

  res.status(status).json({ error: message });
};
