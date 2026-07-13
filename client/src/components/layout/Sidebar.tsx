import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, User, Clock, CalendarHeart, ClipboardList, 
  FileText, Banknote, FolderOpen, Ticket, Target, CheckSquare, 
  Users, Building2, TrendingUp, UserPlus, CreditCard, Wrench, 
  ShieldCheck, UsersRound, ScrollText, CalendarRange, Settings
} from 'lucide-react';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
  badge?: number;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

export default function Sidebar({ collapsed, onToggle, mobileOpen }: { collapsed: boolean; onToggle: () => void; mobileOpen?: boolean }) {
  const { user, hasPermission, hasAnyPermission } = useAuthStore();
  const location = useLocation();

  const menuSections: MenuSection[] = [
    {
      label: 'Main',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'My Profile', path: '/profile', icon: <User size={20} /> },
      ],
    },
    {
      label: 'Self Service',
      items: [
        { label: 'Attendance', path: '/attendance', icon: <Clock size={20} /> },
        { label: 'Apply Leave', path: '/leave/apply', icon: <CalendarHeart size={20} /> },
        { label: 'My Leaves', path: '/leave/requests', icon: <ClipboardList size={20} /> },
        { label: 'EOD Report', path: '/eod', icon: <FileText size={20} /> },
        { label: 'My Payslips', path: '/payslips', icon: <Banknote size={20} /> },
        { label: 'Documents', path: '/documents', icon: <FolderOpen size={20} /> },
        { label: 'Helpdesk', path: '/helpdesk', icon: <Ticket size={20} /> },
        { label: 'Performance', path: '/performance', icon: <Target size={20} /> },
      ],
    },
    {
      label: 'Management',
      items: [
        { label: 'Leave Approvals', path: '/leave/approvals', icon: <CheckSquare size={20} />, permission: 'leave:approve:team' },
        { label: 'Team Attendance', path: '/attendance/manage', icon: <Users size={20} />, permission: 'attendance:read:team' },
        { label: 'Employee Directory', path: '/employees', icon: <Building2 size={20} />, permission: 'employee:read:all' },
        { label: 'Reports', path: '/reports', icon: <TrendingUp size={20} />, permission: 'reports:view:team' },
      ],
    },
    {
      label: 'HR & Payroll',
      items: [
        { label: 'Recruitment', path: '/recruitment', icon: <UserPlus size={20} />, permission: 'employee:read:all' },
        { label: 'Payroll Processing', path: '/payroll', icon: <CreditCard size={20} />, permission: 'payroll:generate' },
        { label: 'Manage Helpdesk', path: '/helpdesk/manage', icon: <Wrench size={20} />, permission: 'helpdesk:manage' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { label: 'Roles & Permissions', path: '/admin/roles', icon: <ShieldCheck size={20} />, permission: 'admin:manage_roles' },
        { label: 'Users', path: '/admin/users', icon: <UsersRound size={20} />, permission: 'admin:manage_roles' },
        { label: 'Audit Logs', path: '/admin/audit', icon: <ScrollText size={20} />, permission: 'audit:view' },
        { label: 'Leave Settings', path: '/admin/leave-settings', icon: <CalendarRange size={20} />, permission: 'admin:settings' },
        { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} />, permission: 'admin:settings' },
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
    <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
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
