const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Captura de screenshots', () => {
  test('Screenshot de página completa', async ({ page }) => {
    await page.goto('/');
    const screenshot = await page.screenshot({ fullPage: true });
    
    expect(screenshot).toBeDefined();
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('Screenshot de viewport', async ({ page }) => {
    await page.goto('/');
    const screenshot = await page.screenshot();
    
    expect(screenshot).toBeDefined();
  });

  test('Screenshot en formato JPEG', async ({ page }) => {
    await page.goto('/');
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 80 });
    
    expect(screenshot).toBeDefined();
  });

  test('Screenshot de elemento específico', async ({ page }) => {
    await page.goto('/');
    const element = await page.locator('[data-testid="card"]').first();
    const screenshot = await element.screenshot();
    
    expect(screenshot).toBeDefined();
  });

  test('Screenshot antes de interacción', async ({ page }) => {
    await page.goto('/');
    await page.screenshot({ path: 'before-click.png' });
    
    await page.click('[data-testid="action-button"]');
    
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });

  test('Screenshot después de error', async ({ page }) => {
    await page.goto('/');
    
    try {
      await page.click('[data-testid="nonexistent-button"]', { timeout: 1000 });
    } catch (e) {
      await page.screenshot({ path: 'error-state.png' });
      throw e;
    }
  });

  test('Screenshot con mask', async ({ page }) => {
    await page.goto('/');
    const screenshot = await page.screenshot({
      mask: [
        page.locator('[data-testid="sensitive-data"]'),
      ],
    });
    
    expect(screenshot).toBeDefined();
  });

  test('Screenshot multicapa', async ({ page }) => {
    await page.goto('/');
    
    const screenshot1 = await page.screenshot({ path: 'full-page.png', fullPage: true });
    expect(screenshot1).toBeDefined();
    
    await page.click('[data-testid="next-section"]');
    const screenshot2 = await page.screenshot({ path: 'next-section.png', fullPage: true });
    expect(screenshot2).toBeDefined();
  });

  test('Screenshot de scroll largo', async ({ page }) => {
    await page.goto('/long-page');
    
    const screenshots = [];
    const sections = await page.locator('[data-testid="section"]').count();
    
    for (let i = 0; i < sections; i++) {
      const section = page.locator('[data-testid="section"]').nth(i);
      await section.scrollIntoViewIfNeeded();
      const screenshot = await section.screenshot();
      screenshots.push(screenshot);
    }
    
    expect(screenshots.length).toBe(sections);
  });

  test('Comparación visual básica', async ({ page }) => {
    await page.goto('/');
    const screenshot1 = await page.screenshot();
    
    await page.reload();
    const screenshot2 = await page.screenshot();
    
    expect(screenshot1.length).toBe(screenshot2.length);
  });
});

test.describe('Grabación de video', () => {
  test('Video de sesión completo', async ({ browser }) => {
    const context = await browser.newContext({
      recordVideo: {
        dir: 'test-results/videos',
        size: { width: 1280, height: 720 },
      },
    });
    
    const page = await context.newPage();
    await page.goto('/');
    
    await page.click('[data-testid="action1"]');
    await page.waitForTimeout(500);
    
    await page.click('[data-testid="action2"]');
    await page.waitForTimeout(500);
    
    await context.close();
  });

  test('Video con tamaño personalizado', async ({ browser }) => {
    const context = await browser.newContext({
      recordVideo: {
        dir: 'test-results/videos',
        size: { width: 800, height: 600 },
      },
    });
    
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    await context.close();
  });

  test('Capturar video solo en caso de error', async ({ browser }) => {
    const context = await browser.newContext({
      recordVideo: {
        dir: 'test-results/videos',
      },
    });
    
    const page = await context.newPage();
    
    try {
      await page.goto('/');
      await page.click('[data-testid="fail-button"]', { timeout: 1000 });
    } catch (e) {
      await context.close();
      throw e;
    }
    
    await context.close();
  });
});

test.describe('Captura automática en falla', () => {
  test('Screenshot automático en retry', async ({ page }) => {
    test.info().annotations.push({ type: 'test', description: 'Screenshot automático configurado en playwright.config.js' });
    
    await page.goto('/');
    expect(page.url()).toContain('/nonexistent');
  });

  test('Video automático en retry', async ({ page }) => {
    test.info().annotations.push({ type: 'test', description: 'Video automático configurado en playwright.config.js' });
    
    await page.goto('/');
    await page.click('[data-testid="error-trigger"]');
  });

  test('Trace en primer retry', async ({ page }) => {
    await page.goto('/');
    
    await page.click('[data-testid="button1"]');
    await page.click('[data-testid="button2"]');
    
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});

test.describe('Reportes HTML', () => {
  test('Reporte HTML contiene screenshots', async ({ page }) => {
    await page.goto('/');
    
    await page.click('[data-testid="action-button"]');
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });

  test('Reporte HTML con trazas', async ({ page }) => {
    await page.goto('/');
    
    await page.click('[data-testid="step1"]');
    await page.click('[data-testid="step2"]');
    await page.click('[data-testid="step3"]');
    
    await expect(page.locator('[data-testid="final-result"]')).toBeVisible();
  });
});
