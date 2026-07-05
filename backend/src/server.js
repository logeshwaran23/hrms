const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`\n🚀 Modular HRMS API running on http://localhost:${port}`);
});
