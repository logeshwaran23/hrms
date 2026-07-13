import { prisma } from '../../config';
import { AppError } from '../../middleware';

// IST timezone for all time formatting
const IST_TIMEZONE = 'Asia/Kolkata';
const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: IST_TIMEZONE,
};

// Get today's date at midnight in IST
function getTodayIST(): Date {
  const now = new Date();
  // Convert UTC to IST string, then parse back to get midnight IST
  const istDateStr = now.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE }); // YYYY-MM-DD format
  return new Date(istDateStr + 'T00:00:00.000+05:30');
}

export class AttendanceService {
  async checkIn(employeeId: string) {
    const today = getTodayIST();

    // Check if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (existing?.checkIn && !existing.checkOut) {
      throw new AppError('Already checked in today. Please check out first.', 400, 'ALREADY_CHECKED_IN');
    }

    if (existing?.checkOut) {
      throw new AppError('You have already completed attendance for today.', 400, 'ALREADY_COMPLETED');
    }

    const now = new Date();
    const attendance = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: today } },
      update: { checkIn: now, status: 'PRESENT' },
      create: {
        employeeId,
        date: today,
        checkIn: now,
        status: 'PRESENT',
        source: 'WEB',
      },
    });

    return { ...attendance, checkInTime: now.toLocaleTimeString('en-US', TIME_FORMAT_OPTIONS) };
  }

  async checkOut(employeeId: string) {
    const today = getTodayIST();

    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!attendance || !attendance.checkIn) {
      throw new AppError('You must check in before checking out.', 400, 'NOT_CHECKED_IN');
    }

    if (attendance.checkOut) {
      throw new AppError('Already checked out today.', 400, 'ALREADY_CHECKED_OUT');
    }

    const now = new Date();
    const workHours = (now.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60);

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        workHours: Math.round(workHours * 100) / 100,
      },
    });

    return {
      ...updated,
      checkOutTime: now.toLocaleTimeString('en-US', TIME_FORMAT_OPTIONS),
      formattedWorkHours: `${Math.floor(workHours)}h ${Math.round((workHours % 1) * 60)}m`,
    };
  }

  async getTodayStatus(employeeId: string) {
    const today = getTodayIST();

    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!attendance) {
      return { present: false, checkIn: null, checkOut: null, workHours: 0, status: 'ABSENT' };
    }

    let currentWorkHours = attendance.workHours || 0;
    if (attendance.checkIn && !attendance.checkOut) {
      currentWorkHours = (new Date().getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60);
    }

    return {
      present: !!attendance.checkIn && !attendance.checkOut,
      checkIn: attendance.checkIn?.toLocaleTimeString('en-US', TIME_FORMAT_OPTIONS) || null,
      checkOut: attendance.checkOut?.toLocaleTimeString('en-US', TIME_FORMAT_OPTIONS) || null,
      workHours: Math.round(currentWorkHours * 100) / 100,
      status: attendance.status,
      completed: !!attendance.checkOut,
    };
  }

  async getMyAttendance(employeeId: string, month?: number, year?: number) {
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
    const targetYear = year || nowIST.getFullYear();
    const targetMonth = month || nowIST.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    return prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getTeamAttendance(managerId: string, date?: string) {
    const targetDate = date ? new Date(date) : getTodayIST();

    const teamMembers = await prisma.employee.findMany({
      where: { managerId, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
    });

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: { in: teamMembers.map(m => m.id) },
        date: targetDate,
      },
    });

    return teamMembers.map(member => {
      const att = attendances.find(a => a.employeeId === member.id);
      return {
        ...(att || {}),
        id: att?.id || `absent-${member.id}`,
        date: targetDate,
        status: att?.status || 'ABSENT',
        checkIn: att?.checkIn || null,
        checkOut: att?.checkOut || null,
        workHours: att?.workHours || null,
        employee: member,
      };
    });
  }

  async getAllAttendance(date?: string) {
    const targetDate = date ? new Date(date) : getTodayIST();

    const allMembers = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } },
    });

    const attendances = await prisma.attendance.findMany({
      where: { date: targetDate },
    });

    return allMembers.map(member => {
      const att = attendances.find(a => a.employeeId === member.id);
      return {
        ...(att || {}),
        id: att?.id || `absent-${member.id}`,
        date: targetDate,
        status: att?.status || 'ABSENT',
        checkIn: att?.checkIn || null,
        checkOut: att?.checkOut || null,
        workHours: att?.workHours || null,
        employee: member,
      };
    });
  }

  async requestRegularization(employeeId: string, attendanceId: string, reason: string, checkIn?: string, checkOut?: string) {
    const attendance = await prisma.attendance.findFirst({
      where: { id: attendanceId, employeeId },
    });

    if (!attendance) throw new AppError('Attendance record not found', 404);

    return prisma.regularization.create({
      data: {
        attendanceId,
        employeeId,
        reason,
        requestedCheckIn: checkIn ? new Date(checkIn) : undefined,
        requestedCheckOut: checkOut ? new Date(checkOut) : undefined,
      },
    });
  }
}

export const attendanceService = new AttendanceService();
