import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import logoSrc from '../assets/logo.svg';

export default function TopBar() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  return (
    <header className="topbar">
      <div className="brand-bar">
        <img className="brand-logo" src={logoSrc} alt="Damodara HRMS logo" />
        <div>
          <div className="brand-title">Damodara Smart Tec Pvt. Ltd</div>
          <div className="brand-subtitle">HRMS Portal</div>
        </div>
      </div>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/report">My Report</Link>
        <Link to="/leave">Apply Leave</Link>
        <Link to="/eod">End of Day</Link>
      </nav>
      <div className="topbar-user">
        <span>{auth.user?.name ?? 'Guest'}</span>
        <button type="button" className="logout-button" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </header>
  );
}
