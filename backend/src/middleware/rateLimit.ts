import type { NextFunction, Request, Response } from 'express';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { config } from '../config';
import type { AuthenticatedRequest } from './auth';

const WINDOW_MS = 60_000;
const MAX_WORKFLOW_REQUESTS = 20;
const MAX_CONCURRENT_WORKFLOW_REQUESTS = 2;
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const activeWorkflowRequests = new Map<string, number>();

let distributedLimiter: Ratelimit | null = null;

function getDistributedLimiter(): Ratelimit | null {
  if (config.rateLimitMode !== 'upstash') return null;
  if (!distributedLimiter) {
    distributedLimiter = new Ratelimit({
        redis: new Redis({ url: config.upstashRedisUrl, token: config.upstashRedisToken }),
        limiter: Ratelimit.slidingWindow(MAX_WORKFLOW_REQUESTS, '1 m'),
        prefix: 'hexflow:workflow',
        timeout: 2_000,
      });
  }
  return distributedLimiter;
}

function requestKey(req: Request): string {
  const authenticated = req as AuthenticatedRequest;
  return `${authenticated.auth?.userId ?? 'unknown'}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}

function reject(res: Response, message: string, retryAfter: number): void {
  res.setHeader('Retry-After', String(retryAfter));
  res.status(429).json({ error: 'Too many requests', message });
}

export async function workflowRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  const key = requestKey(req);
  const active = activeWorkflowRequests.get(key) ?? 0;
  if (active >= MAX_CONCURRENT_WORKFLOW_REQUESTS) {
    reject(res, 'Please wait for the current workflow action to finish.', 5);
    return;
  }

  const limiter = getDistributedLimiter();
  if (limiter) {
    try {
      const result = await limiter.limit(key);
      res.setHeader('X-RateLimit-Limit', String(result.limit));
      res.setHeader('X-RateLimit-Remaining', String(result.remaining));
      res.setHeader('X-RateLimit-Reset', String(result.reset));
      if (!result.success) {
        reject(res, 'Please wait a minute before trying another workflow action.', Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)));
        return;
      }
    } catch {
      res.status(503).json({
        error: 'Rate limiting unavailable',
        message: 'The workflow service is temporarily unavailable. Please try again.',
      });
      return;
    }
  } else {
    const now = Date.now();
    const current = requestCounts.get(key);
    if (!current || current.resetAt <= now) {
      requestCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    } else if (current.count >= MAX_WORKFLOW_REQUESTS) {
      reject(res, 'Please wait a minute before trying another workflow action.', Math.max(1, Math.ceil((current.resetAt - now) / 1000)));
      return;
    } else {
      current.count += 1;
    }
  }

  activeWorkflowRequests.set(key, active + 1);
  res.once('finish', () => {
    const remaining = (activeWorkflowRequests.get(key) ?? 1) - 1;
    if (remaining > 0) activeWorkflowRequests.set(key, remaining);
    else activeWorkflowRequests.delete(key);
  });
  next();
}
