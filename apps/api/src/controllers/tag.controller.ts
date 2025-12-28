import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js';

const createTagSchema = z.object({
  name: z.string().min(1).max(50).transform((str) => str.toLowerCase().replace(/\s+/g, '-')),
  color: z.string().optional(),
});

const updateTagSchema = createTagSchema.partial();

export class TagController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const tags = await prisma.tag.findMany({
        where: { userId },
        include: {
          _count: {
            select: { transactions: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      res.json({
        status: 'success',
        data: {
          tags: tags.map((tag) => ({
            ...tag,
            transactionCount: tag._count.transactions,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const data = createTagSchema.parse(req.body);

      // Check if tag already exists
      const existing = await prisma.tag.findFirst({
        where: { userId, name: data.name },
      });

      if (existing) {
        throw new ConflictError('Tag already exists');
      }

      const tag = await prisma.tag.create({
        data: {
          userId,
          name: data.name,
          color: data.color,
        },
      });

      res.status(201).json({
        status: 'success',
        data: { tag },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const tag = await prisma.tag.findFirst({
        where: { id, userId },
        include: {
          transactions: {
            where: { deletedAt: null },
            orderBy: { date: 'desc' },
            take: 10,
            include: {
              category: { select: { id: true, name: true, icon: true } },
              account: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!tag) {
        throw new NotFoundError('Tag not found');
      }

      res.json({
        status: 'success',
        data: { tag },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const data = updateTagSchema.parse(req.body);

      const existing = await prisma.tag.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw new NotFoundError('Tag not found');
      }

      // Check for duplicate name
      if (data.name && data.name !== existing.name) {
        const duplicate = await prisma.tag.findFirst({
          where: { userId, name: data.name },
        });
        if (duplicate) {
          throw new ConflictError('Tag with this name already exists');
        }
      }

      const tag = await prisma.tag.update({
        where: { id },
        data,
      });

      res.json({
        status: 'success',
        data: { tag },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const existing = await prisma.tag.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw new NotFoundError('Tag not found');
      }

      // Delete tag (will automatically remove from transactions due to relation)
      await prisma.tag.delete({
        where: { id },
      });

      res.json({
        status: 'success',
        message: 'Tag deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
