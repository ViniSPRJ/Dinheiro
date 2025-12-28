import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Log queries in development
prisma.$on('query' as never, (e: { query: string; duration: number }) => {
  logger.debug(`Query: ${e.query}`);
  logger.debug(`Duration: ${e.duration}ms`);
});

prisma.$on('error' as never, (e: { message: string }) => {
  logger.error(`Prisma Error: ${e.message}`);
});

export default prisma;
