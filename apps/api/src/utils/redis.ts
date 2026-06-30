import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

declare global {
  var redis: Redis | undefined;
}

export const redis =
  global.redis ||
  new Redis(config.redisUrl || 'redis://localhost:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

if (process.env.NODE_ENV !== 'production') {
  global.redis = redis;
}

redis.on('error', (error) => {
  logger.warn(`Redis error: ${error.message}`);
});

export default redis;
