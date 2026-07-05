import { useEffect, useState } from 'react';
import api from '../../lib/api';
import type { Employee } from '../../types';

interface EmployeeListItem extends Employee {
  user?: { role: { name: string } };
}

interface PaginatedResult {
  data: EmployeeListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeListItem | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [page, selectedDept]);

  const loadDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.data || []);
    } catch {
      // Departments endpoint might not return data if not seeded
    }
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
      <div className="page-header">
        <h1>Employee Directory</h1>
        <p>Browse and search employees across the organization</p>
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
                      <button className="btn btn-sm btn-ghost" onClick={() => setSelectedEmployee(emp)}>View</button>
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
      {selectedEmployee && (
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
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedEmployee(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
