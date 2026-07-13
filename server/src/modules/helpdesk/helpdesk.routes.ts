// @ts-nocheck
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config';
import { authenticate, authorize, validate, AppError } from '../../middleware';
import { createAuditLog } from '../../utils';

const router = Router();

const createTicketSchema = z.object({
  category: z.enum(['PAYROLL', 'LEAVE', 'ATTENDANCE', 'IT_SUPPORT', 'POLICY', 'GENERAL', 'GRIEVANCE']),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

const resolveTicketSchema = z.object({
  resolution: z.string().min(1, 'Resolution is required'),
});

// Create ticket
router.post('/', authenticate, validate(createTicketSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await prisma.ticket.create({
      data: { employeeId: req.user!.employeeId!, ...req.body },
    });
    await createAuditLog({ userId: req.user!.userId, action: 'CREATE', resource: 'ticket', resourceId: ticket.id, ip: req.ip });
    res.status(201).json({ success: true, data: ticket, message: 'Ticket created successfully' });
  } catch (error) { next(error); }
});

// Get own tickets
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userPerms = req.user!.permissions || [];
    const isHR = userPerms.includes('helpdesk:manage');

    const where: any = isHR ? {} : { employeeId: req.user!.employeeId };
    if (req.query.status) {
      where.status = req.query.status;
    }
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
        assignee: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: tickets });
  } catch (error) { next(error); }
});

// Resolve ticket
router.patch('/:id/resolve', authenticate, authorize('helpdesk:manage'), validate(resolveTicketSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!ticket) throw new AppError('Ticket not found', 404);

    const updated = await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        status: 'RESOLVED',
        resolution: req.body.resolution,
        resolvedAt: new Date(),
        assignedTo: req.user!.employeeId,
      },
    });

    await createAuditLog({ userId: req.user!.userId, action: 'RESOLVE', resource: 'ticket', resourceId: req.params.id, ip: req.ip });
    res.json({ success: true, data: updated, message: 'Ticket resolved' });
  } catch (error) { next(error); }
});

// Update ticket status
router.patch('/:id/status', authenticate, authorize('helpdesk:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const updated = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status, assignedTo: req.user!.employeeId },
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

export default router;
