import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import { fetchDashboard, checkIn, checkOut } from '../api';
import { useAuth } from '../AuthContext';

type DashboardState = {
  attendance: {
    present: boolean;
    completed: boolean;
    checkIn: string | null;
    checkOut: string | null;
    workHours: number;
    status: string;
  };
  leaveBalance: number;
  monthlyStats: {
    presentDays: number;
    totalWorkHours: number;
    workingDays: number;
  };
  notifications: { id: string; message: string }[];
  pendingLeaves: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardState | null>(null);
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const auth = useAuth();

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
      <div className="page-body">
        <section className="dashboard-banner">
          <div className="banner-left">
            <div className="user-avatar">{auth.user?.name?.charAt(0) ?? 'E'}</div>
            <div>
              <p className="eyebrow">Welcome back</p>
              <h2>Hi, {auth.user?.name ?? 'Employee'}!</h2>
              <p className="banner-text">{auth.user?.role ?? 'Employee'}</p>
              <div className="banner-status-row">
                <span>{data?.attendance?.present ? 'Status: At Work' : 'Status: Not Checked In'}</span>
                <span>Last check-in: {data?.attendance?.checkIn || 'Not yet checked in'}</span>
              </div>
            </div>
          </div>
          <div className="banner-right">
            <div className="banner-card">
              <p>Leave Balance</p>
              <strong>{data?.leaveBalance ?? 0} days</strong>
            </div>
            <div className="banner-card">
              <p>Today Hours</p>
              <strong>{data?.attendance?.workHours ?? '00:00'}</strong>
            </div>
            <div className="banner-card">
              <p>Present</p>
              <strong>{data?.attendance?.present ? 'Yes' : 'No'}</strong>
            </div>
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="work-timer-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Attendance</p>
                <h3>Work Timer</h3>
              </div>
              <span className="badge">Live</span>
            </div>
            <div className="timer-display">{data?.attendance?.workHours ?? '00:00:00'}</div>
            <div className="timer-meta">
              <div>
                <span>Checked in at</span>
                <strong>{data?.attendance?.checkIn || '-'}</strong>
              </div>
              <div>
                <span>Checked out at</span>
                <strong>{data?.attendance?.checkOut || '-'}</strong>
              </div>
            </div>
            <div className="attendance-actions-row">
              {data?.attendance?.present ? (
                <button onClick={handleCheckOut} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : 'Check-Out'}
                </button>
              ) : (
                <button onClick={handleCheckIn} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : 'Check-In'}
                </button>
              )}
            </div>
          </section>

          <section className="summary-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Report</p>
                <h3>Monthly Summary</h3>
              </div>
            </div>
            <div className="report-stats-grid">
              <div className="stat-card">
                <span>Total Days</span>
                <strong>{data?.monthlyStats?.workingDays ?? '--'}</strong>
              </div>
              <div className="stat-card">
                <span>On Time</span>
                <strong>{data?.monthlyStats?.presentDays ?? '--'}</strong>
              </div>
              <div className="stat-card">
                <span>Pending Leave</span>
                <strong>{data?.pendingLeaves ?? '--'}</strong>
              </div>
            </div>
            <div className="summary-stats">
              <div className="stat-row">
                <div className="stat-col working">Working Days<br />{data?.monthlyStats?.workingDays ?? '--'}</div>
                <div className="stat-col approved">Approved Leave<br />0</div>
              </div>
              <div className="stat-row">
                <div className="stat-col present">Present Days<br />{data?.monthlyStats?.presentDays ?? '--'}</div>
                <div className="stat-col absent">Absent Days<br />{data ? (data.monthlyStats?.workingDays - data.monthlyStats?.presentDays) : '--'}</div>
              </div>
            </div>
          </section>

          <section className="notifications-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Alerts</p>
                <h3>Notifications</h3>
              </div>
            </div>
            <div className="notification-content">
              {data?.notifications?.map((item) => (
                <div key={item.id} className="notification-item">
                  <p>{item.message}</p>
                </div>
              ))}
              {!data?.notifications?.length && <p className="empty-state">No notifications available.</p>}
            </div>
            <a href="#" className="view-history">View History</a>
          </section>
        </div>

        {message && <p className="status-message">{message}</p>}
      </div>
    </div>
  );
}
