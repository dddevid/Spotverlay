import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, "..", "..", "src");
const outDir = resolve(here, "..", "..", "assets", "screenshots");
const publicDir = resolve(here, "..", "public");
mkdirSync(outDir, { recursive: true });

const candidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));
if (!executablePath) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");

const cover = (a, b) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='120' height='120' fill='url(#g)'/></svg>`,
  );

const stub = (payload) => `
window.__TAURI__ = {
  core: { invoke: async (cmd) => cmd === 'get_settings'
    ? { alwaysOnTop: true, position: 'top-right', animation: 'slide', firstRun: false }
    : null },
  event: { listen: (name, cb) => {
    if (name === 'now-playing') setTimeout(() => cb({ payload: ${JSON.stringify(payload)} }), 30);
    if (name === 'show-card') setTimeout(() => cb({}), 60);
  } },
};`;

const browser = await puppeteer.launch({ executablePath, headless: true });

async function shoot(file, w, h, scale, payload, css, clipSelector) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: scale });
  await page.evaluateOnNewDocument(stub(payload));
  await page.goto(pathToFileURL(resolve(srcDir, file)).href, { waitUntil: "networkidle0" });
  if (css) await page.addStyleTag({ content: css });
  await new Promise((r) => setTimeout(r, 900));
  const out = resolve(outDir, file.replace(".html", ".png"));
  if (clipSelector) {
    const el = await page.$(clipSelector);
    await el.screenshot({ path: out });
  } else {
    await page.screenshot({ path: out });
  }
  await page.close();
  copyFileSync(out, resolve(publicDir, file.replace(".html", ".png")));
  console.log("saved", out);
}

const wallpaper = `
html, body { background: radial-gradient(120% 120% at 15% 10%, #3b2a7a 0%, #14152b 45%, #07090f 100%) !important; }
body::before { content:''; position:fixed; inset:0; background: radial-gradient(500px 300px at 80% 90%, rgba(30,215,96,.35), transparent 70%); }
.card { z-index: 2; left: 28px !important; bottom: 20px !important; }
`;

await shoot(
  "overlay.html", 396, 136, 3,
  { title: "Blinding Lights", artist: "The Weeknd", playing: true, thumbnailUrl: cover("#ff3d6e", "#7a1fa2") },
  wallpaper,
);

await shoot("settings.html", 460, 500, 2, {});

await browser.close();
