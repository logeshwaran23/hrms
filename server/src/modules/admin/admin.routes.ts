// @ts-nocheck
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config';
import { authenticate, authorize, AppError } from '../../middleware';
import { createAuditLog, getPaginationParams, createPaginatedResult, hashPassword } from '../../utils';

const router = Router();

// ─── Roles ────────────────────────────────────────────────
router.get('/roles', authenticate, authorize('admin:manage_roles'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: { select: { users: true } },
        rolePermissions: { include: { permission: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: roles });
  } catch (error) { next(error); }
});

router.get('/roles/:id', authenticate, authorize('admin:manage_roles'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
    if (!role) throw new AppError('Role not found', 404);
    res.json({ success: true, data: role });
  } catch (error) { next(error); }
});

router.post('/roles', authenticate, authorize('admin:manage_roles'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const role = await prisma.role.create({ data: { name, description } });
    await createAuditLog({ userId: req.user!.userId, action: 'CREATE', resource: 'role', resourceId: role.id, after: req.body, ip: req.ip });
    res.status(201).json({ success: true, data: role });
  } catch (error) { next(error); }
});

router.patch('/roles/:id/permissions', authenticate, authorize('admin:manage_roles'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { permissionIds } = req.body;
    const roleId = req.params.id;

    // Check for system role protection
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new AppError('Role not found', 404);

    // Replace all permissions
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    await prisma.rolePermission.createMany({
      data: permissionIds.map((pid: string) => ({ roleId, permissionId: pid })),
    });

    await createAuditLog({ userId: req.user!.userId, action: 'UPDATE_PERMISSIONS', resource: 'role', resourceId: roleId, after: { permissionIds }, ip: req.ip });
    res.json({ success: true, message: 'Permissions updated' });
  } catch (error) { next(error); }
});

// ─── Permissions ────────────────────────────────────────────
router.get('/permissions', authenticate, authorize('admin:manage_roles'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permissions = await prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
    res.json({ success: true, data: permissions });
  } catch (error) { next(error); }
});

// ─── Audit Logs ──────────────────────────────────────────────
router.get('/audit-logs', authenticate, authorize('audit:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const resource = req.query.resource as any as string | undefined;
    const action = req.query.action as any as string | undefined;

    const where: any = {};
    if (resource) where.resource = resource;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, employee: { select: { firstName: true, lastName: true } } } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, ...createPaginatedResult(logs, total, { page, limit, skip }) });
  } catch (error) { next(error); }
});

// ─── Departments ──────────────────────────────────────────────
router.get('/departments', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { employees: true } },
        designations: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: departments });
  } catch (error) { next(error); }
});

router.post('/departments', authenticate, authorize('admin:settings'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    if (!name) throw new AppError('Department name is required', 400);
    const department = await prisma.department.create({ data: { name } });
    await createAuditLog({ userId: req.user!.userId, action: 'CREATE', resource: 'department', resourceId: department.id, after: { name }, ip: req.ip });
    res.status(201).json({ success: true, data: department });
  } catch (error) { next(error); }
});

// ─── Designations ──────────────────────────────────────────────
router.get('/designations', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departmentId = req.query.departmentId as any as string | undefined;
    const where = departmentId ? { departmentId } : {};
    const designations = await prisma.designation.findMany({
      where,
      include: { department: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: designations });
  } catch (error) { next(error); }
});

// ─── System Config ──────────────────────────────────────────────
router.get('/settings', authenticate, authorize('admin:settings'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.systemConfig.findMany({ orderBy: { key: 'asc' } });
    res.json({ success: true, data: settings });
  } catch (error) { next(error); }
});

router.patch('/settings', authenticate, authorize('admin:settings'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body as { key: string; value: string }[];
    for (const { key, value } of updates) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value, updatedBy: req.user!.userId },
        create: { key, value, updatedBy: req.user!.userId },
      });
    }
    await createAuditLog({ userId: req.user!.userId, action: 'UPDATE', resource: 'settings', after: req.body, ip: req.ip });
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) { next(error); }
});

// ─── Holidays ──────────────────────────────────────────────────
router.get('/holidays', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as any as string) : new Date().getFullYear();
    const holidays = await prisma.holiday.findMany({
      where: { year },
      orderBy: { date: 'asc' },
    });
    res.json({ success: true, data: holidays });
  } catch (error) { next(error); }
});

router.post('/holidays', authenticate, authorize('admin:settings'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, date, type, year } = req.body;
    if (!name || !date) throw new AppError('Holiday name and date are required', 400);
    const holiday = await prisma.holiday.create({
      data: { name, date: new Date(date), type, year: year || new Date(date).getFullYear() },
    });
    await createAuditLog({ userId: req.user!.userId, action: 'CREATE', resource: 'holiday', resourceId: holiday.id, after: req.body, ip: req.ip });
    res.status(201).json({ success: true, data: holiday });
  } catch (error) { next(error); }
});

// ─── Users ──────────────────────────────────────────────────────
router.get('/users', authenticate, authorize('admin:manage_roles'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const search = req.query.search as any as string | undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          role: { select: { id: true, name: true } },
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } }
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, ...createPaginatedResult(users, total, { page, limit, skip }) });
  } catch (error) { next(error); }
});

router.post('/users', authenticate, authorize('admin:manage_roles'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, roleId, status, employeeId } = req.body;
    if (!email || !password || !roleId) throw new AppError('Email, password, and role are required', 400);
    
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        roleId,
        status: status || 'ACTIVE',
        employeeId: employeeId || null,
      },
    });
    
    await createAuditLog({ userId: req.user!.userId, action: 'CREATE', resource: 'user', resourceId: user.id, after: { email, roleId, status }, ip: req.ip });
    res.status(201).json({ success: true, data: user, message: 'User created successfully' });
  } catch (error) { next(error); }
});

router.patch('/users/:id', authenticate, authorize('admin:manage_roles'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, roleId, status, employeeId } = req.body;
    
    const data: any = {};
    if (email) data.email = email;
    if (password) data.passwordHash = await hashPassword(password);
    if (roleId) data.roleId = roleId;
    if (status) data.status = status;
    if (employeeId !== undefined) data.employeeId = employeeId || null;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
    });
    
    await createAuditLog({ userId: req.user!.userId, action: 'UPDATE', resource: 'user', resourceId: user.id, after: data, ip: req.ip });
    res.json({ success: true, data: user, message: 'User updated successfully' });
  } catch (error) { next(error); }
});

router.delete('/users/:id', authenticate, authorize('admin:manage_roles'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Soft delete by marking as INACTIVE, or hard delete? Let's just delete the user record.
    await prisma.user.delete({ where: { id: req.params.id } });
    await createAuditLog({ userId: req.user!.userId, action: 'DELETE', resource: 'user', resourceId: req.params.id, ip: req.ip });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) { next(error); }
});

export default router;
