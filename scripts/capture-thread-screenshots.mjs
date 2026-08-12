import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = 'http://127.0.0.1:8787/zh-CN/posts/demo_plz_research_003';
const outputDir = path.resolve('screenshots');

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();

const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await desktop.goto(baseUrl, { waitUntil: 'networkidle' });
await desktop.screenshot({
  path: path.join(outputDir, 'nested-thread-desktop-zh-CN.png'),
  fullPage: true,
});

const mobile = await browser.newPage({ ...devices['iPhone 13'] });
await mobile.goto(baseUrl, { waitUntil: 'networkidle' });
await mobile.screenshot({
  path: path.join(outputDir, 'nested-thread-mobile-zh-CN.png'),
  fullPage: true,
});

await browser.close();
console.log('Saved screenshots to', outputDir);
