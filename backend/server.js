const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tableRoutes = require('./routes/tableRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const establishmentRoutes = require('./routes/establishmentRoutes');
const analyticsRoutes = require('./routes/analytics');
const platformRoutes = require('./routes/platform');
const auditRoutes = require('./routes/audit');
const shiftRoutes = require('./routes/shiftRoutes');
const pinAuthRoutes = require('./routes/pinAuthRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { setupSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/establishments', establishmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/pin', pinAuthRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Restaurant Management API is running' });
});

// Error handling middleware
app.use(errorHandler);

setupSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO running on ws://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
