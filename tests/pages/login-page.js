const BasePage = require('./base-page');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.url = '/login';
    
    this.selectors = {
      form: '#login-form',
      emailInput: '[data-testid="login-email"]',
      passwordInput: '[data-testid="login-password"]',
      submitButton: '[data-testid="login-submit"]',
      rememberMe: '[data-testid="login-remember"]',
      forgotPassword: '[data-testid="login-forgot-password"]',
      socialLogin: {
        google: '[data-testid="social-google"]',
        facebook: '[data-testid="social-facebook"]',
        github: '[data-testid="social-github"]',
      },
      links: {
        signUp: '[data-testid="login-signup-link"]',
        forgotPassword: '[data-testid="forgot-password-link"]',
      },
      errors: {
        email: '[data-testid="error-email"]',
        password: '[data-testid="error-password"]',
        general: '[data-testid="error-general"]',
      },
      messages: {
        success: '[data-testid="message-success"]',
        loading: '[data-testid="message-loading"]',
      },
    };
  }

  async navigate() {
    await super.navigate('');
  }

  async fillEmail(email) {
    await this.fill(this.selectors.emailInput, email);
  }

  async fillPassword(password) {
    await this.fill(this.selectors.passwordInput, password);
  }

  async fillLoginForm(email, password, rememberMe = false) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    if (rememberMe) {
      await this.check(this.selectors.rememberMe);
    }
  }

  async submit() {
    await this.click(this.selectors.submitButton);
    await this.waitForNavigation({ waitUntil: 'networkidle' });
  }

  async submitAndWaitForResponse() {
    const responsePromise = this.waitForResponseWithStatus(200, { timeout: 10000 });
    await this.click(this.selectors.submitButton);
    await responsePromise;
  }

  async login(email, password, rememberMe = false) {
    await this.fillLoginForm(email, password, rememberMe);
    await this.submit();
  }

  async loginWithCredentials(email, password) {
    await this.fill(this.selectors.emailInput, email);
    await this.fill(this.selectors.passwordInput, password);
    
    const [response] = await Promise.all([
      this.waitForResponse((res) => res.url().includes('/api/auth/login') && res.status() === 200),
      this.click(this.selectors.submitButton),
    ]);
    
    return response;
  }

  async isRememberMeChecked() {
    return await this.isChecked(this.selectors.rememberMe);
  }

  async toggleRememberMe() {
    await this.click(this.selectors.rememberMe);
  }

  async clickForgotPassword() {
    await this.click(this.selectors.forgotPassword);
  }

  async clickSignUpLink() {
    await this.click(this.selectors.links.signUp);
  }

  async loginWithGoogle() {
    await this.click(this.selectors.socialLogin.google);
  }

  async loginWithFacebook() {
    await this.click(this.selectors.socialLogin.facebook);
  }

  async loginWithGithub() {
    await this.click(this.selectors.socialLogin.github);
  }

  async getEmailError() {
    return await this.getText(this.selectors.errors.email);
  }

  async getPasswordError() {
    return await this.getText(this.selectors.errors.password);
  }

  async getGeneralError() {
    return await this.getText(this.selectors.errors.general);
  }

  async isEmailErrorVisible() {
    return await this.isVisible(this.selectors.errors.email);
  }

  async isPasswordErrorVisible() {
    return await this.isVisible(this.selectors.errors.password);
  }

  async isGeneralErrorVisible() {
    return await this.isVisible(this.selectors.errors.general);
  }

  async isSubmitButtonEnabled() {
    return await this.isEnabled(this.selectors.submitButton);
  }

  async isSubmitButtonDisabled() {
    return await this.isDisabled(this.selectors.submitButton);
  }

  async waitForLoginSuccess() {
    await this.waitForSelector(this.selectors.messages.success, { state: 'visible', timeout: 10000 });
  }

  async isLoginSuccessMessageVisible() {
    return await this.isVisible(this.selectors.messages.success);
  }

  async clearForm() {
    await this.clear(this.selectors.emailInput);
    await this.clear(this.selectors.passwordInput);
  }

  async getInputEmailValue() {
    return await this.getInputValue(this.selectors.emailInput);
  }

  async getInputPasswordValue() {
    return await this.getInputValue(this.selectors.passwordInput);
  }

  async pressEnterToSubmit() {
    await this.pressKey('Enter');
  }

  async tabToPassword() {
    await this.pressKey('Tab');
  }

  async tabToSubmit() {
    await this.pressKey('Tab');
    await this.pressKey('Tab');
  }
}

module.exports = LoginPage;
