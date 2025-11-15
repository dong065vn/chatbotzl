import dotenv from 'dotenv';

dotenv.config();

interface Config {
  // Server
  port: number;
  nodeEnv: string;

  // Zalo OA
  zaloOaId: string;
  zaloAccessToken: string;
  zaloAppSecret: string;

  // Google Gemini
  geminiApiKey: string;
  geminiModel: string;

  // Cache
  cacheTtl: number; // in seconds
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config: Config = {
  // Server
  port: parseInt(getEnvVar('PORT', '3000'), 10),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),

  // Zalo OA
  zaloOaId: getEnvVar('ZALO_OA_ID'),
  zaloAccessToken: getEnvVar('ZALO_ACCESS_TOKEN'),
  zaloAppSecret: getEnvVar('ZALO_APP_SECRET'),

  // Google Gemini
  geminiApiKey: getEnvVar('GEMINI_API_KEY'),
  geminiModel: getEnvVar('GEMINI_MODEL', 'gemini-2.0-flash-exp'),

  // Cache
  cacheTtl: parseInt(getEnvVar('CACHE_TTL', '3600'), 10), // 1 hour default
};
