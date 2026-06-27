import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { advisorService, AdvisorHolding } from '../services/advisorService.js';

const RISK_PROFILES = ['conservador', 'moderado', 'arrojado'] as const;

const reviewQuerySchema = z.object({
  riskProfile: z.enum(RISK_PROFILES).optional(),
  stage: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

const updateProfileSchema = z.object({
  riskProfile: z.enum(RISK_PROFILES),
});

/**
 * Advisor controller — bridges Dinheiro to the OpenSwarm Advisor Service.
 *
 * It autonomously reads the user's discriminated allocation (the same data
 * shown on the Investments page), forwards it to the advisor, and returns a
 * portfolio review with insights and an optimized allocation proposal.
 */
export class AdvisorController {
  /** Build the holdings payload from the user's stored investments. */
  private static async buildHoldings(userId: string): Promise<{
    holdings: AdvisorHolding[];
    totalValue: number;
  }> {
    const investments = await prisma.investment.findMany({
      where: { userId, deletedAt: null },
    });

    const holdings: AdvisorHolding[] = investments.map((inv) => {
      const currentValue = inv.estimatedValue
        ? Number(inv.estimatedValue)
        : inv.quantity
          ? Number(inv.quantity) * Number(inv.averagePrice)
          : Number(inv.totalInvested);

      return {
        type: inv.type,
        name: inv.name,
        ticker: inv.ticker,
        current_value: Math.round(currentValue * 100) / 100,
        invested: Number(inv.totalInvested),
      };
    });

    const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
    return { holdings, totalValue };
  }

  /**
   * GET /api/advisor/review
   * Autonomous portfolio review + optimized allocation for the current user.
   */
  static async getReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { riskProfile, stage } = reviewQuerySchema.parse(req.query);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { riskProfile: true, currency: true },
      });

      const effectiveProfile = riskProfile ?? user?.riskProfile ?? 'moderado';
      const { holdings, totalValue } = await AdvisorController.buildHoldings(userId);

      const review = await advisorService.optimizePortfolio({
        clientId: `user_${userId}`,
        holdings,
        riskProfile: effectiveProfile,
        currency: user?.currency ?? 'BRL',
        totalValue,
        stage: stage ?? true,
      });

      if (!review) {
        // Graceful degradation — the advisor service is offline.
        return res.status(200).json({
          status: 'success',
          data: {
            available: false,
            riskProfile: effectiveProfile,
            message:
              'O consultor OpenSwarm está temporariamente indisponível. Tente novamente em instantes.',
          },
        });
      }

      res.json({
        status: 'success',
        data: { available: true, riskProfile: effectiveProfile, review },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/advisor/profile
   * Persist the user's investor risk profile so reviews are personalized.
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { riskProfile } = updateProfileSchema.parse(req.body);

      await prisma.user.update({
        where: { id: userId },
        data: { riskProfile },
      });

      res.json({
        status: 'success',
        data: { riskProfile },
      });
    } catch (error) {
      next(error);
    }
  }
}
