// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { attendanceService } from './attendance.service';
import { createAuditLog } from '../../utils';

export class AttendanceController {
  async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.employeeId) throw new AppError('Only employees can check in', 403);
      const result = await attendanceService.checkIn(req.user.employeeId);
      await createAuditLog({ userId: req.user.userId, action: 'CHECK_IN', resource: 'attendance', ip: req.ip });
      res.json({ success: true, data: result, message: 'Checked in successfully' });
    } catch (error) { next(error); }
  }

  async checkOut(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.employeeId) throw new AppError('Only employees can check out', 403);
      const result = await attendanceService.checkOut(req.user.employeeId);
      await createAuditLog({ userId: req.user.userId, action: 'CHECK_OUT', resource: 'attendance', ip: req.ip });
      res.json({ success: true, data: result, message: 'Checked out successfully' });
    } catch (error) { next(error); }
  }

  async getTodayStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.employeeId) return res.json({ success: true, data: { present: false, status: 'NOT_APPLICABLE' } });
      const result = await attendanceService.getTodayStatus(req.user.employeeId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getMyAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.employeeId) return res.json({ success: true, data: [] });
      const month = req.query.month ? parseInt(req.query.month as any as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as any as string) : undefined;
      const data = await attendanceService.getMyAttendance(req.user.employeeId, month, year);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getTeamAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.employeeId) return res.json({ success: true, data: [] });
      const data = await attendanceService.getTeamAttendance(req.user.employeeId, req.query.date as any as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getAllAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attendanceService.getAllAttendance(req.query.date as any as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async regularize(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.employeeId) throw new AppError('Only employees can regularize attendance', 403);
      const { attendanceId, reason, checkIn, checkOut } = req.body;
      const result = await attendanceService.requestRegularization(req.user.employeeId, attendanceId, reason, checkIn, checkOut);
      await createAuditLog({ userId: req.user.userId, action: 'REGULARIZE', resource: 'attendance', resourceId: attendanceId, ip: req.ip });
      res.json({ success: true, data: result, message: 'Regularization request submitted' });
    } catch (error) { next(error); }
  }
}

export const attendanceController = new AttendanceController();
