import { prisma } from '../../config';
import { AppError } from '../../middleware';
import { ApplyLeaveInput } from './leave.validation';

export class LeaveService {
  async getLeaveTypes() {
    return prisma.leaveType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  async createLeaveType(data: { name: string, defaultBalance: number, carryForward?: boolean, maxCarryDays?: number }) {
    return prisma.leaveType.create({ data });
  }

  async updateLeaveType(id: string, data: { name?: string, defaultBalance?: number, carryForward?: boolean, maxCarryDays?: number, isActive?: boolean }) {
    return prisma.leaveType.update({ where: { id }, data });
  }

  async deleteLeaveType(id: string) {
    return prisma.leaveType.update({ where: { id }, data: { isActive: false } });
  }

  async getBalance(employeeId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();
    
    // Auto-allocate missing leave types
    const activeTypes = await prisma.leaveType.findMany({ where: { isActive: true } });
    const currentBalances = await prisma.leaveBalance.findMany({
      where: { employeeId, year: targetYear },
    });

    const missingTypes = activeTypes.filter(t => !currentBalances.some(b => b.leaveTypeId === t.id));
    if (missingTypes.length > 0) {
      await prisma.leaveBalance.createMany({
        data: missingTypes.map(t => ({
          employeeId,
          leaveTypeId: t.id,
          year: targetYear,
          allocated: t.defaultBalance,
          remaining: t.defaultBalance,
        }))
      });
    }

    return prisma.leaveBalance.findMany({
      where: { employeeId, year: targetYear },
      include: { leaveType: { select: { name: true } } },
      orderBy: { leaveType: { name: 'asc' } },
    });
  }

  async apply(employeeId: string, data: ApplyLeaveInput) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate < startDate) {
      throw new AppError('End date must be after start date', 400, 'INVALID_DATES');
    }

    // Calculate duration
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const duration = data.durationType === 'HALF_DAY' ? diffDays * 0.5 : diffDays;

    // Check balance
    const currentYear = new Date().getFullYear();
    let balance = await prisma.leaveBalance.findFirst({
      where: { employeeId, leaveTypeId: data.leaveTypeId, year: currentYear },
    });

    if (!balance) {
      // Auto-allocate missing balance
      const leaveType = await prisma.leaveType.findUnique({ where: { id: data.leaveTypeId } });
      if (leaveType) {
        balance = await prisma.leaveBalance.create({
          data: {
            employeeId,
            leaveTypeId: leaveType.id,
            year: currentYear,
            allocated: leaveType.defaultBalance,
            remaining: leaveType.defaultBalance,
          }
        });
      }
    }

    if (!balance || balance.remaining < duration) {
      throw new AppError(
        `Insufficient leave balance. Available: ${balance?.remaining || 0}, Requested: ${duration}`,
        400,
        'INSUFFICIENT_BALANCE'
      );
    }

    // Check for overlapping requests
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    });

    if (overlapping) {
      throw new AppError('You already have a leave request for these dates', 400, 'OVERLAP');
    }

    return prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate,
        endDate,
        duration,
        durationType: data.durationType as any,
        reason: data.reason,
      },
      include: {
        leaveType: { select: { name: true } },
        employee: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async getRequests(employeeId: string) {
    return prisma.leaveRequest.findMany({
      where: { employeeId },
      include: {
        leaveType: { select: { name: true } },
        approver: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeamRequests(managerId: string, status?: string) {
    const where: any = {
      employee: { managerId },
    };
    if (status) where.status = status;

    return prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        leaveType: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllRequests(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } },
        leaveType: { select: { name: true } },
        approver: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(requestId: string, approverId: string, comment?: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!leaveRequest) throw new AppError('Leave request not found', 404);
    if (leaveRequest.status !== 'PENDING') throw new AppError('Leave request is not pending', 400);

    // Update leave request
    const updated = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approverId,
        approverComment: comment,
        approvedAt: new Date(),
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        leaveType: { select: { name: true } },
      },
    });

    // Deduct leave balance
    const currentYear = new Date().getFullYear();
    await prisma.leaveBalance.updateMany({
      where: {
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year: currentYear,
      },
      data: {
        used: { increment: leaveRequest.duration },
        remaining: { decrement: leaveRequest.duration },
      },
    });

    return updated;
  }

  async reject(requestId: string, approverId: string, comment?: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
    if (!leaveRequest) throw new AppError('Leave request not found', 404);
    if (leaveRequest.status !== 'PENDING') throw new AppError('Leave request is not pending', 400);

    return prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approverId,
        approverComment: comment,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        leaveType: { select: { name: true } },
      },
    });
  }
}

export const leaveService = new LeaveService();
