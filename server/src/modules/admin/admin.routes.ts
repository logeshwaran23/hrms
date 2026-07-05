import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config';
import { authenticate, authorize, AppError } from '../../middleware';
import { createAuditLog, getPaginationParams, createPaginatedResult } from '../../utils';

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
    const resource = req.query.resource as string | undefined;
    const action = req.query.action as string | undefined;

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

// ─── Designations ──────────────────────────────────────────────
router.get('/designations', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departmentId = req.query.departmentId as string | undefined;
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
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const holidays = await prisma.holiday.findMany({
      where: { year },
      orderBy: { date: 'asc' },
    });
    res.json({ success: true, data: holidays });
  } catch (error) { next(error); }
});

export default router;
