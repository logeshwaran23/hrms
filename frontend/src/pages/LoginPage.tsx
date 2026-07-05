import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../AuthContext';
import logoSrc from '../assets/logo.svg';

type LoginResponse = {
  success: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  accessToken: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [auth.isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login({ email, password });
      const data = response.data as LoginResponse;
      if (data.success) {
        auth.login(data.user, data.accessToken);
        navigate('/dashboard');
      }
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="hero-content">
          <div className="hero-brand">
            <img className="login-logo" src={logoSrc} alt="Damodara logo" />
            <div>
              <p className="brand-company">Damodara Smart Tec Pvt. Ltd</p>
              <h1 className="brand-title">HRMS Portal</h1>
            </div>
          </div>
        </div>
      </div>
      <main className="login-panel">
        <div className="login-card auth-card">
          <h2 className="login-title">Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
            <div className="login-meta">
              <a href="#" className="login-link">Forgot password?</a>
              <a href="#" className="login-link">Sign up</a>
            </div>
            {error && <p className="error-message">{error}</p>}
            <p className="demo-note">Demo: logesh@damodara.com | any password</p>
          </form>
        </div>
      </main>
    </div>
  );
}
