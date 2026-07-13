import { Router } from 'express';
import { leaveController } from './leave.controller';
import { authenticate, authorize, validate } from '../../middleware';
import { applyLeaveSchema, leaveActionSchema } from './leave.validation';

const router = Router();

router.get('/types', authenticate, leaveController.getLeaveTypes);
router.post('/types', authenticate, authorize('admin:settings'), leaveController.createLeaveType);
router.patch('/types/:id', authenticate, authorize('admin:settings'), leaveController.updateLeaveType);
router.delete('/types/:id', authenticate, authorize('admin:settings'), leaveController.deleteLeaveType);
router.get('/balance', authenticate, leaveController.getBalance);
router.get('/balance/:employeeId', authenticate, authorize('leave:view:all'), leaveController.getBalance);
router.post('/apply', authenticate, authorize('leave:apply'), validate(applyLeaveSchema), leaveController.apply);
router.get('/requests', authenticate, leaveController.getRequests);
router.get('/requests/team', authenticate, authorize('leave:approve:team', 'leave:approve:all'), leaveController.getTeamRequests);
router.get('/requests/all', authenticate, authorize('leave:view:all'), leaveController.getAllRequests);
router.patch('/requests/:id/approve', authenticate, authorize('leave:approve:team', 'leave:approve:all'), validate(leaveActionSchema), leaveController.approve);
router.patch('/requests/:id/reject', authenticate, authorize('leave:approve:team', 'leave:approve:all'), validate(leaveActionSchema), leaveController.reject);

export default router;
