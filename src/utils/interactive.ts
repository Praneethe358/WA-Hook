import prompts from 'prompts';
import chalk from 'chalk';
import { RUNTIME_CONFIG } from '../config';

const brandPurple = chalk.hex('#8B5CF6');
const brandGreen = chalk.hex('#10B981');
const borderCol = chalk.hex('#3F3F46');

export async function startInteractiveMenu() {
  console.log('\n' + borderCol('╭──────────── ') + chalk.white('INTERACTIVE CONSOLE') + borderCol(' ────────────╮'));
  
  while (true) {
    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: brandPurple('What would you like to do?'),
      choices: [
        { title: '🚀 Simulate Webhook', value: 'simulate' },
        { title: '🧹 Clear Screen', value: 'clear' },
        { title: '🚪 Exit WA-hook', value: 'exit' }
      ]
    });

    if (action === 'exit' || !action) {
      console.log(chalk.gray('\nShutting down WA-hook...'));
      process.exit(0);
    }

    if (action === 'clear') {
      console.clear();
      console.log(borderCol('╭──────────── ') + chalk.white('INTERACTIVE CONSOLE') + borderCol(' ────────────╮'));
      continue;
    }

    if (action === 'simulate') {
      await runSimulationPrompt();
    }
  }
}

async function runSimulationPrompt() {
  const response = await prompts([
    {
      type: 'text',
      name: 'from',
      message: brandPurple('Sender Phone Number:'),
      initial: '919876543210'
    },
    {
      type: 'select',
      name: 'type',
      message: brandPurple('Payload Type:'),
      choices: [
        { title: 'Text Message', value: 'text' },
        { title: 'Button Click (Interactive)', value: 'interactive' }
      ]
    },
    {
      type: (prev: string) => prev === 'text' ? 'text' : null,
      name: 'message',
      message: brandPurple('Message Body:'),
      initial: 'Generate GST invoice'
    }
  ]);

  if (!response.from || !response.type) {
    console.log(chalk.yellow('\n⚠ Simulation cancelled.\n'));
    return;
  }

  const payload = {
    from: response.from,
    type: response.type,
    ...(response.type === 'text' ? { message: response.message } : { 
      button_payload: { id: 'btn_1', title: 'Confirm Action' } 
    })
  };

  try {
    console.log(chalk.gray('\nDispatching webhook to target...'));
    
    const res = await fetch(`http://localhost:${RUNTIME_CONFIG.PORT}/simulator/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log(brandGreen('\n┌─ SUCCESS ────────────────────────────────────────┐'));
      console.log(brandGreen('│ ✓ Webhook generated                              │'));
      console.log(brandGreen('│ ✓ Payload dispatched                             │'));
      console.log(brandGreen('│ ✓ Target responded with 200 OK                   │'));
      console.log(brandGreen('└──────────────────────────────────────────────────┘\n'));
    } else {
      const statusText = `Status: ${res.status}`.padEnd(42);
      console.log(chalk.red('\n┌─ FAILED ─────────────────────────────────────────┐'));
      console.log(chalk.red('│ ✖ Dispatch failed. Target server rejected.       │'));
      console.log(chalk.red(`│   ${statusText} │`));
      console.log(chalk.red('└──────────────────────────────────────────────────┘\n'));
    }
  } catch (error) {
    console.log(chalk.red('\n┌─ FATAL ERROR ────────────────────────────────────┐'));
    console.log(chalk.red('│ ✖ Failed to reach the local WA-hook engine.      │'));
    console.log(chalk.red('│   Is the server fully booted?                    │'));
    console.log(chalk.red('└──────────────────────────────────────────────────┘\n'));
  }
}
