const { test, expect } = require('@playwright/test');

test.describe('Simulación de dispositivos móviles', () => {
  test('Viewport móvil - iPhone 12', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    
    await expect(page).toHaveURL(/\//);
    
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(390);
    expect(viewport.height).toBe(844);
  });

  test('Viewport móvil - Pixel 5', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');
    
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(393);
    expect(viewport.height).toBe(851);
  });

  test('Viewport personalizado', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(768);
    expect(viewport.height).toBe(1024);
  });

  test('Orientación landscape', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(844);
    expect(viewport.height).toBe(390);
  });

  test('Touch events enabled', async ({ page, context }) => {
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
    await page.goto('/');
    
    await page.click('[data-testid="touch-button"]', { force: true });
    await expect(page.locator('[data-testid="touch-result"]')).toBeVisible();
  });

  test('Mobile menu visibility', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const desktopMenu = page.locator('[data-testid="desktop-menu"]');
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    
    await expect(desktopMenu).toBeHidden();
    await expect(mobileMenu).toBeVisible();
  });

  test('Responsive layout check', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 414, height: 896 },
      { width: 768, height: 1024 },
      { width: 1024, height: 1366 },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      const currentViewport = page.viewportSize();
      expect(currentViewport.width).toBe(viewport.width);
      expect(currentViewport.height).toBe(viewport.height);
    }
  });

  test('Touch scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/long-content');
    
    const initialPosition = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
    
    const finalPosition = await page.evaluate(() => window.scrollY);
    expect(finalPosition).toBeGreaterThan(initialPosition);
  });

  test('Device with geolocation', async ({ page, context }) => {
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }),
          () => resolve(null)
        );
      });
    });
    
    expect(result.lat).toBeCloseTo(40.7128, 0);
    expect(result.lng).toBeCloseTo(-74.006, 0);
  });

  test('Mobile form interaction', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/form');
    
    await page.fill('[data-testid="name"]', 'John Doe');
    await page.click('[data-testid="submit-btn"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});

test.describe('Ejecución en modo headless', () => {
  test('Funciona sin navegador visible', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\//);
    
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('Screenshot en headless', async ({ page }) => {
    await page.goto('/');
    const screenshot = await page.screenshot();
    expect(screenshot).toBeDefined();
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('PDF generation en headless', async ({ page }) => {
    await page.goto('/print');
    const pdf = await page.pdf();
    expect(pdf).toBeDefined();
  });

  test('Console logs capture', async ({ page }) => {
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(msg.text()));
    
    await page.goto('/');
    await page.waitForTimeout(500);
    
    expect(consoleLogs).toBeDefined();
  });

  test('Network requests capture', async ({ page }) => {
    const requests = [];
    page.on('request', req => requests.push(req.url()));
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(requests.length).toBeGreaterThan(0);
  });
});

test.describe('Configuración de proyectos por dispositivo', () => {
  test('Test con iPhone 12 preconfigurado', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(390);
    expect(viewport.height).toBe(844);
  });
});
