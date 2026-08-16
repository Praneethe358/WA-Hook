#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { RUNTIME_CONFIG } from '../config';
import { startServer } from '../index';
import { readState } from '../utils/state';

const program = new Command();

program
  .name('wa-hook')
  .description('WhatsApp Cloud API Local Simulator')
  .version('0.1.0');

// Command: start
program
  .command('start')
  .description('Boot the WA-hook server and dashboard')
  .option('-p, --port <number>', 'Port to run on', '3000')
  .option('-t, --target <url>', 'Target webhook endpoint URL', 'http://localhost:3001/api/webhook')
  .action((options) => {
    RUNTIME_CONFIG.PORT = parseInt(options.port, 10);
    RUNTIME_CONFIG.TARGET_WEBHOOK_URL = options.target;
    startServer();
  });

// Command: status
program
  .command('status')
  .description('Check if WA-hook is running')
  .action(async () => {
    const state = readState();
    
    if (!state) {
      console.log(chalk.red('\n✖ WA-hook is not currently running.'));
      console.log(chalk.gray('  Run `wa-hook start` to boot the server.\n'));
      return;
    }

    try {
      // Ping the server to verify it's actually alive
      const res = await fetch(`http://localhost:${state.port}/health`);
      if (res.ok) {
        console.log(chalk.green(`\n● WA-hook is RUNNING on port ${state.port}`));
        console.log(chalk.cyan(`  Target: ${state.targetUrl}`));
        console.log(chalk.cyan(`  PID:    ${state.pid}\n`));
      }
    } catch {
      console.log(chalk.yellow('\n⚠ State file exists, but server is not responding.'));
    }
  });

program.parse(process.argv);
