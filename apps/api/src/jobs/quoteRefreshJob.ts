import cron from 'node-cron';
import { prisma } from '../utils/prisma.js';
import { quotesService } from '../services/quotesService.js';
import { logger } from '../utils/logger.js';

/**
 * Refreshes cached currentPrice/priceUpdatedAt for investments that have a
 * live-quotable ticker (STOCK/FII/CRYPTO). quotesService already caches per
 * ticker in Redis; this keeps Investment rows warm for reads that shouldn't
 * wait on an external call (e.g. allocation summaries, the advisor review).
 */
export async function refreshQuotes(): Promise<void> {
  const investments = await prisma.investment.findMany({
    where: {
      deletedAt: null,
      ticker: { not: null },
      type: { in: ['STOCK', 'FII', 'CRYPTO'] },
    },
    select: { id: true, ticker: true, type: true },
  });

  for (const investment of investments) {
    if (!investment.ticker) continue;
    const quote = await quotesService.getQuote(investment.ticker, investment.type);
    if (!quote) continue;

    await prisma.investment.update({
      where: { id: investment.id },
      data: { currentPrice: quote.price, priceUpdatedAt: new Date(quote.fetchedAt) },
    });
  }

  logger.info(`Quote refresh job: processed ${investments.length} investments`);
}

export function registerQuoteRefreshJob(): void {
  cron.schedule('*/15 * * * *', () => {
    refreshQuotes().catch((error) => {
      logger.error(`Quote refresh job failed: ${(error as Error).message}`);
    });
  });
}
