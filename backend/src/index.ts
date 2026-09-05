import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import workflowRoutes from './routes/workflowRoutes';
import { config, validateConfig } from './config';

validateConfig();

const app = express();

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
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'HexFlow backend is running' });
});

// Workflow routes
app.use('/api/workflow', workflowRoutes);

// Start server
app.listen(config.port, () => {
  console.log(`[server] HexFlow backend running on port ${config.port}`);
  console.log(`[server] Health check: http://localhost:${config.port}/api/health`);
});