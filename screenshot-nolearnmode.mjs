import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pup = require('C:/pup-test/node_modules/puppeteer');

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000/tools/eqms/doc-library.html';
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const outPath = join(__dirname, 'temporary screenshots', `screenshot-nolm${label}.png`);

const browser = await pup.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

await page.evaluateOnNewDocument(() => {
  localStorage.setItem('qms_welcome_seen', '1');
  localStorage.setItem('qms_learn_mode', 'power');
});

await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log('Saved:', outPath);
