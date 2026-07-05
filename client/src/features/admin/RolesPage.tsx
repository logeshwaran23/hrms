import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  _count?: { users: number };
  rolePermissions?: { permission: { id: string; resource: string; action: string; scope: string | null } }[];
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: string | null;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/permissions'),
      ]);
      setRoles(rolesRes.data.data || []);
      setPermissions(permsRes.data.data || []);
    } catch {
      console.error('Failed to load roles data');
    } finally {
      setLoading(false);
    }
  };

  const viewRolePermissions = async (role: Role) => {
    try {
      const res = await api.get(`/admin/roles/${role.id}`);
      setSelectedRole(res.data.data || role);
      setShowPermissions(true);
    } catch {
      setSelectedRole(role);
      setShowPermissions(true);
    }
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const rolePermissionIds = new Set(
    selectedRole?.rolePermissions?.map((rp) => rp.permission.id) || []
  );

  if (loading) return <div className="loading-page"><div className="spinner"></div><p>Loading roles...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Roles & Permissions</h1>
        <p>Manage system roles and their associated permissions</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="stat-card">
          <div className="stat-card-icon primary">🔐</div>
          <div className="stat-card-label">Total Roles</div>
          <div className="stat-card-value">{roles.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon info">📋</div>
          <div className="stat-card-label">Total Permissions</div>
          <div className="stat-card-value">{permissions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon success">📦</div>
          <div className="stat-card-label">Resources</div>
          <div className="stat-card-value">{Object.keys(groupedPermissions).length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="eyebrow">RBAC</div>
            <div className="card-header-title">System Roles</div>
          </div>
        </div>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Description</th>
                <th>Users</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td style={{ fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontSize: '1.1rem' }}>
                        {role.name === 'SUPER_ADMIN' ? '👑' : role.name === 'HR_ADMIN' ? '🏢' : role.name === 'MANAGER' ? '👔' : '👤'}
                      </span>
                      {role.name}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 300 }}>{role.description || '—'}</td>
                  <td><span className="badge badge-neutral">{role._count?.users || 0} users</span></td>
                  <td>
                    <span className={`badge ${role.isSystemRole ? 'badge-primary' : 'badge-neutral'}`}>
                      {role.isSystemRole ? 'System' : 'Custom'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => viewRolePermissions(role)}>
                      View Permissions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Permissions */}
      <div className="card" style={{ marginTop: 'var(--space-5)' }}>
        <div className="card-header">
          <div>
            <div className="eyebrow">All</div>
            <div className="card-header-title">System Permissions ({permissions.length})</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <div key={resource}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary-600)', marginBottom: 'var(--space-2)' }}>
                  {resource}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {perms.map((p) => (
                    <span key={p.id} className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                      {p.action}{p.scope ? `:${p.scope}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role Permissions Modal */}
      {showPermissions && selectedRole && (
        <div className="modal-overlay" onClick={() => setShowPermissions(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div className="modal-title">Permissions — {selectedRole.name}</div>
              <button className="modal-close" onClick={() => setShowPermissions(false)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedRole.rolePermissions && selectedRole.rolePermissions.length > 0 ? (
                <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                  {selectedRole.rolePermissions.map((rp) => (
                    <div key={rp.permission.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--success-50)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--success-600)' }}>✓</span>
                      <span style={{ fontWeight: 500 }}>{rp.permission.resource}:{rp.permission.action}{rp.permission.scope ? `:${rp.permission.scope}` : ''}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <h3>No permissions data loaded</h3>
                  <p>Permission details are available for this role in the database.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPermissions(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
