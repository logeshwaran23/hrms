import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../../config';
import { employeeController } from './employees.controller';
import { authenticate, authorize, validate } from '../../middleware';
import { createEmployeeSchema, updateEmployeeSchema, updateProfileSchema } from './employees.validation';

const router = Router();

// Ensure upload directory exists for avatars
const uploadDir = path.resolve(env.UPLOAD_DIR, 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, WebP'));
    }
  },
});

// Self-service profile update (must be before /:id routes)
router.patch('/profile', authenticate, validate(updateProfileSchema), employeeController.updateProfile);
router.post('/profile/avatar', authenticate, upload.single('avatar'), employeeController.uploadAvatar);

// Team members (manager scope)
router.get('/team', authenticate, authorize('employee:read:team'), employeeController.getTeam);

// Full CRUD (HR/Admin)
router.get('/', authenticate, authorize('employee:read:all', 'employee:read:team'), employeeController.list);
router.get('/:id', authenticate, authorize('employee:read:own', 'employee:read:all'), employeeController.getById);
router.post('/', authenticate, authorize('employee:create'), validate(createEmployeeSchema), employeeController.create);
router.patch('/:id', authenticate, authorize('employee:update:all'), validate(updateEmployeeSchema), employeeController.update);
router.delete('/:id', authenticate, authorize('employee:delete'), employeeController.delete);

export default router;
