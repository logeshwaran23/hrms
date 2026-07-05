import { useEffect, useState } from 'react';
import api from '../../lib/api';
import type { EODReport } from '../../types';

export default function EODPage() {
  const [summary, setSummary] = useState('');
  const [completedTasks, setCompletedTasks] = useState('');
  const [workLocation, setWorkLocation] = useState('Office');
  const [extraHours, setExtraHours] = useState('0');
  const [reports, setReports] = useState<EODReport[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('submit');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/eod').then(r => setReports(r.data.data)); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage(''); setError(''); setLoading(true);
    try {
      const r = await api.post('/eod', { summary, completedTasks, workLocation, extraHours: parseFloat(extraHours) });
      setMessage(r.data.message); setSummary(''); setCompletedTasks('');
      api.get('/eod').then(r => setReports(r.data.data));
    } catch (e: any) { setError(e.response?.data?.message || 'Failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header"><h1>End of Day Report</h1><p>Submit your daily work summary and track past reports</p></div>
      <div className="tabs">
        <button className={`tab-btn ${tab==='submit'?'active':''}`} onClick={()=>setTab('submit')}>Submit EOD</button>
        <button className={`tab-btn ${tab==='history'?'active':''}`} onClick={()=>setTab('history')}>My Reports ({reports.length})</button>
      </div>

      {tab === 'submit' && (
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Work Location</label><select value={workLocation} onChange={e=>setWorkLocation(e.target.value)}><option>Office</option><option>Work From Home</option><option>Client Site</option></select></div>
                <div className="form-group"><label className="form-label">Extra Hours</label><input type="number" step="0.5" min="0" value={extraHours} onChange={e=>setExtraHours(e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">Completed Tasks</label><input value={completedTasks} onChange={e=>setCompletedTasks(e.target.value)} placeholder="List key tasks completed today..." required /></div>
              <div className="form-group"><label className="form-label">Daily Summary</label><textarea value={summary} onChange={e=>setSummary(e.target.value)} placeholder="Summarize your work for the day..." rows={5} required /></div>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Submit EOD Report'}</button>
              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message">{error}</p>}
            </form>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div>
          {reports.map(r => (
            <div className="card" key={r.id} style={{ marginBottom: 'var(--space-4)' }}>
              <div className="card-header">
                <div><div className="card-header-title">{new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</div></div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <span className="badge badge-neutral">{r.workLocation}</span>
                  <span className="badge badge-success badge-dot">Submitted</span>
                </div>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: 'var(--space-2)' }}><strong>Tasks:</strong> {r.completedTasks}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{r.summary}</div>
                {r.extraHours > 0 && <div className="badge badge-info" style={{ marginTop: 'var(--space-2)' }}>+{r.extraHours}h extra</div>}
              </div>
            </div>
          ))}
          {!reports.length && <div className="empty-state"><div className="empty-state-icon">📝</div><h3>No reports yet</h3><p>Submit your first EOD report to see it here</p></div>}
        </div>
      )}
    </div>
  );
}
