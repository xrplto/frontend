import axios from 'axios';
import hashicon from 'hashicon';

// ==== UTILITY FUNCTIONS ====

export function debounce(fn, wait = 100) {
  let timeout;
  return function debounced(...args) {
    const ctx = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(ctx, args), wait);
  };
}

export function throttle(fn, wait = 100) {
  let last = 0;
  let timeout;
  let lastArgs;
  let lastCtx;
  function run(now) {
    last = now;
    fn.apply(lastCtx, lastArgs);
    lastArgs = lastCtx = undefined;
  }
  function throttled(...args) {
    const now = Date.now();
    const remaining = wait - (now - last);
    lastCtx = this;
    lastArgs = args;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      run(now);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        timeout = undefined;
        run(Date.now());
      }, remaining);
    }
  }
  throttled.cancel = function() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    lastArgs = lastCtx = undefined;
  };
  return throttled;
}

export function isEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  // Handle Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle Array
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle Object
  if (typeof a === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
      if (!isEqual(a[k], b[k])) return false;
    }
    return true;
  }

  // Fallback strict equality for primitives/functions
  return false;
}

// ==== XRPL SPECIFIC HELPERS ====

export function getHashIcon(account) {
  let url = '/static/account_logo.webp';
  try {
    const icon = hashicon(account);
    url = icon.toDataURL();
  } catch (e) {}
  return url;
}

export function checkExpiration(expiration) {
  if (expiration) {
    const now = Date.now();
    const expire = (expiration > 946684800 ? expiration : expiration + 946684800) * 1000;

    if (expire < now) return true;
  } else {
    return false;
  }
}

// ==== API HELPERS ====

export async function getTokens(
  sortBy = 'vol24hxrp',
  sortType = 'desc',
  tags = 'yes',
  showNew = false,
  showSlug = false,
  limit = 100
) {
  const BASE_URL = process.env.API_URL;
  let data = null;
  try {
    const res = await axios.get(
      `${BASE_URL}/tokens?start=0&limit=${limit}&sortBy=${sortBy}&sortType=${sortType}&filter=&tags=${tags}&showNew=${showNew}&showSlug=${showSlug}`
    );

    const essentialTokenFields = [
      'md5',
      'currency',
      'issuer',
      'name',
      'pro24h',
      'pro1h',
      'pro5m',
      'pro7d',
      'vol24hxrp',
      'vol24htx',
      'exch',
      'tags',
      'holders',
      'amount',
      'id',
      'user',
      'slug',
      'date',
      'dateon',
      'tvl',
      'origin',
      'isOMCF',
      'marketcap'
    ];

    data = {
      ...res.data,
      tokens: res.data.tokens.map((token) => {
        const filteredToken = {};
        essentialTokenFields.forEach((field) => {
          if (token[field] !== undefined) {
            filteredToken[field] = token[field];
          }
        });

        // Add calculated fields
        filteredToken.bearbull = token.pro24h < 0 ? -1 : 1;
        filteredToken.time = Date.now();

        return filteredToken;
      })
    };
  } catch (error) {
    console.error(`Error fetching tokens (sortBy: ${sortBy}):`, error);
  }
  return data;
}