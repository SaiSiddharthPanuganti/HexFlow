/**
 * Backend configuration
 * All credentials are loaded from environment variables only.
 * Never hard-code or expose API keys.
 */

const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = (process.env.FRONTEND_URL ?? '').replace(/\/+$/, '');
const supabaseUrl = (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
const rateLimitMode = process.env.RATE_LIMIT_MODE ?? (isProduction ? 'upstash' : 'memory');

export const config = {
  isProduction,
  port: Number(process.env.PORT || 5000),
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  frontendUrl,
  supabaseUrl,
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? '',
  rateLimitMode,
  upstashRedisUrl: process.env.UPSTASH_REDIS_REST_URL ?? '',
  upstashRedisToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  sentryDsn: process.env.SENTRY_DSN ?? '',
};

export function validateConfig(): void {
  if (!config.isProduction) return;

  const missing: string[] = [];
  if (!config.geminiApiKey) missing.push('GEMINI_API_KEY');
  if (!config.frontendUrl) missing.push('FRONTEND_URL');
  if (!config.supabaseUrl) missing.push('SUPABASE_URL');
  if (!config.supabasePublishableKey) missing.push('SUPABASE_PUBLISHABLE_KEY');
  if (config.rateLimitMode === 'upstash' && !config.upstashRedisUrl) missing.push('UPSTASH_REDIS_REST_URL');
  if (config.rateLimitMode === 'upstash' && !config.upstashRedisToken) missing.push('UPSTASH_REDIS_REST_TOKEN');

  if (missing.length > 0) {
    throw new Error(
      `[config] Missing required production environment variable(s): ${missing.join(', ')}`,
    );
  }
}
