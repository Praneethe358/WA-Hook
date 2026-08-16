import { Router, Request, Response } from 'express';
import { RUNTIME_CONFIG } from '../config';

export const simulatorRouter = Router();

// GET current configuration
simulatorRouter.get('/simulator/config', (_req: Request, res: Response) => {
  res.status(200).json({
    targetWebhookUrl: RUNTIME_CONFIG.TARGET_WEBHOOK_URL,
    verifyToken: RUNTIME_CONFIG.WEBHOOK_VERIFY_TOKEN,
  });
});

// UPDATE configuration dynamically from UI
simulatorRouter.post('/simulator/config', (req: Request, res: Response) => {
  const { targetWebhookUrl } = req.body;
  if (targetWebhookUrl) {
    RUNTIME_CONFIG.TARGET_WEBHOOK_URL = targetWebhookUrl;
    console.log(`[WA-hook] Target URL updated to: ${targetWebhookUrl}`);
    return res.status(200).json({ status: 'updated', targetWebhookUrl });
  }
  return res.status(400).json({ error: 'Missing targetWebhookUrl parameter' });
});

/**
 * Simulator Trigger
 * Accepts a simplified payload and transforms it into a Meta-compliant webhook,
 * then dispatches it to the configured local target (e.g., your Next.js app).
 */
simulatorRouter.post('/simulator/trigger', async (req: Request, res: Response) => {
  const { type, message, from, button_payload } = req.body;
  const senderNumber = from || '919876543210';
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // 1. Construct the Meta-compliant payload structure
  const metaPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1234567890_mock_account',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '911234567890',
                phone_number_id: 'mock_phone_id',
              },
              contacts: [
                {
                  profile: { name: 'Local Tester' },
                  wa_id: senderNumber,
                },
              ],
              messages: [
                {
                  from: senderNumber,
                  id: `wamid.mock_${Date.now()}`,
                  timestamp: timestamp,
                  type: type,
                  ...(type === 'text' && { text: { body: message } }),
                  ...(type === 'interactive' && {
                    interactive: {
                      type: 'button_reply',
                      button_reply: {
                        id: button_payload?.id || 'mock_button_id',
                        title: button_payload?.title || 'Mock Button',
                      },
                    },
                  }),
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };

  // 2. Dispatch to the target webhook URL
  try {
    const response = await fetch(RUNTIME_CONFIG.TARGET_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metaPayload),
    });

    if (response.ok) {
      return res.status(200).json({ status: 'success', dispatched_payload: metaPayload });
    } else {
      return res.status(502).json({ error: `Target server responded with status: ${response.status}`, status: response.status });
    }
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to reach target webhook URL', message: error?.message || 'Connection refused' });
  }
});
