const { test, expect } = require('@playwright/test');
const { LoginPage, FormPage } = require('./pages');

test.describe('Interacción con elementos dinámicos', () => {
  let loginPage;
  let formPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    formPage = new FormPage(page);
  });

  test.describe('Clicks y interacciones', () => {
    test('Click simple en botón', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.clickSubmitButton();
      await expect(loginPage.errors.email).toBeVisible();
    });

    test('Doble click en elemento', async ({ page }) => {
      await formPage.navigate();
      await formPage.doubleClick('[data-testid="double-click-area"]');
      await expect(page.locator('[data-testid="double-click-result"]')).toBeVisible();
    });

    test('Click derecho (context menu)', async ({ page }) => {
      await page.goto('/');
      await page.locator('[data-testid="right-click-area"]').click({ button: 'right' });
      await expect(page.locator('[data-testid="context-menu"]')).toBeVisible();
    });

    test('Hover sobre elemento', async ({ page }) => {
      await page.goto('/');
      const card = page.locator('[data-testid="feature-card"]').first();
      await card.hover();
      await expect(card.locator('.overlay')).toBeVisible();
    });

    test('Click en elemento deshabilitado debe fallar', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password');
      await expect(loginPage.submitButton).toBeDisabled();
    });

    test('Click en elemento oculto debe fallar', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="hidden-button"]')).toBeHidden();
    });

    test('Drag and drop básico', async ({ page }) => {
      await page.goto('/drag-drop');
      const source = page.locator('[data-testid="draggable-source"]');
      const target = page.locator('[data-testid="droppable-target"]');
      await source.dragTo(target);
      await expect(target).toHaveText('Dropped!');
    });

    test('Click con modificadores (Ctrl)', async ({ page }) => {
      await page.goto('/');
      await page.locator('[data-testid="clickable"]').click({ modifiers: ['Control'] });
      await expect(page.locator('[data-testid="ctrl-click-result"]')).toBeVisible();
    });
  });

  test.describe('Interacción con inputs', () => {
    test('Llenar input de texto', async ({ page }) => {
      await formPage.navigate();
      await formPage.fillFirstName('John');
      await expect(formPage.getLocator(formPage.selectors.firstName)).toHaveValue('John');
    });

    test('Limpiar input', async ({ page }) => {
      await formPage.navigate();
      await formPage.fillFirstName('John');
      await formPage.clearFirstName();
      await expect(formPage.getLocator(formPage.selectors.firstName)).toHaveValue('');
    });

    test('Typing con delay', async ({ page }) => {
      await formPage.navigate();
      await formPage.type(formPage.selectors.firstName, 'Jane', { delay: 100 });
      const value = await formPage.getInputValue(formPage.selectors.firstName);
      expect(value).toBe('Jane');
    });

    test('Presionar teclas especiales', async ({ page }) => {
      await formPage.navigate();
      await formPage.fillFirstName('John');
      await formPage.pressKey('Home');
      await formPage.pressKey('End');
    });

    test('Presionar combinación de teclas', async ({ page }) => {
      await formPage.navigate();
      await formPage.fillFirstName('John');
      await formPage.pressKeys('Control', 'a');
      await formPage.pressKey('Backspace');
      await expect(formPage.getLocator(formPage.selectors.firstName)).toHaveValue('');
    });

    test('Input type="checkbox"', async ({ page }) => {
      await formPage.navigate();
      await formPage.acceptTerms();
      await expect(formPage.selectors.terms).toBeChecked();
    });

    test('Input type="radio"', async ({ page }) => {
      await formPage.navigate();
      await formPage.selectGender('male');
      await expect(page.locator(formPage.selectors.gender.male)).toBeChecked();
    });

    test('Select dropdown simple', async ({ page }) => {
      await formPage.navigate();
      await formPage.selectCountry('US');
      const value = await formPage.getInputValue(formPage.selectors.country);
      expect(value).toBe('US');
    });

    test('Select con múltiples opciones', async ({ page }) => {
      await page.goto('/multi-select');
      await page.selectOption('[data-testid="multi-select"]', ['option1', 'option2']);
      const selected = await page.locator('[data-testid="multi-select"]').inputValue();
      expect(selected).toContain('option1');
    });

    test('File upload simple - requires test file', async ({ page }) => {
      // Note: setInputFiles requires actual file paths on the filesystem
      // This test should use a real test file path
      test.skip(true, 'Requires test file fixture');
    });

    test('Clear uploaded files - requires test file', async ({ page }) => {
      test.skip(true, 'Requires test file fixture');
    });

    test('Input con validación en tiempo real', async ({ page }) => {
      await formPage.navigate();
      await formPage.fillEmail('invalid');
      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="error-email"]')).toBeVisible();
    });
  });

  test.describe('Selectores complejos', () => {
    test('Selector por data-testid', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    });

    test('Selector por texto exacto', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('text=Welcome')).toBeVisible();
    });

    test('Selector por texto contenido', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator(':has-text("elcome")')).toBeVisible();
    });

    test('Selector por atributo', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[type="email"]')).toBeVisible();
    });

    test('Selector por clase', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.btn-primary')).toBeVisible();
    });

    test('Selector por ID', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('#main-content')).toBeVisible();
    });

    test('Selector :nth-child', async ({ page }) => {
      await page.goto('/');
      const secondCard = page.locator('[data-testid="feature-card"]').nth(1);
      await expect(secondCard).toBeVisible();
    });

    test('Selector :first-child', async ({ page }) => {
      await page.goto('/');
      const firstNav = page.locator('nav a').first();
      await expect(firstNav).toBeVisible();
    });

    test('Selector :last-child', async ({ page }) => {
      await page.goto('/');
      const lastNav = page.locator('nav a').last();
      await expect(lastNav).toBeVisible();
    });

    test('Selector combinado', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('nav > a.active')).toBeVisible();
    });

    test('Selector con :not()', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('button:not([disabled])').first()).toBeVisible();
    });

    test('Selector con :has()', async ({ page }) => {
      await page.goto('/');
      const cardWithImage = page.locator('[data-testid="card"]:has(img)').first();
      await expect(cardWithImage).toBeVisible();
    });

    test('Selector por placeholder', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[placeholder="Search..."]')).toBeVisible();
    });
  });
});
