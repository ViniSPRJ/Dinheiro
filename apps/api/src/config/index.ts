import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),

  // Database
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),

  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Email
  SENDGRID_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().default('noreply@dinheiro.app'),

  // ML Service
  ML_SERVICE_URL: z.string().default('http://localhost:8000'),

  // OpenSwarm Advisor Service (portfolio review & allocation optimization)
  ADVISOR_SERVICE_URL: z.string().default('http://localhost:8001'),

  // External APIs
  COINGECKO_API_KEY: z.string().optional(),
  BRAPI_API_KEY: z.string().optional(),

  // Quotes (live market price) caching/timeouts
  QUOTES_CACHE_TTL: z.string().default('60'), // seconds
  QUOTES_REQUEST_TIMEOUT: z.string().default('5000'), // ms
});

const env = envSchema.parse(process.env);

export const config = {
  nodeEnv: env.NODE_ENV,
  port: parseInt(env.PORT, 10),

  // Database
  databaseUrl: env.DATABASE_URL,
  redisUrl: env.REDIS_URL,

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  // OAuth
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
  apple: {
    clientId: env.APPLE_CLIENT_ID,
    teamId: env.APPLE_TEAM_ID,
    privateKey: env.APPLE_PRIVATE_KEY,
  },

  // Frontend
  frontendUrl: env.FRONTEND_URL,

  // Email
  email: {
    sendgridApiKey: env.SENDGRID_API_KEY,
    fromEmail: env.FROM_EMAIL,
  },

  // ML Service
  mlServiceUrl: env.ML_SERVICE_URL,

  // OpenSwarm Advisor Service
  advisorServiceUrl: env.ADVISOR_SERVICE_URL,

  // External APIs
  externalApis: {
    coingeckoApiKey: env.COINGECKO_API_KEY,
    brapiApiKey: env.BRAPI_API_KEY,
  },

  // Quotes
  quotes: {
    cacheTtlSeconds: parseInt(env.QUOTES_CACHE_TTL, 10),
    requestTimeoutMs: parseInt(env.QUOTES_REQUEST_TIMEOUT, 10),
  },

  // Rate limits
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // requests per window
  },

  // Auth rate limits
  authRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // login attempts
  },
} as const;

export type Config = typeof config;
