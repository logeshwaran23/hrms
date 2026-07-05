import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate, validate } from '../../middleware';
import { authLimiter } from '../../middleware';
import { loginSchema, refreshTokenSchema } from './auth.validation';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;
