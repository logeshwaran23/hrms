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
  const [activeTab, setActiveTab] = useState('submit');

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

  return (
    <div className="page eod-page">
      <TopBar />
      <div className="page-body">
        <section className="hero-panel eod-hero">
          <div>
            <p className="eyebrow">End of Day</p>
            <h2>Daily report submission</h2>
            <p>Submit your daily summary, track completed work, and view previous EOD reports.</p>
          </div>
          <div className="hero-action-card">
            <span>Report count</span>
            <strong>{reports.length}</strong>
          </div>
        </section>

        <section className="eod-panel">
          <div className="tab-menu">
            <button className={activeTab === 'submit' ? 'tab-active' : ''} onClick={() => setActiveTab('submit')}>Submit EOD</button>
            <button className={activeTab === 'reports' ? 'tab-active' : ''} onClick={() => setActiveTab('reports')}>My EOD Reports</button>
            <button className={activeTab === 'extra' ? 'tab-active' : ''} onClick={() => setActiveTab('extra')}>Extra Work</button>
          </div>

          {activeTab === 'submit' && (
            <div className="tab-panel">
              <div className="warning-card">
                <p>⚠️ Please make sure you have checked in today before submitting EOD.</p>
              </div>
              <form className="form-card" onSubmit={handleSubmit}>
                <div className="form-row two-column">
                  <label>
                    Work Location
                    <select>
                      <option>Office</option>
                      <option>Work From Home</option>
                    </select>
                  </label>
                  <label>
                    Extra Hours Worked
                    <input
                      type="text"
                      value={completedTasks}
                      onChange={(e) => setCompletedTasks(e.target.value)}
                      placeholder="e.g. 2 hours of client support"
                    />
                  </label>
                </div>
                <label>
                  Daily Summary
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={5}
                    placeholder="Summarize the work completed today..."
                    required
                  />
                </label>
                <button type="submit">Save EOD</button>
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
              </form>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="tab-panel">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <div className="report-card" key={report.id}>
                    <div className="report-card-header">
                      <div>
                        <strong>{report.date}</strong>
                        <p className="muted">Daily summary</p>
                      </div>
                      <span className="status-badge status-green">Submitted</span>
                    </div>
                    <p>{report.summary}</p>
                    <p className="muted">Completed tasks: {report.completedTasks}</p>
                  </div>
                ))
              ) : (
                <div className="empty-state">No EOD reports found yet.</div>
              )}
            </div>
          )}

          {activeTab === 'extra' && (
            <div className="tab-panel extra-info-card">
              <h3>Extra Hours Guidance</h3>
              <ul>
                <li>Work before 8:00 AM</li>
                <li>Work after 6:30 PM</li>
                <li>Weekend or holiday work</li>
              </ul>
              <p>Standard work hours are 8:00 AM - 1:30 PM and 2:30 PM - 6:30 PM.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
