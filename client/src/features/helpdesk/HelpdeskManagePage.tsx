import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface ManagedTicket {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  resolution: string | null;
  createdAt: string;
  employee: { firstName: string; lastName: string; employeeCode: string };
}

export default function HelpdeskManagePage() {
  const [tickets, setTickets] = useState<ManagedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('OPEN');
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadTickets(); }, [filter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/helpdesk', { params: { status: filter === 'ALL' ? undefined : filter, all: true } });
      setTickets(res.data.data || []);
    } catch {
      console.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (ticketId: string) => {
    if (!resolution.trim()) return;
    setProcessing(true);
    try {
      await api.patch(`/helpdesk/${ticketId}/resolve`, { resolution });
      setResolveId(null);
      setResolution('');
      await loadTickets();
    } catch {
      console.error('Failed to resolve ticket');
    } finally {
      setProcessing(false);
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'URGENT': return 'badge-error';
      case 'HIGH': return 'badge-warning';
      case 'MEDIUM': return 'badge-info';
      default: return 'badge-neutral';
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'OPEN': return 'badge-info';
      case 'IN_PROGRESS': return 'badge-warning';
      case 'RESOLVED': return 'badge-success';
      case 'CLOSED': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Manage Helpdesk</h1>
        <p>View and resolve employee support tickets</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="stat-card">
          <div className="stat-card-icon info">🎫</div>
          <div className="stat-card-label">Total Tickets</div>
          <div className="stat-card-value">{tickets.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon warning">⏳</div>
          <div className="stat-card-label">Open</div>
          <div className="stat-card-value">{tickets.filter((t) => t.status === 'OPEN').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon success">✅</div>
          <div className="stat-card-label">Resolved</div>
          <div className="stat-card-value">{tickets.filter((t) => t.status === 'RESOLVED').length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="eyebrow">Tickets</div>
            <div className="card-header-title">All Tickets</div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
              <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(s)}>
                {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="loading-page" style={{ height: '30vh' }}><div className="spinner"></div></div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎫</div>
              <h3>No tickets found</h3>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.employee.firstName} {t.employee.lastName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{t.employee.employeeCode}</div>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                    <td><span className="badge badge-neutral">{t.category.replace(/_/g, ' ')}</span></td>
                    <td><span className={`badge ${priorityColor(t.priority)}`}>{t.priority}</span></td>
                    <td><span className={`badge badge-dot ${statusColor(t.status)}`}>{t.status.replace(/_/g, ' ')}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>
                      {t.status === 'OPEN' || t.status === 'IN_PROGRESS' ? (
                        resolveId === t.id ? (
                          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                            <input value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Resolution note" style={{ fontSize: '0.8rem', padding: '4px 8px', width: 160 }} />
                            <button className="btn btn-sm btn-success" onClick={() => handleResolve(t.id)} disabled={processing}>✓</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => { setResolveId(null); setResolution(''); }}>✕</button>
                          </div>
                        ) : (
                          <button className="btn btn-sm btn-success" onClick={() => setResolveId(t.id)}>Resolve</button>
                        )
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{t.resolution || '—'}</span>
                      )}
                    </td>
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
