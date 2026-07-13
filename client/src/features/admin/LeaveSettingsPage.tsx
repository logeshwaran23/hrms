import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface LeaveType {
  id: string;
  name: string;
  defaultBalance: number;
  carryForward: boolean;
  maxCarryDays: number;
  isActive: boolean;
}

export default function LeaveSettingsPage() {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<LeaveType | null>(null);
  
  const initialForm = { name: '', defaultBalance: 0, carryForward: false, maxCarryDays: 0, isActive: true };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leave/types');
      // For this page, we might want to see inactive ones too if the API returns them, 
      // but standard GET /types only returns active ones. 
      // Assuming GET /types returns what we need.
      setTypes(res.data.data || []);
    } catch {
      console.error('Failed to load leave types');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (selectedType) {
        await api.patch(`/leave/types/${selectedType.id}`, formData);
      } else {
        await api.post('/leave/types', formData);
      }
      setShowModal(false);
      loadTypes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save leave type');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this leave type? Future allocations will stop.')) return;
    try {
      await api.delete(`/leave/types/${id}`);
      loadTypes();
    } catch {
      alert('Failed to deactivate leave type');
    }
  };

  const openCreateModal = () => {
    setSelectedType(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (lt: LeaveType) => {
    setSelectedType(lt);
    setFormData({
      name: lt.name,
      defaultBalance: lt.defaultBalance,
      carryForward: lt.carryForward,
      maxCarryDays: lt.maxCarryDays,
      isActive: lt.isActive,
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Leave Settings</h1>
          <p>Configure leave categories and annual quotas</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ Add Leave Type</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-title">Configured Leave Types</div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading-page"><div className="spinner"></div></div>
          ) : types.length === 0 ? (
            <div className="empty-state">No leave types configured.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Leave Type Name</th>
                  <th>Annual Default Balance</th>
                  <th>Carry Forward</th>
                  <th>Max Carry Days</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {types.map(lt => (
                  <tr key={lt.id}>
                    <td style={{ fontWeight: 600 }}>{lt.name}</td>
                    <td>{lt.defaultBalance} Days</td>
                    <td>{lt.carryForward ? 'Yes' : 'No'}</td>
                    <td>{lt.carryForward ? lt.maxCarryDays : '-'}</td>
                    <td><span className={`badge ${lt.isActive ? 'badge-success' : 'badge-neutral'}`}>{lt.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => openEditModal(lt)}>Edit</button>
                        {lt.isActive && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--error-color)' }} onClick={() => handleDelete(lt.id)}>Deactivate</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{selectedType ? 'Edit Leave Type' : 'Add Leave Type'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Leave Type Name</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Sick Leave" />
              </div>
              <div className="form-group">
                <label className="form-label">Annual Default Balance (Days)</label>
                <input type="number" min="0" value={formData.defaultBalance} onChange={e => setFormData({...formData, defaultBalance: parseInt(e.target.value) || 0})} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>This amount is automatically granted to new employees.</div>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <input type="checkbox" id="cf" checked={formData.carryForward} onChange={e => setFormData({...formData, carryForward: e.target.checked})} />
                <label htmlFor="cf" style={{ margin: 0, fontWeight: 500 }}>Allow Carry Forward to Next Year</label>
              </div>
              {formData.carryForward && (
                <div className="form-group">
                  <label className="form-label">Maximum Carry Forward Days</label>
                  <input type="number" min="0" value={formData.maxCarryDays} onChange={e => setFormData({...formData, maxCarryDays: parseInt(e.target.value) || 0})} />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!formData.name || formData.defaultBalance < 0}>
                {selectedType ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
