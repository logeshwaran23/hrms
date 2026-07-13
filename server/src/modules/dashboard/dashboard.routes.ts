import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config';
import { authenticate } from '../../middleware';

const router = Router();

// IST timezone offset: +5 hours 30 minutes (no ICU dependency)
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function formatTimeIST(date: Date): string {
  const istTime = new Date(date.getTime() + IST_OFFSET_MS);
  let hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function getTodayIST(): Date {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const year = istNow.getUTCFullYear();
  const month = String(istNow.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istNow.getUTCDate()).padStart(2, '0');
  return new Date(`${year}-${month}-${day}T00:00:00.000+05:30`);
}

// Get dashboard data (role-scoped)
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.user!.employeeId;
    const roleName = req.user!.roleName;
    const today = getTodayIST();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Attendance status for today
    const todayAttendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    // Leave balance
    const leaveBalances = await prisma.leaveBalance.findMany({
      where: { employeeId, year: currentYear },
      include: { leaveType: { select: { name: true } } },
    });

    const totalLeaveBalance = leaveBalances.reduce((sum, b) => sum + b.remaining, 0);

    // Pending leave requests
    const pendingLeaves = await prisma.leaveRequest.count({
      where: { employeeId, status: 'PENDING' },
    });

    // Monthly attendance stats
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);
    const monthAttendances = await prisma.attendance.findMany({
      where: { employeeId, date: { gte: monthStart, lte: monthEnd } },
    });

    const presentDays = monthAttendances.filter(a => a.status === 'PRESENT').length;
    const totalWorkHours = monthAttendances.reduce((sum, a) => sum + (a.workHours || 0), 0);

    // Notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    });

    // Upcoming holidays
    const holidays = await prisma.holiday.findMany({
      where: { date: { gte: today }, year: currentYear },
      orderBy: { date: 'asc' },
      take: 5,
    });

    // Base response for all roles
    const dashboardData: any = {
      attendance: {
        present: !!todayAttendance?.checkIn && !todayAttendance?.checkOut,
        completed: !!todayAttendance?.checkOut,
        checkIn: todayAttendance?.checkIn ? formatTimeIST(todayAttendance.checkIn) : null,
        checkOut: todayAttendance?.checkOut ? formatTimeIST(todayAttendance.checkOut) : null,
        workHours: todayAttendance?.workHours || 0,
        status: todayAttendance?.status || 'ABSENT',
      },
      leaveBalance: totalLeaveBalance,
      leaveBalanceDetails: leaveBalances.map(b => ({
        type: b.leaveType.name,
        allocated: b.allocated,
        used: b.used,
        remaining: b.remaining,
      })),
      pendingLeaves,
      monthlyStats: {
        presentDays,
        totalWorkHours: Math.round(totalWorkHours * 10) / 10,
        workingDays: monthEnd.getDate(),
      },
      notifications,
      unreadNotifications: unreadCount,
      holidays,
    };

    // Manager-level stats
    if (['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(roleName)) {
      const teamWhere = roleName === 'MANAGER' 
        ? { managerId: employeeId, status: 'ACTIVE' as const }
        : { status: 'ACTIVE' as const };

      const teamCount = await prisma.employee.count({ where: teamWhere });
      const teamIds = (await prisma.employee.findMany({
        where: teamWhere, select: { id: true },
      })).map(e => e.id);

      const teamPresentToday = await prisma.attendance.count({
        where: { employeeId: { in: teamIds }, date: today, status: 'PRESENT' },
      });

      const pendingApprovals = await prisma.leaveRequest.count({
        where: {
          status: 'PENDING',
          employee: roleName === 'MANAGER' ? { managerId: employeeId } : {},
        },
      });

      dashboardData.team = {
        totalMembers: teamCount,
        presentToday: teamPresentToday,
        absentToday: teamCount - teamPresentToday,
        pendingApprovals,
      };
    }

    // HR/Admin-level stats
    if (['HR_ADMIN', 'SUPER_ADMIN'].includes(roleName)) {
      const totalEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });
      const departments = await prisma.department.findMany({
        include: { _count: { select: { employees: true } } },
      });

      const openTickets = await prisma.ticket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      });

      dashboardData.organization = {
        totalEmployees,
        departments: departments.map(d => ({ name: d.name, count: d._count.employees })),
        openTickets,
      };
    }

    res.json({ success: true, data: dashboardData });
  } catch (error) { next(error); }
});

// Get notifications
router.get('/notifications', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (error) { next(error); }
});

// Mark notification as read
router.patch('/notifications/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
