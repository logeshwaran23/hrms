import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config';
import { errorHandler, apiLimiter } from './middleware';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import employeeRoutes from './modules/employees/employees.routes';
import leaveRoutes from './modules/leave/leave.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import eodRoutes from './modules/eod/eod.routes';
import documentRoutes from './modules/documents/documents.routes';
import helpdeskRoutes from './modules/helpdesk/helpdesk.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import adminRoutes from './modules/admin/admin.routes';
import performanceRoutes from './modules/performance/performance.routes';
import recruitmentRoutes from './modules/recruitment/recruitment.routes';

const app = express();

// ─── Trust Proxy (Render/Vercel) ─────────────────────────────
// Required for rate-limiting to use real client IPs, not proxy IP
app.set('trust proxy', 1);

// ─── Security ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      env.CLIENT_URL,
      'https://dhrms-w47g.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Parsing ─────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ───────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Static Files ────────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR || './uploads')));

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: 'v2-ist-fix', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/eod', eodRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/helpdesk', helpdeskRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/recruitment', recruitmentRoutes);

// ─── 404 ─────────────────────────────────────────────────────
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// ─── Error Handler ───────────────────────────────────────────
app.use(errorHandler);

export default app;
