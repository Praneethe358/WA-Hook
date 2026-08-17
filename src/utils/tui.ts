import chalk from 'chalk';
import { RUNTIME_CONFIG } from '../config';

// ══════════════════════════════════════════════════════════════════════
// WA-Hook TUI v2 — Zero-framework, raw ANSI rendering engine.
//
// Every frame is computed as a single string and flushed to stdout
// in one atomic write() call. This makes partial redraws and screen
// tearing physically impossible. No blessed, no ink, no framework.
// ══════════════════════════════════════════════════════════════════════

// ── Box-drawing characters ──
const TL = '┌', TR = '┐', BL = '└', BR = '┘';
const H = '─', V = '│';

// ── ANSI helpers ──
const ESC = '\x1b';
const ALT_ON = `${ESC}[?1049h`;
const ALT_OFF = `${ESC}[?1049l`;
const HIDE_CUR = `${ESC}[?25l`;
const SHOW_CUR = `${ESC}[?25h`;
const HOME = `${ESC}[H`;
const CLEAR = `${ESC}[2J`;
const BG_BLACK = `${ESC}[40m`;       // Force black background
const FG_RESET = `${ESC}[0m`;

// ── Vibrant Dark Theme — optimized for dark terminal backgrounds ──
const theme = {
  // Borders & structure — bright cyan so they POP on dark bg
  border: chalk.hex('#00CED1'),          // Dark turquoise borders
  borderFocus: chalk.hex('#00FFFF'),     // Bright cyan on focus
  label: chalk.hex('#FF69B4').bold,      // Hot pink labels

  // Text hierarchy
  text: chalk.whiteBright,               // Pure bright white
  bright: chalk.whiteBright.bold,
  muted: chalk.hex('#B0B0B0'),           // Light gray
  dim: chalk.hex('#808080'),             // Medium gray

  // Accents — fully saturated
  green: chalk.hex('#00FF88'),           // Neon green
  red: chalk.hex('#FF4757'),             // Bright red
  cyan: chalk.hex('#00FFFF'),            // Bright cyan
  yellow: chalk.hex('#FFD700'),          // Gold
  purple: chalk.hex('#BF40FF'),          // Electric purple
  magenta: chalk.hex('#FF69B4'),         // Hot pink

  // Interactive states
  highlight: chalk.bgHex('#BF40FF').whiteBright.bold,  // Focused field
  editHighlight: chalk.bgHex('#0066FF').whiteBright.bold, // Editing field
  btnNormal: chalk.bgHex('#BF40FF').whiteBright.bold,  // Button default
  btnFocus: chalk.bgHex('#0066FF').whiteBright.bold,    // Button focused

  // Header
  headerBg: chalk.hex('#B0B0B0'),
  headerAccent: chalk.hex('#00FFFF').bold,

  // Status indicators
  success: chalk.hex('#00FF88').bold,     // Neon green
  error: chalk.hex('#FF4757').bold,       // Bright red
  warning: chalk.hex('#FFD700').bold,     // Gold
  info: chalk.hex('#00BFFF').bold,        // Deep sky blue
};

// ── Utility functions ──
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function pad(str: string, width: number): string {
  const visible = stripAnsi(str);
  if (visible.length >= width) return str.substring(0, width);
  return str + ' '.repeat(width - visible.length);
}

function padBg(str: string, width: number): string {
  // Pad with black background spaces
  const visible = stripAnsi(str);
  if (visible.length >= width) return str;
  return str + chalk.bgBlack(' '.repeat(width - visible.length));
}

// ── Draw a bordered box ──
function drawBox(
  width: number,
  height: number,
  label: string,
  contentLines: string[],
  focused: boolean = false
): string[] {
  const inner = width - 2;
  const lines: string[] = [];
  const b = focused ? theme.borderFocus : theme.border;

  // Top border with label
  const labelStr = label ? ` ${label} ` : '';
  const labelStyled = focused ? theme.label(labelStr) : theme.label(labelStr);
  const topFill = inner - stripAnsi(labelStr).length;
  lines.push(
    b(TL) + b(H) + labelStyled +
    b(H.repeat(Math.max(0, topFill - 1))) + b(TR)
  );

  // Content rows — each gets a black background fill
  for (let i = 0; i < height - 2; i++) {
    const content = contentLines[i] || '';
    lines.push(
      b(V) + padBg(content, inner) + b(V)
    );
  }

  // Bottom border
  lines.push(b(BL) + b(H.repeat(inner)) + b(BR));
  return lines;
}

// ══════════════════════════════════════════════════════════════════════
// MAIN TUI
// ══════════════════════════════════════════════════════════════════════

interface Field {
  label: string;
  value: string;
  onSave?: (val: string) => void;
}

export async function startTUI() {
  // ── Intercept console output from Express routes ──
  const pendingLogs: string[] = [];
  const origLog = console.log.bind(console);
  const origWarn = console.warn.bind(console);
  const origErr = console.error.bind(console);
  console.log = (...a: any[]) => pendingLogs.push(a.map(String).join(' '));
  console.warn = (...a: any[]) => pendingLogs.push('[W] ' + a.map(String).join(' '));
  console.error = (...a: any[]) => pendingLogs.push('[E] ' + a.map(String).join(' '));

  // ── State ──
  const fields: Field[] = [
    {
      label: 'Target URL',
      value: RUNTIME_CONFIG.TARGET_WEBHOOK_URL,
      onSave: (val: string) => { RUNTIME_CONFIG.TARGET_WEBHOOK_URL = val; }
    },
    { label: 'Phone Number', value: '919876543210' },
    { label: 'Payload Type', value: 'text' },
    { label: 'Message Body', value: 'Generate GST invoice' },
  ];
  const TOTAL_FOCUSABLES = fields.length + 1; // fields + button
  const BTN_IDX = fields.length;

  let focusIdx = 0;
  let isEditing = false;
  let editBuffer = '';
  let dispatched = 0;
  let failed = 0;
  let statusLine = theme.muted('Ready to dispatch webhook.');
  let statusIcon = theme.dim('●');
  const logLines: string[] = [theme.dim('  Waiting for actions...')];

  // ── Terminal setup ──
  const cols = () => process.stdout.columns || 80;
  const rows = () => process.stdout.rows || 24;

  process.stdout.write(ALT_ON + HIDE_CUR + CLEAR + BG_BLACK);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  // ── Clean exit ──
  const cleanup = () => {
    console.log = origLog;
    console.warn = origWarn;
    console.error = origErr;
    process.stdout.write(FG_RESET + SHOW_CUR + ALT_OFF);
    if (process.stdin.isTTY) {
      try { process.stdin.setRawMode(false); } catch {}
    }
    process.stdin.pause();
  };

  const exit = () => { cleanup(); process.exit(0); };
  process.on('SIGINT', exit);
  process.on('SIGTERM', exit);

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════
  function render() {
    const W = cols();
    const H_TOTAL = rows();
    const leftW = Math.floor(W * 0.67);
    const rightW = W - leftW;

    const output: string[] = [];

    // ── Row 0: Header bar ──
    const headerLeft = theme.headerAccent(' WA-HOOK ') + theme.headerBg(' Fleet Overview');
    const version = theme.dim(' v0.1.0 ');
    output.push(padBg(headerLeft + version, W));

    // ── Rows 1-6: Top panels (Status / Stats / Remote) ──
    const col1W = Math.floor(W / 3);
    const col2W = Math.floor(W / 3);
    const col3W = W - col1W - col2W;

    const targetUrlShort = RUNTIME_CONFIG.TARGET_WEBHOOK_URL.substring(0, col1W - 12);
    const statusContent = [
      '',
      `  ${theme.success('●')} ${theme.success('Running')}`,
      `  ${theme.dim('Port')}    ${theme.text(RUNTIME_CONFIG.PORT.toString())}`,
      `  ${theme.dim('Target')}  ${theme.cyan(targetUrlShort)}`,
    ];
    const statsContent = [
      '',
      `  ${theme.green(dispatched.toString())} ${theme.text('Dispatched')}`,
      `  ${theme.red(failed.toString())} ${theme.text('Failed')}`,
      `  ${theme.dim('1 Contributor')}`,
    ];
    const remoteContent = [
      '',
      `  ${theme.dim('origin')}  ${theme.green('↑' + dispatched)}  ${theme.red('↓' + failed)}`,
      '',
      `  ${theme.dim('branch')}  ${theme.magenta('feat/issue-7')}`,
    ];

    const statusBox = drawBox(col1W, 6, 'STATUS', statusContent);
    const statsBox = drawBox(col2W, 6, 'DISPATCHES', statsContent);
    const remoteBox = drawBox(col3W, 6, 'REMOTE', remoteContent);

    for (let i = 0; i < 6; i++) {
      output.push(
        (statusBox[i] || ' '.repeat(col1W)) +
        (statsBox[i] || ' '.repeat(col2W)) +
        (remoteBox[i] || ' '.repeat(col3W))
      );
    }

    // ── Rows 7+: Simulator (left) + Logs (right) ──
    const simH = H_TOTAL - 8;
    const logH = simH;
    const simContent: string[] = [];

    // Editable fields
    for (let fi = 0; fi < fields.length; fi++) {
      const f = fields[fi];
      const labelText = `  ${theme.dim(f.label.padEnd(14))}`;
      let valStr: string;

      if (isEditing && focusIdx === fi) {
        valStr = theme.editHighlight(` ${editBuffer}_ `);
      } else if (!isEditing && focusIdx === fi) {
        valStr = theme.highlight(` ${f.value} `);
      } else {
        valStr = theme.text(` ${f.value}`);
      }

      simContent.push(labelText + valStr);
      if (fi < fields.length - 1) simContent.push(''); // spacer between fields
    }
    simContent.push(''); // spacer before status box

    // Embedded status/error box
    const errBoxLines = drawBox(leftW - 6, 5, 'DISPATCH STATUS', [
      ` ${statusIcon} ${statusLine}`,
      '',
      '',
    ]);
    for (const el of errBoxLines) {
      simContent.push('  ' + el);
    }

    // Fill remaining space
    while (simContent.length < simH - 4) {
      simContent.push('');
    }

    // Button at bottom
    const btnText = '  ▶ PUSH WEBHOOK  ';
    const btnStr = focusIdx === BTN_IDX
      ? theme.btnFocus(` ${btnText} `)
      : theme.btnNormal(` ${btnText} `);
    simContent.push('');
    simContent.push(`  ${btnStr}`);
    simContent.push('');

    const simBox = drawBox(leftW, simH, 'STAGED / SIMULATOR', simContent, focusIdx < BTN_IDX);

    // Log panel
    const visibleLogs = logLines.slice(-(logH - 2));
    const logContent: string[] = [];
    for (const l of visibleLogs) {
      logContent.push(' ' + l);
    }
    const logBoxLines = drawBox(rightW, logH, 'ACTIVITY LOG', logContent);

    for (let i = 0; i < simH; i++) {
      output.push(
        (simBox[i] || ' '.repeat(leftW)) +
        (logBoxLines[i] || ' '.repeat(rightW))
      );
    }

    // ── Footer ──
    const footerContent =
      theme.dim(' ') +
      chalk.bgHex('#00CED1').black.bold(' q ') + theme.muted(' Quit  ') +
      chalk.bgHex('#00CED1').black.bold(' Tab ') + theme.muted(' Next  ') +
      chalk.bgHex('#00CED1').black.bold(' ↑↓ ') + theme.muted(' Move  ') +
      chalk.bgHex('#00CED1').black.bold(' Enter ') + theme.muted(' Edit / Push  ') +
      chalk.bgHex('#00CED1').black.bold(' Esc ') + theme.muted(' Cancel');
    output.push(padBg(footerContent, W));

    // ── Atomic flush ──
    process.stdout.write(HOME + BG_BLACK + output.join('\n'));
  }

  // ══════════════════════════════════════════════════════════════════
  // DISPATCH
  // ══════════════════════════════════════════════════════════════════
  async function triggerDispatch() {
    const time = new Date().toLocaleTimeString();
    logLines.push(`  ${theme.cyan(`[${time}]`)} ${theme.text('Dispatching...')}`);
    statusLine = theme.yellow('Sending request...');
    statusIcon = theme.warning('◌');
    render();

    const payload = {
      from: fields[1].value,
      type: fields[2].value,
      ...(fields[2].value === 'text'
        ? { message: fields[3].value }
        : { button_payload: { id: 'btn_1', title: 'Action' } })
    };

    try {
      const res = await fetch(
        `http://localhost:${RUNTIME_CONFIG.PORT}/simulator/trigger`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        dispatched++;
        logLines.push(`  ${theme.success('✓')} ${theme.text('200 OK')} ${theme.dim('— payload accepted')}`);
        statusLine = theme.success('SUCCESS — Target server accepted webhook payload.');
        statusIcon = theme.success('●');
      } else {
        failed++;
        logLines.push(`  ${theme.error('✗')} ${theme.text(`${res.status}`)} ${theme.dim('— rejected')}`);
        statusLine = theme.error(`FAILED (${res.status}) — ${data.error || 'Rejected'}`);
        statusIcon = theme.error('●');
      }
    } catch {
      failed++;
      logLines.push(`  ${theme.error('✗')} ${theme.dim('Connection refused')}`);
      statusLine = theme.error('ECONNREFUSED — Is your backend running?');
      statusIcon = theme.error('●');
    }

    render();
  }

  // ══════════════════════════════════════════════════════════════════
  // KEYBOARD INPUT
  // ══════════════════════════════════════════════════════════════════
  process.stdin.on('data', (data: string) => {
    for (let i = 0; i < data.length; i++) {
      const ch = data[i];
      const code = ch.charCodeAt(0);

      // ── Escape sequences (arrows) ──
      if (ch === '\x1b' && data[i + 1] === '[') {
        const seq = data[i + 2];
        if (seq === 'B') { // Down
          if (!isEditing) { focusIdx = (focusIdx + 1) % TOTAL_FOCUSABLES; render(); }
          i += 2; continue;
        }
        if (seq === 'A') { // Up
          if (!isEditing) { focusIdx = (focusIdx + TOTAL_FOCUSABLES - 1) % TOTAL_FOCUSABLES; render(); }
          i += 2; continue;
        }
        i += 2; continue;
      }

      // ── EDITING MODE ──
      if (isEditing) {
        if (ch === '\r' || ch === '\n') {
          fields[focusIdx].value = editBuffer;
          if (fields[focusIdx].onSave) {
            fields[focusIdx].onSave!(editBuffer);
          }
          isEditing = false;
          focusIdx = (focusIdx + 1) % TOTAL_FOCUSABLES;
          render();
          continue;
        }
        if (code === 27) { isEditing = false; render(); continue; }
        if (code === 127 || code === 8) { editBuffer = editBuffer.slice(0, -1); render(); continue; }
        if (code >= 32 && code < 127) { editBuffer += ch; render(); continue; }
        continue;
      }

      // ── NAVIGATION MODE ──
      if (ch === '\t') { focusIdx = (focusIdx + 1) % TOTAL_FOCUSABLES; render(); continue; }
      if (ch === '\r' || ch === '\n') {
        if (focusIdx === BTN_IDX) {
          triggerDispatch();
        } else {
          isEditing = true;
          editBuffer = fields[focusIdx].value;
          render();
        }
        continue;
      }
      if (ch === 'q' || code === 3) { exit(); return; }
    }
  });

  // ── Drain Express logs ──
  setInterval(() => {
    if (pendingLogs.length > 0) {
      const logs = pendingLogs.splice(0, pendingLogs.length);
      for (const msg of logs) {
        logLines.push(`  ${theme.dim(stripAnsi(msg))}`);
      }
      render();
    }
  }, 500);

  // ── Handle resize ──
  process.stdout.on('resize', () => { process.stdout.write(CLEAR); render(); });

  // ── Initial render ──
  render();
}
