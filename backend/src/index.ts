import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import workflowRoutes from './routes/workflowRoutes';
import { config, validateConfig } from './config';

validateConfig();

const app = express();

// Trust the single reverse proxy used by common hosting platforms so req.ip
// resolves to the client address for rate limiting.
if (config.isProduction) app.set('trust proxy', 1);

app.disable('x-powered-by');

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (config.isProduction) {
      callback(null, origin === config.frontendUrl);
      return;
    }

    callback(null, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 600,
}));

// Keep request bodies bounded to reduce accidental and malicious memory usage.
app.use(express.json({ limit: '1mb', strict: true }));

// Lightweight per-process protection for expensive AI endpoints.
// For multi-instance deployments, replace this with a shared store-based limiter.
const WINDOW_MS = 60_000;
const MAX_WORKFLOW_REQUESTS = 20;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function workflowRateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();

  // Opportunistic cleanup keeps the map from growing indefinitely.
  if (requestCounts.size > 5_000) {
    for (const [key, value] of requestCounts) {
      if (value.resetAt <= now) requestCounts.delete(key);
    }
  }

  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const current = requestCounts.get(key);

  if (!current || current.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (current.count >= MAX_WORKFLOW_REQUESTS) {
    res.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please wait a minute before trying another workflow action.',
    });
    return;
  }

  current.count += 1;
  next();
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: 'ok', message: 'HexFlow backend is running' });
});

// Workflow routes can trigger paid/limited AI operations.
app.use('/api/workflow', workflowRateLimit, workflowRoutes);

// Consistent response for unknown API routes.
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested API endpoint does not exist.',
  });
});

// Handle malformed JSON and oversized bodies without leaking stack traces.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;

  const err = error as { type?: string; status?: number };
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    res.status(413).json({
      error: 'Request too large',
      message: 'Request body must be 1 MB or smaller.',
    });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body must contain valid JSON.',
    });
    return;
  }

  console.error('[server] Unhandled request error');
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred.',
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`[server] HexFlow backend running on port ${config.port}`);
  console.log(`[server] Health check: http://localhost:${config.port}/api/health`);
});
