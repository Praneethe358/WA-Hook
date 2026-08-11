import express from 'express';
import cors from 'cors';
import { CONFIG } from './config';
import { webhookRouter } from './routes/webhook';
import { apiRouter } from './routes/api';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/', webhookRouter);
app.use('/', apiRouter);

// Health Check
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok', service: 'WA-hook Core' });
});

app.listen(CONFIG.PORT, () => {
  console.log(`\n🚀 WA-hook Core Server active on http://localhost:${CONFIG.PORT}`);
  console.log(`   - Webhook Verification: GET  http://localhost:${CONFIG.PORT}/webhook`);
  console.log(`   - Outbound Mock API:   POST http://localhost:${CONFIG.PORT}/v19.0/:phoneNumberId/messages\n`);
});
