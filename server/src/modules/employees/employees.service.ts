import { prisma } from '../../config';
import { hashPassword, getPaginationParams, createPaginatedResult } from '../../utils';
import { AppError } from '../../middleware';
import { Request } from 'express';
import { CreateEmployeeInput, UpdateEmployeeInput, UpdateProfileInput } from './employees.validation';

export class EmployeeService {
  async list(req: Request) {
    const { page, limit, skip } = getPaginationParams(req);
    const search = req.query.search as string | undefined;
    const department = req.query.department as string | undefined;
    const status = req.query.status as string | undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (department) where.departmentId = department;
    if (status) where.status = status;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
          user: { select: { id: true, role: { select: { name: true } } } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return createPaginatedResult(employees, total, { page, limit, skip });
  }

  async getTeam(managerId: string) {
    return prisma.employee.findMany({
      where: { managerId },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
        user: { select: { role: { select: { name: true } } } },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async getById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        directReports: {
          select: { id: true, firstName: true, lastName: true, email: true, employeeCode: true },
        },
        user: { select: { id: true, email: true, status: true, role: { select: { id: true, name: true } }, lastLogin: true } },
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404, 'NOT_FOUND');
    }

    return employee;
  }

  async create(data: CreateEmployeeInput) {
    // Generate employee code
    const lastEmployee = await prisma.employee.findFirst({
      orderBy: { employeeCode: 'desc' },
      select: { employeeCode: true },
    });

    let nextCode = 'DST-001';
    if (lastEmployee?.employeeCode) {
      const lastNum = parseInt(lastEmployee.employeeCode.split('-')[1]) || 0;
      nextCode = `DST-${String(lastNum + 1).padStart(3, '0')}`;
    }

    const passwordHash = await hashPassword(data.password || 'Welcome@123');

    const employee = await prisma.employee.create({
      data: {
        employeeCode: nextCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        dateOfJoining: new Date(data.dateOfJoining),
        gender: data.gender as any,
        departmentId: data.departmentId,
        designationId: data.designationId,
        managerId: data.managerId,
        user: {
          create: {
            email: data.email,
            passwordHash,
            roleId: data.roleId,
          },
        },
      },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
        user: { select: { role: { select: { name: true } } } },
      },
    });

    // Create leave balances for the new employee
    const leaveTypes = await prisma.leaveType.findMany({ where: { isActive: true } });
    const currentYear = new Date().getFullYear();

    await prisma.leaveBalance.createMany({
      data: leaveTypes.map((lt) => ({
        employeeId: employee.id,
        leaveTypeId: lt.id,
        year: currentYear,
        allocated: lt.defaultBalance,
        remaining: lt.defaultBalance,
      })),
    });

    return employee;
  }

  async update(id: string, data: UpdateEmployeeInput) {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });

    return employee;
  }

  async updateProfile(employeeId: string, data: UpdateProfileInput) {
    return prisma.employee.update({
      where: { id: employeeId },
      data,
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });
  }

  async delete(id: string) {
    // Soft delete — mark as TERMINATED
    return prisma.employee.update({
      where: { id },
      data: { status: 'TERMINATED' },
    });
  }
}

export const employeeService = new EmployeeService();
