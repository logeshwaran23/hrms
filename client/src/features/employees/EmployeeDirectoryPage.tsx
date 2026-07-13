import { useEffect, useState } from 'react';
import api from '../../lib/api';
import type { Employee } from '../../types';
import { useAuthStore } from '../../store/authStore';

interface EmployeeListItem extends Employee {
  user?: { role: { id: string; name: string } };
}

interface PaginatedResult {
  data: EmployeeListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function EmployeeDirectoryPage() {
  const { hasPermission } = useAuthStore();
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeListItem[]>([]); // For manager dropdown
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [designations, setDesignations] = useState<{ id: string; name: string; departmentId: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeListItem | null>(null);
  
  const [employeeDocs, setEmployeeDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // CRUD State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const initialFormState = {
    firstName: '', lastName: '', email: '', phone: '', dateOfJoining: '',
    gender: 'MALE', departmentId: '', designationId: '', managerId: '', roleId: '', password: '', status: 'ACTIVE'
  };
  const [formData, setFormData] = useState(initialFormState);

  const canCreate = hasPermission('employee:create');
  const canUpdate = hasPermission('employee:update:all');
  const canDelete = hasPermission('employee:delete');

  useEffect(() => {
    loadDepartments();
    loadDesignations();
    loadRoles();
    loadAllEmployees(); // For manager dropdown
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [page, selectedDept]);

  useEffect(() => {
    if (selectedEmployee && !showEditModal) {
      setLoadingDocs(true);
      api.get(`/documents/${selectedEmployee.id}`)
        .then(res => setEmployeeDocs(res.data.data || []))
        .catch(() => console.error('Failed to load employee documents'))
        .finally(() => setLoadingDocs(false));
    } else {
      setEmployeeDocs([]);
    }
  }, [selectedEmployee, showEditModal]);

  const loadDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.data || []);
    } catch { console.error('Failed to load departments'); }
  };

  const loadDesignations = async () => {
    try {
      const res = await api.get('/admin/designations');
      setDesignations(res.data.data || []);
    } catch { console.error('Failed to load designations'); }
  };

  const loadRoles = async () => {
    try {
      const res = await api.get('/admin/roles');
      setRoles(res.data.data || []);
    } catch { console.error('Failed to load roles'); }
  };

  const loadAllEmployees = async () => {
    try {
      const res = await api.get('/employees', { params: { limit: 1000 } });
      setAllEmployees(res.data.data || []);
    } catch { console.error('Failed to load all employees'); }
  };

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      if (selectedDept) params.department = selectedDept;
      const res = await api.get('/employees', { params });
      const result = res.data as PaginatedResult;
      setEmployees(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotal(result.pagination?.total || 0);
    } catch {
      console.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadEmployees();
  };

  // CRUD Actions
  const handleCreateEmployee = async () => {
    try {
      await api.post('/employees', {
        ...formData,
        managerId: formData.managerId || null
      });
      setShowCreateModal(false);
      setFormData(initialFormState);
      loadEmployees();
      loadAllEmployees();
    } catch (err) {
      console.error('Failed to create employee', err);
      alert('Failed to create employee. Ensure all required fields are filled and email is unique.');
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      // Don't send password or email in update if they aren't part of schema
      const { email, password, roleId, ...updateData } = formData;
      await api.patch(`/employees/${selectedEmployee.id}`, {
        ...updateData,
        managerId: updateData.managerId || null
      });
      setShowEditModal(false);
      setSelectedEmployee(null);
      loadEmployees();
      loadAllEmployees();
    } catch (err) {
      console.error('Failed to update employee', err);
      alert('Failed to update employee.');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;
    try {
      await api.delete(`/employees/${id}`);
      loadEmployees();
      loadAllEmployees();
    } catch (err) {
      console.error('Failed to delete employee', err);
      alert('Failed to delete employee. They may have dependent records.');
    }
  };

  const openEditModal = (emp: EmployeeListItem) => {
    setSelectedEmployee(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      dateOfJoining: new Date(emp.dateOfJoining).toISOString().split('T')[0],
      gender: emp.gender || 'MALE',
      departmentId: emp.departmentId || '',
      designationId: emp.designationId || '',
      managerId: emp.managerId || '',
      roleId: emp.user?.role?.id || '',
      password: '',
      status: emp.status
    });
    setShowEditModal(true);
  };

  const handleDownloadDoc = async (docId: string, docName: string) => {
    try {
      const res = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', docName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download document', err);
    }
  };

  const handleVerifyDoc = async (docId: string) => {
    try {
      await api.patch(`/documents/${docId}/verify`);
      setEmployeeDocs(prev => prev.map(d => d.id === docId ? { ...d, verified: true } : d));
    } catch (err) {
      console.error('Failed to verify document', err);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'ACTIVE': return 'badge-success';
      case 'ON_NOTICE': return 'badge-warning';
      case 'TERMINATED': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Employee Directory</h1>
          <p>Browse and manage employees across the organization</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => { setFormData(initialFormState); setShowCreateModal(true); }}>
            + Add Employee
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-body" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Name, email, or employee code..."
            />
          </div>
          <div style={{ minWidth: 180 }}>
            <label className="form-label">Department</label>
            <select value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSearch}>🔍 Search</button>
        </div>
      </div>

      {/* Results */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="eyebrow">Directory</div>
            <div className="card-header-title">{total} Employees</div>
          </div>
        </div>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="loading-page" style={{ height: '30vh' }}><div className="spinner"></div></div>
          ) : employees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3>No employees found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div className="topbar-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem', flexShrink: 0 }}>
                          {emp.firstName?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{emp.firstName} {emp.lastName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-neutral">{emp.employeeCode}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>{emp.department?.name}</td>
                    <td style={{ fontSize: '0.85rem' }}>{emp.designation?.name}</td>
                    <td><span className={`badge badge-dot ${statusColor(emp.status)}`}>{emp.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => setSelectedEmployee(emp)}>View</button>
                        {canUpdate && <button className="btn btn-sm btn-ghost" onClick={() => openEditModal(emp)}>Edit</button>}
                        {canDelete && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--error-color)' }} onClick={() => handleDeleteEmployee(emp.id)}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
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

      {/* Employee Detail Modal */}
      {selectedEmployee && !showEditModal && (
        <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Employee Details</div>
              <button className="modal-close" onClick={() => setSelectedEmployee(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div className="topbar-avatar" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>
                  {selectedEmployee.firstName?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{selectedEmployee.employeeCode} · {selectedEmployee.designation?.name}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--text-secondary)' }}>Email</span><span>{selectedEmployee.email}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--text-secondary)' }}>Phone</span><span>{selectedEmployee.phone || '—'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--text-secondary)' }}>Department</span><span>{selectedEmployee.department?.name}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--text-secondary)' }}>Designation</span><span>{selectedEmployee.designation?.name}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--text-secondary)' }}>Manager</span><span>{selectedEmployee.manager ? `${selectedEmployee.manager.firstName} ${selectedEmployee.manager.lastName}` : '—'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--text-secondary)' }}>Date of Joining</span><span>{new Date(selectedEmployee.dateOfJoining).toLocaleDateString('en-IN')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--text-secondary)' }}>Status</span><span className={`badge badge-dot ${statusColor(selectedEmployee.status)}`}>{selectedEmployee.status}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--text-secondary)' }}>Role</span><span>{selectedEmployee.user?.role?.name || '—'}</span></div>
              </div>
              <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-4)' }}>
                <div style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Uploaded Documents</div>
                {loadingDocs ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading documents...</div>
                ) : employeeDocs.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No documents uploaded.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {employeeDocs.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span>📄</span>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                              {doc.name}
                              {doc.verified && <span style={{ marginLeft: 8, color: 'var(--success-color)', fontSize: '0.75rem' }}>✓ Verified</span>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{doc.type.replace(/_/g, ' ')}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          {!doc.verified && (
                            <button className="btn btn-sm btn-success" onClick={() => handleVerifyDoc(doc.id)}>
                              Verify
                            </button>
                          )}
                          <button className="btn btn-sm btn-secondary" onClick={() => handleDownloadDoc(doc.id, doc.name)}>
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedEmployee(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Employee Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <div className="modal-title">{showEditModal ? 'Edit Employee' : 'Add Employee'}</div>
              <button className="modal-close" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="John" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Doe" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" disabled={showEditModal} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john.doe@company.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 8900" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Joining</label>
                  <input type="date" value={formData.dateOfJoining} onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value, designationId: ''})}>
                    <option value="">Select Department</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <select value={formData.designationId} onChange={(e) => setFormData({...formData, designationId: e.target.value})}>
                    <option value="">Select Designation</option>
                    {designations.filter(d => !formData.departmentId || d.departmentId === formData.departmentId).map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select disabled={showEditModal} value={formData.roleId} onChange={(e) => setFormData({...formData, roleId: e.target.value})}>
                    <option value="">Select System Role</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Manager (Optional)</label>
                  <select value={formData.managerId} onChange={(e) => setFormData({...formData, managerId: e.target.value})}>
                    <option value="">None</option>
                    {allEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                    ))}
                  </select>
                </div>
              </div>
              {!showEditModal ? (
                <div className="form-group">
                  <label className="form-label">Temporary Password</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Min 6 characters" />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_NOTICE">On Notice</option>
                    <option value="TERMINATED">Terminated</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={showEditModal ? handleUpdateEmployee : handleCreateEmployee}>
                {showEditModal ? 'Update Employee' : 'Create Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
