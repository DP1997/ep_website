/**
 * Minimaler Chrome-DevTools-Protocol-Treiber (headless Chrome, kein Playwright).
 * Aufruf: node scripts/cdp.mjs <url> [--w 1440] [--h 900] [--shot datei.png] [--eval "js"]
 */
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const PROFILE = join(tmpdir(), 'opencode', 'cdp-profile');

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};

export async function launch() {
  if (!existsSync(PROFILE)) mkdirSync(PROFILE, { recursive: true });
  const proc = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${arg('w', 1440)},${arg('h', 900)}`,
    'about:blank',
  ], { stdio: 'ignore', detached: false });

  // Auf den DevTools-Port warten
  let targets = null;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      targets = await r.json();
      if (targets.some(t => t.type === 'page')) break;
    } catch { /* noch nicht bereit */ }
    await new Promise(r => setTimeout(r, 250));
  }
  if (!targets) throw new Error('Chrome-Devtools-Port nicht erreichbar');
  const page = targets.find(t => t.type === 'page');
  return { proc, ws: await connect(page.webSocketDebuggerUrl) };
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    const listeners = [];
    let id = 0;
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      } else if (msg.method) {
        for (const l of listeners) l(msg);
      }
    };
    ws.onerror = (e) => reject(new Error('WS-Fehler: ' + e.message));
    ws.onopen = () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const mid = ++id;
          pending.set(mid, { res, rej });
          ws.send(JSON.stringify({ id: mid, method, params }));
        });
      },
      on(fn) { listeners.push(fn); },
      close() { ws.close(); },
    });
  });
}

export async function openPage(ws, url, w = 1440, h = 900) {
  await ws.send('Page.enable');
  await ws.send('Runtime.enable');
  await ws.send('Emulation.setDeviceMetricsOverride', {
    width: w, height: h, deviceScaleFactor: 1, mobile: false,
  });
  const loaded = new Promise((res) => {
    const off = (msg) => { if (msg.method === 'Page.loadEventFired') res(); };
    ws.on(off);
  });
  await ws.send('Page.navigate', { url });
  await Promise.race([loaded, new Promise(r => setTimeout(r, 15000))]);
  await new Promise(r => setTimeout(r, 400));
}

export async function evaluate(ws, expression) {
  const r = await ws.send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

export async function screenshot(ws, file) {
  const r = await ws.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(file, Buffer.from(r.data, 'base64'));
  return file;
}

// Direktaufruf: node scripts/cdp.mjs <url> [--shot datei] [--eval "js"]
if (process.argv[1] && process.argv[1].endsWith('cdp.mjs')) {
  const url = process.argv[2];
  const { proc, ws } = await launch();
  try {
    await openPage(ws, url, Number(arg('w', 1440)), Number(arg('h', 900)));
    const js = arg('eval', null);
    if (js) console.log(JSON.stringify(await evaluate(ws, js), null, 1));
    const shot = arg('shot', null);
    if (shot) { await screenshot(ws, shot); console.log('Screenshot: ' + shot); }
  } finally {
    ws.close();
    proc.kill();
    await new Promise(r => setTimeout(r, 300));
    try { rmSync(PROFILE, { recursive: true, force: true }); } catch { /* egal */ }
  }
}
