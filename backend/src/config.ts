/**
 * Backend configuration
 * All credentials are loaded from environment variables only.
 * Never hard-code or expose API keys.
 */

const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = (process.env.FRONTEND_URL ?? '').replace(/\/+$/, '');

export const config = {
  isProduction,
  port: Number(process.env.PORT || 5000),
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  frontendUrl,
};

export function validateConfig(): void {
  if (!config.isProduction) return;

  const missing: string[] = [];
  if (!config.geminiApiKey) missing.push('GEMINI_API_KEY');
  if (!config.frontendUrl) missing.push('FRONTEND_URL');

  if (missing.length > 0) {
    throw new Error(
      `[config] Missing required production environment variable(s): ${missing.join(', ')}`,
    );
  }
}