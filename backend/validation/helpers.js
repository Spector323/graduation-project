exports.validateFields = (obj, required) => {
  const missing = required.filter(f => !obj[f] && obj[f] !== 0 && obj[f] !== false);
  if (missing.length > 0) {
    return { valid: false, error: `Обязательные поля: ${missing.join(', ')}` };
  }
  return { valid: true };
};

exports.isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

exports.isValidType = (type, allowed) => allowed.includes(type);

exports.sanitize = (value) => {
  if (typeof value === 'string') return value.trim();
  return value;
};
