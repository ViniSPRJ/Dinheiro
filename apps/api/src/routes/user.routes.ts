import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/me', UserController.getMe);
router.patch('/me', UserController.updateMe);
router.delete('/me', UserController.deleteMe);
router.get('/me/preferences', UserController.getPreferences);
router.patch('/me/preferences', UserController.updatePreferences);
router.post('/me/export-data', UserController.exportData);
router.post('/me/complete-onboarding', UserController.completeOnboarding);

export default router;
