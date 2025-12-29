import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']).default('EXPENSE'),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional(),
});

const updateCategorySchema = createCategorySchema.partial();

export class CategoryController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { type } = req.query;

      const categories = await prisma.category.findMany({
        where: {
          OR: [
            { userId: null }, // Global categories
            { userId }, // User's custom categories
          ],
          deletedAt: null,
          ...(type && { type: type as 'EXPENSE' | 'INCOME' | 'TRANSFER' }),
        },
        include: {
          children: true,
        },
        orderBy: [{ userId: 'asc' }, { name: 'asc' }], // Global first, then alphabetical
      });

      res.json({
        status: 'success',
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const data = createCategorySchema.parse(req.body);

      const category = await prisma.category.create({
        data: {
          userId,
          name: data.name,
          type: data.type,
          icon: data.icon,
          color: data.color,
          parentId: data.parentId,
        },
      });

      res.status(201).json({
        status: 'success',
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const category = await prisma.category.findFirst({
        where: {
          id,
          OR: [{ userId: null }, { userId }],
          deletedAt: null,
        },
        include: {
          children: true,
          parent: true,
        },
      });

      if (!category) {
        throw new NotFoundError('Category not found');
      }

      res.json({
        status: 'success',
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const data = updateCategorySchema.parse(req.body);

      // Check ownership (can only edit user's own categories, not global ones)
      const existing = await prisma.category.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError('Category not found or not editable');
      }

      const category = await prisma.category.update({
        where: { id },
        data,
      });

      res.json({
        status: 'success',
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check ownership
      const existing = await prisma.category.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError('Category not found or not deletable');
      }

      // Soft delete
      await prisma.category.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      res.json({
        status: 'success',
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
