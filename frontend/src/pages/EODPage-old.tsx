import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import { fetchEODReports, submitEOD } from '../api';

type EODReport = {
  id: number;
  summary: string;
  completedTasks: string;
  date: string;
};

export default function EODPage() {
  const [summary, setSummary] = useState('');
  const [completedTasks, setCompletedTasks] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reports, setReports] = useState<EODReport[]>([]);

  const loadReports = async () => {
    const response = await fetchEODReports();
    setReports(response.data.eodReports);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await submitEOD({ summary, completedTasks });
      setMessage(response.data.message);
      setSummary('');
      setCompletedTasks('');
      await loadReports();
    } catch {
      setError('Unable to save EOD report. Please try again.');
    }
  };

  const reportCount = reports.length;

  return (
    <div className="page eod-page">
      <TopBar />
      <div className="content-grid">
        <div className="hero-panel leave-hero">
          <div>
            <h2>End of Day Report</h2>
            <p>Submit your daily summary and completed tasks for manager review.</p>
          </div>
          <div className="leave-summary-card">
            <span>Recent Reports</span>
            <strong>{reportCount}</strong>
          </div>
        </div>
        <form className="form-card" onSubmit={handleSubmit}>
          <label>
            Summary
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} required />
          </label>
          <label>
            Completed Tasks
            <textarea value={completedTasks} onChange={(e) => setCompletedTasks(e.target.value)} rows={4} required />
          </label>
          <button type="submit">Save EOD</button>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
        </form>
        {reports.length > 0 && (
          <div className="eod-history">
            <h3>Recent EOD Reports</h3>
            <div className="report-list">
              {reports.map((report) => (
                <div className="report-card" key={report.id}>
                  <div className="report-card-header">
                    <span>{report.date}</span>
                    <strong>Submitted</strong>
                  </div>
                  <p>{report.summary}</p>
                  <p className="muted">Completed tasks: {report.completedTasks}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
