import { Request, Response, NextFunction } from 'express';
import { leaveService } from './leave.service';
import { createAuditLog } from '../../utils';

export class LeaveController {
  async getLeaveTypes(_req: Request, res: Response, next: NextFunction) {
    try {
      const types = await leaveService.getLeaveTypes();
      res.json({ success: true, data: types });
    } catch (error) { next(error); }
  }

  async getBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.params.employeeId || req.user!.employeeId;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const balances = await leaveService.getBalance(employeeId, year);
      res.json({ success: true, data: balances });
    } catch (error) { next(error); }
  }

  async apply(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.apply(req.user!.employeeId, req.body);
      await createAuditLog({ userId: req.user!.userId, action: 'APPLY', resource: 'leave', resourceId: result.id, after: req.body, ip: req.ip });
      res.status(201).json({ success: true, data: result, message: 'Leave request submitted successfully' });
    } catch (error) { next(error); }
  }

  async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await leaveService.getRequests(req.user!.employeeId);
      res.json({ success: true, data: requests });
    } catch (error) { next(error); }
  }

  async getTeamRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const requests = await leaveService.getTeamRequests(req.user!.employeeId, status);
      res.json({ success: true, data: requests });
    } catch (error) { next(error); }
  }

  async getAllRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const requests = await leaveService.getAllRequests(status);
      res.json({ success: true, data: requests });
    } catch (error) { next(error); }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.approve(req.params.id, req.user!.employeeId, req.body.comment);
      await createAuditLog({ userId: req.user!.userId, action: 'APPROVE', resource: 'leave', resourceId: req.params.id, ip: req.ip });
      res.json({ success: true, data: result, message: 'Leave approved' });
    } catch (error) { next(error); }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.reject(req.params.id, req.user!.employeeId, req.body.comment);
      await createAuditLog({ userId: req.user!.userId, action: 'REJECT', resource: 'leave', resourceId: req.params.id, ip: req.ip });
      res.json({ success: true, data: result, message: 'Leave rejected' });
    } catch (error) { next(error); }
  }
}

export const leaveController = new LeaveController();
