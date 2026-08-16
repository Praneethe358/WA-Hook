import express from 'express';
import cors from 'cors';
import path from 'path';
import { RUNTIME_CONFIG } from './config';
import { webhookRouter } from './routes/webhook';
import { apiRouter } from './routes/api';
import { simulatorRouter } from './routes/simulator';

const app = express();

app.use(cors());
app.use(express.json());

// Serve Static Dashboard UI (resolves correctly in both dev and built dist directories)
const publicPath = path.resolve(__dirname, '../public');
app.use(express.static(publicPath));

// Routes
app.use('/', webhookRouter);
app.use('/', apiRouter);
app.use('/', simulatorRouter);

// Health Check
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok', service: 'WA-hook Core' });
});

import { displayStartupSequence } from './utils/logger';

export async function startServer() {
  app.listen(RUNTIME_CONFIG.PORT, async () => {
    await displayStartupSequence();
  });
}

// Auto-start if executed directly (e.g. via tsx in development)
if (require.main === module) {
  startServer();
}
