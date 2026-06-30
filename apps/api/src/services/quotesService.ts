import axios from 'axios';
import { config } from '../config/index.js';
import { redis } from '../utils/redis.js';
import { logger } from '../utils/logger.js';

export interface Quote {
  price: number;
  source: 'brapi' | 'coingecko';
  fetchedAt: string;
}

const CRYPTO_TICKER_TO_COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
};

/**
 * Live market quote client for B3 stocks/FIIs (brapi.dev) and crypto (CoinGecko).
 *
 * Mirrors the graceful-degradation contract of MLService/AdvisorService (return
 * `null` instead of throwing), but unlike those, brapi/CoinGecko have no /health
 * endpoint to poll — the quote request itself is the health check. Results (and
 * misses) are cached in Redis so a down provider isn't hit on every render within
 * the same cache window.
 */
export class QuotesService {
  private static instance: QuotesService;

  private constructor() {}

  static getInstance(): QuotesService {
    if (!QuotesService.instance) {
      QuotesService.instance = new QuotesService();
    }
    return QuotesService.instance;
  }

  async getQuote(ticker: string, type: string): Promise<Quote | null> {
    if (!ticker) return null;
    const cacheKey = `quote:${type}:${ticker.toUpperCase()}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        return cached === 'null' ? null : (JSON.parse(cached) as Quote);
      }
    } catch (error) {
      logger.warn(`Quotes cache read error: ${(error as Error).message}`);
    }

    const quote = await this.fetchQuote(ticker, type);

    try {
      await redis.set(
        cacheKey,
        quote ? JSON.stringify(quote) : 'null',
        'EX',
        config.quotes.cacheTtlSeconds
      );
    } catch (error) {
      logger.warn(`Quotes cache write error: ${(error as Error).message}`);
    }

    return quote;
  }

  private async fetchQuote(ticker: string, type: string): Promise<Quote | null> {
    if (type === 'STOCK' || type === 'FII') {
      return this.fetchFromBrapi(ticker);
    }
    if (type === 'CRYPTO') {
      return this.fetchFromCoinGecko(ticker);
    }
    // Fixed income, funds, property, other: no live quote source available.
    return null;
  }

  private async fetchFromBrapi(ticker: string): Promise<Quote | null> {
    try {
      const response = await axios.get(
        `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}`,
        {
          params: config.externalApis.brapiApiKey
            ? { token: config.externalApis.brapiApiKey }
            : undefined,
          timeout: config.quotes.requestTimeoutMs,
        }
      );
      const price = response.data?.results?.[0]?.regularMarketPrice;
      if (typeof price !== 'number') return null;
      return { price, source: 'brapi', fetchedAt: new Date().toISOString() };
    } catch (error) {
      logger.warn(`brapi quote error for ${ticker}: ${(error as Error).message}`);
      return null;
    }
  }

  private async fetchFromCoinGecko(ticker: string): Promise<Quote | null> {
    // ponytail: small hardcoded ticker->id map covers the common coins; unmapped
    // tickers fall back to a lowercase guess (works for many majors, not for
    // ambiguous symbols). Upgrade to a cached /coins/list lookup if long-tail
    // tokens start showing up in portfolios.
    const id = CRYPTO_TICKER_TO_COINGECKO_ID[ticker.toUpperCase()] ?? ticker.toLowerCase();
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: id,
          vs_currencies: 'brl',
          x_cg_demo_api_key: config.externalApis.coingeckoApiKey,
        },
        timeout: config.quotes.requestTimeoutMs,
      });
      const price = response.data?.[id]?.brl;
      if (typeof price !== 'number') return null;
      return { price, source: 'coingecko', fetchedAt: new Date().toISOString() };
    } catch (error) {
      logger.warn(`coingecko quote error for ${ticker}: ${(error as Error).message}`);
      return null;
    }
  }
}

export const quotesService = QuotesService.getInstance();
