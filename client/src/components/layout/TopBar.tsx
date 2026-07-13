import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Menu } from 'lucide-react';

export default function TopBar({ onMenuToggle, isMobile }: { onMenuToggle?: () => void; isMobile?: boolean }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Proceed with logout even if API fails
    }
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

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
        {/* Hamburger menu for mobile */}
        {isMobile && (
          <button
            className="topbar-menu-btn"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <Menu size={22} />
          </button>
        )}
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
          ref={dropdownRef}
        >
          {user?.employee?.avatar ? (
            <img src={user.employee.avatar} alt="Avatar" className="topbar-avatar" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="topbar-avatar">{initial}</div>
          )}
          {!isMobile && (
            <div className="topbar-user-info">
              <div className="topbar-user-name">{displayName}</div>
              <div className="topbar-user-role">{roleName}</div>
            </div>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="user-dropdown">
          {isMobile && (
            <>
              <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-secondary)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{displayName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{roleName}</div>
              </div>
            </>
          )}
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
