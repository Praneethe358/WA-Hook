#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
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
        console.log(chalk.hex('#10B981')(`\n● WA-hook is RUNNING on port ${state.port}`));
        console.log(chalk.hex('#6366F1')(`  ➜ Target: `) + chalk.gray(state.targetUrl));
        console.log(chalk.hex('#6366F1')(`  ➜ PID:    `) + chalk.gray(state.pid) + '\n');
      }
    } catch {
      console.log(chalk.yellow('\n⚠ State file exists, but server is not responding.'));
    }
  });

// Command: simulate
program
  .command('simulate')
  .description('Trigger a webhook directly from the terminal')
  .action(async () => {
    const state = readState();
    
    if (!state) {
      console.log(chalk.red('\n✖ WA-hook server is not running.'));
      console.log(chalk.gray('  Run `wa-hook start` in another terminal tab first.\n'));
      return;
    }

    // The Sleek Header
    console.log(chalk.magenta('\n╭──────────────────────────────────────────────────╮'));
    console.log(chalk.magenta('│') + chalk.yellow.bold('               WA-HOOK SIMULATOR                  ') + chalk.magenta('│'));
    console.log(chalk.magenta('╰──────────────────────────────────────────────────╯\n'));

    const response = await prompts([
      {
        type: 'text',
        name: 'from',
        message: chalk.hex('#6366F1')('Sender Phone Number:'),
        initial: '919876543210'
      },
      {
        type: 'select',
        name: 'type',
        message: chalk.hex('#6366F1')('Payload Type:'),
        choices: [
          { title: 'Text Message', value: 'text' },
          { title: 'Button Click (Interactive)', value: 'interactive' }
        ]
      },
      {
        type: (prev: string) => prev === 'text' ? 'text' : null,
        name: 'message',
        message: chalk.hex('#6366F1')('Message Body:'),
        initial: 'Generate GST invoice'
      }
    ]);

    // Handle user cancelling the prompt (Ctrl+C)
    if (!response.from || !response.type) {
      console.log(chalk.yellow('\n⚠ Simulation cancelled.\n'));
      return;
    }

    // Construct payload for the WA-hook engine
    const payload = {
      from: response.from,
      type: response.type,
      ...(response.type === 'text' ? { message: response.message } : { 
        button_payload: { id: 'btn_1', title: 'Confirm Action' } 
      })
    };

    try {
      console.log(chalk.gray('\nDispatching webhook to local engine...'));
      
      const res = await fetch(`http://localhost:${state.port}/simulator/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Professional Success Block
        console.log(chalk.green('\n┌─ SUCCESS ────────────────────────────────────────┐'));
        console.log(chalk.green('│ ✓ Webhook generated                              │'));
        console.log(chalk.green('│ ✓ Payload dispatched                             │'));
        console.log(chalk.green('│ ✓ Target responded with 200 OK                   │'));
        console.log(chalk.green('└──────────────────────────────────────────────────┘\n'));
      } else {
        // Professional Error Block
        const statusText = `Status: ${res.status}`.padEnd(42);
        console.log(chalk.red('\n┌─ FAILED ─────────────────────────────────────────┐'));
        console.log(chalk.red('│ ✖ Dispatch failed. Target server rejected.       │'));
        console.log(chalk.red(`│   ${statusText} │`));
        console.log(chalk.red('└──────────────────────────────────────────────────┘\n'));
      }
    } catch (error) {
      console.log(chalk.red('\n┌─ FATAL ERROR ────────────────────────────────────┐'));
      console.log(chalk.red('│ ✖ Failed to reach the local WA-hook engine.      │'));
      console.log(chalk.red('│   Is the background server running?              │'));
      console.log(chalk.red('└──────────────────────────────────────────────────┘\n'));
    }
  });

program.parse(process.argv);
