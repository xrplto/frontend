import { format, formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import hashicon from 'hashicon';

// ==== NUMBER FORMATTING ====

export function fNumber(num) {
  if (!num) return '0';
  if (num < 1) return num.toFixed(4);
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function fIntNumber(number) {
  if (number === undefined || number === null || isNaN(number)) return '0';
  return Math.round(number).toLocaleString('en-US');
}

export function fVolume(vol) {
  const volume = typeof vol === 'string' ? parseFloat(vol) || 0 : vol;
  if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
  if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
  if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
  if (volume > 1) return volume.toFixed(2);
  return volume.toFixed(4);
}

// ==== DATE/TIME FORMATTING ====

export function fDate(date) {
  if (!date) return '';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  return format(dateObj, 'dd MMMM yyyy');
}

export function fDateTime(date) {
  if (!date) return '';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  return format(dateObj, 'dd MMM yyyy HH:mm');
}

export function fDateTimeSuffix(date) {
  if (!date) return '';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  return format(dateObj, 'dd/MM/yyyy hh:mm p');
}

export function fToNow(date) {
  if (!date) return '';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  return formatDistanceToNow(dateObj, {
    addSuffix: true
  });
}

const pad = (n) => String(n).padStart(2, '0');
const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDateTime(time) {
  if (!time) return '';
  try {
    const d = new Date(time);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch (e) {
    return '';
  }
}

export function formatMonthYear(time) {
  if (!time) return '';
  try {
    const d = new Date(time);
    return `${shortMonths[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return '';
  }
}

export function formatMonthYearDate(time) {
  if (!time) return '';
  try {
    const d = new Date(time);
    return `${pad(d.getDate())} ${shortMonths[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return '';
  }
}

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
  let timeout, lastRan;
  return function(...args) {
    if (!lastRan) {
      fn.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (Date.now() - lastRan >= wait) {
          fn.apply(this, args);
          lastRan = Date.now();
        }
      }, wait - (Date.now() - lastRan));
    }
  };
}

export function isEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null || typeof a !== typeof b) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!isEqual(a[i], b[i])) return false;
    return true;
  }

  if (typeof a === 'object') {
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    for (const k of keys) if (!b.hasOwnProperty(k) || !isEqual(a[k], b[k])) return false;
    return true;
  }

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
  if (!expiration) return false;
  const expire = (expiration > 946684800 ? expiration : expiration + 946684800) * 1000;
  return expire < Date.now();
}

// ==== API HELPERS ====

const essentialFields = ['md5', 'currency', 'issuer', 'name', 'pro24h', 'pro1h', 'pro5m', 'pro7d',
  'vol24hxrp', 'vol24htx', 'exch', 'tags', 'holders', 'amount', 'id', 'user', 'slug', 'date',
  'dateon', 'tvl', 'origin', 'isOMCF', 'marketcap'];

export async function getTokens(sortBy = 'vol24hxrp', sortType = 'desc', tags = 'yes',
  showNew = false, showSlug = false, limit = 100) {
  try {
    const res = await axios.get(`${process.env.API_URL}/tokens`, {
      params: { start: 0, limit, sortBy, sortType, filter: '', tags, showNew, showSlug }
    });

    return {
      ...res.data,
      tokens: res.data.tokens.map(token => ({
        ...essentialFields.reduce((acc, f) => (token[f] !== undefined && (acc[f] = token[f]), acc), {}),
        bearbull: token.pro24h < 0 ? -1 : 1,
        time: Date.now()
      }))
    };
  } catch (error) {
    console.error(`Error fetching tokens (${sortBy}):`, error);
    return null;
  }
}