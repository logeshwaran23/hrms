import { Router } from 'express';
import { performanceController } from './performance.controller';
import { authenticate } from '../../middleware';

const router = Router();

router.use(authenticate);

router.get('/goals', performanceController.getGoals);
router.post('/goals', performanceController.createGoal);
router.patch('/goals/:id', performanceController.updateGoal);
router.get('/appraisals', performanceController.getAppraisals);
router.post('/appraisals', performanceController.createAppraisal);

export default router;
