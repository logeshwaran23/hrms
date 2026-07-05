import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import { fetchReports } from '../api';

type ReportItem = {
  date: string;
  status: string;
  hours: number;
};

export default function ReportPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [totals, setTotals] = useState<any>(null);

  useEffect(() => {
    fetchReports().then((response) => {
      setReports(response.data.summary);
      setTotals(response.data.totals);
    });
  }, []);

  return (
    <div className="page report-page">
      <TopBar />
      <div className="page-body">
        <section className="hero-panel report-hero">
          <div>
            <p className="eyebrow">Attendance Report</p>
            <h2>Monthly Attendance Overview</h2>
            <p>Review your attendance summary and daily status for the current month.</p>
          </div>
          <div className="report-summary-cards">
            <div className="summary-card">
              <span>Total Days</span>
              <strong>{totals?.totalDays ?? '--'}</strong>
            </div>
            <div className="summary-card">
              <span>Present Days</span>
              <strong>{totals?.presentDays ?? '--'}</strong>
            </div>
            <div className="summary-card">
              <span>Absent Days</span>
              <strong>{totals?.absentDays ?? '--'}</strong>
            </div>
          </div>
        </section>

        <section className="report-table">
          <div className="table-row header">
            <span>Date</span>
            <span>Status</span>
            <span>Hours</span>
          </div>
          {reports.map((item) => (
            <div className="table-row" key={item.date}>
              <span>{item.date}</span>
              <span>
                <span
                  className={`status-badge ${
                    item.status === 'On Time'
                      ? 'status-green'
                      : item.status === 'Partial'
                      ? 'status-yellow'
                      : 'status-red'
                  }`}
                >
                  {item.status}
                </span>
              </span>
              <span>{item.hours}</span>
            </div>
          ))}
          {!reports.length && <div className="empty-state">No report data available yet.</div>}
        </section>
      </div>
    </div>
  );
}
