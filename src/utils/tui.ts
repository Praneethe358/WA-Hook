import blessed from 'blessed';
import { RUNTIME_CONFIG } from '../config';

export async function startTUI() {
  const screen = blessed.screen({
    smartCSR: false,
    fastCSR: true,
    dockBorders: false,
    title: 'WA-Hook Fleet Overview',
    fullUnicode: true,
    warnings: false,
    style: {
      bg: 'black',
      fg: 'white'
    }
  });

  // Clean teardown on exit
  const destroyScreen = () => {
    try {
      screen.destroy();
    } catch {}
  };
  process.on('SIGINT', destroyScreen);
  process.on('SIGTERM', destroyScreen);
  process.on('exit', destroyScreen);

  // Global uncaught error shield: Prevents process crash and terminal reset
  process.on('uncaughtException', () => {
    // Ignore internal blessed mouse/key syntax warnings
  });

  // Theme Colors
  const bgCol = 'black';
  const borderCol = 'gray';
  const labelCol = 'magenta';
  const textCol = 'white';
  const mutedCol = 'light-gray';

  // 1. Header Bar
  const header = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: ' {bold}WA-HOOK{/bold} Fleet overview',
    tags: true,
    style: { fg: textCol, bg: 'black' }
  });

  // 2. Status Row (Left)
  const statusBox = blessed.box({
    top: 1,
    left: 0,
    width: '33%',
    height: 6,
    label: ' STATUS ',
    content: `\n {green-fg}✓ Clean{/green-fg}\n Port: ${RUNTIME_CONFIG.PORT}\n Target: ${RUNTIME_CONFIG.TARGET_WEBHOOK_URL}`,
    tags: true,
    border: { type: 'line' },
    style: {
      fg: textCol,
      bg: bgCol,
      border: { fg: borderCol, bg: bgCol },
      label: { fg: labelCol, bg: bgCol, bold: true }
    }
  });

  // 3. Stats Row (Center)
  const statsBox = blessed.box({
    top: 1,
    left: '33%',
    width: '34%',
    height: 6,
    label: ' COMMITS (DISPATCHES) ',
    content: `\n {bold}0{/bold} Dispatched\n {bold}0{/bold} Failed\n 1 Contributor`,
    tags: true,
    border: { type: 'line' },
    style: {
      fg: textCol,
      bg: bgCol,
      border: { fg: borderCol, bg: bgCol },
      label: { fg: labelCol, bg: bgCol, bold: true }
    }
  });

  // 4. Remote Box (Right)
  const remoteBox = blessed.box({
    top: 1,
    left: '67%',
    width: '33%',
    height: 6,
    label: ' REMOTE SUMMARY ',
    content: `\n origin  {green-fg}↑ 0{/green-fg}  {red-fg}↓ 0{/red-fg}`,
    tags: true,
    border: { type: 'line' },
    style: {
      fg: textCol,
      bg: bgCol,
      border: { fg: borderCol, bg: bgCol },
      label: { fg: labelCol, bg: bgCol, bold: true }
    }
  });

  // 5. Main Simulator Area
  const form = blessed.form({
    top: 7,
    left: 0,
    width: '67%',
    height: '100%-8',
    label: ' STAGED / SIMULATOR ',
    border: { type: 'line' },
    style: {
      fg: textCol,
      bg: bgCol,
      border: { fg: borderCol, bg: bgCol },
      label: { fg: labelCol, bg: bgCol, bold: true }
    }
  });

  blessed.text({
    parent: form,
    top: 1,
    left: 2,
    content: 'Phone Number:',
    style: { fg: mutedCol, bg: bgCol }
  });

  const phoneInput = blessed.textbox({
    parent: form,
    top: 1,
    left: 20,
    width: 30,
    height: 1,
    value: '919876543210',
    style: {
      fg: textCol,
      bg: 'black',
      focus: { bg: 'magenta', fg: 'white' }
    }
  });

  blessed.text({
    parent: form,
    top: 3,
    left: 2,
    content: 'Payload Type:',
    style: { fg: mutedCol, bg: bgCol }
  });

  const typeInput = blessed.textbox({
    parent: form,
    top: 3,
    left: 20,
    width: 30,
    height: 1,
    value: 'text',
    style: {
      fg: textCol,
      bg: 'black',
      focus: { bg: 'magenta', fg: 'white' }
    }
  });

  blessed.text({
    parent: form,
    top: 5,
    left: 2,
    content: 'Message Body:',
    style: { fg: mutedCol, bg: bgCol }
  });

  const messageInput = blessed.textbox({
    parent: form,
    top: 5,
    left: 20,
    width: 45,
    height: 1,
    value: 'Generate GST invoice',
    style: {
      fg: textCol,
      bg: 'black',
      focus: { bg: 'magenta', fg: 'white' }
    }
  });

  // Dedicated Error / Status Box in bottom left of simulator
  const errorBox = blessed.box({
    parent: form,
    top: 7,
    left: 2,
    width: '94%',
    height: 5,
    label: ' DISPATCH STATUS & ERRORS ',
    content: '{gray-fg}Ready to dispatch webhook.{/gray-fg}',
    tags: true,
    border: { type: 'line' },
    style: {
      fg: textCol,
      bg: bgCol,
      border: { fg: borderCol, bg: bgCol },
      label: { fg: labelCol, bg: bgCol, bold: true }
    }
  });

  const submitBtn = blessed.box({
    parent: form,
    bottom: 1,
    left: 2,
    width: 24,
    height: 3,
    content: ' PUSH WEBHOOK ',
    align: 'center',
    valign: 'middle',
    border: { type: 'line' },
    style: {
      fg: 'white',
      bg: 'magenta',
      border: { fg: 'white', bg: bgCol },
      focus: { bg: 'blue', border: { fg: 'white', bg: bgCol } }
    }
  });

  // 6. Right Area - Logs
  const logBox = blessed.log({
    top: 7,
    left: '67%',
    width: '33%',
    height: '100%-8',
    label: ' RECENT COMMITS (LOGS) ',
    tags: true,
    scrollback: 100,
    border: { type: 'line' },
    style: {
      fg: textCol,
      bg: bgCol,
      border: { fg: borderCol, bg: bgCol },
      label: { fg: labelCol, bg: bgCol, bold: true }
    }
  });

  // 7. Footer
  const footer = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: ' {white-fg}q{/white-fg} Quit   {white-fg}Tab / ↓{/white-fg} Next Field   {white-fg}Enter{/white-fg} Edit / Push Webhook',
    tags: true,
    style: { fg: mutedCol, bg: 'black' }
  });

  screen.append(header);
  screen.append(statusBox);
  screen.append(statsBox);
  screen.append(remoteBox);
  screen.append(form);
  screen.append(logBox);
  screen.append(footer);

  logBox.log('{gray-fg}Waiting for actions...{/gray-fg}');

  let dispatched = 0;
  let failed = 0;

  const triggerDispatch = async () => {
    const from = phoneInput.getValue();
    const type = typeInput.getValue();
    const message = messageInput.getValue();

    const time = new Date().toLocaleTimeString();
    logBox.log(`{cyan-fg}[${time}]{/cyan-fg} Dispatching ${type}...`);
    errorBox.setContent('{yellow-fg}⏳ Sending request to target URL...{/yellow-fg}');
    screen.render();

    const payload = {
      from,
      type,
      ...(type === 'text' ? { message } : { button_payload: { id: 'btn_1', title: 'Action' } })
    };

    try {
      const res = await fetch(`http://localhost:${RUNTIME_CONFIG.PORT}/simulator/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        dispatched++;
        logBox.log(`{green-fg}✓ Success: 200 OK{/green-fg}`);
        errorBox.setContent(`{green-fg}✓ SUCCESS (200 OK){/green-fg}\nTarget server accepted webhook payload.`);
      } else {
        failed++;
        logBox.log(`{red-fg}✖ Failed (${res.status}){/red-fg}`);
        errorBox.setContent(`{red-fg}✖ DISPATCH FAILED (Status ${res.status}){/red-fg}\n${data.error || 'Target rejected request'}`);
      }
    } catch (e: any) {
      failed++;
      logBox.log(`{red-fg}✖ Error: Network failed{/red-fg}`);
      errorBox.setContent(`{red-fg}✖ CONNECTION REFUSED (ECONNREFUSED){/red-fg}\nTarget: ${RUNTIME_CONFIG.TARGET_WEBHOOK_URL}\nCheck if your backend server is running!`);
    }

    statsBox.setContent(`\n {bold}${dispatched}{/bold} Dispatched\n {bold}${failed}{/bold} Failed\n 1 Contributor`);
    remoteBox.setContent(`\n origin  {green-fg}↑ ${dispatched}{/green-fg}  {red-fg}↓ ${failed}{/red-fg}`);
    screen.render();
  };

  // Focusables management
  const focusables = [phoneInput, typeInput, messageInput, submitBtn];
  let currIdx = 0;
  let isEditing = false;

  const focusItem = (idx: number) => {
    if (isEditing) return; // Don't interrupt active typing session
    currIdx = (idx + focusables.length) % focusables.length;
    focusables[currIdx].focus();
    screen.render();
  };

  // Keyboard navigation
  screen.key(['tab', 'down'], () => {
    if (!isEditing) focusItem(currIdx + 1);
  });

  screen.key(['S-tab', 'up'], () => {
    if (!isEditing) focusItem(currIdx - 1);
  });

  // Enter key action handling
  screen.key(['enter'], () => {
    const active = focusables[currIdx];
    if (active === submitBtn) {
      triggerDispatch();
    } else if (active && !isEditing) {
      isEditing = true;
      const textbox = active as blessed.Widgets.TextboxElement;
      textbox.readInput((_err, value) => {
        isEditing = false;
        if (value !== undefined) {
          textbox.setValue(value);
        }
        focusItem(currIdx + 1);
      });
    }
  });

  screen.key(['escape', 'q', 'C-c'], () => {
    if (isEditing) {
      isEditing = false;
      return;
    }
    destroyScreen();
    process.exit(0);
  });

  focusItem(0);
}
