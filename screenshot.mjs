// Usage: node screenshot.mjs <url> [label]
// Saves to ./temporary screenshots/screenshot-N[-label].png
// Requires: puppeteer installed at C:/pup-test/node_modules/puppeteer
//           Chrome at C:/Program Files/Google/Chrome/Application/chrome.exe

import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const require = createRequire(import.meta.url);
const pup = require('C:/pup-test/node_modules/puppeteer');

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const dir = join(__dirname, 'temporary screenshots');

if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

let n = 1;
while (existsSync(join(dir, `screenshot-${n}${label}.png`))) n++;
const outPath = join(dir, `screenshot-${n}${label}.png`);

const browser = await pup.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log('Saved:', outPath);
