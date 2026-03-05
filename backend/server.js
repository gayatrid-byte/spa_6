const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { pool, testConnection, initializeTables } = require('./config/database');
const { errorHandler } = require('./middleware/error.middleware');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const customerRoutes = require('./routes/customers.routes');
const serviceRoutes = require('./routes/services.routes');
const bookingRoutes = require('./routes/bookings.routes');
const billingRoutes = require('./routes/billing.routes');
const expenseRoutes = require('./routes/expenses.routes');
const reportRoutes = require('./routes/reports.routes');
const settingsRoutes = require('./routes/settings.routes');
const membershipsRoutes = require('./routes/memberships.routes');
const staffRoutes = require('./routes/staff.routes');
const advancedBIRoutes = require('./routes/advanced-bi.routes');
const calendarRoutes = require('./routes/calendar.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= API ROUTES =================
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/memberships', membershipsRoutes);
app.use('/api/bi', advancedBIRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ================= FRONTEND ROUTES =================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/app.html'));
});

// ================= ERROR HANDLING =================
app.use(errorHandler);

app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ================= START SERVER =================
async function startServer() {
  try {
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      logger.error('Database connection failed. Please check your database configuration.');
      process.exit(1);
    }
    
    await initializeTables();
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Frontend URL: http://localhost:${PORT}`);
      logger.info(`API URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();

module.exports = app;