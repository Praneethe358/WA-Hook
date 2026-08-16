import chalk from 'chalk';
import { RUNTIME_CONFIG } from '../config';

// ══════════════════════════════════════════════════════════════════════
// WA-Hook TUI — Zero-framework, raw ANSI rendering engine.
//
// Every frame is computed as a single string and flushed to stdout
// in one atomic write() call. This makes partial redraws and screen
// tearing physically impossible. No blessed, no ink, no framework.
// ══════════════════════════════════════════════════════════════════════

// ── Box-drawing characters ──
const TL = '┌', TR = '┐', BL = '└', BR = '┘';
const H = '─', V = '│', LT = '├', RT = '┤';

// ── ANSI helpers ──
const ESC = '\x1b';
const ALT_ON = `${ESC}[?1049h`;    // Enter alternate screen buffer
const ALT_OFF = `${ESC}[?1049l`;   // Exit alternate screen buffer
const HIDE_CUR = `${ESC}[?25l`;    // Hide cursor
const SHOW_CUR = `${ESC}[?25h`;    // Show cursor
const HOME = `${ESC}[H`;           // Move cursor to top-left
const CLEAR = `${ESC}[2J`;         // Clear entire screen

// ── Theme ──
const c = {
  border: chalk.gray,
  label: chalk.magenta.bold,
  text: chalk.white,
  muted: chalk.gray,
  green: chalk.green,
  red: chalk.red,
  cyan: chalk.cyan,
  yellow: chalk.yellow,
  highlight: chalk.bgMagenta.white,
  editHighlight: chalk.bgBlue.white,
  btnNormal: chalk.bgMagenta.white.bold,
  btnFocus: chalk.bgBlue.white.bold,
};

// ── Utility: pad string to exact visible width ──
function pad(str: string, width: number): string {
  const visible = stripAnsi(str);
  if (visible.length >= width) return str.substring(0, width);
  return str + ' '.repeat(width - visible.length);
}

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// ── Draw a bordered box as an array of lines ──
function drawBox(
  width: number,
  height: number,
  label: string,
  contentLines: string[]
): string[] {
  const inner = width - 2;
  const lines: string[] = [];

  // Top border with label
  const labelStr = label ? ` ${label} ` : '';
  const topFill = inner - stripAnsi(labelStr).length;
  lines.push(
    c.border(TL) +
    c.border(H) +
    c.label(labelStr) +
    c.border(H.repeat(Math.max(0, topFill - 1))) +
    c.border(TR)
  );

  // Content rows
  for (let i = 0; i < height - 2; i++) {
    const content = contentLines[i] || '';
    lines.push(
      c.border(V) + pad(content, inner) + c.border(V)
    );
  }

  // Bottom border
  lines.push(c.border(BL) + c.border(H.repeat(inner)) + c.border(BR));

  return lines;
}

// ══════════════════════════════════════════════════════════════════════
// MAIN TUI
// ══════════════════════════════════════════════════════════════════════

interface Field {
  label: string;
  value: string;
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
    { label: 'Phone Number:', value: '919876543210' },
    { label: 'Payload Type:', value: 'text' },
    { label: 'Message Body:', value: 'Generate GST invoice' },
  ];
  let focusIdx = 0;          // 0-2 = fields, 3 = button
  let isEditing = false;
  let editBuffer = '';
  let dispatched = 0;
  let failed = 0;
  let statusLine = c.muted('Ready to dispatch webhook.');
  const logLines: string[] = [c.muted('Waiting for actions...')];

  // ── Terminal setup ──
  const cols = () => process.stdout.columns || 80;
  const rows = () => process.stdout.rows || 24;

  process.stdout.write(ALT_ON + HIDE_CUR + CLEAR);

  // Enable raw mode for keypress capture
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
    process.stdout.write(SHOW_CUR + ALT_OFF);
    if (process.stdin.isTTY) {
      try { process.stdin.setRawMode(false); } catch {}
    }
    process.stdin.pause();
  };

  const exit = () => {
    cleanup();
    process.exit(0);
  };

  process.on('SIGINT', exit);
  process.on('SIGTERM', exit);

  // ══════════════════════════════════════════════════════════════════
  // RENDER — builds the entire frame and flushes it atomically
  // ══════════════════════════════════════════════════════════════════
  function render() {
    const W = cols();
    const H_TOTAL = rows();
    const leftW = Math.floor(W * 0.67);
    const rightW = W - leftW;

    const output: string[] = [];

    // ── Row 0: Header ──
    output.push(pad(c.text(' ') + chalk.bold('WA-HOOK') + c.text(' Fleet overview'), W));

    // ── Rows 1-6: Status / Stats / Remote (3 columns) ──
    const col1W = Math.floor(W / 3);
    const col2W = Math.floor(W / 3);
    const col3W = W - col1W - col2W;

    const statusContent = [
      '',
      ` ${c.green('*')} ${c.green('Clean')}`,
      ` Port: ${RUNTIME_CONFIG.PORT}`,
      ` Target: ${RUNTIME_CONFIG.TARGET_WEBHOOK_URL.substring(0, col1W - 6)}`,
    ];
    const statsContent = [
      '',
      ` ${chalk.bold(dispatched.toString())} Dispatched`,
      ` ${chalk.bold(failed.toString())} Failed`,
      ` 1 Contributor`,
    ];
    const remoteContent = [
      '',
      ` origin  ${c.green('^' + dispatched)}  ${c.red('v' + failed)}`,
    ];

    const statusBox = drawBox(col1W, 6, 'STATUS', statusContent);
    const statsBox = drawBox(col2W, 6, 'COMMITS (DISPATCHES)', statsContent);
    const remoteBox = drawBox(col3W, 6, 'REMOTE SUMMARY', remoteContent);

    for (let i = 0; i < 6; i++) {
      output.push(
        (statusBox[i] || ' '.repeat(col1W)) +
        (statsBox[i] || ' '.repeat(col2W)) +
        (remoteBox[i] || ' '.repeat(col3W))
      );
    }

    // ── Rows 7+: Simulator (left) + Logs (right) ──
    const simH = H_TOTAL - 8; // -1 header, -6 top row, -1 footer
    const logH = simH;

    // Build simulator content
    const simContent: string[] = [];

    // Fields
    for (let fi = 0; fi < fields.length; fi++) {
      const f = fields[fi];
      const labelPad = pad(c.muted(`  ${f.label}`), 19);
      let valStr: string;

      if (isEditing && focusIdx === fi) {
        valStr = c.editHighlight(` ${editBuffer}_ `);
      } else if (!isEditing && focusIdx === fi) {
        valStr = c.highlight(` ${f.value} `);
      } else {
        valStr = c.text(` ${f.value}`);
      }

      simContent.push(labelPad + valStr);
      simContent.push(''); // spacer line
    }

    // Error/status box (embedded as sub-box)
    const errBoxLines = drawBox(leftW - 6, 5, 'DISPATCH STATUS & ERRORS', [
      ' ' + statusLine,
      '',
      '',
    ]);
    for (const el of errBoxLines) {
      simContent.push('  ' + el);
    }

    // Fill remaining space
    while (simContent.length < simH - 5) {
      simContent.push('');
    }

    // Button
    const btnText = '  PUSH WEBHOOK  ';
    const btnStr = focusIdx === 3
      ? c.btnFocus(` ${btnText} `)
      : c.btnNormal(` ${btnText} `);
    simContent.push('');
    simContent.push(`  ${btnStr}`);
    simContent.push('');

    const simBox = drawBox(leftW, simH, 'STAGED / SIMULATOR', simContent);

    // Build log content
    const visibleLogs = logLines.slice(-(logH - 2));
    const logContent: string[] = [];
    for (const l of visibleLogs) {
      logContent.push(' ' + l);
    }
    const logBoxLines = drawBox(rightW, logH, 'RECENT COMMITS (LOGS)', logContent);

    for (let i = 0; i < simH; i++) {
      output.push(
        (simBox[i] || ' '.repeat(leftW)) +
        (logBoxLines[i] || ' '.repeat(rightW))
      );
    }

    // ── Footer ──
    output.push(
      pad(
        c.muted(' ') +
        c.text('q') + c.muted(' Quit   ') +
        c.text('Tab') + c.muted(' Next   ') +
        c.text('Enter') + c.muted(' Edit / Push'),
        W
      )
    );

    // ── Atomic flush ──
    const frame = HOME + output.join('\n');
    process.stdout.write(frame);
  }

  // ══════════════════════════════════════════════════════════════════
  // DISPATCH
  // ══════════════════════════════════════════════════════════════════
  async function triggerDispatch() {
    const time = new Date().toLocaleTimeString();
    logLines.push(`${c.cyan(`[${time}]`)} Dispatching...`);
    statusLine = c.yellow('Sending request to target URL...');
    render();

    const payload = {
      from: fields[0].value,
      type: fields[1].value,
      ...(fields[1].value === 'text'
        ? { message: fields[2].value }
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
        logLines.push(c.green('* Success: 200 OK'));
        statusLine = c.green('* SUCCESS (200 OK) — Target accepted payload.');
      } else {
        failed++;
        logLines.push(c.red(`x Failed (${res.status})`));
        statusLine = c.red(`x FAILED (${res.status}) — ${data.error || 'Rejected'}`);
      }
    } catch {
      failed++;
      logLines.push(c.red('x Network error'));
      statusLine = c.red('x CONNECTION REFUSED — Is your backend running?');
    }

    render();
  }

  // ══════════════════════════════════════════════════════════════════
  // KEYBOARD INPUT — raw stdin, no framework
  // ══════════════════════════════════════════════════════════════════
  process.stdin.on('data', (data: string) => {
    for (let i = 0; i < data.length; i++) {
      const ch = data[i];
      const code = ch.charCodeAt(0);

      // ── Check for escape sequences (arrow keys, etc.) ──
      if (ch === '\x1b' && data[i + 1] === '[') {
        const seq = data[i + 2];
        if (seq === 'B') { // Down arrow
          if (!isEditing) { focusIdx = (focusIdx + 1) % 4; render(); }
          i += 2;
          continue;
        }
        if (seq === 'A') { // Up arrow
          if (!isEditing) { focusIdx = (focusIdx + 3) % 4; render(); }
          i += 2;
          continue;
        }
        i += 2;
        continue;
      }

      // ── EDITING MODE ──
      if (isEditing) {
        if (ch === '\r' || ch === '\n') {
          // Save and exit edit mode
          fields[focusIdx].value = editBuffer;
          isEditing = false;
          focusIdx = (focusIdx + 1) % 4;
          render();
          continue;
        }
        if (code === 27) { // Escape
          isEditing = false;
          render();
          continue;
        }
        if (code === 127 || code === 8) { // Backspace
          editBuffer = editBuffer.slice(0, -1);
          render();
          continue;
        }
        if (code >= 32 && code < 127) { // Printable ASCII
          editBuffer += ch;
          render();
          continue;
        }
        continue;
      }

      // ── NAVIGATION MODE ──
      if (ch === '\t') { // Tab
        focusIdx = (focusIdx + 1) % 4;
        render();
        continue;
      }
      if (ch === '\r' || ch === '\n') { // Enter
        if (focusIdx === 3) {
          triggerDispatch();
        } else {
          isEditing = true;
          editBuffer = fields[focusIdx].value;
          render();
        }
        continue;
      }
      if (ch === 'q' || code === 3) { // q or Ctrl+C
        exit();
        return;
      }
    }
  });

  // ── Drain Express logs periodically ──
  setInterval(() => {
    if (pendingLogs.length > 0) {
      const logs = pendingLogs.splice(0, pendingLogs.length);
      for (const msg of logs) {
        logLines.push(c.muted(stripAnsi(msg)));
      }
      render();
    }
  }, 500);

  // ── Handle terminal resize ──
  process.stdout.on('resize', () => {
    process.stdout.write(CLEAR);
    render();
  });

  // ── Initial render ──
  render();
}
