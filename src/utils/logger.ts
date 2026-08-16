import figlet from 'figlet';
import chalk from 'chalk';
import ora from 'ora';
import gradient from 'gradient-string';
import { RUNTIME_CONFIG } from '../config';

// Helper to calculate true string length by ignoring invisible Chalk color codes
const stripAnsi = (str: string) => str.replace(/\x1B\[[0-9;]*m/g, '');

export async function displayStartupSequence() {
  console.clear();

  const brandPurple = chalk.hex('#8B5CF6');
  const brandGreen = chalk.hex('#10B981');

  // 1. The ASCII Banner with solid brand color
  const bannerText = figlet.textSync('WA-Hook', { font: 'Slant' });
  console.log(brandPurple(bannerText));
  
  console.log(
    chalk.gray('  WhatsApp Cloud API Local Simulator ') + 
    brandGreen('v0.1.0\n')
  );
  console.log(brandGreen('✓ WA-hook is ready for incoming requests!\n'));

  // 2. Define the Box Content
  const title = 'LOCAL SIMULATOR STATUS';
  const lines = [
    `${brandPurple('→')} ${chalk.bold.white('Local Port')} : ${chalk.white(RUNTIME_CONFIG.PORT)}`,
    `${brandPurple('→')} ${chalk.bold.white('Target URL')} : ${chalk.gray(RUNTIME_CONFIG.TARGET_WEBHOOK_URL)}`,
    `${brandPurple('→')} ${chalk.bold.white('Dashboard')}  : ${brandPurple.underline(`http://localhost:${RUNTIME_CONFIG.PORT}`)}`
  ];

  // 3. Dynamically Calculate the Perfect Box Width
  const visibleLengths = lines.map(line => stripAnsi(line).length);
  const maxContentLength = Math.max(stripAnsi(title).length, ...visibleLengths);
  const boxWidth = maxContentLength + 4; // Add 2 spaces padding on each side

  // 4. Box Drawing Characters (Subtle gray borders)
  const borderCol = chalk.hex('#3F3F46'); // zinc-700
  const topBorder = borderCol('╭' + '─'.repeat(boxWidth) + '╮');
  const divider = borderCol('├' + '─'.repeat(boxWidth) + '┤');
  const bottomBorder = borderCol('╰' + '─'.repeat(boxWidth) + '╯');

  const padLine = (str: string, visibleLen: number) => {
    const padding = boxWidth - visibleLen - 2; // -2 for the left space and right space
    return ` ${str}${' '.repeat(padding)} `;
  };

  // 5. Render the Flawless Box
  console.log(topBorder);
  console.log(borderCol('│') + padLine(chalk.white.bold(title), stripAnsi(title).length) + borderCol('│'));
  console.log(divider);
  lines.forEach((line, idx) => {
    console.log(borderCol('│') + padLine(line, visibleLengths[idx]) + borderCol('│'));
  });
  console.log(bottomBorder);
  
  console.log(chalk.gray('\nListening for webhooks. Press Ctrl+C to stop.\n'));
}
