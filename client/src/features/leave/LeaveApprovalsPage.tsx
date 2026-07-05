import { useEffect, useState } from 'react';
import api from '../../lib/api';
import type { LeaveRequest } from '../../types';
import { useAuthStore } from '../../store/authStore';

export default function LeaveApprovalsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { hasPermission } = useAuthStore();

  const loadRequests = async () => {
    const endpoint = hasPermission('leave:approve:all') ? '/leave/requests/all' : '/leave/requests/team';
    const res = await api.get(endpoint, { params: { status: 'PENDING' } });
    setRequests(res.data.data);
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      await api.patch(`/leave/requests/${id}/${action}`, { comment: '' });
      await loadRequests();
    } catch { /* handled */ }
    setActionLoading(null);
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header"><h1>Leave Approvals</h1><p>Review and approve pending leave requests</p></div>
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Actions</th></tr></thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.employee?.firstName} {r.employee?.lastName}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{r.employee?.employeeCode}</span></td>
                  <td>{r.leaveType.name}</td>
                  <td>{new Date(r.startDate).toLocaleDateString()}</td>
                  <td>{new Date(r.endDate).toLocaleDateString()}</td>
                  <td>{r.duration}</td>
                  <td style={{ maxWidth: 200 }}>{r.reason}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleAction(r.id, 'approve')} disabled={actionLoading === r.id}>✓ Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction(r.id, 'reject')} disabled={actionLoading === r.id}>✗ Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!requests.length && <div className="table-empty">No pending leave requests 🎉</div>}
        </div>
      </div>
    </div>
  );
}
