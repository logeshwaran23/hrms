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

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  department?: { name: string };
  designation?: { name: string };
}

export default function PerformancePage() {
  const { user, hasPermission } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // My Performance State
  const [newGoal, setNewGoal] = useState({ title: '', description: '', dueDate: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [updateForm, setUpdateForm] = useState({ status: '', progress: 0 });

  // Team Performance State
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAppraisalModal, setShowAppraisalModal] = useState(false);
  const [newAppraisal, setNewAppraisal] = useState({ year: new Date().getFullYear(), rating: 3, feedback: '' });

  const isManagerOrHR = hasPermission('employee:read:team') || hasPermission('employee:read:all');

  useEffect(() => {
    if (activeTab === 'my') {
      loadMyData();
    } else {
      loadTeamData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeePerformance(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  const loadMyData = async () => {
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

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const endpoint = hasPermission('employee:read:all') ? '/employees' : '/employees/team';
      const res = await api.get(endpoint);
      const data = res.data.data || [];
      // If it's paginated list, data might be in res.data.data.data or res.data.data
      const members = Array.isArray(data) ? data : data.data || [];
      setTeamMembers(members);
      if (!selectedEmployee && members.length > 0) {
        setSelectedEmployee(members[0]);
      }
    } catch (err) {
      console.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeePerformance = async (empId: string) => {
    setLoading(true);
    try {
      const [goalsRes, appraisalsRes] = await Promise.all([
        api.get('/performance/goals', { params: { employeeId: empId } }),
        api.get('/performance/appraisals', { params: { employeeId: empId } })
      ]);
      setGoals(goalsRes.data.data || []);
      setAppraisals(appraisalsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load employee performance');
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
      loadMyData();
    } catch (err) {
      console.error('Failed to add goal');
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;
    try {
      await api.patch(`/performance/goals/${editingGoal.id}`, updateForm);
      setEditingGoal(null);
      if (activeTab === 'my') loadMyData();
      else if (selectedEmployee) loadEmployeePerformance(selectedEmployee.id);
    } catch (err) {
      console.error('Failed to update goal');
    }
  };

  const handleAddAppraisal = async () => {
    if (!selectedEmployee) return;
    try {
      await api.post('/performance/appraisals', {
        employeeId: selectedEmployee.id,
        ...newAppraisal
      });
      setShowAppraisalModal(false);
      setNewAppraisal({ year: new Date().getFullYear(), rating: 3, feedback: '' });
      loadEmployeePerformance(selectedEmployee.id);
    } catch (err) {
      console.error('Failed to add appraisal');
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Performance Management</h1>
          <p>Track goals and view performance reviews</p>
        </div>
        {activeTab === 'my' && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + New Goal
          </button>
        )}
        {activeTab === 'team' && selectedEmployee && (
          <button className="btn btn-primary" onClick={() => setShowAppraisalModal(true)}>
            + Add Review
          </button>
        )}
      </div>

      {isManagerOrHR && (
        <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
          <button className={`tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>My Performance</button>
          <button className={`tab ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>Team Performance</button>
        </div>
      )}

      {activeTab === 'team' && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label className="form-label">Select Employee</label>
          <select 
            className="form-control" 
            style={{ maxWidth: 300 }}
            value={selectedEmployee?.id || ''} 
            onChange={(e) => {
              const emp = teamMembers.find(t => t.id === e.target.value);
              if (emp) setSelectedEmployee(emp);
            }}
          >
            {teamMembers.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && (!teamMembers.length || activeTab === 'my') ? (
        <div className="loading-page"><div className="spinner"></div></div>
      ) : (
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="eyebrow">OKRs</div>
                <div className="card-header-title">{activeTab === 'my' ? 'My Goals' : `${selectedEmployee?.firstName}'s Goals`}</div>
              </div>
            </div>
            <div className="card-body">
              {goals.length === 0 ? (
                <div className="empty-state">No goals set yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  {goals.map(goal => (
                    <div key={goal.id} style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <strong style={{ fontSize: '1.05rem' }}>{goal.title}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span className={`badge ${goal.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{goal.status.replace('_', ' ')}</span>
                          {/* Only show Update button for own goals, or allow managers to update too */}
                          <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => {
                            setEditingGoal(goal);
                            setUpdateForm({ status: goal.status, progress: goal.progress });
                          }}>Update</button>
                        </div>
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
      )}

      {/* Add Goal Modal */}
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

      {/* Update Goal Modal */}
      {editingGoal && (
        <div className="modal-overlay" onClick={() => setEditingGoal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">Update Goal Progress</div>
              <button className="modal-close" onClick={() => setEditingGoal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">Status</label>
                <select value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Progress: {updateForm.progress}%</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={updateForm.progress} 
                  onChange={e => setUpdateForm({ ...updateForm, progress: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingGoal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateGoal}>Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Appraisal Modal */}
      {showAppraisalModal && (
        <div className="modal-overlay" onClick={() => setShowAppraisalModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">Create Performance Review</div>
              <button className="modal-close" onClick={() => setShowAppraisalModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input type="number" value={newAppraisal.year} onChange={e => setNewAppraisal({ ...newAppraisal, year: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rating (1-5)</label>
                  <input type="number" min="1" max="5" value={newAppraisal.rating} onChange={e => setNewAppraisal({ ...newAppraisal, rating: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Feedback</label>
                <textarea 
                  rows={4}
                  value={newAppraisal.feedback} 
                  onChange={e => setNewAppraisal({ ...newAppraisal, feedback: e.target.value })} 
                  placeholder="Provide detailed feedback..."
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAppraisalModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddAppraisal} disabled={!newAppraisal.feedback}>Save Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
