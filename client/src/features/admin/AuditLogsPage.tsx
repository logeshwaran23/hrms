import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ip: string | null;
  createdAt: string;
  user?: { email: string; employee?: { firstName: string; lastName: string } | null } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');

  useEffect(() => { loadLogs(); }, [page, filterAction, filterResource]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 25 };
      if (filterAction) params.action = filterAction;
      if (filterResource) params.resource = filterResource;
      const res = await api.get('/admin/audit-logs', { params });
      setLogs(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      console.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const actionColor = (a: string) => {
    if (a === 'LOGIN' || a === 'LOGOUT') return 'badge-info';
    if (a === 'CREATE') return 'badge-success';
    if (a === 'UPDATE' || a === 'APPROVE') return 'badge-warning';
    if (a === 'DELETE' || a === 'UNAUTHORIZED_ACCESS') return 'badge-error';
    return 'badge-neutral';
  };

  return (
    <div>
      <div className="page-header">
        <h1>Audit Logs</h1>
        <p>Track all system actions and changes for compliance and security</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-body" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 160 }}>
            <label className="form-label">Action</label>
            <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}>
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="APPROVE">Approve</option>
              <option value="REJECT">Reject</option>
              <option value="UNAUTHORIZED_ACCESS">Unauthorized</option>
            </select>
          </div>
          <div style={{ minWidth: 160 }}>
            <label className="form-label">Resource</label>
            <select value={filterResource} onChange={(e) => { setFilterResource(e.target.value); setPage(1); }}>
              <option value="">All Resources</option>
              <option value="auth">Auth</option>
              <option value="employee">Employee</option>
              <option value="leave">Leave</option>
              <option value="attendance">Attendance</option>
              <option value="payroll">Payroll</option>
              <option value="helpdesk">Helpdesk</option>
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => { setFilterAction(''); setFilterResource(''); setPage(1); }}>Clear Filters</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="eyebrow">Security</div>
            <div className="card-header-title">Activity Log</div>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={loadLogs}>↻ Refresh</button>
        </div>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="loading-page" style={{ height: '30vh' }}><div className="spinner"></div></div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📜</div>
              <h3>No audit logs found</h3>
              <p>Audit logs will appear here as users perform actions in the system.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Resource ID</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {log.user?.employee ? `${log.user.employee.firstName} ${log.user.employee.lastName}` : log.user?.email || '—'}
                      </div>
                    </td>
                    <td><span className={`badge ${actionColor(log.action)}`}>{log.action}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>{log.resource}</td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.resourceId || '—'}</td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{log.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
              <button className="btn btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
