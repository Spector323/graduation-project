const prisma = require('../config/database');

exports.log = (action, entity) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    let entityId = null;
    if (req.params?.id) entityId = req.params.id;
    if (req.body?.id) entityId = req.body.id;

    res.json = async function (body) {
      const statusCode = res.statusCode;

      if (statusCode >= 200 && statusCode < 300) {
        const details = {
          requestBody: sanitizeForLog(req.body),
          responseStatus: statusCode,
        };

        if (body?.id && !entityId) entityId = body.id;
        if (body?.id) details.createdId = body.id;

        try {
          await prisma.auditLog.create({
            data: {
              action,
              entity,
              entityId: entityId || null,
              details: JSON.stringify(details),
              userId: req.userId || null,
              userEmail: req.userEmail || null,
              userName: req.userName || null,
              establishmentId: req.establishmentId || null,
            },
          });
        } catch (err) {
          console.error('Audit log error:', err.message);
        }
      }

      return originalJson(body);
    };

    next();
  };
};

function sanitizeForLog(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = { ...obj };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.platformSecret;
  return sanitized;
}
