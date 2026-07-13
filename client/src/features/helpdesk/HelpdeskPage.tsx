import { useEffect, useState } from 'react';
import api from '../../lib/api';
import type { Ticket } from '../../types';

const CATEGORIES = ['PAYROLL', 'LEAVE', 'ATTENDANCE', 'IT_SUPPORT', 'POLICY', 'GENERAL', 'GRIEVANCE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [form, setForm] = useState({
    category: 'GENERAL',
    subject: '',
    description: '',
    priority: 'MEDIUM',
  });

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    try {
      const res = await api.get('/helpdesk');
      setTickets(res.data.data || []);
    } catch {
      console.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.subject || !form.description) {
      setMessage('Please fill in subject and description');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await api.post('/helpdesk', form);
      setMessage('Ticket submitted successfully!');
      setForm({ category: 'GENERAL', subject: '', description: '', priority: 'MEDIUM' });
      setShowForm(false);
      await loadTickets();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = filter === 'ALL' ? tickets : tickets.filter((t) => t.status === filter);

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

  if (loading) return <div className="loading-page"><div className="spinner"></div><p>Loading tickets...</p></div>;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Helpdesk</h1>
          <p>Raise queries and track your support tickets</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '🎫 Raise Ticket'}
        </button>
      </div>

      {message && <p className={message.includes('Failed') || message.includes('Please') ? 'error-message' : 'success-message'} style={{ marginBottom: 'var(--space-4)' }}>{message}</p>}

      {showForm && (
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="card-header">
            <div>
              <div className="eyebrow">New Ticket</div>
              <div className="card-header-title">Raise a Support Request</div>
            </div>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief description of the issue" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Provide detailed information about your request..." />
            </div>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : '📩 Submit Ticket'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="eyebrow">My Tickets</div>
            <div className="card-header-title">Support History ({filteredTickets.length})</div>
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
          {filteredTickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎫</div>
              <h3>No tickets found</h3>
              <p>Click "Raise Ticket" to create a new support request.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                    <td><span className="badge badge-neutral">{t.category.replace(/_/g, ' ')}</span></td>
                    <td><span className={`badge ${priorityColor(t.priority)}`}>{t.priority}</span></td>
                    <td><span className={`badge badge-dot ${statusColor(t.status)}`}>{t.status.replace(/_/g, ' ')}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
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
