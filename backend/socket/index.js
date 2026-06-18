const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Требуется аутентификация'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.establishmentId = decoded.establishmentId;
      next();
    } catch (error) {
      next(new Error('Недействительный токен'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Пользователь ${socket.userId} подключён (роль: ${socket.userRole})`);

    if (socket.establishmentId) {
      socket.join(`establishment:${socket.establishmentId}`);
      console.log(`  → присоединился к комнате establishment:${socket.establishmentId}`);
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Пользователь ${socket.userId} отключён`);
    });
  });

  console.log('📡 Socket.IO инициализирован');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO не инициализирован');
  }
  return io;
}

function emitToEstablishment(establishmentId, event, data) {
  if (!io) return;
  io.to(`establishment:${establishmentId}`).emit(event, data);
}

module.exports = { setupSocket, getIO, emitToEstablishment };
