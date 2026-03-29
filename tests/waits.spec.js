const { test, expect } = require('@playwright/test');
const { HomePage } = require('./pages');

test.describe('Manejo de esperas', () => {
  let homePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
  });

  test.describe('Esperas implícitas', () => {
    test('Espera automática en click', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-testid="async-button"]');
      await expect(page.locator('[data-testid="async-result"]')).toBeVisible();
    });

    test('Espera automática en fill', async ({ page }) => {
      await page.goto('/form');
      await page.fill('[data-testid="name-input"]', 'John');
      await expect(page.locator('[data-testid="name-input"]')).toHaveValue('John');
    });

    test('Espera automática en navigation', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-testid="nav-about"]');
      await expect(page).toHaveURL(/\/about/);
    });
  });

  test.describe('Esperas explícitas - waitForSelector', () => {
    test('Esperar elemento visible', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="delayed-content"]', { state: 'visible', timeout: 10000 });
      await expect(page.locator('[data-testid="delayed-content"]')).toBeVisible();
    });

    test('Esperar elemento oculto', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-testid="hide-button"]');
      await page.waitForSelector('[data-testid="hidden-element"]', { state: 'hidden', timeout: 5000 });
    });

    test('Esperar elemento en DOM', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="new-element"]', { state: 'attached' });
    });

    test('Esperar elemento sea removido', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-testid="remove-button"]');
      await page.waitForSelector('[data-testid="removed-element"]', { state: 'detached', timeout: 5000 });
    });
  });

  test.describe('Esperas explícitas - waitForLoadState', () => {
    test('Esperar domcontentloaded', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\//);
    });

    test('Esperar load', async ({ page }) => {
      await page.goto('/', { waitUntil: 'load' });
      const title = await page.title();
      expect(title).toBeTruthy();
    });

    test('Esperar networkidle', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\//);
    });

    test('Esperar después de interacción', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-testid="load-more"]');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="loaded-content"]')).toBeVisible();
    });
  });

  test.describe('Esperas explícitas - waitForNavigation', () => {
    test('Esperar navegación completa', async ({ page }) => {
      await page.goto('/');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('[data-testid="nav-about"]'),
      ]);
      await expect(page).toHaveURL(/\/about/);
    });

    test('Esperar URL específica', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-testid="nav-services"]');
      await page.waitForURL('**/services');
      await expect(page).toHaveURL(/\/services/);
    });

    test('Esperar función de URL', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-testid="nav-blog"]');
      await page.waitForURL((url) => url.pathname.includes('/blog'));
      await expect(page.url()).toContain('/blog');
    });
  });

  test.describe('Esperas explícitas - waitForResponse', () => {
    test('Esperar respuesta de API', async ({ page }) => {
      await page.goto('/');
      
      const [response] = await Promise.all([
        page.waitForResponse((resp) => resp.url().includes('/api/data') && resp.status() === 200),
        page.click('[data-testid="load-data"]'),
      ]);
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
    });

    test('Esperar respuesta con estado específico', async ({ page }) => {
      await page.goto('/');
      
      await Promise.all([
        page.waitForResponse((resp) => resp.status() === 201),
        page.click('[data-testid="create-item"]'),
      ]);
    });

    test('Esperar respuesta con timeout', async ({ page }) => {
      await page.goto('/');
      
      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes('/api/slow'),
        { timeout: 5000 }
      );
      
      await page.click('[data-testid="load-slow"]');
      
      try {
        await responsePromise;
      } catch (e) {
        console.log('Timeout esperando respuesta');
      }
    });
  });

  test.describe('Esperas explícitas - waitForRequest', () => {
    test('Esperar request específico', async ({ page }) => {
      await page.goto('/');
      
      const [request] = await Promise.all([
        page.waitForRequest((req) => req.url().includes('/api/users')),
        page.click('[data-testid="load-users"]'),
      ]);
      
      expect(request.url()).toContain('/api/users');
    });

    test('Esperar POST request', async ({ page }) => {
      await page.goto('/form');
      
      await Promise.all([
        page.waitForRequest((req) => req.method() === 'POST'),
        page.click('[data-testid="submit-btn"]'),
      ]);
    });
  });

  test.describe('Esperas con condiciones personalizadas', () => {
    test('Esperar condición personalizada con evaluate', async ({ page }) => {
      await page.goto('/');
      
      await page.waitForFunction(() => {
        const element = document.querySelector('[data-testid="counter"]');
        return element && parseInt(element.textContent) >= 10;
      }, null, { timeout: 10000 });
    });

    test('Esperar con polling', async ({ page }) => {
      await page.goto('/');
      
      await page.waitForFunction(async () => {
        const response = await fetch('/api/status');
        const data = await response.json();
        return data.status === 'ready';
      }, null, { timeout: 10000 });
    });

    test('Esperar expresión JavaScript', async ({ page }) => {
      await page.goto('/');
      
      const startTime = Date.now();
      await page.waitForFunction(
        () => Date.now() - startTime > 1000
      );
      
      expect(Date.now() - startTime).toBeGreaterThanOrEqual(1000);
    });
  });

  test.describe('Esperas de texto', () => {
    test('Esperar texto aparezca', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('text=Loaded', { state: 'visible', timeout: 10000 });
      await expect(page.locator('text=Loaded')).toBeVisible();
    });

    test('Esperar texto desaparezca', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-testid="hide-text"]');
      await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 5000 });
    });

    test('Esperar texto contenga', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('has-text=Success', { state: 'visible', timeout: 10000 });
    });
  });

  test.describe('Combinación de esperas', () => {
    test('Múltiples esperas encadenadas', async ({ page }) => {
      await page.goto('/');
      
      await page.click('[data-testid="load-and-navigate"]');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="content-loaded"]', { state: 'visible' });
      
      await expect(page.locator('[data-testid="content-loaded"]')).toBeVisible();
    });

    test('Esperas con retry automático', async ({ page }) => {
      await page.goto('/');
      
      await expect(page.locator('[data-testid="async-counter"]')).toHaveText('100', { timeout: 15000 });
    });
  });
});
