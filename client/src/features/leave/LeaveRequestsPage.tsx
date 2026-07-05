import { useEffect, useState } from 'react';
import api from '../../lib/api';
import type { LeaveRequest } from '../../types';

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leave/requests').then(res => { setRequests(res.data.data); setLoading(false); });
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { PENDING: 'badge-warning', APPROVED: 'badge-success', REJECTED: 'badge-error', CANCELLED: 'badge-neutral' };
    return <span className={`badge badge-dot ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  return (
    <div>
      <div className="page-header"><h1>My Leave Requests</h1><p>Track the status of all your leave applications</p></div>
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Type</th><th>From</th><th>To</th><th>Duration</th><th>Reason</th><th>Status</th><th>Applied On</th></tr></thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.leaveType.name}</strong></td>
                  <td>{new Date(r.startDate).toLocaleDateString()}</td>
                  <td>{new Date(r.endDate).toLocaleDateString()}</td>
                  <td>{r.duration} {r.durationType === 'HALF_DAY' ? '(½)' : ''} days</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!requests.length && <div className="table-empty">No leave requests found</div>}
        </div>
      </div>
    </div>
  );
}
