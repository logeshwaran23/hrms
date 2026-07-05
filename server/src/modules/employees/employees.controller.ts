import { Request, Response, NextFunction } from 'express';
import { employeeService } from './employees.service';
import { createAuditLog } from '../../utils';

export class EmployeeController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.list(req);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const team = await employeeService.getTeam(req.user!.employeeId);
      res.json({ success: true, data: team });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.getById(req.params.id);
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.create(req.body);

      await createAuditLog({
        userId: req.user!.userId,
        action: 'CREATE',
        resource: 'employee',
        resourceId: employee.id,
        after: req.body,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ success: true, data: employee, message: 'Employee created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const before = await employeeService.getById(req.params.id);
      const employee = await employeeService.update(req.params.id, req.body);

      await createAuditLog({
        userId: req.user!.userId,
        action: 'UPDATE',
        resource: 'employee',
        resourceId: employee.id,
        before: before as any,
        after: req.body,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ success: true, data: employee, message: 'Employee updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.updateProfile(req.user!.employeeId, req.body);

      await createAuditLog({
        userId: req.user!.userId,
        action: 'UPDATE_PROFILE',
        resource: 'employee',
        resourceId: req.user!.employeeId,
        after: req.body,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ success: true, data: employee, message: 'Profile updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await employeeService.delete(req.params.id);

      await createAuditLog({
        userId: req.user!.userId,
        action: 'DELETE',
        resource: 'employee',
        resourceId: req.params.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ success: true, message: 'Employee deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const employeeController = new EmployeeController();
