import { Router, Request, Response } from 'express';
import { RUNTIME_CONFIG } from '../config';

export const webhookRouter = Router();

/**
 * Meta Webhook Verification Handshake
 * Handles GET requests sent by Meta (or local apps) during initial setup.
 */
webhookRouter.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === RUNTIME_CONFIG.WEBHOOK_VERIFY_TOKEN) {
      console.log('[WA-hook] Webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      console.warn('[WA-hook] Webhook verification failed: Invalid Token');
      return res.sendStatus(403);
    }
  }

  return res.status(400).json({ error: 'Missing hub.mode or hub.verify_token parameters' });
});
