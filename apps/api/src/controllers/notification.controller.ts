import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { NotFoundError } from '../middleware/errorHandler.js';

export class NotificationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { unreadOnly } = req.query;

      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          ...(unreadOnly === 'true' && { isRead: false }),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.json({
        status: 'success',
        data: { notifications },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const count = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      res.json({
        status: 'success',
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      await prisma.notification.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });

      res.json({
        status: 'success',
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });

      res.json({
        status: 'success',
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      await prisma.notification.delete({
        where: { id },
      });

      res.json({
        status: 'success',
        message: 'Notification deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}
