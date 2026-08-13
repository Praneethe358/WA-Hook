import { Router, Request, Response } from 'express';

export const apiRouter = Router();

/**
 * Outgoing WhatsApp Graph API Mock
 * Intercepts POST calls to send messages and returns standard Meta API response.
 */
apiRouter.post('/:version/:phoneNumberId/messages', (req: Request, res: Response) => {
  const { version, phoneNumberId } = req.params;
  const payload = req.body;

  console.log(`[WA-hook Intercepted API Call] Version: ${version} | Phone ID: ${phoneNumberId}`);
  console.log('[WA-hook Outbound Payload]:', JSON.stringify(payload, null, 2));

  // Simulated Meta success response
  return res.status(200).json({
    messaging_product: 'whatsapp',
    contacts: [
      {
        input: payload.to || '1234567890',
        wa_id: payload.to || '1234567890',
      },
    ],
    messages: [
      {
        id: `wamid.hbgl_${Date.now()}_mock`,
      },
    ],
  });
});
