import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface PayrollEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: { name: string };
  designation: { name: string };
}

interface PayslipRecord {
  id: string;
  month: number;
  year: number;
  grossSalary: number;
  netSalary: number;
  status: string;
  employee: { firstName: string; lastName: string; employeeCode: string };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PayrollPage() {
  const [tab, setTab] = useState<'generate' | 'history'>('generate');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleGenerate = async () => {
    setProcessing(true);
    setMessage('');
    try {
      const res = await api.post('/payroll/process', { month, year });
      setMessage(res.data.message || 'Payroll processed successfully!');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to process payroll');
    } finally {
      setProcessing(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/payroll/payslips', { params: { month, year } });
      setPayslips(res.data.data || []);
    } catch {
      console.error('Failed to load payroll history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab]);

  return (
    <div>
      <div className="page-header">
        <h1>Payroll Processing</h1>
        <p>Generate and manage employee payslips</p>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'generate' ? 'active' : ''}`} onClick={() => setTab('generate')}>Generate Payroll</button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Payroll History</button>
      </div>

      {tab === 'generate' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="eyebrow">Payroll</div>
              <div className="card-header-title">Generate Monthly Payslips</div>
            </div>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Month</label>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {[2024, 2025, 2026].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ background: 'var(--warning-50)', border: '1px solid var(--warning-100)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)', fontSize: '0.85rem', color: 'var(--warning-600)' }}>
              ⚠️ This will generate payslips for all active employees for {MONTHS[month - 1]} {year}. Make sure salary structures are up to date.
            </div>

            <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={processing}>
              {processing ? 'Processing...' : '💳 Generate Payslips'}
            </button>

            {message && <p className={message.includes('Failed') ? 'error-message' : 'success-message'} style={{ marginTop: 'var(--space-4)' }}>{message}</p>}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="eyebrow">History</div>
              <div className="card-header-title">Generated Payslips</div>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={loadHistory}>Refresh</button>
          </div>
          <div className="card-body" style={{ overflowX: 'auto' }}>
            {loadingHistory ? (
              <div className="loading-page" style={{ height: '30vh' }}><div className="spinner"></div></div>
            ) : payslips.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📄</div>
                <h3>No payslips generated yet</h3>
                <p>Switch to the "Generate Payroll" tab to create payslips.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Code</th>
                    <th>Gross</th>
                    <th>Net</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((p) => (
                    <tr key={p.id}>
                      <td>{p.employee.firstName} {p.employee.lastName}</td>
                      <td><span className="badge badge-neutral">{p.employee.employeeCode}</span></td>
                      <td>₹{p.grossSalary.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600 }}>₹{p.netSalary.toLocaleString('en-IN')}</td>
                      <td><span className={`badge ${p.status === 'PAID' ? 'badge-success' : p.status === 'PUBLISHED' ? 'badge-info' : 'badge-neutral'}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
