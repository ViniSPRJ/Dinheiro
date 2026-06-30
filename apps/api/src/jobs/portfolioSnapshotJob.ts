import cron from 'node-cron';
import { prisma } from '../utils/prisma.js';
import { InvestmentController } from '../controllers/investment.controller.js';
import { logger } from '../utils/logger.js';

function todayUtc(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/**
 * Records one PortfolioSnapshot per user per day, reusing the same
 * current-value resolution InvestmentController.getPerformanceInternal already
 * uses (live quote -> cached price -> estimatedValue -> averagePrice). This is
 * the return series riskEngine needs for volatility/Sharpe/correlation.
 */
export async function snapshotPortfolios(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { deletedAt: null, investments: { some: { deletedAt: null } } },
    select: { id: true },
  });

  const date = todayUtc();

  for (const user of users) {
    const { totals } = await InvestmentController.getPerformanceInternal(user.id);

    await prisma.portfolioSnapshot.upsert({
      where: { userId_date: { userId: user.id, date } },
      update: { totalValue: totals.totalCurrentValue },
      create: { userId: user.id, date, totalValue: totals.totalCurrentValue },
    });
  }

  logger.info(`Portfolio snapshot job: recorded ${users.length} snapshots`);
}

export function registerPortfolioSnapshotJob(): void {
  cron.schedule('30 6 * * *', () => {
    snapshotPortfolios().catch((error) => {
      logger.error(`Portfolio snapshot job failed: ${(error as Error).message}`);
    });
  });
}
