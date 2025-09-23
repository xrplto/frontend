// Lightweight utilities to avoid pulling lodash/lodash-es
// Implementations are minimal and cover this app's usage.

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
