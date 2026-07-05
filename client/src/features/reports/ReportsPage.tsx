import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface AttendanceSummary {
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
}

export default function ReportsPage() {
  const [tab, setTab] = useState<'attendance' | 'leave' | 'headcount'>('attendance');
  const [attendanceData, setAttendanceData] = useState<AttendanceSummary[]>([]);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [departments, setDepartments] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => { loadData(); }, [tab, month, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'attendance') {
        const res = await api.get('/attendance', { params: { month, year, scope: 'all' } });
        setAttendanceData(res.data.data || []);
      } else if (tab === 'leave') {
        const res = await api.get('/leave/requests', { params: { scope: 'all' } });
        setLeaveData(res.data.data || []);
      } else {
        const res = await api.get('/admin/departments');
        const depts = res.data.data || [];
        setDepartments(depts.map((d: any) => ({ name: d.name, count: d._count?.employees || d.employeeCount || 0 })));
      }
    } catch {
      console.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const statusColor = (s: string) => {
    switch (s) {
      case 'PRESENT': return 'badge-success';
      case 'ABSENT': return 'badge-error';
      case 'HALF_DAY': return 'badge-warning';
      case 'ON_LEAVE': return 'badge-info';
      case 'APPROVED': return 'badge-success';
      case 'PENDING': return 'badge-warning';
      case 'REJECTED': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  const totalPresent = attendanceData.filter(a => a.status === 'PRESENT').length;
  const totalAbsent = attendanceData.filter(a => a.status === 'ABSENT').length;
  const totalHours = attendanceData.reduce((sum, a) => sum + (a.workHours || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>Attendance, leave, and headcount reports</p>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>📊 Attendance</button>
        <button className={`tab-btn ${tab === 'leave' ? 'active' : ''}`} onClick={() => setTab('leave')}>🏖️ Leave</button>
        <button className={`tab-btn ${tab === 'headcount' ? 'active' : ''}`} onClick={() => setTab('headcount')}>👥 Headcount</button>
      </div>

      {tab === 'attendance' && (
        <>
          <div className="stats-grid" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="stat-card">
              <div className="stat-card-icon success">✅</div>
              <div className="stat-card-label">Present Days</div>
              <div className="stat-card-value">{totalPresent}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon error">❌</div>
              <div className="stat-card-label">Absent Days</div>
              <div className="stat-card-value">{totalAbsent}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon primary">⏱️</div>
              <div className="stat-card-label">Total Hours</div>
              <div className="stat-card-value">{totalHours.toFixed(1)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon info">📈</div>
              <div className="stat-card-label">Attendance Rate</div>
              <div className="stat-card-value">{attendanceData.length > 0 ? Math.round((totalPresent / attendanceData.length) * 100) : 0}%</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="eyebrow">Attendance</div>
                <div className="card-header-title">Monthly Report — {MONTHS[month - 1]} {year}</div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ width: 'auto' }}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 'auto' }}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="card-body" style={{ overflowX: 'auto' }}>
              {loading ? <div className="loading-page" style={{ height: '20vh' }}><div className="spinner"></div></div> : attendanceData.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No data available</h3></div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
                  <tbody>
                    {attendanceData.map((a, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                        <td>{a.checkIn ? new Date(a.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td>{a.workHours ? `${a.workHours.toFixed(1)}h` : '—'}</td>
                        <td><span className={`badge badge-dot ${statusColor(a.status)}`}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'leave' && (
        <div className="card">
          <div className="card-header">
            <div><div className="eyebrow">Leave</div><div className="card-header-title">All Leave Requests</div></div>
          </div>
          <div className="card-body" style={{ overflowX: 'auto' }}>
            {loading ? <div className="loading-page" style={{ height: '20vh' }}><div className="spinner"></div></div> : leaveData.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🏖️</div><h3>No leave data</h3></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr></thead>
                <tbody>
                  {leaveData.map((l: any) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>{l.employee?.firstName} {l.employee?.lastName}</td>
                      <td><span className="badge badge-neutral">{l.leaveType?.name}</span></td>
                      <td>{new Date(l.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                      <td>{new Date(l.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                      <td>{l.duration}</td>
                      <td><span className={`badge badge-dot ${statusColor(l.status)}`}>{l.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'headcount' && (
        <div className="card">
          <div className="card-header">
            <div><div className="eyebrow">Organization</div><div className="card-header-title">Headcount by Department</div></div>
          </div>
          <div className="card-body">
            {loading ? <div className="loading-page" style={{ height: '20vh' }}><div className="spinner"></div></div> : departments.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">👥</div><h3>No department data</h3></div>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {departments.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontWeight: 600 }}>{d.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ width: Math.max(40, Math.min(200, d.count * 20)), height: 8, background: 'var(--primary-200)', borderRadius: 'var(--radius-full)' }}>
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', borderRadius: 'var(--radius-full)' }}></div>
                      </div>
                      <span style={{ fontWeight: 700, minWidth: 30, textAlign: 'right' }}>{d.count}</span>
                    </div>
                  </div>
                ))}
                <div style={{ padding: 'var(--space-4)', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total Employees</span>
                  <span>{departments.reduce((s, d) => s + d.count, 0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
