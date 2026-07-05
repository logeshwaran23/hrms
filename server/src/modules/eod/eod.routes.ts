import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config';
import { authenticate, authorize, validate, AppError } from '../../middleware';
import { createAuditLog } from '../../utils';

const router = Router();

const eodSchema = z.object({
  summary: z.string().min(1, 'Summary is required'),
  completedTasks: z.string().min(1, 'Completed tasks are required'),
  workLocation: z.string().default('Office'),
  extraHours: z.coerce.number().default(0),
});

// Submit EOD
router.post('/', authenticate, validate(eodSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.eODReport.findUnique({
      where: { employeeId_date: { employeeId: req.user!.employeeId, date: today } },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.eODReport.update({
        where: { id: existing.id },
        data: req.body,
      });
      res.json({ success: true, data: updated, message: 'EOD report updated' });
      return;
    }

    const report = await prisma.eODReport.create({
      data: { employeeId: req.user!.employeeId, date: today, ...req.body },
    });

    await createAuditLog({ userId: req.user!.userId, action: 'SUBMIT', resource: 'eod', resourceId: report.id, ip: req.ip });
    res.status(201).json({ success: true, data: report, message: 'EOD report submitted' });
  } catch (error) { next(error); }
});

// Get own EOD reports
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.eODReport.findMany({
      where: { employeeId: req.user!.employeeId },
      orderBy: { date: 'desc' },
      take: 30,
    });
    res.json({ success: true, data: reports });
  } catch (error) { next(error); }
});

// Get team EOD reports
router.get('/team', authenticate, authorize('eod:read:team'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    date.setHours(0, 0, 0, 0);

    const reports = await prisma.eODReport.findMany({
      where: {
        date,
        employee: { managerId: req.user!.employeeId },
      },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reports });
  } catch (error) { next(error); }
});

export default router;
