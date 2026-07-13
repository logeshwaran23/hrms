import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/guards/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ProfilePage from './features/profile/ProfilePage';
import AttendancePage from './features/attendance/AttendancePage';
import TeamAttendancePage from './features/attendance/TeamAttendancePage';
import LeaveApplyPage from './features/leave/LeaveApplyPage';
import LeaveRequestsPage from './features/leave/LeaveRequestsPage';
import LeaveApprovalsPage from './features/leave/LeaveApprovalsPage';
import EODPage from './features/eod/EODPage';
import PayslipsPage from './features/payroll/PayslipsPage';
import PayrollPage from './features/payroll/PayrollPage';
import DocumentsPage from './features/documents/DocumentsPage';
import HelpdeskPage from './features/helpdesk/HelpdeskPage';
import HelpdeskManagePage from './features/helpdesk/HelpdeskManagePage';
import EmployeeDirectoryPage from './features/employees/EmployeeDirectoryPage';
import ReportsPage from './features/reports/ReportsPage';
import RolesPage from './features/admin/RolesPage';
import AuditLogsPage from './features/admin/AuditLogsPage';
import SettingsPage from './features/admin/SettingsPage';
import UsersPage from './features/admin/UsersPage';
import LeaveSettingsPage from './features/admin/LeaveSettingsPage';
import ForbiddenPage from './features/errors/ForbiddenPage';
import PerformancePage from './features/performance/PerformancePage';
import RecruitmentPage from './features/recruitment/RecruitmentPage';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected — wrapped in AppShell (sidebar + topbar) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Main */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Self Service */}
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leave/apply" element={<LeaveApplyPage />} />
          <Route path="/leave/requests" element={<LeaveRequestsPage />} />
          <Route path="/eod" element={<EODPage />} />
          <Route path="/payslips" element={<PayslipsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/helpdesk" element={<HelpdeskPage />} />
          <Route path="/performance" element={<PerformancePage />} />

          {/* Management — permission-gated at component level */}
          <Route path="/leave/approvals" element={<LeaveApprovalsPage />} />
          <Route path="/attendance/manage" element={<TeamAttendancePage />} />
          <Route path="/employees" element={<EmployeeDirectoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />

          {/* HR & Payroll */}
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/helpdesk/manage" element={<HelpdeskManagePage />} />
          <Route path="/recruitment" element={<RecruitmentPage />} />

          {/* Admin */}
          <Route path="/admin/roles" element={<RolesPage />} />
          <Route path="/admin/audit" element={<AuditLogsPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/admin/leave-settings" element={<LeaveSettingsPage />} />
          <Route path="/admin/users" element={<UsersPage />} />

          {/* Error */}
          <Route path="/403" element={<ForbiddenPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
