const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  // Go to dev server (default port 3006)
  await page.goto('http://localhost:3006/admin/ventas', { waitUntil: 'networkidle' });
  // Find the Imelda row and click the "Notificación Oficial" button
  const row = await page.locator('tr', { hasText: 'Imelda' }).first();
  if (await row.count() === 0) {
    console.error('Imelda row not found');
    await browser.close();
    process.exit(1);
  }
  const button = row.locator('button', { hasText: 'Notificación Oficial' });
  await button.click();
  // Wait a short while for async request
  await page.waitForTimeout(3000);
  // Print captured logs
  console.log('--- LOGS START ---');
  console.log(logs.join('\n'));
  console.log('--- LOGS END ---');
  await browser.close();
})();
