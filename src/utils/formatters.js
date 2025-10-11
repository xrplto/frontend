import Decimal from 'decimal.js-light';
import { format, formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import hashicon from 'hashicon';

// ==== NUMBER FORMATTING ====

// Helper function to format decimal with thousand separators
function formatDecimal(decimal, decimalPlaces = null) {
  let str = decimalPlaces !== null ? decimal.toFixed(decimalPlaces) : decimal.toString();
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Trims x numbers after zeroes
const trimDecimal = (num, threshold = 4) => {
  num = typeof num === 'string' ? num : num.toString();
  num = num.includes('e') ? new Decimal(num).toFixed() : num;
  let match = num.match(new RegExp(`^[^.]+\.[0]*[1-9][0-9]{${threshold - 1}}`));
  let ret = match ? match[0] : num;
  return ret;
};

export function fNumber(num, flag = false) {
  if (!num) return 0;

  const strNum = num.toString().trim();

  if (strNum.includes('e')) {
    if (num < 1) {
      return trimDecimal(num);
    }

    if (flag) return trimDecimal(new Decimal(strNum).toFixed());
    else {
      const splitNum = strNum.split('e');
      const result = (
        <span>
          {Number(splitNum[0]).toFixed(2)} x 10<sup>{Number(splitNum[1])}</sup>
        </span>
      );
      return result;
    }
  }
  return fCurrency5(num);
}

export function fNumberWithCurreny(num, exchRate) {
  if (!num || !exchRate) return 0;
  return fCurrency5(new Decimal(num).div(exchRate).toNumber());
}

export function fIntNumber(number) {
  if (number === undefined || number === null || isNaN(number)) return '0';
  return formatDecimal(new Decimal(number), 0);
}

export function fCurrency(number) {
  if (number === undefined || number === null || isNaN(number)) return '0';
  return formatDecimal(new Decimal(number), Number.isInteger(number) ? 0 : 2);
}

export function fCurrency3(number) {
  if (number === undefined || number === null || isNaN(number)) return '0';
  return formatDecimal(new Decimal(number), Number.isInteger(number) ? 0 : 3);
}

export function fCurrency5(number) {
  if (number === undefined || number === null || isNaN(number)) return '0';
  if (number < 1) return trimDecimal(number);
  else if (number < 100) {
    // Use 4 decimals for prices below 100, but trim trailing zeros
    const decimal = new Decimal(number);
    const formatted = decimal.toFixed(4);
    // Remove trailing zeros but keep at least 2 decimals
    let trimmed = formatted.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0*$/, '');

    // Ensure minimum 2 decimal places
    const parts = trimmed.split('.');
    if (parts.length === 1) {
      trimmed = parts[0] + '.00';
    } else if (parts[1].length === 1) {
      trimmed = parts[0] + '.' + parts[1] + '0';
    }

    // Add thousand separators only to the integer part
    const [intPart, decPart] = trimmed.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart ? `${formattedInt}.${decPart}` : formattedInt;
  } else {
    const res = formatDecimal(new Decimal(number), Number.isInteger(number) ? 0 : 2);
    if (res === 'NaN') return 0;
    return res;
  }
}

export function fPercent(number) {
  if (number === undefined || number === null || isNaN(number)) return '0';
  if (number < 1) return trimDecimal(number, 2);
  else {
    const res = formatDecimal(new Decimal(number), Number.isInteger(number) ? 0 : 1);
    if (res === 'NaN') return 0;
    return res;
  }
}

export function fNumberWithSuffix(number) {
  let suffix = '';
  let formattedNumber = '';

  if (typeof number === 'number' && !isNaN(number)) {
    if (Math.abs(number) >= 1e12) {
      suffix = 'T';
      formattedNumber = (number / 1e12).toFixed(0);
    } else if (Math.abs(number) >= 1e9) {
      suffix = 'B';
      formattedNumber = (number / 1e9).toFixed(0);
    } else if (Math.abs(number) >= 1e6) {
      suffix = 'M';
      formattedNumber = (number / 1e6).toFixed(0);
    } else if (Math.abs(number) >= 1e3) {
      suffix = 'K';
      formattedNumber = (number / 1e3).toFixed(0);
    } else {
      formattedNumber = number.toFixed(0);
    }
  } else {
    formattedNumber = number;
  }

  return formattedNumber + suffix;
}

export function fVolume(vol) {
  let cleanVol = vol;
  if (typeof vol === 'string') {
    const match = vol.match(/^-?\d+\.?\d*/);
    cleanVol = match ? match[0] : '0';
  }

  let volume = new Decimal(cleanVol).toNumber();
  if (volume > 1) {
    if (volume >= 1e9) {
      volume = (volume / 1e9).toFixed(2) + 'B';
    } else if (volume >= 1e6) {
      volume = (volume / 1e6).toFixed(2) + 'M';
    } else if (volume >= 1e3) {
      volume = (volume / 1e3).toFixed(2) + 'K';
    } else {
      volume = volume.toFixed(2);
    }
  } else {
    volume = fNumber(volume);
  }
  return volume;
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

export function formatDateTime(time) {
  if (!time) return '';

  try {
    const nDate = new Date(time);
    const year = nDate.getFullYear();
    const month = (nDate.getMonth() + 1).toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false
    });
    const day = nDate
      .getDate()
      .toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
    const hour = nDate
      .getHours()
      .toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
    const min = nDate
      .getMinutes()
      .toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
    const sec = nDate
      .getSeconds()
      .toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

    const strDateTime = `${year}-${month}-${day} ${hour}:${min}:${sec}`;
    return strDateTime;
  } catch (e) {}
  return '';
}

const shortMonthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function formatMonthYear(time) {
  if (!time) return '';

  try {
    const nDate = new Date(time);
    const year = nDate.getFullYear();
    const month = nDate.getMonth() + 1;
    const strMonthYear = `${shortMonthNames[month - 1]} ${year}`;
    return strMonthYear;
  } catch (e) {}
  return '';
}

export function formatMonthYearDate(time) {
  if (!time) return '';

  try {
    const nDate = new Date(time);
    const year = nDate.getFullYear();
    const month = nDate.getMonth() + 1;
    const day = nDate.getDate()
      .toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

    const strMonthYearDate = `${day} ${shortMonthNames[month - 1]} ${year}`;
    return strMonthYearDate;
  } catch (e) {}
  return '';
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