import { useEffect, useState } from 'react';
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
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

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
      await loadLeaves();
    } catch {
      setError('Unable to submit leave request. Please try again.');
    }
  };

  const pendingCount = leaveRequests.filter((request) => request.status === 'Pending').length;

  return (
    <div className="page leave-page">
      <TopBar />
      <div className="content-grid">
        <div className="hero-panel leave-hero">
          <div>
            <h2>Apply for Leave</h2>
            <p>Submit leave requests and track approval status in one place.</p>
          </div>
          <div className="leave-summary-card">
            <span>Pending Requests</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>
        <form className="form-card" onSubmit={handleSubmit}>
          <label>
            Leave Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>Sick Leave</option>
              <option>Casual Leave</option>
              <option>Paid Leave</option>
            </select>
          </label>
          <label>
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
          </label>
          <label>
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} required />
          </label>
          <label>
            Reason
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} required />
          </label>
          <button type="submit">Submit Leave</button>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
        </form>
        {leaveRequests.length > 0 && (
          <div className="leave-history">
            <h3>Leave Requests</h3>
            <ul>
              {leaveRequests.map((request) => (
                <li key={request.id}>
                  <strong>{request.type}</strong> from {request.from} to {request.to} — {request.status}
                  <p>{request.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
