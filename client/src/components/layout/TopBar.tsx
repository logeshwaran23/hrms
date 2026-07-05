import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

export default function TopBar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Proceed with logout even if API fails
    }
    logout();
    navigate('/login');
  };

  // Generate breadcrumb from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment) =>
    segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
  );

  const initial = user?.employee?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U';
  const displayName = user?.employee?.name || user?.email || 'User';
  const roleName = user?.role?.replace('_', ' ') || 'Employee';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-breadcrumbs">
          {breadcrumbs.map((crumb, i) => (
            <span key={i}>
              {i > 0 && <span> / </span>}
              {i === breadcrumbs.length - 1 ? <strong>{crumb}</strong> : crumb}
            </span>
          ))}
        </div>
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-btn" title="Notifications">
          🔔
          <span className="badge"></span>
        </button>

        <div
          className="topbar-user"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="topbar-avatar">{initial}</div>
          <div className="topbar-user-info">
            <div className="topbar-user-name">{displayName}</div>
            <div className="topbar-user-role">{roleName}</div>
          </div>
        </div>
      </div>

      {showDropdown && (
        <div className="user-dropdown">
          <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/profile'); }}>
            👤 My Profile
          </button>
          <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/admin/settings'); }}>
            ⚙️ Settings
          </button>
          <div className="dropdown-divider" />
          <button className="dropdown-item danger" onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
