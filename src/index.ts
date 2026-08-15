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

// Serve Static Dashboard UI
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/', webhookRouter);
app.use('/', apiRouter);
app.use('/', simulatorRouter);

// Health Check
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok', service: 'WA-hook Core' });
});

app.listen(RUNTIME_CONFIG.PORT, () => {
  console.log(`\n🚀 WA-hook Core Server active on http://localhost:${RUNTIME_CONFIG.PORT}`);
  console.log(`   - 🖥️  Dashboard UI:      http://localhost:${RUNTIME_CONFIG.PORT}`);
  console.log(`   - 🤝 Webhook Handshake: GET  http://localhost:${RUNTIME_CONFIG.PORT}/webhook`);
  console.log(`   - 📤 Outbound Mock API: POST http://localhost:${RUNTIME_CONFIG.PORT}/v19.0/:phoneNumberId/messages`);
  console.log(`   - 📥 Trigger Simulator: POST http://localhost:${RUNTIME_CONFIG.PORT}/simulator/trigger\n`);
});
