const prisma = require('../config/database');

exports.getLogs = async (req, res) => {
  try {
    const { entity, action, establishmentId, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (req.establishmentId) {
      where.establishmentId = req.establishmentId;
    } else if (establishmentId) {
      where.establishmentId = establishmentId;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Не удалось загрузить журнал' });
  }
};

exports.getLogsByEntity = async (req, res) => {
  try {
    const { entity, id } = req.params;

    const where = { entity, entityId: id };
    if (req.establishmentId) {
      where.establishmentId = req.establishmentId;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json(logs);
  } catch (error) {
    console.error('Get entity logs error:', error);
    res.status(500).json({ error: 'Не удалось загрузить историю' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const where = {};
    if (req.establishmentId) {
      where.establishmentId = req.establishmentId;
    }

    const [totalLogs, actionCounts, entityCounts, recentLogs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
      }),
      prisma.auditLog.groupBy({
        by: ['entity'],
        where,
        _count: true,
        orderBy: { _count: { entity: 'desc' } },
      }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    res.json({
      totalLogs,
      actionCounts: actionCounts.map(a => ({ action: a.action, count: a._count })),
      entityCounts: entityCounts.map(e => ({ entity: e.entity, count: e._count })),
      recentLogs,
    });
  } catch (error) {
    console.error('Audit stats error:', error);
    res.status(500).json({ error: 'Не удалось загрузить статистику' });
  }
};
