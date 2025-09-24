import { format, formatDistanceToNow } from 'date-fns';

// ----------------------------------------------------------------------

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

    //const strTime = (new Date(date)).toLocaleTimeString('en-US', { hour12: false });
    //const strTime = nDate.format("YYYY-MM-DD HH:mm:ss");
    const strDateTime = `${year}-${month}-${day} ${hour}:${min}:${sec}`;
    // const strTime = `${hour}:${min}:${sec}`;
    return strDateTime;
  } catch (e) {}
  return '';
}

export function formatMonthYear(time) {
  if (!time) return '';

  const longMonthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  const shortMonthNames = [
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

    //const strTime = (new Date(date)).toLocaleTimeString('en-US', { hour12: false });
    //const strTime = nDate.format("YYYY-MM-DD HH:mm:ss");
    const strMonthYear = `${shortMonthNames[month - 1]} ${year}`;
    return strMonthYear;
  } catch (e) {}
  return '';
}

export function formatMonthYearDate(time) {
  if (!time) return '';

  const longMonthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  const shortMonthNames = [
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

    //const strTime = (new Date(date)).toLocaleTimeString('en-US', { hour12: false });
    //const strTime = nDate.format("YYYY-MM-DD HH:mm:ss");
    const strMonthYearDate = `${day} ${shortMonthNames[month - 1]} ${year}`;
    return strMonthYearDate;
  } catch (e) {}
  return '';
}
