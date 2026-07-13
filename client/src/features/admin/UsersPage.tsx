import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface User {
  id: string;
  email: string;
  status: string;
  lastLogin: string | null;
  role: { id: string; name: string };
  employee: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
}

interface PaginatedResult {
  data: User[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: string; firstName: string; lastName: string; employeeCode: string }[]>([]);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const initialFormState = { email: '', password: '', roleId: '', status: 'ACTIVE', employeeId: '' };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadRoles();
    loadEmployees();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      const res = await api.get('/admin/users', { params });
      const result = res.data as PaginatedResult;
      setUsers(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotal(result.pagination?.total || 0);
    } catch {
      console.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await api.get('/admin/roles');
      setRoles(res.data.data || []);
    } catch { console.error('Failed to load roles'); }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get('/employees', { params: { limit: 1000 } });
      const data = res.data.data || [];
      setEmployees(Array.isArray(data) ? data : data.data || []);
    } catch { console.error('Failed to load employees'); }
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const handleSave = async () => {
    try {
      if (selectedUser) {
        const payload: any = {
          email: formData.email,
          roleId: formData.roleId,
          status: formData.status,
          employeeId: formData.employeeId || null,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await api.patch(`/admin/users/${selectedUser.id}`, payload);
      } else {
        await api.post('/admin/users', {
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId,
          status: formData.status,
          employeeId: formData.employeeId || null,
        });
      }
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? They will lose all access to the system.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      loadUsers();
    } catch {
      alert('Failed to delete user');
    }
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '', // don't load password
      roleId: user.role.id,
      status: user.status,
      employeeId: user.employee?.id || ''
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>User Management</h1>
          <p>Manage system access, login credentials, and roles.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ Add User</button>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-body" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Search Email</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="user@domain.com"
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch}>🔍 Search</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="eyebrow">System Access</div>
            <div className="card-header-title">{total} Users</div>
          </div>
        </div>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="loading-page" style={{ height: '30vh' }}><div className="spinner"></div></div>
          ) : users.length === 0 ? (
            <div className="empty-state">No users found.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email / Login</th>
                  <th>System Role</th>
                  <th>Linked Employee</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.email}</td>
                    <td><span className="badge badge-primary">{u.role.name}</span></td>
                    <td>
                      {u.employee ? `${u.employee.firstName} ${u.employee.lastName} (${u.employee.employeeCode})` : <span style={{ color: 'var(--text-tertiary)' }}>Unlinked</span>}
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => openEditModal(u)}>Edit</button>
                        <button className="btn btn-sm btn-ghost" style={{ color: 'var(--error-color)' }} onClick={() => handleDelete(u.id)}>Delete</button>
                      </div>
                    </td>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">{selectedUser ? 'Edit User' : 'Add User'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Email (Login ID)</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="admin@hrms.com" />
              </div>
              <div className="form-group">
                <label className="form-label">{selectedUser ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">System Role</label>
                <select value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})}>
                  <option value="">Select Role...</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Linked Employee Profile (Optional)</label>
                <select value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                  <option value="">No linked employee (System User Only)</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>)}
                </select>
              </div>
              {selectedUser && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!formData.email || !formData.roleId || (!selectedUser && !formData.password)}>
                {selectedUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
