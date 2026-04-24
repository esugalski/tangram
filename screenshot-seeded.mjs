import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const require = createRequire(import.meta.url);
const pup = require('C:/pup-test/node_modules/puppeteer');

const __dirname = dirname(fileURLToPath(import.meta.url));
const targetUrl = process.argv[2] || 'http://localhost:3000/tools/eqms/doc-library.html';
const urlSlug = targetUrl.replace(/https?:\/\/[^/]+\//, '').replace(/[/\\]/g, '-').replace(/\.html$/, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
const outPath = join(__dirname, 'temporary screenshots', 'screenshot-seeded-' + urlSlug + '.png');

// Read the seed-demo.js so we can call SeedDemo.seedForce() in browser
const seedScript = readFileSync(join(__dirname, 'tools/eqms/seed-demo.js'), 'utf8');

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

// First navigate to any eQMS page to get the right origin for localStorage
await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 15000 });

// Inject and run seed
await page.evaluate((script) => {
  eval(script);
  SeedDemo.seedForce();
}, seedScript);

// Reload to pick up seeded data
await page.reload({ waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log('Saved:', outPath);
