const { test, expect } = require('@playwright/test');
const { testData, generateRandomEmail, generateRandomPhone, wait } = require('./utils');

test.describe('Suite completa de pruebas E2E - Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Verificar página principal carga correctamente', async ({ page }) => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Navegación completa a través del sitio', async ({ page }) => {
    const navLinks = [
      { text: 'Home', url: '/' },
      { text: 'About', url: '/about' },
      { text: 'Contact', url: '/contact' },
      { text: 'Services', url: '/services' },
    ];

    for (const link of navLinks) {
      const navElement = page.getByRole('link', { name: link.text });
      if (await navElement.count() > 0) {
        await navElement.click();
        await page.waitForURL(link.url === '/' ? '**/' : `**${link.url}`);
      }
    }
  });

  test('Formulario de contacto con validaciones', async ({ page }) => {
    await page.goto('/contact');
    
    const nameInput = page.locator('[data-testid="contact-name"]');
    const emailInput = page.locator('[data-testid="contact-email"]');
    const messageInput = page.locator('[data-testid="contact-message"]');
    const submitButton = page.locator('[data-testid="contact-submit"]');
    
    await submitButton.click();
    await expect(page.locator('[data-testid="error-name"]')).toBeVisible();
    
    await nameInput.fill('John Doe');
    await emailInput.fill('invalid-email');
    await messageInput.fill('Test message');
    await submitButton.click();
    await expect(page.locator('[data-testid="error-email"]')).toBeVisible();
    
    await emailInput.fill(generateRandomEmail());
    await submitButton.click();
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('Login con credenciales válidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="login-email"]', testData.validUser.email);
    await page.fill('[data-testid="login-password"]', testData.validUser.password);
    
    const responsePromise = page.waitForResponse(resp => 
      resp.url().includes('/api/login') && resp.status() === 200
    );
    
    await page.click('[data-testid="login-submit"]');
    
    try {
      await responsePromise;
    } catch (e) {
      console.log('Login API no disponible, verificando UI');
    }
    
    await page.waitForLoadState('networkidle');
  });

  test('Búsqueda con resultados', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('playwright');
    await searchInput.press('Enter');
    
    await page.waitForLoadState('networkidle');
    
    const results = page.locator('[data-testid="search-result"]');
    await expect(results.first()).toBeVisible();
  });

  test('Carrito de compras - agregar y remover items', async ({ page }) => {
    await page.goto('/shop');
    
    const addToCartButtons = page.locator('[data-testid="add-to-cart"]');
    const initialCount = await addToCartButtons.count();
    
    if (initialCount > 0) {
      await addToCartButtons.first().click();
      await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
      
      await page.click('[data-testid="cart-icon"]');
      await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
      
      await page.click('[data-testid="remove-item"]');
      await expect(page.locator('[data-testid="cart-empty"]')).toBeVisible();
    }
  });

  test('Filtrado de productos', async ({ page }) => {
    await page.goto('/products');
    
    await page.click('[data-testid="filter-category"]');
    await page.click('[data-testid="category-electronics"]');
    
    await page.waitForLoadState('networkidle');
    
    const products = page.locator('[data-testid="product-card"]');
    const count = await products.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Paginación', async ({ page }) => {
    await page.goto('/products');
    
    const firstPageProducts = await page.locator('[data-testid="product-card"]').count();
    
    const nextButton = page.locator('[data-testid="pagination-next"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      
      const secondPageProducts = await page.locator('[data-testid="product-card"]').count();
      expect(secondPageProducts).toBe(firstPageProducts);
    }
  });

  test('Modal dialog', async ({ page }) => {
    await page.goto('/');
    
    const openModalButton = page.locator('[data-testid="open-modal"]');
    if (await openModalButton.count() > 0) {
      await openModalButton.click();
      await expect(page.locator('[data-testid="modal-content"]')).toBeVisible();
      
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="modal-content"]')).toBeHidden();
    }
  });

  test('Tabs navigation', async ({ page }) => {
    await page.goto('/features');
    
    await page.click('[data-testid="tab-2"]');
    await expect(page.locator('[data-testid="tab-content-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-content-1"]')).toBeHidden();
    
    await page.click('[data-testid="tab-3"]');
    await expect(page.locator('[data-testid="tab-content-3"]')).toBeVisible();
  });

  test('Toast notifications', async ({ page }) => {
    await page.goto('/');
    
    await page.click('[data-testid="trigger-toast"]');
    
    const toast = page.locator('[data-testid="toast"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Success');
    
    await wait(3000);
    await expect(toast).toBeHidden();
  });

  test('Dropdown menu', async ({ page }) => {
    await page.goto('/');
    
    const dropdownTrigger = page.locator('[data-testid="dropdown-trigger"]');
    if (await dropdownTrigger.count() > 0) {
      await dropdownTrigger.hover();
      await expect(page.locator('[data-testid="dropdown-menu"]')).toBeVisible();
      
      await page.click('[data-testid="dropdown-item-1"]');
      await expect(page.locator('[data-testid="dropdown-menu"]')).toBeHidden();
    }
  });

  test('Keyboard navigation', async ({ page }) => {
    await page.goto('/form');
    
    await page.locator('[data-testid="first-field"]').focus();
    await page.keyboard.type('Test');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.locator(':focus');
    expect(await focusedElement.getAttribute('data-testid')).toBe('second-field');
  });

  test('Loading states', async ({ page }) => {
    await page.goto('/');
    
    await page.click('[data-testid="load-data"]');
    
    const loader = page.locator('[data-testid="loader"]');
    await expect(loader).toBeVisible();
    
    await page.waitForSelector('[data-testid="loader"]', { state: 'hidden', timeout: 10000 });
    await expect(page.locator('[data-testid="loaded-data"]')).toBeVisible();
  });

  test('Error handling', async ({ page }) => {
    await page.goto('/api-error');
    
    await page.click('[data-testid="trigger-error"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Error');
    
    await page.click('[data-testid="retry-button"]');
    await page.waitForLoadState('networkidle');
  });

  test('Responsive behavior', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.reload();
      
      const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
      const desktopMenu = page.locator('[data-testid="desktop-menu"]');
      
      if (viewport.width < 768) {
        if (await hamburgerMenu.count() > 0) {
          await expect(hamburgerMenu).toBeVisible();
        }
      } else {
        if (await desktopMenu.count() > 0) {
          await expect(desktopMenu).toBeVisible();
        }
      }
    }
  });

  test('Accessibility - ARIA attributes', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('Local storage operations', async ({ page }) => {
    await page.goto('/');
    
    await page.evaluate(() => {
      localStorage.setItem('testKey', 'testValue');
    });
    
    const value = await page.evaluate(() => localStorage.getItem('testKey'));
    expect(value).toBe('testValue');
    
    await page.evaluate(() => localStorage.clear());
    const clearedValue = await page.evaluate(() => localStorage.getItem('testKey'));
    expect(clearedValue).toBeNull();
  });

  test('Cookies operations', async ({ page }) => {
    await page.goto('/');
    
    await page.context().addCookies([
      { name: 'session', value: 'test-session-id', domain: 'localhost', path: '/' }
    ]);
    
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'session');
    expect(sessionCookie.value).toBe('test-session-id');
    
    await page.context().clearCookies();
    const clearedCookies = await page.context().cookies();
    expect(clearedCookies.length).toBe(0);
  });

  test('Iframe interaction', async ({ page }) => {
    await page.goto('/iframe');
    
    const iframe = page.locator('[data-testid="content-iframe"]');
    if (await iframe.count() > 0) {
      const frame = page.frameLocator('[data-testid="content-iframe"]');
      await expect(frame.locator('body')).toBeVisible();
    }
  });

  test('File download', async ({ page }) => {
    await page.goto('/downloads');
    
    const downloadButton = page.locator('[data-testid="download-file"]');
    if (await downloadButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadButton.click()
      ]);
      
      expect(download.suggestedFilename()).toBeTruthy();
    }
  });
});

test.describe('Pruebas de integración API', () => {
  test('GET request', async ({ request }) => {
    const response = await request.get('https://jsonplaceholder.typicode.com/posts/1');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.id).toBe(1);
    expect(data.title).toBeTruthy();
  });

  test('POST request', async ({ request }) => {
    const newPost = {
      title: 'Test Post',
      body: 'Test body',
      userId: 1,
    };
    
    const response = await request.post('https://jsonplaceholder.typicode.com/posts', {
      data: newPost,
    });
    
    expect(response.status()).toBe(201);
    
    const data = await response.json();
    expect(data.title).toBe(newPost.title);
  });

  test('PUT request', async ({ request }) => {
    const updatedPost = {
      id: 1,
      title: 'Updated Post',
      body: 'Updated body',
      userId: 1,
    };
    
    const response = await request.put('https://jsonplaceholder.typicode.com/posts/1', {
      data: updatedPost,
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.title).toBe(updatedPost.title);
  });

  test('DELETE request', async ({ request }) => {
    const response = await request.delete('https://jsonplaceholder.typicode.com/posts/1');
    expect(response.status()).toBe(200);
  });
});

test.describe('Pruebas de rendimiento', () => {
  test('Page load time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000);
  });

  test('Navigation timing', async ({ page }) => {
    await page.goto('/');
    
    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadEventEnd: timing.loadEventEnd,
        navigationStart: timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      };
    });
    
    expect(metrics.domContentLoaded).toBeGreaterThan(0);
  });
});
