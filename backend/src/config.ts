/**
 * Backend configuration
 * All credentials are loaded from environment variables only.
 * Never hard-code or expose API keys.
 */

export const config = {
  port: Number(process.env.PORT || 3000),
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  frontendUrl: process.env.FRONTEND_URL ?? '',
};