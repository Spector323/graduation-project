const { validateFields, isValidEmail, isValidType } = require('../validation/helpers');
const ESTABLISHMENT_TYPES = ['RESTAURANT', 'CAFE', 'CANTEEN', 'COFFEE_SHOP', 'BAKERY', 'FAST_FOOD', 'PUB', 'OTHER'];
const USER_ROLES = ['ADMIN', 'MANAGER', 'WAITER', 'COOK', 'CASHIER', 'PLATFORM_OWNER'];
const ORDER_STATUSES = ['NEW', 'PAID', 'IN_QUEUE', 'COOKING', 'READY', 'READY_FOR_PICKUP', 'HANDED_OUT', 'COMPLETED', 'CANCELLED'];
const TABLE_STATUSES = ['FREE', 'RESERVED', 'OCCUPIED'];
const RESERVATION_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
const PAYMENT_TYPES = ['CASH', 'CARD', 'QR', 'SPLIT_PAYMENT'];

const rules = {
  register: {
    body: ['email', 'password', 'fullName'],
    validate: (body) => {
      if (!isValidEmail(body.email)) return 'Неверный формат email';
      if (body.password.length < 6) return 'Пароль минимум 6 символов';
      if (body.role && !isValidType(body.role, USER_ROLES)) return 'Недопустимая роль';
      if (body.establishmentType && body.establishmentType !== '' && !isValidType(body.establishmentType, ESTABLISHMENT_TYPES)) return 'Недопустимый тип заведения';
      return null;
    },
  },
  login: {
    body: ['email', 'password'],
    validate: (body) => {
      if (!isValidEmail(body.email)) return 'Неверный формат email';
      return null;
    },
  },
  createOrder: {
    body: ['items'],
    validate: (body) => {
      if (!Array.isArray(body.items) || body.items.length === 0) return 'Заказ должен содержать хотя бы одну позицию';
      for (const item of body.items) {
        if (!item.menuItemId) return 'Укажите menuItemId для каждой позиции';
        if (!item.price && item.price !== 0) return 'Укажите цену для каждой позиции';
      }
      if (body.status && !isValidType(body.status, ORDER_STATUSES)) return 'Недопустимый статус заказа';
      return null;
    },
  },
  updateOrderStatus: {
    body: ['status'],
    validate: (body) => {
      if (!isValidType(body.status, ORDER_STATUSES)) return 'Недопустимый статус заказа';
      return null;
    },
  },
  createTable: {
    body: ['number'],
    validate: (body) => {
      if (typeof body.number !== 'number' || body.number < 1) return 'Номер стола должен быть положительным числом';
      if (body.capacity && (typeof body.capacity !== 'number' || body.capacity < 1)) return 'Вместимость должна быть положительным числом';
      return null;
    },
  },
  updateTable: {
    body: [],
    validate: (body) => {
      if (body.status && !isValidType(body.status, TABLE_STATUSES)) return 'Недопустимый статус стола';
      return null;
    },
  },
  createMenuCategory: {
    body: ['name'],
    validate: (body) => {
      if (!body.name || body.name.trim().length === 0) return 'Название категории обязательно';
      return null;
    },
  },
  createMenuItem: {
    body: ['name', 'price'],
    validate: (body) => {
      if (!body.name || body.name.trim().length === 0) return 'Название блюда обязательно';
      if (typeof body.price !== 'number' || body.price < 0) return 'Цена должна быть неотрицательным числом';
      return null;
    },
  },
  updateMenuItem: {
    body: [],
    validate: (body) => {
      if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0)) return 'Цена должна быть неотрицательным числом';
      return null;
    },
  },
  createReservation: {
    body: ['customerName', 'reservedAt'],
    validate: (body) => {
      if (!body.customerName || body.customerName.trim().length === 0) return 'Имя клиента обязательно';
      if (!body.reservedAt) return 'Дата бронирования обязательна';
      const date = new Date(body.reservedAt);
      if (isNaN(date.getTime())) return 'Неверный формат даты';
      return null;
    },
  },
  updateReservation: {
    body: [],
    validate: (body) => {
      if (body.status && !isValidType(body.status, RESERVATION_STATUSES)) return 'Недопустимый статус бронирования';
      return null;
    },
  },
  createEstablishment: {
    body: ['name', 'type'],
    validate: (body) => {
      if (!isValidType(body.type, ESTABLISHMENT_TYPES)) return 'Недопустимый тип заведения';
      return null;
    },
  },
  createUser: {
    body: ['email', 'password', 'fullName', 'role'],
    validate: (body) => {
      if (!isValidEmail(body.email)) return 'Неверный формат email';
      if (body.password.length < 6) return 'Пароль минимум 6 символов';
      if (!isValidType(body.role, USER_ROLES)) return 'Недопустимая роль';
      return null;
    },
  },
  updateUser: {
    body: [],
    validate: (body) => {
      if (body.role && !isValidType(body.role, USER_ROLES)) return 'Недопустимая роль';
      return null;
    },
  },
};

exports.validate = (ruleName) => {
  const rule = rules[ruleName];
  if (!rule) {
    return (req, res, next) => next();
  }

  return (req, res, next) => {
    const body = req.body || {};
    const { valid, error: missingError } = validateFields(body, rule.body);

    if (!valid) {
      return res.status(400).json({ error: missingError });
    }

    const validationError = rule.validate(body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    next();
  };
};
