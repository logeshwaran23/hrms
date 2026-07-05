import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  permission?: string;
  badge?: number;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user, hasPermission, hasAnyPermission } = useAuthStore();
  const location = useLocation();

  const menuSections: MenuSection[] = [
    {
      label: 'Main',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: '📊' },
        { label: 'My Profile', path: '/profile', icon: '👤' },
      ],
    },
    {
      label: 'Self Service',
      items: [
        { label: 'Attendance', path: '/attendance', icon: '⏱️' },
        { label: 'Apply Leave', path: '/leave/apply', icon: '🏖️' },
        { label: 'My Leaves', path: '/leave/requests', icon: '📋' },
        { label: 'EOD Report', path: '/eod', icon: '📝' },
        { label: 'My Payslips', path: '/payslips', icon: '💰', permission: 'payroll:view:own' },
        { label: 'Documents', path: '/documents', icon: '📁' },
        { label: 'Helpdesk', path: '/helpdesk', icon: '🎫' },
        { label: 'Performance', path: '/performance', icon: '🎯' },
      ],
    },
    {
      label: 'Management',
      items: [
        { label: 'Leave Approvals', path: '/leave/approvals', icon: '✅', permission: 'leave:approve:team' },
        { label: 'Team Attendance', path: '/attendance/manage', icon: '👥', permission: 'attendance:read:team' },
        { label: 'Employee Directory', path: '/employees', icon: '🏢', permission: 'employee:read:all' },
        { label: 'Reports', path: '/reports', icon: '📈', permission: 'reports:view:team' },
      ],
    },
    {
      label: 'HR & Payroll',
      items: [
        { label: 'Recruitment', path: '/recruitment', icon: '🤝', permission: 'employee:read:all' },
        { label: 'Payroll Processing', path: '/payroll', icon: '💳', permission: 'payroll:generate' },
        { label: 'Manage Helpdesk', path: '/helpdesk/manage', icon: '🛠️', permission: 'helpdesk:manage' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { label: 'Roles & Permissions', path: '/admin/roles', icon: '🔐', permission: 'admin:manage_roles' },
        { label: 'Audit Logs', path: '/admin/audit', icon: '📜', permission: 'audit:view' },
        { label: 'Settings', path: '/admin/settings', icon: '⚙️', permission: 'admin:settings' },
      ],
    },
  ];

  // Filter menu items by permission
  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || hasPermission(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">D</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">Damodara Smart Tec</div>
          <div className="sidebar-brand-subtitle">HRMS Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {filteredSections.map((section) => (
          <div className="sidebar-section" key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' active' : ''}`
                }
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-link-text">{item.label}</span>
                {item.badge ? <span className="sidebar-badge">{item.badge}</span> : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <button className="sidebar-toggle" onClick={onToggle}>
        {collapsed ? '▶' : '◀'}
      </button>
    </aside>
  );
}
