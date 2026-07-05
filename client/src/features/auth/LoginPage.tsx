import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success) {
        login(data.user, data.accessToken, data.refreshToken);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="hero-content">
          <h1>HRMS Portal</h1>
          <p>Your complete Employee Self-Service platform. Manage attendance, leave, payroll, and more — all in one place.</p>
        </div>
      </div>

      <main className="login-panel">
        <div className="login-card">
          <h2>Welcome back</h2>
          <p className="login-subtitle">Sign in to your HRMS account</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@damodara.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="login-meta">
              <a href="#">Forgot password?</a>
            </div>

            <div className="demo-note">
              <strong>Demo Accounts</strong> (password: Admin@123)<br />
              admin@damodara.com · hr@damodara.com · manager@damodara.com · logesh@damodara.com
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
