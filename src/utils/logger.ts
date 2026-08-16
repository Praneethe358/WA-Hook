import figlet from 'figlet';
import chalk from 'chalk';
import ora from 'ora';
import { RUNTIME_CONFIG } from '../config';

export async function displayStartupSequence() {
  console.clear();

  // 1. The ASCII Banner
  console.log(
    chalk.green(
      figlet.textSync('WA - hook', { horizontalLayout: 'full' })
    )
  );
  console.log(chalk.gray('  WhatsApp Cloud API Local Simulator v0.1.0\n'));

  // 2. The Animated Spinner Sequence
  const spinner = ora({
    text: 'Initializing Mock Engine...',
    color: 'cyan',
    spinner: 'dots'
  }).start();

  // Simulate a quick loading sequence for professional feel
  await new Promise(resolve => setTimeout(resolve, 600));
  spinner.text = 'Loading configuration...';
  await new Promise(resolve => setTimeout(resolve, 400));
  spinner.text = 'Mounting webhook endpoints...';
  await new Promise(resolve => setTimeout(resolve, 500));
  
  spinner.succeed(chalk.green('WA-hook is ready!'));
  console.log('\n');

  // 3. The Boxed Status Layout
  const boxWidth = 50;
  const border = chalk.gray('│');
  const topBorder = chalk.gray('╭' + '─'.repeat(boxWidth) + '╮');
  const bottomBorder = chalk.gray('╰' + '─'.repeat(boxWidth) + '╯');
  const divider = chalk.gray('├' + '─'.repeat(boxWidth) + '┤');

  const pad = (str: string, length: number) => {
    // Strip ANSI codes for length calculation
    const visibleLength = str.replace(/\u001b\[\d+m/g, '').length;
    return str + ' '.repeat(Math.max(0, length - visibleLength));
  };

  console.log(topBorder);
  console.log(`${border} ${pad(chalk.bold.white('SERVER STATUS'), boxWidth - 2)} ${border}`);
  console.log(divider);
  console.log(`${border} ${pad(`${chalk.cyan('Local Port')}   : ${RUNTIME_CONFIG.PORT}`, boxWidth - 2)} ${border}`);
  console.log(`${border} ${pad(`${chalk.cyan('Target URL')}   : ${RUNTIME_CONFIG.TARGET_WEBHOOK_URL}`, boxWidth - 2)} ${border}`);
  console.log(`${border} ${pad(`${chalk.cyan('Dashboard')}    : http://localhost:${RUNTIME_CONFIG.PORT}`, boxWidth - 2)} ${border}`);
  console.log(bottomBorder);
  console.log('\n');
}
