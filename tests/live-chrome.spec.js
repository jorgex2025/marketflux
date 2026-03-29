const { test, expect, chromium } = require('@playwright/test');

test('Live Chrome - Navegar al marketplace', async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);
  
  const title = await page.title();
  console.log('Título de la página:', title);
  
  const h1Text = await page.locator('h1').first().textContent();
  console.log('H1:', h1Text);
  
  await page.screenshot({ path: 'live-test.png' });
  console.log('Screenshot guardado: live-test.png');
  
  await browser.close();
});