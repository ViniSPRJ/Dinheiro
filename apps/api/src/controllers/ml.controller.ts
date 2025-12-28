import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { mlService } from '../services/mlService.js';

const suggestCategorySchema = z.object({
  description: z.string().min(1).max(500),
  amount: z.number().optional(),
  accountType: z.string().optional(),
});

export class MLController {
  /**
   * Suggest a category for a transaction description
   */
  static async suggestCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const data = suggestCategorySchema.parse(req.body);

      // Try ML service first
      const suggestion = await mlService.suggestCategory({
        description: data.description,
        userId,
        amount: data.amount,
        accountType: data.accountType,
      });

      if (suggestion && suggestion.confidence > 0.3) {
        // Find the actual category in our database
        const category = await prisma.category.findFirst({
          where: {
            OR: [
              { id: suggestion.category_id },
              { name: { equals: suggestion.category_name, mode: 'insensitive' } },
            ],
            deletedAt: null,
          },
        });

        if (category) {
          res.json({
            status: 'success',
            data: {
              suggestion: {
                categoryId: category.id,
                categoryName: category.name,
                categoryIcon: category.icon,
                categoryColor: category.color,
                confidence: suggestion.confidence,
                source: 'ml',
              },
              alternatives: suggestion.alternatives.slice(0, 2).map((alt) => ({
                categoryId: alt.category_id,
                categoryName: alt.category_name,
                confidence: alt.confidence,
              })),
            },
          });
          return;
        }
      }

      // Fallback: Find category based on user's history
      const historicalMatch = await prisma.transaction.findFirst({
        where: {
          userId,
          description: { contains: data.description.slice(0, 20), mode: 'insensitive' },
          categoryId: { not: null },
          deletedAt: null,
        },
        include: {
          category: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (historicalMatch?.category) {
        res.json({
          status: 'success',
          data: {
            suggestion: {
              categoryId: historicalMatch.category.id,
              categoryName: historicalMatch.category.name,
              categoryIcon: historicalMatch.category.icon,
              categoryColor: historicalMatch.category.color,
              confidence: 0.6,
              source: 'history',
            },
            alternatives: [],
          },
        });
        return;
      }

      // No suggestion available
      res.json({
        status: 'success',
        data: {
          suggestion: null,
          alternatives: [],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrain the ML model when user corrects a category
   */
  static async retrain(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { transactionId, description, categoryId } = z.object({
        transactionId: z.string(),
        description: z.string(),
        categoryId: z.string(),
      }).parse(req.body);

      // Get category name
      const category = await prisma.category.findFirst({
        where: { id: categoryId, deletedAt: null },
      });

      if (!category) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }

      // Send to ML service for retraining
      const success = await mlService.retrain({
        userId,
        transactionId,
        description,
        correctCategoryId: categoryId,
        correctCategoryName: category.name,
      });

      res.json({
        status: 'success',
        data: { retrained: success },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the status of the user's ML model
   */
  static async getModelStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const status = await mlService.getModelStatus(userId);

      if (status) {
        res.json({
          status: 'success',
          data: status,
        });
      } else {
        res.json({
          status: 'success',
          data: {
            hasModel: false,
            trainingExamples: 0,
            readyForTraining: false,
            serviceAvailable: false,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }
}
