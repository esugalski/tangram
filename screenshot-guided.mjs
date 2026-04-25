import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pup = require('C:/pup-test/node_modules/puppeteer');

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';

const browser = await pup.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.evaluate(() => {
  localStorage.setItem('qms_learn_mode', 'guided');
  localStorage.setItem('qms_welcome_seen', '1');
  localStorage.setItem('qms_demo_seeded', '1');
});
await page.reload({ waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1000));
const outPath = join(__dirname, 'temporary screenshots', `screenshot-guided${label}.png`);
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log('Saved:', outPath);
