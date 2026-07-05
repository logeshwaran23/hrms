import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface Department {
  id: string;
  name: string;
  _count?: { employees: number };
}

interface Designation {
  id: string;
  name: string;
  departmentId: string;
  department?: { name: string };
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
  year: number;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'departments' | 'holidays' | 'config'>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  // Department form
  const [newDept, setNewDept] = useState('');
  const [deptMsg, setDeptMsg] = useState('');

  // Holiday form
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', type: 'GENERAL', year: new Date().getFullYear() });
  const [holidayMsg, setHolidayMsg] = useState('');

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'departments') {
        const res = await api.get('/admin/departments');
        setDepartments(res.data.data || []);
      } else if (tab === 'holidays') {
        const res = await api.get('/admin/holidays', { params: { year: new Date().getFullYear() } });
        setHolidays(res.data.data || []);
      }
    } catch {
      console.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = async () => {
    if (!newDept.trim()) return;
    try {
      await api.post('/admin/departments', { name: newDept.trim() });
      setNewDept('');
      setDeptMsg('Department added!');
      await loadData();
    } catch (err: any) {
      setDeptMsg(err.response?.data?.message || 'Failed to add department');
    }
  };

  const addHoliday = async () => {
    if (!holidayForm.name || !holidayForm.date) {
      setHolidayMsg('Please fill in name and date');
      return;
    }
    try {
      await api.post('/admin/holidays', {
        ...holidayForm,
        year: new Date(holidayForm.date).getFullYear(),
      });
      setHolidayForm({ name: '', date: '', type: 'GENERAL', year: new Date().getFullYear() });
      setHolidayMsg('Holiday added!');
      await loadData();
    } catch (err: any) {
      setHolidayMsg(err.response?.data?.message || 'Failed to add holiday');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>System Settings</h1>
        <p>Manage departments, holidays, and system configuration</p>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'departments' ? 'active' : ''}`} onClick={() => setTab('departments')}>🏢 Departments</button>
        <button className={`tab-btn ${tab === 'holidays' ? 'active' : ''}`} onClick={() => setTab('holidays')}>📅 Holidays</button>
        <button className={`tab-btn ${tab === 'config' ? 'active' : ''}`} onClick={() => setTab('config')}>⚙️ General</button>
      </div>

      {tab === 'departments' && (
        <>
          {/* Add Department */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="card-header">
              <div><div className="eyebrow">Add</div><div className="card-header-title">New Department</div></div>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Department Name</label>
                <input value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="e.g. Engineering" onKeyDown={(e) => e.key === 'Enter' && addDepartment()} />
              </div>
              <button className="btn btn-primary" onClick={addDepartment}>Add Department</button>
            </div>
            {deptMsg && <div className="card-body" style={{ paddingTop: 0 }}><p className={deptMsg.includes('Failed') ? 'error-message' : 'success-message'}>{deptMsg}</p></div>}
          </div>

          {/* Department List */}
          <div className="card">
            <div className="card-header">
              <div><div className="eyebrow">Organization</div><div className="card-header-title">Departments ({departments.length})</div></div>
            </div>
            <div className="card-body">
              {loading ? <div className="loading-page" style={{ height: '20vh' }}><div className="spinner"></div></div> : departments.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">🏢</div><h3>No departments</h3></div>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                  {departments.map((d) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontWeight: 600 }}>{d.name}</span>
                      <span className="badge badge-neutral">{d._count?.employees || 0} employees</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'holidays' && (
        <>
          {/* Add Holiday */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="card-header">
              <div><div className="eyebrow">Add</div><div className="card-header-title">New Holiday</div></div>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Holiday Name</label>
                  <input value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} placeholder="e.g. Independence Day" />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} />
                </div>
              </div>
              <div className="form-group" style={{ maxWidth: 240 }}>
                <label className="form-label">Type</label>
                <select value={holidayForm.type} onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}>
                  <option value="GENERAL">General</option>
                  <option value="OPTIONAL">Optional</option>
                  <option value="RESTRICTED">Restricted</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={addHoliday}>📅 Add Holiday</button>
              {holidayMsg && <p className={holidayMsg.includes('Failed') || holidayMsg.includes('Please') ? 'error-message' : 'success-message'} style={{ marginTop: 'var(--space-3)' }}>{holidayMsg}</p>}
            </div>
          </div>

          {/* Holiday List */}
          <div className="card">
            <div className="card-header">
              <div><div className="eyebrow">Calendar</div><div className="card-header-title">Holidays ({holidays.length})</div></div>
            </div>
            <div className="card-body" style={{ overflowX: 'auto' }}>
              {loading ? <div className="loading-page" style={{ height: '20vh' }}><div className="spinner"></div></div> : holidays.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📅</div><h3>No holidays configured</h3></div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Holiday</th><th>Date</th><th>Day</th><th>Type</th></tr></thead>
                  <tbody>
                    {holidays.map((h) => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600 }}>🎉 {h.name}</td>
                        <td>{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'long' })}</td>
                        <td><span className={`badge ${h.type === 'GENERAL' ? 'badge-success' : h.type === 'OPTIONAL' ? 'badge-info' : 'badge-warning'}`}>{h.type}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'config' && (
        <div className="card">
          <div className="card-header">
            <div><div className="eyebrow">System</div><div className="card-header-title">General Configuration</div></div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div><div style={{ fontWeight: 600 }}>Company Name</div><div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Organization display name</div></div>
                <span style={{ fontWeight: 500 }}>Damodara Smart Tec Pvt Ltd</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div><div style={{ fontWeight: 600 }}>Financial Year</div><div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current financial year period</div></div>
                <span style={{ fontWeight: 500 }}>April 2026 — March 2027</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div><div style={{ fontWeight: 600 }}>Work Week</div><div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Standard working days</div></div>
                <span style={{ fontWeight: 500 }}>Monday — Friday</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div><div style={{ fontWeight: 600 }}>Working Hours</div><div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Standard shift timing</div></div>
                <span style={{ fontWeight: 500 }}>9:00 AM — 6:00 PM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div><div style={{ fontWeight: 600 }}>Leave Policy</div><div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Auto-managed via leave types</div></div>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
