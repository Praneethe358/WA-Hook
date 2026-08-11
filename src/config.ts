import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN || 'wa_hook_local_token',
  TARGET_WEBHOOK_URL: process.env.TARGET_WEBHOOK_URL || 'http://localhost:3001/api/webhook',
};
