/**
 * Gemini client singleton.
 * The API key lives only on the backend, loaded from environment config.
 * It is never exposed to the frontend.
 */

import { GoogleGenAI } from '@google/genai';
import { config } from '../config';
import { WorkflowGenerationError } from '../utils/workflowErrors';

let client: GoogleGenAI | null = null;

export function getAIClient(): GoogleGenAI {
  if (!config.geminiApiKey) {
    throw new WorkflowGenerationError(
      500,
      'Server is not configured with a Gemini API key. ' +
        'Set GEMINI_API_KEY in backend/.env (see backend/.env.example).',
    );
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }

  return client;
}