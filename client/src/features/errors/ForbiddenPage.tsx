import { useNavigate } from 'react-router-dom';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <div className="error-code">403</div>
      <h2>Access Denied</h2>
      <p>You don't have permission to access this page. Contact your HR administrator if you believe this is a mistake.</p>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
        ← Back to Dashboard
      </button>
    </div>
  );
}
