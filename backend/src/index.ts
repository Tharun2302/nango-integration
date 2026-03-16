import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { workflowRouter } from './routes/workflow.routes';
import { integrationRouter } from './routes/integration.routes';
import logger from './utils/logger';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/workflow', workflowRouter);
app.use('/api/integrations', integrationRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

export default app;
