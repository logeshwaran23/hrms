import { useEffect, useMemo, useState } from 'react';
import TopBar from '../components/TopBar';
import { fetchLeaves, submitLeave } from '../api';

type LeaveRequest = {
  id: number;
  type: string;
  from: string;
  to: string;
  reason: string;
  status: string;
};

export default function LeavePage() {
  const [type, setType] = useState('Sick Leave');
  const [durationType, setDurationType] = useState('Full Day');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const leaveBalance = useMemo(() => ({
    sick: '24/24',
    personal: '24/24',
  }), []);

  const calculatedDays = useMemo(() => {
    if (!from || !to) {
      return '0 days';
    }
    const start = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return '0 days';
    }
    const diff = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    if (diff === 0) {
      return '0 days';
    }
    return durationType === 'Half Day' ? `${diff * 0.5} days` : `${diff} days`;
  }, [from, to, durationType]);

  const loadLeaves = async () => {
    const response = await fetchLeaves();
    setLeaveRequests(response.data.leaveRequests);
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await submitLeave({ type, from, to, reason });
      setMessage(response.data.message);
      setFrom('');
      setTo('');
      setReason('');
      setDurationType('Full Day');
      await loadLeaves();
    } catch {
      setError('Unable to submit leave request. Please try again.');
    }
  };

  return (
    <div className="page leave-page">
      <TopBar />
      <div className="page-body">
        <section className="hero-panel leave-hero">
          <div>
            <p className="eyebrow">Leave Management</p>
            <h2>Manage your leave requests</h2>
            <p>View leave balances, submit a request, and track status in one place.</p>
          </div>
          <div className="hero-action-card">
            <span>Pending Requests</span>
            <strong>{leaveRequests.filter((r) => r.status === 'Pending').length}</strong>
          </div>
        </section>

        <section className="leave-balance-grid">
          <div className="leave-balance-card">
            <span>Sick Leave</span>
            <strong>{leaveBalance.sick}</strong>
          </div>
          <div className="leave-balance-card">
            <span>Personal Leave</span>
            <strong>{leaveBalance.personal}</strong>
          </div>
        </section>

        <div className="leave-grid">
          <div className="form-card leave-form-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Apply Leave</p>
                <h3>Submit a new request</h3>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row two-column">
                <label>
                  Leave Type
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option>Sick Leave</option>
                    <option>Casual Leave</option>
                    <option>Paid Leave</option>
                  </select>
                </label>
                <label>
                  Duration Type
                  <select value={durationType} onChange={(e) => setDurationType(e.target.value)}>
                    <option>Full Day</option>
                    <option>Half Day</option>
                  </select>
                </label>
              </div>
              <div className="form-row two-column">
                <label>
                  Start Date
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
                </label>
                <label>
                  End Date
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)} required />
                </label>
              </div>
              <label>
                Calculated Days
                <input type="text" value={calculatedDays} readOnly />
              </label>
              <label>
                Reason for Leave
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Please provide the reason for your leave request..." required />
              </label>
              <button type="submit">Submit Leave Request</button>
              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message">{error}</p>}
            </form>
          </div>

          <div className="leave-history">
            <div className="section-header">
              <div>
                <p className="eyebrow">Request History</p>
                <h3>Recent leave requests</h3>
              </div>
            </div>
            <ul>
              {leaveRequests.map((request) => (
                <li key={request.id}>
                  <div className="leave-history-row">
                    <div>
                      <strong>{request.type}</strong>
                      <p>{request.from} → {request.to}</p>
                    </div>
                    <span className={`status-badge ${request.status === 'Approved' ? 'status-green' : request.status === 'Pending' ? 'status-yellow' : 'status-red'}`}>
                      {request.status}
                    </span>
                  </div>
                  <p>{request.reason}</p>
                </li>
              ))}
              {!leaveRequests.length && <div className="empty-state">No leave requests submitted yet.</div>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
