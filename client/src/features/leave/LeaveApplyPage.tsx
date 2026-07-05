import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import type { LeaveBalance, LeaveRequest } from '../../types';

export default function LeaveApplyPage() {
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationType, setDurationType] = useState('FULL_DAY');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/leave/types').then(res => {
      setLeaveTypes(res.data.data);
      if (res.data.data.length > 0) setLeaveTypeId(res.data.data[0].id);
    });
    api.get('/leave/balance').then(res => setBalances(res.data.data));
  }, []);

  const calculatedDays = (() => {
    if (!startDate || !endDate) return '0 days';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return durationType === 'HALF_DAY' ? `${diff * 0.5} days` : `${diff} days`;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError(''); setLoading(true);
    try {
      const res = await api.post('/leave/apply', { leaveTypeId, startDate, endDate, durationType, reason });
      setMessage(res.data.message);
      setStartDate(''); setEndDate(''); setReason('');
      api.get('/leave/balance').then(res => setBalances(res.data.data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Apply Leave</h1>
        <p>Submit a new leave request and track your balance</p>
      </div>

      <div className="leave-balance-grid">
        {balances.map(b => (
          <div key={b.id} className="leave-balance-card">
            <div>
              <div className="leave-type-name">{b.leaveType.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Used {b.used} / {b.allocated}</div>
            </div>
            <div className="leave-count">{b.remaining}</div>
          </div>
        ))}
      </div>

      <div className="two-col-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="eyebrow">Leave Request</div>
              <div className="card-header-title">Submit New Request</div>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select value={leaveTypeId} onChange={e => setLeaveTypeId(e.target.value)}>
                    {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration Type</label>
                  <select value={durationType} onChange={e => setDurationType(e.target.value)}>
                    <option value="FULL_DAY">Full Day</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Calculated Days</label>
                <input type="text" value={calculatedDays} readOnly style={{ background: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Please provide the reason..." required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Leave Request'}
              </button>
              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message">{error}</p>}
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="eyebrow">Guidelines</div>
              <div className="card-header-title">Leave Policy</div>
            </div>
          </div>
          <div className="card-body">
            <div className="notification-item"><span>📌</span><div className="notification-text">Apply leave at least 3 days in advance for planned leaves</div></div>
            <div className="notification-item"><span>📌</span><div className="notification-text">Medical certificate required for sick leave &gt; 3 days</div></div>
            <div className="notification-item"><span>📌</span><div className="notification-text">Casual leave cannot be taken for more than 3 consecutive days</div></div>
            <div className="notification-item"><span>📌</span><div className="notification-text">Leave balance resets at the start of each calendar year</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
