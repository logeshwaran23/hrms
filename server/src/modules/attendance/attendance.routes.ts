import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { authenticate, authorize } from '../../middleware';

const router = Router();

router.post('/check-in', authenticate, attendanceController.checkIn);
router.post('/check-out', authenticate, attendanceController.checkOut);
router.get('/today', authenticate, attendanceController.getTodayStatus);
router.get('/', authenticate, attendanceController.getMyAttendance);
router.get('/team', authenticate, authorize('attendance:read:team'), attendanceController.getTeamAttendance);
router.get('/all', authenticate, authorize('attendance:read:all'), attendanceController.getAllAttendance);
router.post('/regularize', authenticate, authorize('attendance:regularize'), attendanceController.regularize);

export default router;
