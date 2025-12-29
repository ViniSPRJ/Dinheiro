import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';
import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Helper functions
function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { sub: userId, email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );
}

function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
  );
}

async function saveRefreshToken(userId: string, token: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
}

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = signupSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
        },
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id);

      // Save refresh token
      await saveRefreshToken(user.id, refreshToken);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      logger.info(`User signed up: ${user.email}`);

      res.status(201).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            onboardingCompleted: user.onboardingCompleted,
          },
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user || !user.passwordHash) {
        throw new UnauthorizedError('Invalid credentials');
      }

      if (user.deletedAt) {
        throw new UnauthorizedError('Account has been deleted');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id);

      // Save refresh token
      await saveRefreshToken(user.id, refreshToken);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      logger.info(`User logged in: ${user.email}`);

      res.json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            onboardingCompleted: user.onboardingCompleted,
          },
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token provided');
      }

      // Verify refresh token
      let decoded: { sub: string };
      try {
        decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { sub: string };
      } catch {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Check if token exists in database and is not revoked
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedError('Refresh token is invalid or expired');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || user.deletedAt) {
        throw new UnauthorizedError('User not found');
      }

      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });

      // Generate new tokens
      const newAccessToken = generateAccessToken(user.id, user.email);
      const newRefreshToken = generateRefreshToken(user.id);

      // Save new refresh token
      await saveRefreshToken(user.id, newRefreshToken);

      // Set new refresh token as httpOnly cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        status: 'success',
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        // Revoke refresh token
        await prisma.refreshToken.updateMany({
          where: { token: refreshToken },
          data: { revokedAt: new Date() },
        });
      }

      // Clear cookie
      res.clearCookie('refreshToken');

      logger.info(`User logged out: ${req.userId}`);

      res.json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      // Always return success to prevent email enumeration
      if (!user || !user.passwordHash) {
        return res.json({
          status: 'success',
          message: 'If an account exists, a reset email has been sent',
        });
      }

      // TODO: Generate reset token and send email
      // For now, just log it
      const resetToken = jwt.sign(
        { sub: user.id, purpose: 'password-reset' },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      logger.info(`Password reset requested for: ${email}, token: ${resetToken}`);

      res.json({
        status: 'success',
        message: 'If an account exists, a reset email has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);

      // Verify token
      let decoded: { sub: string; purpose: string };
      try {
        decoded = jwt.verify(token, config.jwt.secret) as { sub: string; purpose: string };
      } catch {
        throw new BadRequestError('Invalid or expired reset token');
      }

      if (decoded.purpose !== 'password-reset') {
        throw new BadRequestError('Invalid token');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 12);

      // Update user password
      await prisma.user.update({
        where: { id: decoded.sub },
        data: { passwordHash },
      });

      // Revoke all refresh tokens for this user
      await prisma.refreshToken.updateMany({
        where: { userId: decoded.sub },
        data: { revokedAt: new Date() },
      });

      logger.info(`Password reset completed for user: ${decoded.sub}`);

      res.json({
        status: 'success',
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      // Verify token
      let decoded: { sub: string; purpose: string };
      try {
        decoded = jwt.verify(token, config.jwt.secret) as { sub: string; purpose: string };
      } catch {
        throw new BadRequestError('Invalid or expired verification token');
      }

      if (decoded.purpose !== 'email-verification') {
        throw new BadRequestError('Invalid token');
      }

      // Update user
      await prisma.user.update({
        where: { id: decoded.sub },
        data: { emailVerified: true },
      });

      res.json({
        status: 'success',
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      const userId = req.userId!;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.passwordHash) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

      if (!isValidPassword) {
        throw new BadRequestError('Current password is incorrect');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      logger.info(`Password changed for user: ${userId}`);

      res.json({
        status: 'success',
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // OAuth placeholders - to be implemented with Passport.js
  static async googleAuth(req: Request, res: Response) {
    // TODO: Implement Google OAuth with Passport.js
    res.redirect(`${config.frontendUrl}/auth/google-not-implemented`);
  }

  static async googleCallback(req: Request, res: Response) {
    // TODO: Handle Google OAuth callback
    res.redirect(`${config.frontendUrl}/dashboard`);
  }

  static async appleAuth(req: Request, res: Response) {
    // TODO: Implement Apple Sign In with Passport.js
    res.redirect(`${config.frontendUrl}/auth/apple-not-implemented`);
  }

  static async appleCallback(req: Request, res: Response) {
    // TODO: Handle Apple Sign In callback
    res.redirect(`${config.frontendUrl}/dashboard`);
  }
}
