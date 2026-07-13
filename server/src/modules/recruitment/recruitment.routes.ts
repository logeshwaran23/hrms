import { Router } from 'express';
import { recruitmentController } from './recruitment.controller';
import { authenticate } from '../../middleware';

const router = Router();

router.use(authenticate);

router.get('/jobs', recruitmentController.getJobs);
router.get('/candidates', recruitmentController.getCandidates);
router.post('/candidates', recruitmentController.createCandidate);
router.patch('/candidates/:id/status', recruitmentController.updateCandidateStatus);

export default router;
