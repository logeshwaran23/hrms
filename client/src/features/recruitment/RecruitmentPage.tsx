import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: string;
  postedDate: string;
}

interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  status: string;
  appliedDate: string;
  resumeUrl: string;
}

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', email: '', jobId: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsRes, candidatesRes] = await Promise.all([
        api.get('/recruitment/jobs'),
        api.get('/recruitment/candidates')
      ]);
      setJobs(jobsRes.data.data || []);
      setCandidates(candidatesRes.data.data || []);
    } catch (err) {
      console.error('Failed to load recruitment data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async () => {
    if (!newCandidate.name || !newCandidate.email || !newCandidate.jobId) return;
    try {
      await api.post('/recruitment/candidates', newCandidate);
      setShowAddModal(false);
      setNewCandidate({ name: '', email: '', jobId: '' });
      loadData();
    } catch (err) {
      console.error('Failed to add candidate');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/recruitment/candidates/${id}/status`, { status });
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    } catch (err) {
      console.error('Failed to update status');
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Recruitment</h1>
          <p>Applicant Tracking System (ATS)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Candidate
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="eyebrow">Openings</div>
              <div className="card-header-title">Active Job Postings</div>
            </div>
          </div>
          <div className="card-body">
            {jobs.length === 0 ? (
              <div className="empty-state">No active job postings.</div>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                {jobs.map(job => (
                  <div key={job.id} style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{job.title}</strong>
                      <span className="badge badge-success">{job.status}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {job.department} • {job.location} • {job.type}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                      Posted: {new Date(job.postedDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="eyebrow">Pipeline</div>
              <div className="card-header-title">Candidates</div>
            </div>
          </div>
          <div className="card-body">
            {candidates.length === 0 ? (
              <div className="empty-state">No candidates in pipeline.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Job Role</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(candidate => {
                    const job = jobs.find(j => j.id === candidate.jobId);
                    return (
                      <tr key={candidate.id}>
                        <td>
                          <div>{candidate.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{candidate.email}</div>
                        </td>
                        <td>{job?.title || 'Unknown Role'}</td>
                        <td>
                          <select
                            value={candidate.status}
                            onChange={(e) => handleStatusChange(candidate.id, e.target.value)}
                            className={`badge ${candidate.status === 'HIRED' ? 'badge-success' :
                              candidate.status === 'REJECTED' ? 'badge-error' :
                                candidate.status === 'SHORTLISTED' ? 'badge-info' :
                                  'badge-warning'
                              }`}
                            style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto', border: 'none', outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="SCREENING">SCREENING</option>
                            <option value="SHORTLISTED">SHORTLISTED</option>
                            <option value="INTERVIEWING">INTERVIEWING</option>
                            <option value="OFFERED">OFFERED</option>
                            <option value="HIRED">HIRED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </td>
                        <td>{new Date(candidate.appliedDate).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">Add New Candidate</div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Candidate Name</label>
                <input type="text" value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} placeholder="Full Name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" value={newCandidate.email} onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })} placeholder="Email address" />
              </div>
              <div className="form-group">
                <label className="form-label">Job Role</label>
                <select value={newCandidate.jobId} onChange={e => setNewCandidate({ ...newCandidate, jobId: e.target.value })} className="form-control">
                  <option value="">Select a job...</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddCandidate} disabled={!newCandidate.name || !newCandidate.email || !newCandidate.jobId}>Add Candidate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
