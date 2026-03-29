const { test, expect } = require('@playwright/test');
const { HomePage, LoginPage } = require('./pages');

test.describe('Navegación entre páginas', () => {
  let homePage;
  let loginPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    loginPage = new LoginPage(page);
  });

  test('Navegación a la página principal', async ({ page }) => {
    await homePage.navigate();
    await expect(page).toHaveURL(/\/$/);
    await expect(page).toHaveTitle(/.*/);
  });

  test('Navegación directa a través de URL', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
  });

  test('Navegación a página de inicio con ruta explícita', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/($|#)/);
  });

  test('Navegación a través de enlaces de navegación', async ({ page }) => {
    await homePage.navigate();
    
    await homePage.clickNavigationLink('home');
    await expect(page).toHaveURL(/\/$/);
    
    await homePage.clickNavigationLink('about');
    await expect(page).toHaveURL(/\/about/);
    
    await homePage.clickNavigationLink('contact');
    await expect(page).toHaveURL(/\/contact/);
    
    await homePage.clickNavigationLink('services');
    await expect(page).toHaveURL(/\/services/);
  });

  test('Navegación con botones primarios', async ({ page }) => {
    await homePage.navigate();
    await homePage.clickGetStarted();
    await expect(page).toHaveURL(/\/(signup|register|login)/);
  });

  test('Navegación con botones secundarios', async ({ page }) => {
    await homePage.navigate();
    await homePage.clickLearnMore();
    await expect(page).toHaveURL(/\/about/);
  });

  test('Navegación hacia atrás en el historial', async ({ page }) => {
    await homePage.navigate();
    await homePage.clickNavigationLink('about');
    await expect(page).toHaveURL(/\/about/);
    
    await homePage.goBack();
    await expect(page).toHaveURL(/\/$/);
  });

  test('Navegación hacia adelante en el historial', async ({ page }) => {
    await homePage.navigate();
    await homePage.clickNavigationLink('about');
    await homePage.goBack();
    await homePage.goForward();
    await expect(page).toHaveURL(/\/about/);
  });

  test('Recarga de página', async ({ page }) => {
    await homePage.navigate();
    const initialTitle = await homePage.getTitle();
    await homePage.reload();
    const reloadedTitle = await homePage.getTitle();
    expect(initialTitle).toBe(reloadedTitle);
  });

  test('Navegación entre múltiples páginas del sitio', async ({ page }) => {
    await homePage.navigate();
    
    const pages = ['/', '/about', '/contact', '/services', '/blog'];
    for (const path of pages) {
      await page.goto(path);
      await homePage.waitForPageLoaded();
      expect(page.url()).toContain(path);
    }
  });

  test('Navegación con esperar URL específica', async ({ page }) => {
    await homePage.navigate();
    await homePage.clickNavigationLink('about');
    await homePage.waitForURL('**/about');
    await expect(page).toHaveURL(/\/about/);
  });

  test('Navegación a través del footer', async ({ page }) => {
    await homePage.navigate();
    const footerLinks = await homePage.getFooterLinks();
    expect(footerLinks.length).toBeGreaterThan(0);
  });
});
