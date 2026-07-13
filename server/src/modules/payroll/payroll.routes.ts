// @ts-nocheck
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config';
import { authenticate, authorize, AppError } from '../../middleware';

const router = Router();

// Get own payslips
router.get('/payslips', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payslips = await prisma.payslip.findMany({
      where: { employeeId: req.user!.employeeId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json({ success: true, data: payslips });
  } catch (error) { next(error); }
});
// Get all payslips (HR)
router.get('/payslips/all', authenticate, authorize('payroll:view:all'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month, year } = req.query;
    const payslips = await prisma.payslip.findMany({
      where: { 
        ...(month ? { month: Number(month) } : {}),
        ...(year ? { year: Number(year) } : {})
      },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json({ success: true, data: payslips });
  } catch (error) { next(error); }
});


// Get employee payslips (HR)
router.get('/payslips/:employeeId', authenticate, authorize('payroll:view:all'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payslips = await prisma.payslip.findMany({
      where: { employeeId: req.params.employeeId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json({ success: true, data: payslips });
  } catch (error) { next(error); }
});

// Download payslip
router.get('/payslips/:id/download', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payslip = await prisma.payslip.findUnique({ where: { id: req.params.id } });
    if (!payslip) throw new AppError('Payslip not found', 404);

    const userPerms = req.user!.permissions || [];
    if (payslip.employeeId !== req.user!.employeeId && !userPerms.includes('payroll:view:all')) {
      throw new AppError('Access denied', 403);
    }

    if (payslip.filePath) {
      res.download(payslip.filePath);
    } else {
      // Return payslip data as JSON for now
      res.json({ success: true, data: payslip });
    }
  } catch (error) { next(error); }
});

// Process payroll (HR)
router.post('/process', authenticate, authorize('payroll:generate'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month, year } = req.body;

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true },
    });

    // Create draft payslips (simplified — real payroll would have complex calculations)
    const payslips = [];
    for (const emp of employees) {
      const existing = await prisma.payslip.findUnique({
        where: { employeeId_month_year: { employeeId: emp.id, month, year } },
      });

      if (!existing) {
        const basicSalary = 50000; // Placeholder — would come from salary structure
        const hra = basicSalary * 0.4;
        const allowances = 5000;
        const grossSalary = basicSalary + hra + allowances;
        const pf = basicSalary * 0.12;
        const tax = grossSalary * 0.1;
        const totalDeductions = pf + tax;
        const netSalary = grossSalary - totalDeductions;

        const payslip = await prisma.payslip.create({
          data: {
            employeeId: emp.id,
            month, year,
            basicSalary, hra, allowances, grossSalary,
            pf, tax, totalDeductions, netSalary,
            status: 'DRAFT',
          },
        });
        payslips.push(payslip);
      }
    }

    res.json({ success: true, data: payslips, message: `Payroll processed for ${payslips.length} employees` });
  } catch (error) { next(error); }
});

// Create payslip request (Employee)
router.post('/requests', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month, year, purpose } = req.body;
    const request = await prisma.payslipRequest.create({
      data: {
        employeeId: req.user!.employeeId!,
        month: Number(month),
        year: Number(year),
        purpose,
        status: 'PENDING',
      },
    });
    res.json({ success: true, data: request, message: 'Payslip request submitted' });
  } catch (error) { next(error); }
});

// Get own payslip requests (Employee)
router.get('/requests/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.payslipRequest.findMany({
      where: { employeeId: req.user!.employeeId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (error) { next(error); }
});

// Get all payslip requests (HR)
router.get('/requests', authenticate, authorize('payroll:view:all'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.payslipRequest.findMany({
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (error) { next(error); }
});

// Update payslip request status (HR)
router.patch('/requests/:id', authenticate, authorize('payroll:generate'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, remarks } = req.body;
    const request = await prisma.payslipRequest.update({
      where: { id: req.params.id },
      data: { status, remarks },
    });
    res.json({ success: true, data: request, message: 'Request updated' });
  } catch (error) { next(error); }
});

export default router;
