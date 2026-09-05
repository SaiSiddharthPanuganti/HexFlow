import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import workflowRoutes from './routes/workflowRoutes';
import { config } from './config';

const app = express();

// Middleware
app.use(cors());
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