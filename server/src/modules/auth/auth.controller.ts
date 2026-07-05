import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { createAuditLog } from '../../utils';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      await createAuditLog({
        userId: result.user.id,
        action: 'LOGIN',
        resource: 'auth',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.userId);

      await createAuditLog({
        userId: req.user!.userId,
        action: 'LOGOUT',
        resource: 'auth',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json({ success: true, user });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
