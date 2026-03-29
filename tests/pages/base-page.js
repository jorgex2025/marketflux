const { expect } = require('@playwright/test');

class BasePage {
  constructor(page) {
    this.page = page;
    this.url = '';
  }

  async navigate(path = '') {
    const fullUrl = path ? `${this.url}${path}` : this.url;
    await this.page.goto(fullUrl, { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoaded();
  }

  async waitForPageLoaded() {
    await this.page.waitForLoadState('networkidle');
    await this.waitForDocumentReady();
  }

  async waitForDocumentReady() {
    await this.page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', resolve);
        }
      });
    });
  }

  async click(selector, options = {}) {
    const defaultOptions = { waitFor: 'visible' };
    const mergedOptions = { ...defaultOptions, ...options };
    
    if (mergedOptions.waitFor) {
      await this.page.waitForSelector(selector, { state: mergedOptions.waitFor === 'visible' ? 'visible' : 'attached' });
    }
    await this.page.click(selector, options);
  }

  async doubleClick(selector, options = {}) {
    await this.page.dblclick(selector, options);
  }

  async rightClick(selector) {
    await this.page.click(selector, { button: 'right' });
  }

  async hover(selector) {
    await this.page.hover(selector);
  }

  async fill(selector, value) {
    await this.page.fill(selector, value);
  }

  async type(selector, text, options = {}) {
    await this.page.type(selector, text, options);
  }

  async clear(selector) {
    await this.page.fill(selector, '');
  }

  async selectOption(selector, value) {
    await this.page.selectOption(selector, value);
  }

  async selectOptions(selector, values) {
    await this.page.selectOption(selector, values);
  }

  async check(selector) {
    await this.page.check(selector);
  }

  async uncheck(selector) {
    await this.page.uncheck(selector);
  }

  async isChecked(selector) {
    return await this.page.isChecked(selector);
  }

  async isVisible(selector) {
    return await this.page.isVisible(selector);
  }

  async isHidden(selector) {
    return await this.page.isHidden(selector);
  }

  async isEnabled(selector) {
    return await this.page.isEnabled(selector);
  }

  async isDisabled(selector) {
    return await this.page.isDisabled(selector);
  }

  async getText(selector) {
    return await this.page.textContent(selector);
  }

  async getAttribute(selector, attribute) {
    return await this.page.getAttribute(selector, attribute);
  }

  async getInputValue(selector) {
    return await this.page.inputValue(selector);
  }

  async count(selector) {
    return await this.page.locator(selector).count();
  }

  async waitForSelector(selector, options = {}) {
    return await this.page.waitForSelector(selector, options);
  }

  async waitForLoadState(state = 'networkidle') {
    await this.page.waitForLoadState(state);
  }

  async waitForNavigation(options = {}) {
    await this.page.waitForNavigation(options);
  }

  async waitForURL(url, options = {}) {
    await this.page.waitForURL(url, options);
  }

  async waitForResponse(predicate, options = {}) {
    return await this.page.waitForResponse(predicate, options);
  }

  async waitForRequest(predicate, options = {}) {
    return await this.page.waitForRequest(predicate, options);
  }

  async scrollTo(selector) {
    await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, selector);
  }

  async scrollToTop() {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  async pressKey(key) {
    await this.page.keyboard.press(key);
  }

  async pressKeys(...keys) {
    await this.page.keyboard.press(keys.join('+'));
  }

  async getTitle() {
    return await this.page.title();
  }

  async getCurrentURL() {
    return this.page.url();
  }

  async reload() {
    await this.page.reload();
  }

  async goBack() {
    await this.page.goBack();
  }

  async goForward() {
    await this.page.goForward();
  }

  async takeScreenshot(options = {}) {
    return await this.page.screenshot(options);
  }

  async takeElementScreenshot(selector, options = {}) {
    const element = await this.page.$(selector);
    if (element) {
      return await element.screenshot(options);
    }
    return null;
  }

  async getBoundingBox(selector) {
    const element = await this.page.$(selector);
    if (element) {
      return await element.boundingBox();
    }
    return null;
  }

  async isElementInViewport(selector) {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }, selector);
  }

  async dragAndDrop(sourceSelector, targetSelector) {
    await this.page.dragAndDrop(sourceSelector, targetSelector);
  }

  async uploadFile(selector, filePaths) {
    await this.page.setInputFiles(selector, filePaths);
  }

  async clearUploadedFiles(selector) {
    await this.page.setInputFiles(selector, []);
  }

  async executeScript(script, ...args) {
    return await this.page.evaluate(script, ...args);
  }

  async addScriptTag(script) {
    await this.page.addScriptTag({ content: script });
  }

  async addStyleTag(css) {
    await this.page.addStyleTag({ content: css });
  }

  async setViewportSize(width, height) {
    await this.page.setViewportSize({ width, height });
  }

  async setGeolocation(latitude, longitude) {
    await this.page.setGeolocation({ latitude, longitude });
  }

  async mockGeolocation(latitude, longitude) {
    await this.page.evaluate(
      ({ lat, lon }) => {
        navigator.geolocation.getCurrentPosition = (success) => {
          success({ coords: { latitude: lat, longitude: lon, accuracy: 1 } });
        };
      },
      { lat: latitude, lon: longitude }
    );
  }

  async getCookies() {
    return await this.page.context().cookies();
  }

  async setCookies(cookies) {
    await this.page.context().addCookies(cookies);
  }

  async clearCookies() {
    await this.page.context().clearCookies();
  }

  async getLocalStorage() {
    return await this.page.evaluate(() => JSON.stringify(localStorage));
  }

  async setLocalStorage(key, value) {
    await this.page.evaluate(
      ({ k, v }) => localStorage.setItem(k, v),
      { k: key, v: value }
    );
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }

  async getSessionStorage() {
    return await this.page.evaluate(() => JSON.stringify(sessionStorage));
  }

  async setSessionStorage(key, value) {
    await this.page.evaluate(
      ({ k, v }) => sessionStorage.setItem(k, v),
      { k: key, v: value }
    );
  }

  async clearSessionStorage() {
    await this.page.evaluate(() => sessionStorage.clear());
  }

  expect(actual) {
    return expect(actual);
  }

  expectVisible(selector, options = {}) {
    return expect(this.page.locator(selector)).toBeVisible(options);
  }

  expectHidden(selector) {
    return expect(this.page.locator(selector)).toBeHidden();
  }

  expectEnabled(selector) {
    return expect(this.page.locator(selector)).toBeEnabled();
  }

  expectDisabled(selector) {
    return expect(this.page.locator(selector)).toBeDisabled();
  }

  expectChecked(selector) {
    return expect(this.page.locator(selector)).toBeChecked();
  }

  expectNotChecked(selector) {
    return expect(this.page.locator(selector)).not.toBeChecked();
  }

  expectText(selector, text, options = {}) {
    return expect(this.page.locator(selector)).toHaveText(text, options);
  }

  expectValue(selector, value, options = {}) {
    return expect(this.page.locator(selector)).toHaveValue(value, options);
  }

  expectCount(selector, count) {
    return expect(this.page.locator(selector)).toHaveCount(count);
  }

  expectURL(url, options = {}) {
    return expect(this.page).toHaveURL(url, options);
  }

  expectTitle(title, options = {}) {
    return expect(this.page).toHaveTitle(title, options);
  }

  expectAttribute(selector, attribute, value) {
    return expect(this.page.locator(selector)).toHaveAttribute(attribute, value);
  }

  async waitForElementWithText(selector, text, options = {}) {
    await this.page.waitForSelector(`${selector}:text("${text}")`, options);
  }

  async waitForElementContainingText(selector, text, options = {}) {
    await this.page.waitForSelector(`${selector}:has-text("${text}")`, options);
  }

  async waitForElementNotVisible(selector, options = {}) {
    await this.page.waitForSelector(selector, { state: 'hidden', ...options });
  }

  async waitForElementVisible(selector, options = {}) {
    await this.page.waitForSelector(selector, { state: 'visible', ...options });
  }

  async waitForElementAttached(selector, options = {}) {
    await this.page.waitForSelector(selector, { state: 'attached', ...options });
  }

  async waitForElementDetached(selector, options = {}) {
    await this.page.waitForSelector(selector, { state: 'detached', ...options });
  }

  async waitForResponseWithStatus(status, options = {}) {
    return await this.page.waitForResponse(
      (response) => response.status() === status,
      options
    );
  }

  async waitForResponseContainingText(text, options = {}) {
    return await this.page.waitForResponse(
      (response) => response.text().then((t) => t.includes(text)),
      options
    );
  }

  async pause() {
    await this.page.pause();
  }
}

module.exports = BasePage;
