const { test as base } = require('@playwright/test');
const { HomePage, LoginPage, FormPage } = require('./pages');

const testData = {
  validUser: {
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'John',
    lastName: 'Doe',
  },
  invalidUsers: {
    noEmail: {
      email: '',
      password: 'Password123!',
      expectedError: 'Email is required',
    },
    invalidEmail: {
      email: 'invalid-email',
      password: 'Password123!',
      expectedError: 'Please enter a valid email',
    },
    noPassword: {
      email: 'test@example.com',
      password: '',
      expectedError: 'Password is required',
    },
    shortPassword: {
      email: 'test@example.com',
      password: '123',
      expectedError: 'Password must be at least 8 characters',
    },
  },
  formData: {
    valid: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      country: 'US',
      gender: 'male',
      interests: ['sports', 'technology'],
      newsletter: true,
      acceptTerms: true,
    },
    partial: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
    },
    invalid: {
      firstName: '',
      lastName: '',
      email: 'invalid',
      phone: 'abc',
      country: '',
    },
  },
  searchQueries: [
    'playwright',
    'testing',
    'automation',
    'web development',
  ],
  navigationLinks: [
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' },
    { name: 'Contact', url: '/contact' },
    { name: 'Services', url: '/services' },
  ],
};

const createPageObjects = (page) => ({
  homePage: new HomePage(page),
  loginPage: new LoginPage(page),
  formPage: new FormPage(page),
});

const extendedTest = base.extend({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  formPage: async ({ page }, use) => {
    const formPage = new FormPage(page);
    await use(formPage);
  },
  testData: async ({}, use) => {
    await use(testData);
  },
  createPageObjects: async ({ page }, use) => {
    await use((page) => createPageObjects(page));
  },
});

module.exports = {
  test: extendedTest,
  expect: base.expect,
  testData,
  createPageObjects,
};
