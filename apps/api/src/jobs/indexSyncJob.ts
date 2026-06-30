import cron from 'node-cron';
import axios from 'axios';
import { prisma } from '../utils/prisma.js';
import { redis } from '../utils/redis.js';
import { quotesService } from '../services/quotesService.js';
import { logger } from '../utils/logger.js';

// Banco Central do Brasil SGS series ids. Both already come back as period
// returns in % (CDI: daily, IPCA: monthly), so they slot directly into
// MarketIndex.value without conversion.
const BCB_SERIES: Record<string, number> = {
  CDI: 12,
  IPCA: 433,
};

async function fetchBcbSeries(seriesId: number): Promise<number | null> {
  try {
    const response = await axios.get(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesId}/dados/ultimos/1?formato=json`,
      { timeout: 8000 }
    );
    const value = response.data?.[0]?.valor;
    return value ? Number(value) : null;
  } catch (error) {
    logger.warn(`BCB series ${seriesId} fetch error: ${(error as Error).message}`);
    return null;
  }
}

function todayUtc(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

async function upsertMarketIndex(name: string, value: number, source: string): Promise<void> {
  const date = todayUtc();
  const clamped = Math.max(Math.min(value, 999.99), -999.99); // fits Decimal(5,2)

  const existing = await prisma.marketIndex.findFirst({ where: { name, date } });
  if (existing) {
    await prisma.marketIndex.update({ where: { id: existing.id }, data: { value: clamped } });
  } else {
    await prisma.marketIndex.create({ data: { name, value: clamped, date, source } });
  }
}

/**
 * IBOV has no period-return API of its own — brapi.dev (reused via
 * quotesService) only gives the raw index level. We diff today's level
 * against yesterday's, cached in Redis (not Postgres, since the raw level
 * itself doesn't fit MarketIndex's %-scale column), to derive a daily % return
 * consistent with how CDI/IPCA are stored. First run has nothing to diff
 * against yet, so it's skipped.
 */
async function syncIbov(): Promise<void> {
  const quote = await quotesService.getQuote('^BVSP', 'STOCK');
  if (!quote) return;

  const cacheKey = 'index:ibov:last_level';
  const previousRaw = await redis.get(cacheKey);
  await redis.set(cacheKey, String(quote.price));

  if (!previousRaw) return;
  const previousLevel = Number(previousRaw);
  if (!previousLevel) return;

  const returnPct = ((quote.price - previousLevel) / previousLevel) * 100;
  await upsertMarketIndex('IBOV', returnPct, 'brapi');
}

export async function syncMarketIndexes(): Promise<void> {
  for (const [name, seriesId] of Object.entries(BCB_SERIES)) {
    const value = await fetchBcbSeries(seriesId);
    if (value !== null) await upsertMarketIndex(name, value, 'BCB');
  }

  await syncIbov();

  logger.info('Index sync job: CDI/IPCA/IBOV refreshed');
}

export function registerIndexSyncJob(): void {
  cron.schedule('0 6 * * *', () => {
    syncMarketIndexes().catch((error) => {
      logger.error(`Index sync job failed: ${(error as Error).message}`);
    });
  });
}
