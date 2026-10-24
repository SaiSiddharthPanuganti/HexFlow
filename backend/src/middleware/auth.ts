import type { NextFunction, Request, Response } from 'express';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    email?: string;
  };
}

function unauthorized(res: Response): void {
  res.status(401).json({
    error: 'Unauthorized',
    message: 'A valid Supabase access token is required.',
  });
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.header('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    unauthorized(res);
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token || !config.supabaseUrl || !config.supabasePublishableKey) {
    unauthorized(res);
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: config.supabasePublishableKey,
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      unauthorized(res);
      return;
    }

    const user = await response.json() as { id?: unknown; email?: unknown };
    if (typeof user.id !== 'string' || user.id.length === 0) {
      unauthorized(res);
      return;
    }

    req.auth = {
      userId: user.id,
      email: typeof user.email === 'string' ? user.email : undefined,
    };
    next();
  } catch {
    res.status(503).json({
      error: 'Authentication unavailable',
      message: 'Authentication could not be verified. Please try again.',
    });
  } finally {
    clearTimeout(timeout);
  }
}
