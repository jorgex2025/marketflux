const BasePage = require('./base-page');

class FormPage extends BasePage {
  constructor(page) {
    super(page);
    this.url = '/form';
    
    this.selectors = {
      form: '#main-form',
      firstName: '[data-testid="first-name"]',
      lastName: '[data-testid="last-name"]',
      email: '[data-testid="email"]',
      phone: '[data-testid="phone"]',
      country: '[data-testid="country"]',
      gender: {
        male: '[data-testid="gender-male"]',
        female: '[data-testid="gender-female"]',
        other: '[data-testid="gender-other"]',
      },
      interests: {
        sports: '[data-testid="interest-sports"]',
        music: '[data-testid="interest-music"]',
        technology: '[data-testid="interest-technology"]',
        art: '[data-testid="interest-art"]',
      },
      newsletter: '[data-testid="newsletter"]',
      terms: '[data-testid="terms"]',
      submitButton: '[data-testid="submit-btn"]',
      resetButton: '[data-testid="reset-btn"]',
      errors: {
        firstName: '[data-testid="error-first-name"]',
        lastName: '[data-testid="error-last-name"]',
        email: '[data-testid="error-email"]',
        phone: '[data-testid="error-phone"]',
        country: '[data-testid="error-country"]',
        gender: '[data-testid="error-gender"]',
        terms: '[data-testid="error-terms"]',
      },
      successMessage: '[data-testid="success-message"]',
      progressBar: '[data-testid="progress-bar"]',
      fieldset: 'fieldset',
    };
  }

  async navigate() {
    await super.navigate('');
  }

  async fillFirstName(name) {
    await this.fill(this.selectors.firstName, name);
  }

  async fillLastName(name) {
    await this.fill(this.selectors.lastName, name);
  }

  async fillEmail(email) {
    await this.fill(this.selectors.email, email);
  }

  async fillPhone(phone) {
    await this.fill(this.selectors.phone, phone);
  }

  async selectCountry(country) {
    await this.selectOption(this.selectors.country, country);
  }

  async selectGender(gender) {
    const selector = this.selectors.gender[gender.toLowerCase()];
    if (selector) {
      await this.check(selector);
    }
  }

  async toggleInterest(interest) {
    const selector = this.selectors.interests[interest.toLowerCase()];
    if (selector) {
      await this.click(selector);
    }
  }

  async checkNewsletter() {
    await this.check(this.selectors.newsletter);
  }

  async uncheckNewsletter() {
    await this.uncheck(this.selectors.newsletter);
  }

  async acceptTerms() {
    await this.check(this.selectors.terms);
  }

  async declineTerms() {
    await this.uncheck(this.selectors.terms);
  }

  async fillFullForm(data) {
    if (data.firstName) await this.fillFirstName(data.firstName);
    if (data.lastName) await this.fillLastName(data.lastName);
    if (data.email) await this.fillEmail(data.email);
    if (data.phone) await this.fillPhone(data.phone);
    if (data.country) await this.selectCountry(data.country);
    if (data.gender) await this.selectGender(data.gender);
    
    if (data.interests) {
      for (const interest of data.interests) {
        await this.toggleInterest(interest);
      }
    }
    
    if (data.newsletter !== undefined) {
      data.newsletter ? await this.checkNewsletter() : await this.uncheckNewsletter();
    }
    
    if (data.acceptTerms) {
      await this.acceptTerms();
    }
  }

  async submit() {
    await this.click(this.selectors.submitButton);
  }

  async submitAndWaitForResponse() {
    const responsePromise = this.waitForResponseWithStatus(200, { timeout: 15000 });
    await this.click(this.selectors.submitButton);
    await responsePromise;
  }

  async reset() {
    await this.click(this.selectors.resetButton);
  }

  async isGenderSelected(gender) {
    const selector = this.selectors.gender[gender.toLowerCase()];
    if (selector) {
      return await this.isChecked(selector);
    }
    return false;
  }

  async isInterestChecked(interest) {
    const selector = this.selectors.interests[interest.toLowerCase()];
    if (selector) {
      return await this.isChecked(selector);
    }
    return false;
  }

  async isNewsletterChecked() {
    return await this.isChecked(this.selectors.newsletter);
  }

  async isTermsChecked() {
    return await this.isChecked(this.selectors.terms);
  }

  async isSubmitEnabled() {
    return await this.isEnabled(this.selectors.submitButton);
  }

  async isSubmitDisabled() {
    return await this.isDisabled(this.selectors.submitButton);
  }

  async getErrorMessage(field) {
    const selector = this.selectors.errors[field];
    if (selector) {
      return await this.getText(selector);
    }
    return null;
  }

  async isErrorVisible(field) {
    const selector = this.selectors.errors[field];
    if (selector) {
      return await this.isVisible(selector);
    }
    return false;
  }

  async isSuccessMessageVisible() {
    return await this.isVisible(this.selectors.successMessage);
  }

  async getProgressPercentage() {
    const progressText = await this.getText(this.selectors.progressBar);
    const match = progressText.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }

  async waitForSuccessMessage() {
    await this.waitForSelector(this.selectors.successMessage, { state: 'visible', timeout: 10000 });
  }

  async clearFirstName() {
    await this.clear(this.selectors.firstName);
  }

  // Helper method to get locator from selector string (for proper page object pattern)
  getLocator(selector) {
    return this.page.locator(selector);
  }
}

  async clearLastName() {
    await this.clear(this.selectors.lastName);
  }

  async clearEmail() {
    await this.clear(this.selectors.email);
  }

  async clearPhone() {
    await this.clear(this.selectors.phone);
  }

  async clearAllFields() {
    await this.clearFirstName();
    await this.clearLastName();
    await this.clearEmail();
    await this.clearPhone();
    await this.selectOption(this.selectors.country, '');
  }

  async fillFormWithKeyboardNavigation(data) {
    await this.fill(this.selectors.firstName, data.firstName || '');
    await this.pressKey('Tab');
    await this.page.keyboard.type(data.lastName || '');
    await this.pressKey('Tab');
    await this.page.keyboard.type(data.email || '');
    await this.pressKey('Tab');
    await this.page.keyboard.type(data.phone || '');
  }
}

module.exports = FormPage;
