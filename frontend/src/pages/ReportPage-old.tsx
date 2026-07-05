import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import SectionCard from '../components/SectionCard';
import { fetchReports } from '../api';

type ReportItem = {
  date: string;
  status: string;
  hours: number;
};

type ReportResponse = {
  summary: ReportItem[];
  totals: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    totalHours: number;
  };
};

export default function ReportPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [totals, setTotals] = useState<ReportResponse['totals'] | null>(null);

  useEffect(() => {
    fetchReports().then((response) => {
      setReports(response.data.summary);
      setTotals(response.data.totals);
    });
  }, []);

  return (
    <div className="page report-page">
      <TopBar />
      <div className="content-grid">
        <div className="hero-panel">
          <h2>My Attendance Report</h2>
          <p>Track monthly attendance, on-time rate, and work hour totals.</p>
        </div>

        <div className="report-stat-grid">
          <SectionCard title="Total Days" value={`${totals?.totalDays ?? '--'}`} subtitle="This month" />
          <SectionCard title="Present" value={`${totals?.presentDays ?? '--'}`} subtitle="Days" />
          <SectionCard title="Absent" value={`${totals?.absentDays ?? '--'}`} subtitle="Days" />
          <SectionCard title="Hours" value={`${totals?.totalHours ?? '--'}`} subtitle="Worked" />
        </div>

        <div className="report-table">
          <div className="table-row header">
            <span>Date</span>
            <span>Status</span>
            <span>Hours</span>
          </div>
          {reports.map((item) => (
            <div className="table-row" key={item.date}>
              <span>{item.date}</span>
              <span>
                <span className={`status-badge ${item.status === 'On Time' ? 'status-green' : item.status === 'Partial' ? 'status-yellow' : 'status-red'}`}>
                  {item.status}
                </span>
              </span>
              <span>{item.hours}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
