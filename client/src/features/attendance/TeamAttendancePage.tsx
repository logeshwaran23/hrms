import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  status: string;
  employee: { firstName: string; lastName: string; employeeCode: string };
}

export default function TeamAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, total: 0 });

  const { hasPermission } = useAuthStore();

  useEffect(() => { loadAttendance(); }, [selectedDate]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const endpoint = hasPermission('attendance:read:all') ? '/attendance/all' : '/attendance/team';
      const res = await api.get(endpoint, { params: { date: selectedDate } });
      const data = res.data.data || [];
      setRecords(data);
      setSummary({
        total: data.length,
        present: data.filter((r: AttendanceRecord) => r.status === 'PRESENT').length,
        absent: data.filter((r: AttendanceRecord) => r.status === 'ABSENT').length,
      });
    } catch {
      console.error('Failed to load team attendance');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'PRESENT': return 'badge-success';
      case 'ABSENT': return 'badge-error';
      case 'HALF_DAY': return 'badge-warning';
      case 'ON_LEAVE': return 'badge-info';
      case 'HOLIDAY': return 'badge-primary';
      default: return 'badge-neutral';
    }
  };

  const formatTime = (t: string | null) => {
    if (!t) return '—';
    return new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Team Attendance</h1>
          <p>Monitor your team's attendance for any date</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: 'auto' }}
          />
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="stat-card">
          <div className="stat-card-icon info">👥</div>
          <div className="stat-card-label">Total Members</div>
          <div className="stat-card-value">{summary.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon success">✅</div>
          <div className="stat-card-label">Present</div>
          <div className="stat-card-value">{summary.present}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon error">❌</div>
          <div className="stat-card-label">Absent</div>
          <div className="stat-card-value">{summary.absent}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon primary">📊</div>
          <div className="stat-card-label">Attendance Rate</div>
          <div className="stat-card-value">{summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0}%</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="eyebrow">Attendance</div>
            <div className="card-header-title">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="loading-page" style={{ height: '30vh' }}><div className="spinner"></div></div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No attendance records found</h3>
              <p>There are no attendance records for this date.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.employee?.firstName} {r.employee?.lastName}</td>
                    <td><span className="badge badge-neutral">{r.employee?.employeeCode}</span></td>
                    <td>{formatTime(r.checkIn)}</td>
                    <td>{formatTime(r.checkOut)}</td>
                    <td>{r.workHours ? `${r.workHours.toFixed(1)}h` : '—'}</td>
                    <td><span className={`badge badge-dot ${statusColor(r.status)}`}>{r.status.replace(/_/g, ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
