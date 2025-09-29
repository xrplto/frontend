import Decimal from 'decimal.js-light';
import { format, formatDistanceToNow } from 'date-fns';

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
  else {
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