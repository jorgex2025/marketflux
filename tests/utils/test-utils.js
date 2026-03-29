const crypto = require('crypto');

const generateRandomEmail = (domain = 'test.com') => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `user_${timestamp}_${random}@${domain}`;
};

const generateRandomPhone = () => {
  return `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
};

const generateRandomString = (length = 10) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

const generateRandomNumber = (min = 0, max = 100) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateTestData = {
  user: () => ({
    firstName: 'Test',
    lastName: 'User',
    email: generateRandomEmail(),
    phone: generateRandomPhone(),
  }),
  address: () => ({
    street: `${generateRandomNumber(1, 999)} Test Street`,
    city: 'Test City',
    state: 'TS',
    zipCode: generateRandomNumber(10000, 99999).toString(),
    country: 'US',
  }),
  creditCard: () => ({
    number: '4111111111111111',
    expiry: '12/25',
    cvv: '123',
    name: 'Test User',
  }),
};

const wait = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const retry = async (fn, options = {}) => {
  const { maxAttempts = 3, delay = 1000, backoff = 2 } = options;
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await wait(waitTime);
      }
    }
  }
  throw lastError;
};

const retryUntil = async (conditionFn, options = {}) => {
  const { maxAttempts = 10, delay = 500, timeout = 10000 } = options;
  const startTime = Date.now();
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await conditionFn();
    if (result) return true;
    
    if (Date.now() - startTime >= timeout) {
      throw new Error(`Timeout after ${timeout}ms waiting for condition`);
    }
    
    await wait(delay);
  }
  
  return false;
};

const sleep = wait;

const formatDate = (date = new Date()) => {
  return date.toISOString();
};

const parseQueryString = (url) => {
  const queryString = url.split('?')[1];
  if (!queryString) return {};
  
  return queryString.split('&').reduce((acc, param) => {
    const [key, value] = param.split('=');
    acc[decodeURIComponent(key)] = decodeURIComponent(value || '');
    return acc;
  }, {});
};

const buildQueryString = (params) => {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const mergeObjects = (...objects) => {
  return objects.reduce((acc, obj) => {
    Object.keys(obj).forEach(key => {
      if (isObject(acc[key]) && isObject(obj[key])) {
        acc[key] = mergeObjects(acc[key], obj[key]);
      } else {
        acc[key] = obj[key];
      }
    });
    return acc;
  }, {});
};

const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {});
};

const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

const groupBy = (array, key) => {
  return array.reduce((acc, item) => {
    const group = item[key];
    acc[group] = acc[group] || [];
    acc[group].push(item);
    return acc;
  }, {});
};

const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const unique = (array) => {
  return [...new Set(array)];
};

const flatten = (array) => {
  return array.reduce((acc, val) => 
    Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), 
  []
  );
};

const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const throttle = (fn, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

module.exports = {
  generateRandomEmail,
  generateRandomPhone,
  generateRandomString,
  generateRandomNumber,
  generateTestData,
  wait,
  retry,
  retryUntil,
  sleep,
  formatDate,
  parseQueryString,
  buildQueryString,
  truncateText,
  sanitizeFilename,
  deepClone,
  mergeObjects,
  pick,
  omit,
  groupBy,
  chunk,
  unique,
  flatten,
  debounce,
  throttle,
};
