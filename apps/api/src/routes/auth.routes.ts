import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/verify-email/:token', AuthController.verifyEmail);

// OAuth routes
router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleCallback);
router.get('/apple', AuthController.appleAuth);
router.get('/apple/callback', AuthController.appleCallback);

// Protected routes
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/change-password', authMiddleware, AuthController.changePassword);

export default router;
