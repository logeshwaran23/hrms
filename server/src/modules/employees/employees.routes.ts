import { Router } from 'express';
import { employeeController } from './employees.controller';
import { authenticate, authorize, validate } from '../../middleware';
import { createEmployeeSchema, updateEmployeeSchema, updateProfileSchema } from './employees.validation';

const router = Router();

// Self-service profile update (must be before /:id routes)
router.patch('/profile', authenticate, validate(updateProfileSchema), employeeController.updateProfile);

// Team members (manager scope)
router.get('/team', authenticate, authorize('employee:read:team'), employeeController.getTeam);

// Full CRUD (HR/Admin)
router.get('/', authenticate, authorize('employee:read:all', 'employee:read:team'), employeeController.list);
router.get('/:id', authenticate, authorize('employee:read:own', 'employee:read:all'), employeeController.getById);
router.post('/', authenticate, authorize('employee:create'), validate(createEmployeeSchema), employeeController.create);
router.patch('/:id', authenticate, authorize('employee:update:all'), validate(updateEmployeeSchema), employeeController.update);
router.delete('/:id', authenticate, authorize('employee:delete'), employeeController.delete);

export default router;
