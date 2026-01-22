import { format, formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
import axios from 'axios';
import hashicon from 'hashicon';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// ==== THEME COMPATIBILITY ====

// Alpha helper - converts hex color to rgba with opacity
export function alpha(color, opacity) {
  if (!color) return `rgba(0, 0, 0, ${opacity})`;
  if (color.startsWith('rgba')) return color.replace(/[\d.]+\)$/, `${opacity})`);
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

// MUI-compatible useTheme hook for legacy code
export function useTheme() {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  return {
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: { main: '#4285f4', light: '#6ba3f7', dark: '#2d5bb7' },
      secondary: { main: '#8B92A8' },
      success: { main: '#10b981' },
      warning: { main: '#f59e0b' },
      error: { main: '#ef4444' },
      info: { main: '#3b82f6' },
      text: {
        primary: isDark ? '#ffffff' : '#000000',
        secondary: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
      },
      background: {
        default: isDark ? '#000000' : '#ffffff',
        paper: isDark ? '#111111' : '#ffffff'
      },
      divider: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    }
  };
}

// ==== NUMBER FORMATTING ====

export function fNumber(num) {
  if (!num) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  if (n < 1) return n.toFixed(4);
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function fIntNumber(number) {
  if (number === undefined || number === null || isNaN(number)) return '0';
  return Math.round(number).toLocaleString('en-US');
}

export function fVolume(vol) {
  if (vol === undefined || vol === null) return '0';
  const volume = typeof vol === 'string' ? parseFloat(vol) || 0 : vol;
  if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
  if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
  if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
  if (volume > 1) return volume.toFixed(2);
  return volume.toFixed(4);
}

export function fCurrency5(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';

  // For very large numbers, use abbreviated format
  const absN = Math.abs(n);
  if (absN >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (absN >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (absN >= 1e3) return (n / 1e3).toFixed(2) + 'K';

  // For smaller numbers, show 2 decimal places for values >= 1
  if (absN >= 1) return n.toFixed(2);

  // For very small numbers, show more precision
  if (absN > 0 && absN < 0.0001) return n.toFixed(10);
  if (absN > 0 && absN < 0.01) return n.toFixed(8);

  // Default to 4 decimal places
  return n.toFixed(4);
}

export function fPercent(value) {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';

  // For percentages, show 2 decimal places
  return `${num.toFixed(2)}%`;
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

export { formatDistanceToNowStrict };

const pad = (n) => String(n).padStart(2, '0');
const shortMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

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

export function throttle(fn, wait = 100) {
  let timeout, lastRan;
  return function (...args) {
    if (!lastRan) {
      fn.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(
        () => {
          if (Date.now() - lastRan >= wait) {
            fn.apply(this, args);
            lastRan = Date.now();
          }
        },
        wait - (Date.now() - lastRan)
      );
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
  const fallback = '/static/account_logo.webp';
  if (typeof window === 'undefined' || !account) return fallback;
  try {
    const icon = hashicon(account, { size: 64 });
    return icon.toDataURL();
  } catch (e) {
    return fallback;
  }
}

export function checkExpiration(expiration) {
  if (!expiration) return false;
  const expire = (expiration > 946684800 ? expiration : expiration + 946684800) * 1000;
  return expire < Date.now();
}

// ==== API HELPERS ====

const essentialFields = [
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
  'marketcap',
  'tokenType',
  'mptIssuanceID',
  'metadata'
];

export async function getTokens(
  sortBy = 'vol24hxrp',
  sortType = 'desc',
  tags = 'yes',
  showNew = false,
  showSlug = false,
  limit = 100,
  tokenType = ''
) {
  try {
    const params = { start: 0, limit, sortBy, sortType, filter: '', tags, showNew, showSlug };
    if (tokenType) params.tokenType = tokenType;
    const res = await axios.get('https://api.xrpl.to/v1/tokens', { params });

    return {
      ...res.data,
      tokens: res.data.tokens.map((token) => ({
        ...essentialFields.reduce(
          (acc, f) => (token[f] !== undefined && (acc[f] = token[f]), acc),
          {}
        ),
        bearbull: token.pro24h < 0 ? -1 : 1,
        time: Date.now()
      }))
    };
  } catch (error) {
    console.error(`Error fetching tokens (${sortBy}):`, error);
    return null;
  }
}
