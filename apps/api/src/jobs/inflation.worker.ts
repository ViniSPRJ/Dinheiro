import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Worker responsible for updating the current price of items in the Personal Basket.
 * In a real scenario, this would use Puppeteer/Playwright or external APIs.
 */
export class InflationWorker {
  static async updateBasketPrices() {
    logger.info('Starting Inflation Worker: Updating Personal Basket Prices...');

    const items = await prisma.personalBasketItem.findMany();
    
    for (const item of items) {
      try {
        // Mock Logic: Simulate price fluctuation driven by "inflation"
        // Random fluctuation between -1% and +2% (inflation bias)
        const volatility = (Math.random() * 0.03) - 0.01; 
        
        const currentPrice = Number(item.currentPrice);
        const newPrice = currentPrice * (1 + volatility);
        
        await prisma.personalBasketItem.update({
          where: { id: item.id },
          data: {
            currentPrice: newPrice,
            lastUpdated: new Date()
          }
        });
        
        logger.info(`Updated price for ${item.itemName}: ${currentPrice.toFixed(2)} -> ${newPrice.toFixed(2)}`);
      } catch (error) {
        logger.error(`Failed to update price for ${item.itemName}: ${error}`);
      }
    }

    logger.info('Inflation Worker completed.');
  }
}
