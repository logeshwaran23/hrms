// @ts-nocheck
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../config';
import { env } from '../../config';
import { authenticate, authorize, AppError } from '../../middleware';
import { createAuditLog } from '../../utils';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, JPEG, PNG, WebP, DOC, DOCX'));
    }
  },
});

// Upload document
router.post('/upload', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);

    const doc = await prisma.document.create({
      data: {
        employeeId: req.user!.employeeId!,
        name: req.body.name || req.file.originalname,
        type: req.body.type || 'OTHER',
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });

    await createAuditLog({ userId: req.user!.userId, action: 'UPLOAD', resource: 'document', resourceId: doc.id, ip: req.ip });
    res.status(201).json({ success: true, data: doc, message: 'Document uploaded successfully' });
  } catch (error) { next(error); }
});

// Get own documents
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await prisma.document.findMany({
      where: { employeeId: req.user!.employeeId },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json({ success: true, data: docs });
  } catch (error) { next(error); }
});

// Get employee documents (HR)
router.get('/:employeeId', authenticate, authorize('document:read:all'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await prisma.document.findMany({
      where: { employeeId: req.params.employeeId },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json({ success: true, data: docs });
  } catch (error) { next(error); }
});

// Verify document (HR)
router.patch('/:id/verify', authenticate, authorize('document:read:all'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await prisma.document.update({
      where: { id: req.params.id },
      data: { verified: true, verifiedBy: req.user!.userId },
    });
    await createAuditLog({ userId: req.user!.userId, action: 'VERIFY', resource: 'document', resourceId: doc.id, ip: req.ip });
    res.json({ success: true, data: doc, message: 'Document verified' });
  } catch (error) { next(error); }
});

// Download document
router.get('/:id/download', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) throw new AppError('Document not found', 404);

    // Check ownership or HR access
    const userPerms = req.user!.permissions || [];
    if (doc.employeeId !== req.user!.employeeId && !userPerms.includes('document:read:all')) {
      throw new AppError('Access denied', 403);
    }

    res.download(doc.filePath, doc.name);
  } catch (error) { next(error); }
});

export default router;
