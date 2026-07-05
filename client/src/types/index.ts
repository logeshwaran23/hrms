export interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    employeeCode: string;
    avatar: string | null;
    department: string;
    designation: string;
  } | null;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  dateOfJoining: string;
  gender: string | null;
  status: string;
  department: { id: string; name: string };
  designation: { id: string; name: string };
  manager: { id: string; firstName: string; lastName: string } | null;
  user?: { role: { name: string } };
}

export interface LeaveBalance {
  id: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
  remaining: number;
  leaveType: { name: string };
}

export interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  duration: number;
  durationType: string;
  reason: string;
  status: string;
  createdAt: string;
  leaveType: { name: string };
  employee?: { firstName: string; lastName: string; employeeCode: string };
  approver?: { firstName: string; lastName: string } | null;
}

export interface Attendance {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  status: string;
}

export interface EODReport {
  id: string;
  date: string;
  summary: string;
  completedTasks: string;
  workLocation: string;
  extraHours: number;
}

export interface Ticket {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  resolution: string | null;
  createdAt: string;
  employee?: { firstName: string; lastName: string; employeeCode: string };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  link: string | null;
  createdAt: string;
}

export interface DashboardData {
  attendance: {
    present: boolean;
    completed: boolean;
    checkIn: string | null;
    checkOut: string | null;
    workHours: number;
    status: string;
  };
  leaveBalance: number;
  leaveBalanceDetails: { type: string; allocated: number; used: number; remaining: number }[];
  pendingLeaves: number;
  monthlyStats: { presentDays: number; totalWorkHours: number; workingDays: number };
  notifications: Notification[];
  unreadNotifications: number;
  holidays: { id: string; name: string; date: string }[];
  team?: {
    totalMembers: number;
    presentToday: number;
    absentToday: number;
    pendingApprovals: number;
  };
  organization?: {
    totalEmployees: number;
    departments: { name: string; count: number }[];
    openTickets: number;
  };
}
