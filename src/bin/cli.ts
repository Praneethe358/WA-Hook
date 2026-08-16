#!/usr/bin/env node

import { Command } from 'commander';
import { RUNTIME_CONFIG } from '../config';
import { startServer } from '../index';

const program = new Command();

program
  .name('wa-hook')
  .description('Local WhatsApp Cloud API simulator and webhook handler')
  .version('0.1.0')
  .option('-p, --port <number>', 'Port to run the simulator server on', '3000')
  .option('-t, --target <url>', 'Target webhook endpoint URL', 'http://localhost:3001/api/webhook')
  .option('--token <token>', 'Meta webhook verification handshake token', 'wa_hook_local_token')
  .action((options) => {
    // Override defaults with CLI flags
    RUNTIME_CONFIG.PORT = parseInt(options.port, 10);
    RUNTIME_CONFIG.TARGET_WEBHOOK_URL = options.target;
    RUNTIME_CONFIG.WEBHOOK_VERIFY_TOKEN = options.token;

    startServer();
  });

program.parse(process.argv);
