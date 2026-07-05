import { useEffect, useState } from 'react';
import api from '../../lib/api';
import type { Attendance } from '../../types';

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    const [att, today] = await Promise.all([api.get('/attendance'), api.get('/attendance/today')]);
    setRecords(att.data.data); setTodayStatus(today.data.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleCheckIn = async () => { setActionLoading(true); try { const r = await api.post('/attendance/check-in'); setMessage(r.data.message); await load(); } catch(e:any) { setMessage(e.response?.data?.message || 'Failed'); } setActionLoading(false); };
  const handleCheckOut = async () => { setActionLoading(true); try { const r = await api.post('/attendance/check-out'); setMessage(r.data.message); await load(); } catch(e:any) { setMessage(e.response?.data?.message || 'Failed'); } setActionLoading(false); };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  const statusBadge = (s: string) => {
    const m: Record<string,string> = { PRESENT: 'badge-success', ABSENT: 'badge-error', HALF_DAY: 'badge-warning', ON_LEAVE: 'badge-info', WEEKEND: 'badge-neutral', HOLIDAY: 'badge-primary' };
    return <span className={`badge badge-dot ${m[s] || 'badge-neutral'}`}>{s.replace('_', ' ')}</span>;
  };

  return (
    <div>
      <div className="page-header"><h1>My Attendance</h1><p>Track your daily attendance and work hours</p></div>
      <div className="two-col-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-header"><div><div className="eyebrow">Today</div><div className="card-header-title">Attendance Status</div></div>
            {statusBadge(todayStatus?.status || 'ABSENT')}
          </div>
          <div className="card-body work-timer">
            <div className="timer-status"><span className={`dot ${todayStatus?.present ? 'active' : 'inactive'}`}></span>{todayStatus?.present ? 'Working' : todayStatus?.completed ? 'Completed' : 'Not checked in'}</div>
            <div className="timer-display">{todayStatus?.workHours ? `${Math.floor(todayStatus.workHours)}h ${Math.round((todayStatus.workHours % 1)*60)}m` : '0h 0m'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              {todayStatus?.checkIn && <span>In: {todayStatus.checkIn}</span>}
              {todayStatus?.checkOut && <span> · Out: {todayStatus.checkOut}</span>}
            </div>
            <div className="timer-actions">
              {todayStatus?.present ? <button className="btn btn-danger" onClick={handleCheckOut} disabled={actionLoading}>{actionLoading ? '...' : '⏹ Check Out'}</button>
                : !todayStatus?.completed ? <button className="btn btn-success btn-lg" onClick={handleCheckIn} disabled={actionLoading}>{actionLoading ? '...' : '▶ Check In'}</button>
                : <span className="badge badge-success">✓ Complete</span>}
            </div>
            {message && <p className="success-message" style={{ marginTop: 'var(--space-3)' }}>{message}</p>}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div><div className="eyebrow">Summary</div><div className="card-header-title">This Month</div></div></div>
          <div className="card-body">
            <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="stat-card"><div className="stat-card-label">Present</div><div className="stat-card-value">{records.filter(r=>r.status==='PRESENT').length}</div></div>
              <div className="stat-card"><div className="stat-card-label">Absent</div><div className="stat-card-value">{records.filter(r=>r.status==='ABSENT').length}</div></div>
              <div className="stat-card"><div className="stat-card-label">Total Hours</div><div className="stat-card-value">{Math.round(records.reduce((s,r)=>s+(r.workHours||0),0))}h</div></div>
              <div className="stat-card"><div className="stat-card-label">Records</div><div className="stat-card-value">{records.length}</div></div>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div><div className="eyebrow">History</div><div className="card-header-title">Attendance Records</div></div></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>{records.map(r => (
              <tr key={r.id}><td>{new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                <td>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td>{r.workHours ? `${r.workHours.toFixed(1)}h` : '-'}</td>
                <td>{statusBadge(r.status)}</td></tr>
            ))}</tbody>
          </table>
          {!records.length && <div className="table-empty">No attendance records found</div>}
        </div>
      </div>
    </div>
  );
}
