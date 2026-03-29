const BasePage = require('./base-page');

class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.url = '/';
    
    this.selectors = {
      welcomeTitle: 'h1',
      welcomeMessage: '[data-testid="welcome-message"]',
      navigation: {
        home: '[data-testid="nav-home"]',
        about: '[data-testid="nav-about"]',
        contact: '[data-testid="nav-contact"]',
        services: '[data-testid="nav-services"]',
      },
      buttons: {
        primary: '.btn-primary',
        secondary: '.btn-secondary',
        getStarted: '[data-testid="btn-get-started"]',
        learnMore: '[data-testid="btn-learn-more"]',
      },
      forms: {
        search: '[data-testid="search-input"]',
        newsletter: '[data-testid="newsletter-form"]',
      },
      content: {
        featureCards: '[data-testid="feature-card"]',
        testimonialCards: '[data-testid="testimonial-card"]',
      },
      footer: {
        links: 'footer a',
        copyright: '[data-testid="footer-copyright"]',
      },
    };
  }

  async navigate() {
    await super.navigate('');
  }

  async getWelcomeTitle() {
    return await this.getText(this.selectors.welcomeTitle);
  }

  async getWelcomeMessage() {
    return await this.getText(this.selectors.welcomeMessage);
  }

  async clickNavigationLink(name) {
    const selector = this.selectors.navigation[name.toLowerCase()];
    if (selector) {
      await this.click(selector);
    }
  }

  async clickPrimaryButton() {
    await this.click(this.selectors.buttons.primary);
  }

  async clickSecondaryButton() {
    await this.click(this.selectors.buttons.secondary);
  }

  async clickGetStarted() {
    await this.click(this.selectors.buttons.getStarted);
  }

  async clickLearnMore() {
    await this.click(this.selectors.buttons.learnMore);
  }

  async search(query) {
    await this.fill(this.selectors.forms.search, query);
    await this.pressKey('Enter');
  }

  async subscribeNewsletter(email) {
    await this.fill(this.selectors.forms.newsletter + ' input[type="email"]', email);
    await this.click(this.selectors.forms.newsletter + ' button[type="submit"]');
  }

  async getFeatureCards() {
    return await this.count(this.selectors.content.featureCards);
  }

  async getTestimonialCards() {
    return await this.count(this.selectors.content.testimonialCards);
  }

  async getFooterLinks() {
    const elements = await this.page.$$(this.selectors.footer.links);
    return Promise.all(elements.map(el => el.textContent()));
  }

  async isFeatureCardVisible(index = 0) {
    return await this.isVisible(`${this.selectors.content.featureCards}:nth-child(${index + 1})`);
  }

  async hoverFeatureCard(index = 0) {
    await this.hover(`${this.selectors.content.featureCards}:nth-child(${index + 1})`);
  }
}

module.exports = HomePage;
