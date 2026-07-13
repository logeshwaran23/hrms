import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import type { DashboardData } from '../../types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const loadDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data.data);
    } catch {
      console.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/check-in');
      setMessage(res.data.message);
      await loadDashboard();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/check-out');
      setMessage(res.data.message);
      await loadDashboard();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner"></div><p>Loading dashboard...</p></div>;
  }

  const workHoursDisplay = data?.attendance.workHours
    ? `${Math.floor(data.attendance.workHours)}h ${Math.round((data.attendance.workHours % 1) * 60)}m`
    : '0h 0m';

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user?.employee?.firstName || 'User'} 👋</h1>
        <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Today's Hours</div>
          <div className="stat-card-value">{workHoursDisplay}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Leave Balance</div>
          <div className="stat-card-value">{data?.leaveBalance || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Pending Leaves</div>
          <div className="stat-card-value">{data?.pendingLeaves || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Present This Month</div>
          <div className="stat-card-value">{data?.monthlyStats.presentDays || 0}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Work Timer */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="eyebrow">Attendance</div>
              <div className="card-header-title">Work Timer</div>
            </div>
            <span className={`badge ${data?.attendance.present ? 'badge-success badge-dot' : data?.attendance.completed ? 'badge-neutral badge-dot' : 'badge-warning badge-dot'}`}>
              {data?.attendance.present ? 'Working' : data?.attendance.completed ? 'Completed' : 'Not Checked In'}
            </span>
          </div>
          <div className="card-body work-timer">
            <div className="timer-status">
              <span className={`dot ${data?.attendance.present ? 'active' : 'inactive'}`}></span>
              {data?.attendance.present ? 'Currently at work' : data?.attendance.completed ? 'Shift completed' : 'Waiting for check-in'}
            </div>
            <div className="timer-display">{workHoursDisplay}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              {data?.attendance.checkIn && <span>In: {data.attendance.checkIn}</span>}
              {data?.attendance.checkOut && <span> · Out: {data.attendance.checkOut}</span>}
            </div>
            <div className="timer-actions">
              {data?.attendance.present ? (
                <button className="btn btn-danger" onClick={handleCheckOut} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : '⏹ Check Out'}
                </button>
              ) : !data?.attendance.completed ? (
                <button className="btn btn-success btn-lg" onClick={handleCheckIn} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : '▶ Check In'}
                </button>
              ) : (
                <span className="badge badge-success">✓ Day Complete</span>
              )}
            </div>
            {message && <p className="success-message" style={{ marginTop: 'var(--space-4)' }}>{message}</p>}
          </div>
        </div>

        {/* Quick Actions + Leave Balance */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="eyebrow">Quick Actions</div>
              <div className="card-header-title">Leave Balance</div>
            </div>
          </div>
          <div className="card-body">
            {data?.leaveBalanceDetails?.map((b) => (
              <div key={b.type} className="leave-balance-card" style={{ marginBottom: 'var(--space-3)' }}>
                <div>
                  <div className="leave-type-name">{b.type}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Used: {b.used} / {b.allocated}</div>
                </div>
                <div className="leave-count">{b.remaining}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-primary" onClick={() => navigate('/leave/apply')}>Apply Leave</button>
              <button className="btn btn-secondary" onClick={() => navigate('/eod')}>Submit EOD</button>
            </div>
          </div>
        </div>
      </div>

      {/* Manager/HR Stats */}
      {data?.team && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
            {user?.role === 'MANAGER' ? 'Team Overview' : 'Organization Overview'}
          </h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon info">👥</div>
              <div className="stat-card-label">{user?.role === 'MANAGER' ? 'Team Members' : 'Total Employees'}</div>
              <div className="stat-card-value">{data.team.totalMembers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon success">✅</div>
              <div className="stat-card-label">Present Today</div>
              <div className="stat-card-value">{data.team.presentToday}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon error">❌</div>
              <div className="stat-card-label">Absent Today</div>
              <div className="stat-card-value">{data.team.absentToday}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon warning">⏳</div>
              <div className="stat-card-label">Pending Approvals</div>
              <div className="stat-card-value">{data.team.pendingApprovals}</div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Holidays */}
      {data?.holidays && data.holidays.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--space-6)' }}>
          <div className="card-header">
            <div>
              <div className="eyebrow">Calendar</div>
              <div className="card-header-title">Upcoming Holidays</div>
            </div>
          </div>
          <div className="card-body">
            {data.holidays.map((h) => (
              <div key={h.id} className="notification-item">
                <span>🎉</span>
                <div>
                  <div className="notification-text">{h.name}</div>
                  <div className="notification-time">{new Date(h.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
