import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config';

export class PerformanceController {
  async getGoals(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.query;
      const data = await prisma.performanceGoal.findMany({
        where: employeeId ? { employeeId: employeeId as string } : undefined,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const goal = await prisma.performanceGoal.create({
        data: {
          employeeId: req.body.employeeId,
          title: req.body.title,
          description: req.body.description,
          dueDate: req.body.dueDate,
          status: req.body.status || 'NOT_STARTED',
          progress: req.body.progress || 0,
        },
      });
      res.json({ success: true, message: 'Goal created!', data: goal });
    } catch (error) {
      next(error);
    }
  }

  async getAppraisals(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.query;
      const data = await prisma.performanceAppraisal.findMany({
        where: employeeId ? { employeeId: employeeId as string } : undefined,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const performanceController = new PerformanceController();
