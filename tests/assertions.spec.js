const { test, expect } = require('@playwright/test');
const { LoginPage, FormPage } = require('./pages');

test.describe('Validaciones y assertions', () => {
  let loginPage;
  let formPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    formPage = new FormPage(page);
  });

  test.describe('Assertions de visibilidad', () => {
    test('Elemento visible', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    });

    test('Elemento oculto', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="hidden-element"]')).toBeHidden();
    });

    test('Elemento attached pero oculto', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="removed-element"]')).not.toBeVisible();
    });

    test('Alternar visibilidad', async ({ page }) => {
      await page.goto('/');
      const toggle = page.locator('[data-testid="toggle-button"]');
      const target = page.locator('[data-testid="toggle-target"]');
      
      await toggle.click();
      await expect(target).toBeVisible();
      
      await toggle.click();
      await expect(target).toBeHidden();
    });

    test('Elemento eventualmente visible', async ({ page }) => {
      await page.goto('/');
      await page.locator('[data-testid="delayed-element"]').waitFor({ state: 'visible', timeout: 10000 });
      await expect(page.locator('[data-testid="delayed-element"]')).toBeVisible();
    });
  });

  test.describe('Assertions de estado', () => {
    test('Elemento habilitado', async ({ page }) => {
      await loginPage.navigate();
      await expect(page.locator(loginPage.selectors.submitButton)).toBeEnabled();
    });

    test('Elemento deshabilitado', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('short');
      await expect(page.locator(loginPage.selectors.submitButton)).toBeDisabled();
    });

    test('Checkbox marcado', async ({ page }) => {
      await formPage.navigate();
      await formPage.acceptTerms();
      await expect(page.locator(formPage.selectors.terms)).toBeChecked();
    });

    test('Checkbox desmarcado', async ({ page }) => {
      await formPage.navigate();
      await expect(page.locator(formPage.selectors.terms)).not.toBeChecked();
    });

    test('Radio button seleccionado', async ({ page }) => {
      await formPage.navigate();
      await formPage.selectGender('male');
      await expect(page.locator(formPage.selectors.gender.male)).toBeChecked();
    });

    test('Dropdown con valor', async ({ page }) => {
      await formPage.navigate();
      await formPage.selectCountry('US');
      await expect(page.locator(formPage.selectors.country)).toHaveValue('US');
    });
  });

  test.describe('Assertions de contenido', () => {
    test('Texto exacto', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('h1')).toHaveText('Welcome');
    });

    test('Texto conteniendo', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="message"]')).toContainText('Hello');
    });

    test('Texto vacio', async ({ page }) => {
      await page.goto('/');
      const input = page.locator('[data-testid="empty-input"]');
      await expect(input).toHaveValue('');
    });

    test('Valor de input', async ({ page }) => {
      await formPage.navigate();
      await formPage.fillFirstName('John');
      await expect(page.locator(formPage.selectors.firstName)).toHaveValue('John');
    });

    test('Múltiples elementos con texto', async ({ page }) => {
      await page.goto('/');
      const items = page.locator('[data-testid="list-item"]');
      await expect(items).toHaveCount(5);
    });
  });

  test.describe('Assertions de URL y título', () => {
    test('URL exacta', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL('http://localhost:3000/');
    });

    test('URL con patrón', async ({ page }) => {
      await page.goto('/about');
      await expect(page).toHaveURL(/\/about/);
    });

    test('URL conteniendo texto', async ({ page }) => {
      await page.goto('/about');
      await expect(page).toHaveURL(/.*about.*/);
    });

    test('Título exacto', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle('My App');
    });

    test('Título conteniendo', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/My/);
    });
  });

  test.describe('Assertions de atributos', () => {
    test('Atributo existente', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="image"]')).toHaveAttribute('alt', 'Test Image');
    });

    test('Clase CSS presente', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.btn-primary')).toHaveClass(/btn/);
    });

    test('href de link', async ({ page }) => {
      await page.goto('/');
      const link = page.locator('nav a').first();
      await expect(link).toHaveAttribute('href', /./);
    });

    test('Multiple atributos', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="input"]')).toHaveAttributes({
        type: 'text',
        required: 'true',
      });
    });
  });

  test.describe('Assertions de conteo', () => {
    test('Contar elementos', async ({ page }) => {
      await page.goto('/');
      const cards = page.locator('[data-testid="card"]');
      await expect(cards).toHaveCount(3);
    });

    test('Contar elementos mayores que', async ({ page }) => {
      await page.goto('/');
      const items = page.locator('[data-testid="item"]');
      expect(await items.count()).toBeGreaterThan(0);
    });

    test('Contar elementos menores que', async ({ page }) => {
      await page.goto('/');
      const items = page.locator('[data-testid="item"]');
      expect(await items.count()).toBeLessThan(100);
    });
  });

  test.describe('Assertions negativas', () => {
    test('No visible', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.nonexistent')).not.toBeVisible();
    });

    test('No contains text', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="message"]')).not.toContainText('Goodbye');
    });

    test('Not have URL', async ({ page }) => {
      await page.goto('/');
      await expect(page).not.toHaveURL(/admin/);
    });

    test('Not have value', async ({ page }) => {
      await formPage.navigate();
      await expect(page.locator(formPage.selectors.firstName)).not.toHaveValue('Jane');
    });
  });

  test.describe('Soft assertions', () => {
    test('Múltiples assertions sin detener en primera falla', async ({ page }) => {
      await page.goto('/');
      
      await expect.soft(page.locator('h1')).toHaveText('Welcome');
      await expect.soft(page.locator('[data-testid="subtitle"]')).toContainText('Testing');
    });

    test('Soft con custom message', async ({ page }) => {
      await page.goto('/');
      await expect.soft(page.locator('h1'), 'El título debería ser Welcome').toHaveText('Welcome');
    });
  });

  test.describe('Custom expectations', () => {
    test('Custom matcher con toPass', async ({ page }) => {
      await page.goto('/');
      await expect(async () => {
        const count = await page.locator('[data-testid="loaded-item"]').count();
        return count === 5;
      }).toPass({ timeout: 10000 });
    });

    test('Custom retry logic', async ({ page }) => {
      await page.goto('/');
      await expect(async () => {
        const text = await page.locator('[data-testid="status"]').textContent();
        return text === 'Ready';
      }).toPass({ intervals: [1000, 2000, 5000], timeout: 15000 });
    });
  });
});
