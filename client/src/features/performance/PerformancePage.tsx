import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface Goal {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  dueDate: string;
}

interface Appraisal {
  id: string;
  year: number;
  rating: number;
  feedback: string;
  managerName: string;
}

export default function PerformancePage() {
  const { user } = useAuthStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', dueDate: '' });
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsRes, appraisalsRes] = await Promise.all([
        api.get('/performance/goals', { params: { employeeId: user?.employee?.id } }),
        api.get('/performance/appraisals', { params: { employeeId: user?.employee?.id } })
      ]);
      setGoals(goalsRes.data.data || []);
      setAppraisals(appraisalsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.dueDate) return;
    try {
      await api.post('/performance/goals', {
        employeeId: user?.employee?.id,
        status: 'NOT_STARTED',
        ...newGoal
      });
      setShowAddModal(false);
      setNewGoal({ title: '', description: '', dueDate: '' });
      loadData();
    } catch (err) {
      console.error('Failed to add goal');
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Performance Management</h1>
          <p>Track your goals and view performance reviews</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + New Goal
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="eyebrow">OKRs</div>
              <div className="card-header-title">My Goals</div>
            </div>
          </div>
          <div className="card-body">
            {goals.length === 0 ? (
              <div className="empty-state">No goals set yet. Add a new goal to get started.</div>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                {goals.map(goal => (
                  <div key={goal.id} style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{goal.title}</strong>
                      <span className={`badge ${goal.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{goal.status.replace('_', ' ')}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>{goal.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--primary-100)', borderRadius: 'var(--radius-full)' }}>
                        <div style={{ width: `${goal.progress}%`, height: '100%', background: 'var(--primary-600)', borderRadius: 'var(--radius-full)' }}></div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{goal.progress}%</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                      Due: {new Date(goal.dueDate).toLocaleDateString()}
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
              <div className="eyebrow">Reviews</div>
              <div className="card-header-title">Performance Appraisals</div>
            </div>
          </div>
          <div className="card-body">
            {appraisals.length === 0 ? (
              <div className="empty-state">No past appraisals found.</div>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                {appraisals.map(appraisal => (
                  <div key={appraisal.id} style={{ borderLeft: '3px solid var(--primary-500)', paddingLeft: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{appraisal.year} Annual Review</h3>
                      <span className="badge badge-primary">Rating: {appraisal.rating} / 5</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                      Reviewed by: {appraisal.managerName}
                    </div>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>"{appraisal.feedback}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">Create New Goal</div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Goal Title</label>
                <input type="text" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="e.g. Learn React Query" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="Brief details about the goal..."></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Target Date</label>
                <input type="date" value={newGoal.dueDate} onChange={e => setNewGoal({ ...newGoal, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddGoal} disabled={!newGoal.title || !newGoal.dueDate}>Save Goal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
