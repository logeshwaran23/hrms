import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import SectionCard from '../components/SectionCard';
import { fetchDashboard, checkIn, checkOut } from '../api';
import { useAuth } from '../AuthContext';

type DashboardState = {
  attendance: {
    today: string;
    checkIn: string;
    workHours: string;
    leaveBalance: number;
    present: boolean;
  };
  notifications: { id: number; text: string }[];
  metrics: {
    totalWorkingDays: number;
    onTimeDays: number;
    pendingLeaves: number;
  };
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardState | null>(null);
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const loadDashboard = async () => {
    const response = await fetchDashboard();
    setData(response.data);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage('');

    try {
      const response = await checkIn();
      setMessage(response.data.message);
      await loadDashboard();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Unable to check in.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setMessage('');

    try {
      const response = await checkOut();
      setMessage(response.data.message);
      await loadDashboard();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Unable to check out.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page dashboard-page">
      <TopBar />
      <div className="content-grid">
        <div className="hero-panel">
          <h2>Welcome back, {auth.user?.name ?? 'Employee'}</h2>
          <p>Track attendance, apply leave, and submit EOD reports from one place.</p>
        </div>
        <div className="stats-row">
          <SectionCard title="Today" value={data?.attendance.today ?? 'Loading'} subtitle={data?.attendance.checkIn} />
          <SectionCard title="Work Hours" value={data?.attendance.workHours ?? '--'} subtitle="Today" />
          <SectionCard title="Leave Balance" value={`${data?.attendance.leaveBalance ?? '--'} days`} subtitle="Remaining" />
        </div>
        <div className="dashboard-summary-grid">
          <div className="attendance-panel">
          <div className="attendance-summary">
            <p className="small-label">Attendance Status</p>
            <h3>{data?.attendance.present ? 'Checked In' : 'Not Checked In'}</h3>
            <p>{data?.attendance.present ? `Checked in at ${data?.attendance.checkIn}` : 'Tap below to start your day.'}</p>
          </div>
          <div className="attendance-actions">
            {data?.attendance.present ? (
              <button type="button" onClick={handleCheckOut} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Check Out'}
              </button>
            ) : (
              <button type="button" onClick={handleCheckIn} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Check In'}
              </button>
            )}
          </div>
        </div>
          <div className="dashboard-insights">
            <div className="insight-card">
              <h4>Remaining Leaves</h4>
              <p>{data?.attendance.leaveBalance ?? '--'} days</p>
            </div>
            <div className="insight-card highlight">
              <h4>Status</h4>
              <p>{data?.attendance.present ? 'Checked In' : 'Not Checked In'}</p>
            </div>
            <div className="insight-card">
              <h4>Work Today</h4>
              <p>{data?.attendance.workHours ?? '--'} hrs</p>
            </div>
          </div>
        </div>
        <div className="quick-actions">
          <button type="button" onClick={() => navigate('/leave')}>
            Apply Leave
          </button>
          <button type="button" onClick={() => navigate('/report')}>
            View Report
          </button>
          <button type="button" onClick={() => navigate('/eod')}>
            Submit EOD
          </button>
        </div>
        {message && <p className="status-message">{message}</p>}
        <div className="notifications-card">
          <h3>Notifications</h3>
          <ul>
            {data?.notifications.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        </div>
        <div className="metrics-row">
          <SectionCard title="Working Days" value={data?.metrics.totalWorkingDays.toString() ?? '--'} subtitle="This month" />
          <SectionCard title="On-Time" value={data?.metrics.onTimeDays.toString() ?? '--'} subtitle="Days" />
          <SectionCard title="Pending Leaves" value={data?.metrics.pendingLeaves.toString() ?? '--'} subtitle="Requests" />
        </div>
      </div>
    </div>
  );
}
