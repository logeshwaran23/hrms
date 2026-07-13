// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config';

export class RecruitmentController {
  async getJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await prisma.jobPosting.findMany();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await prisma.candidate.findMany();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createCandidate(req: Request, res: Response, next: NextFunction) {
    try {
      const candidate = await prisma.candidate.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          jobId: req.body.jobId,
          status: req.body.status || 'SCREENING',
          appliedDate: req.body.appliedDate || new Date().toISOString(),
          resumeUrl: req.body.resumeUrl,
        },
      });
      res.json({ success: true, message: 'Candidate added!', data: candidate });
    } catch (error) {
      next(error);
    }
  }
  async updateCandidateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const candidate = await prisma.candidate.update({
        where: { id: req.params.id },
        data: { status: req.body.status },
      });
      res.json({ success: true, message: 'Candidate status updated', data: candidate });
    } catch (error) {
      next(error);
    }
  }
}

export const recruitmentController = new RecruitmentController();
