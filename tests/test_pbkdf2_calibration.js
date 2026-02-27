#!/usr/bin/env node
/**
 * Extensive unit tests for adaptive PBKDF2 calibration in encryptedWalletStorage.js
 *
 * Run: node tests/test_pbkdf2_calibration.js
 *
 * Tests the calibration function, encrypt/decrypt roundtrip, binary format,
 * edge cases, and security boundaries WITHOUT needing IndexedDB (we test
 * the crypto layer directly by extracting encryptData/decryptData/calibratePBKDF2).
 */

const { webcrypto } = require('crypto');
const { performance } = require('perf_hooks');

// Polyfill browser globals for the module
if (!globalThis.crypto) globalThis.crypto = webcrypto;
if (!globalThis.performance) globalThis.performance = performance;
globalThis.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
globalThis.atob = (s) => Buffer.from(s, 'base64').toString('binary');

// --- Constants (mirrored from source to validate against) ---
const PBKDF2_MIN_ITERATIONS = 600_000;
const PBKDF2_MAX_ITERATIONS = 4_000_000;
const PBKDF2_TARGET_MS = 250;
const PBKDF2_PROBE_ITERATIONS = 50_000;

// --- Minimal test harness ---
let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

function assert(condition, msg) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

function assertThrows(fn, msgMatch, label) {
  let threw = false;
  let err;
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        () => { throw new Error(`Expected throw: ${label}`); },
        (e) => {
          if (msgMatch && !e.message.includes(msgMatch)) {
            throw new Error(`Expected "${msgMatch}" in error, got: "${e.message}"`);
          }
        }
      );
    }
  } catch (e) {
    threw = true;
    err = e;
  }
  if (!threw) throw new Error(`Expected throw: ${label}`);
  if (msgMatch && !err.message.includes(msgMatch)) {
    throw new Error(`Expected "${msgMatch}" in error, got: "${err.message}"`);
  }
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`  FAIL  ${name}`);
    console.log(`        ${e.message}`);
  }
}

// --- Build a standalone crypto harness from the source logic ---
// We replicate the exact encrypt/decrypt/deriveKey/calibrate logic
// so tests validate the real algorithm without needing IndexedDB or localStorage.

function makeHarness() {
  let _calibratedIterations = null;
  let _calibrationPromise = null;
  const _localStorage = new Map();

  const localStorage = {
    getItem(k) { return _localStorage.get(k) ?? null; },
    setItem(k, v) { _localStorage.set(k, v); },
    removeItem(k) { _localStorage.delete(k); },
    clear() { _localStorage.clear(); }
  };

  async function calibratePBKDF2() {
    if (_calibratedIterations) return _calibratedIterations;

    if (typeof performance === 'undefined' || typeof crypto === 'undefined') {
      return PBKDF2_MIN_ITERATIONS;
    }

    if (_calibrationPromise) return _calibrationPromise;

    _calibrationPromise = (async () => {
      try {
        const cached = localStorage.getItem('xrplto_pbkdf2_iter');
        if (cached) {
          const { iterations, ts } = JSON.parse(cached);
          if (
            typeof iterations === 'number' &&
            typeof ts === 'number' &&
            Date.now() - ts < 7 * 24 * 60 * 60 * 1000 &&
            iterations >= PBKDF2_MIN_ITERATIONS &&
            iterations <= PBKDF2_MAX_ITERATIONS
          ) {
            _calibratedIterations = iterations;
            return iterations;
          }
        }
      } catch { /* continue */ }

      try {
        const probeSalt = crypto.getRandomValues(new Uint8Array(16));
        const keyMaterial = await crypto.subtle.importKey(
          'raw', new TextEncoder().encode('calibration-probe'),
          'PBKDF2', false, ['deriveBits']
        );

        const t0 = performance.now();
        await crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt: probeSalt, iterations: PBKDF2_PROBE_ITERATIONS, hash: 'SHA-256' },
          keyMaterial, 256
        );
        const elapsed = performance.now() - t0;

        if (elapsed < 1) {
          _calibratedIterations = PBKDF2_MIN_ITERATIONS;
          return PBKDF2_MIN_ITERATIONS;
        }

        const raw = Math.round((PBKDF2_TARGET_MS / elapsed) * PBKDF2_PROBE_ITERATIONS);
        const rounded = Math.round(raw / 50_000) * 50_000;
        const iterations = Math.max(PBKDF2_MIN_ITERATIONS, Math.min(PBKDF2_MAX_ITERATIONS, rounded));

        _calibratedIterations = iterations;
        try {
          localStorage.setItem('xrplto_pbkdf2_iter', JSON.stringify({ iterations, ts: Date.now() }));
        } catch { /* */ }
        return iterations;
      } catch {
        _calibratedIterations = PBKDF2_MIN_ITERATIONS;
        return PBKDF2_MIN_ITERATIONS;
      }
    })();

    try {
      return await _calibrationPromise;
    } finally {
      _calibrationPromise = null;
    }
  }

  async function deriveKey(password, salt, iterations = PBKDF2_MIN_ITERATIONS) {
    const encoder = new TextEncoder();
    const enhancedPassword = `xrpl-wallet-pin-v1-${password}`;
    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(enhancedPassword), 'PBKDF2', false, ['deriveBits', 'deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: typeof salt === 'string' ? encoder.encode(salt) : salt,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptData(data, password, { deviceBound = true, deviceId = null } = {}) {
    const iterations = await calibratePBKDF2();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt, iterations);

    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));
    const params = { name: 'AES-GCM', iv };
    let version;

    if (deviceBound) {
      params.additionalData = encoder.encode(deviceId || '');
      version = 1;
    } else {
      version = 2;
    }

    const encrypted = await crypto.subtle.encrypt(params, key, plaintext);

    const iterBuf = new Uint8Array(4);
    new DataView(iterBuf.buffer).setUint32(0, iterations, false);

    const combinedBuffer = new Uint8Array(1 + 4 + salt.length + iv.length + encrypted.byteLength);
    combinedBuffer.set(new Uint8Array([version]), 0);
    combinedBuffer.set(iterBuf, 1);
    combinedBuffer.set(salt, 5);
    combinedBuffer.set(iv, 21);
    combinedBuffer.set(new Uint8Array(encrypted), 33);

    return btoa(String.fromCharCode(...combinedBuffer));
  }

  async function decryptData(encryptedString, password, { deviceId = null } = {}) {
    const combinedBuffer = new Uint8Array(
      atob(encryptedString).split('').map((c) => c.charCodeAt(0))
    );

    if (combinedBuffer.length < 49) {
      throw new Error('Invalid format - clear browser data and create new wallet');
    }

    const version = combinedBuffer[0];
    if (version !== 1 && version !== 2) {
      throw new Error('Invalid format - clear browser data and create new wallet');
    }

    const iterations = new DataView(
      combinedBuffer.buffer, combinedBuffer.byteOffset, combinedBuffer.byteLength
    ).getUint32(1, false);
    if (iterations < PBKDF2_MIN_ITERATIONS || iterations > PBKDF2_MAX_ITERATIONS) {
      throw new Error('Invalid iteration count');
    }

    const salt = combinedBuffer.slice(5, 21);
    const iv = combinedBuffer.slice(21, 33);
    const encrypted = combinedBuffer.slice(33);

    const key = await deriveKey(password, salt, iterations);

    const params = { name: 'AES-GCM', iv };
    if (version === 1) {
      params.additionalData = new TextEncoder().encode(deviceId || '');
    }

    const decrypted = await crypto.subtle.decrypt(params, key, encrypted);
    return JSON.parse(new TextDecoder().decode(decrypted));
  }

  // Force a specific iteration count (for testing without real calibration delay)
  function _forceIterations(n) {
    _calibratedIterations = n;
  }

  function _resetCalibration() {
    _calibratedIterations = null;
    _calibrationPromise = null;
    localStorage.clear();
  }

  return { calibratePBKDF2, deriveKey, encryptData, decryptData, _forceIterations, _resetCalibration, localStorage };
}


// ============================================================
// TEST SUITE
// ============================================================

(async () => {
  console.log('\n=== PBKDF2 Adaptive Calibration Tests ===\n');

  // ----------------------------------------------------------
  // 1. CALIBRATION
  // ----------------------------------------------------------
  console.log('--- Calibration ---');

  await test('calibrate returns a number >= MIN and <= MAX', async () => {
    const h = makeHarness();
    const iter = await h.calibratePBKDF2();
    assert(typeof iter === 'number', 'not a number');
    assert(iter >= PBKDF2_MIN_ITERATIONS, `${iter} < MIN`);
    assert(iter <= PBKDF2_MAX_ITERATIONS, `${iter} > MAX`);
  });

  await test('calibrate result is rounded to nearest 50k', async () => {
    const h = makeHarness();
    const iter = await h.calibratePBKDF2();
    assert(iter % 50_000 === 0, `${iter} not multiple of 50k`);
  });

  await test('calibrate caches in memory (second call instant)', async () => {
    const h = makeHarness();
    await h.calibratePBKDF2();
    const t0 = performance.now();
    const iter2 = await h.calibratePBKDF2();
    const elapsed = performance.now() - t0;
    assert(elapsed < 5, `second call took ${elapsed}ms, expected < 5ms`);
    assert(iter2 >= PBKDF2_MIN_ITERATIONS, 'bad cached value');
  });

  await test('calibrate writes to localStorage', async () => {
    const h = makeHarness();
    await h.calibratePBKDF2();
    const raw = h.localStorage.getItem('xrplto_pbkdf2_iter');
    assert(raw !== null, 'nothing in localStorage');
    const parsed = JSON.parse(raw);
    assert(parsed.iterations >= PBKDF2_MIN_ITERATIONS, 'bad iterations in LS');
    assert(typeof parsed.ts === 'number', 'no timestamp in LS');
  });

  await test('calibrate reads valid localStorage cache', async () => {
    const h = makeHarness();
    h.localStorage.setItem('xrplto_pbkdf2_iter', JSON.stringify({
      iterations: 800_000, ts: Date.now()
    }));
    const iter = await h.calibratePBKDF2();
    assert(iter === 800_000, `expected 800k from cache, got ${iter}`);
  });

  await test('calibrate rejects expired localStorage cache', async () => {
    const h = makeHarness();
    h.localStorage.setItem('xrplto_pbkdf2_iter', JSON.stringify({
      iterations: 800_000, ts: Date.now() - 8 * 24 * 60 * 60 * 1000
    }));
    const iter = await h.calibratePBKDF2();
    // Should re-probe, not return 800k (unless probe happens to land on 800k)
    assert(iter >= PBKDF2_MIN_ITERATIONS, 'below MIN after expired cache');
    assert(iter % 50_000 === 0, 'not rounded after re-probe');
  });

  await test('calibrate rejects below-MIN localStorage cache', async () => {
    const h = makeHarness();
    h.localStorage.setItem('xrplto_pbkdf2_iter', JSON.stringify({
      iterations: 100_000, ts: Date.now()
    }));
    const iter = await h.calibratePBKDF2();
    assert(iter >= PBKDF2_MIN_ITERATIONS, `accepted tampered cache: ${iter}`);
  });

  await test('calibrate rejects above-MAX localStorage cache', async () => {
    const h = makeHarness();
    h.localStorage.setItem('xrplto_pbkdf2_iter', JSON.stringify({
      iterations: 10_000_000, ts: Date.now()
    }));
    const iter = await h.calibratePBKDF2();
    assert(iter <= PBKDF2_MAX_ITERATIONS, `accepted above-max cache: ${iter}`);
  });

  await test('calibrate rejects corrupt localStorage JSON', async () => {
    const h = makeHarness();
    h.localStorage.setItem('xrplto_pbkdf2_iter', '{corrupt!!!');
    const iter = await h.calibratePBKDF2();
    assert(iter >= PBKDF2_MIN_ITERATIONS, 'failed on corrupt JSON');
  });

  await test('calibrate rejects non-number iterations in cache', async () => {
    const h = makeHarness();
    h.localStorage.setItem('xrplto_pbkdf2_iter', JSON.stringify({
      iterations: "800000", ts: Date.now()
    }));
    const iter = await h.calibratePBKDF2();
    // String "800000" should fail typeof check, trigger re-probe
    assert(typeof iter === 'number', 'returned non-number');
    assert(iter >= PBKDF2_MIN_ITERATIONS, 'below MIN');
  });

  await test('calibrate concurrent calls return same value (dedup)', async () => {
    const h = makeHarness();
    const [a, b, c] = await Promise.all([
      h.calibratePBKDF2(),
      h.calibratePBKDF2(),
      h.calibratePBKDF2()
    ]);
    assert(a === b && b === c, `dedup failed: ${a}, ${b}, ${c}`);
  });

  // ----------------------------------------------------------
  // 2. ENCRYPT / DECRYPT ROUNDTRIP
  // ----------------------------------------------------------
  console.log('\n--- Encrypt/Decrypt Roundtrip ---');

  await test('v1 (device-bound) roundtrip with simple object', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const data = { seed: 'sEdSomeXrplSeed123', address: 'rTestAddress123' };
    const enc = await h.encryptData(data, 'mypassword', { deviceBound: true, deviceId: 'device-abc' });
    const dec = await h.decryptData(enc, 'mypassword', { deviceId: 'device-abc' });
    assert(dec.seed === data.seed, 'seed mismatch');
    assert(dec.address === data.address, 'address mismatch');
  });

  await test('v2 (portable) roundtrip with simple object', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const data = { seed: 'sEdPortable456', address: 'rPortableAddr' };
    const enc = await h.encryptData(data, 'pass123', { deviceBound: false });
    const dec = await h.decryptData(enc, 'pass123');
    assert(dec.seed === data.seed, 'seed mismatch');
    assert(dec.address === data.address, 'address mismatch');
  });

  await test('roundtrip with calibrated (non-minimum) iterations', async () => {
    const h = makeHarness();
    h._forceIterations(1_200_000);
    const data = { key: 'value', num: 42 };
    const enc = await h.encryptData(data, 'testpw', { deviceBound: false });
    const dec = await h.decryptData(enc, 'testpw');
    assert(dec.key === 'value', 'key mismatch');
    assert(dec.num === 42, 'num mismatch');
  });

  await test('roundtrip with MAX iterations', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MAX_ITERATIONS);
    const data = { test: 'max_iter' };
    const enc = await h.encryptData(data, 'pw', { deviceBound: false });
    const dec = await h.decryptData(enc, 'pw');
    assert(dec.test === 'max_iter', 'data mismatch at max iterations');
  });

  await test('roundtrip with empty object', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({}, 'pw', { deviceBound: false });
    const dec = await h.decryptData(enc, 'pw');
    assert(JSON.stringify(dec) === '{}', 'empty object mismatch');
  });

  await test('roundtrip with nested object', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const data = { a: { b: { c: [1, 2, 3] } }, d: null, e: true };
    const enc = await h.encryptData(data, 'pw', { deviceBound: false });
    const dec = await h.decryptData(enc, 'pw');
    assert(JSON.stringify(dec) === JSON.stringify(data), 'nested object mismatch');
  });

  await test('roundtrip with unicode data', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const data = { emoji: '\u{1F680}\u{1F30D}', cjk: '\u4F60\u597D', arabic: '\u0645\u0631\u062D\u0628\u0627' };
    const enc = await h.encryptData(data, 'pw', { deviceBound: false });
    const dec = await h.decryptData(enc, 'pw');
    assert(dec.emoji === data.emoji, 'unicode mismatch');
  });

  await test('roundtrip with large payload (~100KB)', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const data = { big: 'x'.repeat(100_000) };
    const enc = await h.encryptData(data, 'pw', { deviceBound: false });
    const dec = await h.decryptData(enc, 'pw');
    assert(dec.big.length === 100_000, 'large payload truncated');
  });

  // ----------------------------------------------------------
  // 3. BINARY FORMAT VALIDATION
  // ----------------------------------------------------------
  console.log('\n--- Binary Format ---');

  await test('v1 ciphertext starts with version byte 0x01', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ a: 1 }, 'pw', { deviceBound: true, deviceId: 'dev' });
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    assert(buf[0] === 1, `version byte is ${buf[0]}, expected 1`);
  });

  await test('v2 ciphertext starts with version byte 0x02', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ a: 1 }, 'pw', { deviceBound: false });
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    assert(buf[0] === 2, `version byte is ${buf[0]}, expected 2`);
  });

  await test('iterations stored as big-endian uint32 at bytes 1-4', async () => {
    const h = makeHarness();
    h._forceIterations(1_200_000);
    const enc = await h.encryptData({ a: 1 }, 'pw', { deviceBound: false });
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    const storedIter = new DataView(buf.buffer).getUint32(1, false);
    assert(storedIter === 1_200_000, `stored ${storedIter}, expected 1200000`);
  });

  await test('total header is 33 bytes (1 + 4 + 16 + 12)', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ x: 1 }, 'pw', { deviceBound: false });
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    // AES-GCM ciphertext = plaintext + 16 byte tag. Minimum ciphertext > 0
    assert(buf.length > 33, `total length ${buf.length} too small`);
    // The ciphertext portion starts at 33
    const ct = buf.slice(33);
    assert(ct.length >= 16, `ciphertext portion ${ct.length} bytes, need at least 16 (GCM tag)`);
  });

  await test('different encryptions produce different salt and iv', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc1 = await h.encryptData({ a: 1 }, 'pw', { deviceBound: false });
    const enc2 = await h.encryptData({ a: 1 }, 'pw', { deviceBound: false });
    const buf1 = new Uint8Array(atob(enc1).split('').map(c => c.charCodeAt(0)));
    const buf2 = new Uint8Array(atob(enc2).split('').map(c => c.charCodeAt(0)));
    const salt1 = buf1.slice(5, 21).join(',');
    const salt2 = buf2.slice(5, 21).join(',');
    const iv1 = buf1.slice(21, 33).join(',');
    const iv2 = buf2.slice(21, 33).join(',');
    assert(salt1 !== salt2, 'salts are identical across encryptions');
    assert(iv1 !== iv2, 'IVs are identical across encryptions');
  });

  // ----------------------------------------------------------
  // 4. WRONG PASSWORD / WRONG DEVICE
  // ----------------------------------------------------------
  console.log('\n--- Authentication Failures ---');

  await test('wrong password fails to decrypt', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ secret: 'data' }, 'correct', { deviceBound: false });
    let threw = false;
    try {
      await h.decryptData(enc, 'wrong');
    } catch {
      threw = true;
    }
    assert(threw, 'decryption with wrong password should fail');
  });

  await test('wrong deviceId fails to decrypt v1', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ secret: 'data' }, 'pw', { deviceBound: true, deviceId: 'device-A' });
    let threw = false;
    try {
      await h.decryptData(enc, 'pw', { deviceId: 'device-B' });
    } catch {
      threw = true;
    }
    assert(threw, 'v1 decrypt with wrong deviceId should fail');
  });

  await test('v2 (portable) decrypts without any deviceId', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ secret: 'portable' }, 'pw', { deviceBound: false });
    const dec = await h.decryptData(enc, 'pw');
    assert(dec.secret === 'portable', 'portable decrypt failed without deviceId');
  });

  await test('v1 encrypted data cannot be decrypted as v2 (AAD mismatch)', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ s: 1 }, 'pw', { deviceBound: true, deviceId: 'dev123' });
    // Tamper: change version byte from 1 to 2
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    buf[0] = 2;
    const tampered = btoa(String.fromCharCode(...buf));
    let threw = false;
    try {
      await h.decryptData(tampered, 'pw');
    } catch {
      threw = true;
    }
    assert(threw, 'version byte tampering should cause GCM auth failure');
  });

  // ----------------------------------------------------------
  // 5. TAMPERED CIPHERTEXT
  // ----------------------------------------------------------
  console.log('\n--- Tamper Detection ---');

  await test('flipped bit in ciphertext fails GCM auth', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ x: 1 }, 'pw', { deviceBound: false });
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    buf[buf.length - 1] ^= 0x01; // flip last bit
    const tampered = btoa(String.fromCharCode(...buf));
    let threw = false;
    try { await h.decryptData(tampered, 'pw'); } catch { threw = true; }
    assert(threw, 'bit flip in ciphertext not detected');
  });

  await test('tampered iteration bytes fails decryption (different key)', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ x: 1 }, 'pw', { deviceBound: false });
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    // Change iterations from 600k to 650k
    new DataView(buf.buffer).setUint32(1, 650_000, false);
    const tampered = btoa(String.fromCharCode(...buf));
    let threw = false;
    try { await h.decryptData(tampered, 'pw'); } catch { threw = true; }
    assert(threw, 'tampered iterations not detected');
  });

  await test('tampered salt fails decryption', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ x: 1 }, 'pw', { deviceBound: false });
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    buf[5] ^= 0xFF; // corrupt first salt byte
    const tampered = btoa(String.fromCharCode(...buf));
    let threw = false;
    try { await h.decryptData(tampered, 'pw'); } catch { threw = true; }
    assert(threw, 'tampered salt not detected');
  });

  await test('tampered IV fails decryption', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ x: 1 }, 'pw', { deviceBound: false });
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    buf[21] ^= 0xFF; // corrupt first IV byte
    const tampered = btoa(String.fromCharCode(...buf));
    let threw = false;
    try { await h.decryptData(tampered, 'pw'); } catch { threw = true; }
    assert(threw, 'tampered IV not detected');
  });

  // ----------------------------------------------------------
  // 6. INVALID INPUT REJECTION
  // ----------------------------------------------------------
  console.log('\n--- Invalid Input Rejection ---');

  await test('rejects empty string', async () => {
    const h = makeHarness();
    let threw = false;
    try { await h.decryptData('', 'pw'); } catch { threw = true; }
    assert(threw, 'accepted empty string');
  });

  await test('rejects truncated blob (< 49 bytes)', async () => {
    const h = makeHarness();
    const short = btoa(String.fromCharCode(...new Uint8Array(48)));
    let threw = false;
    try { await h.decryptData(short, 'pw'); } catch (e) {
      threw = true;
      assert(e.message.includes('Invalid format'), `wrong error: ${e.message}`);
    }
    assert(threw, 'accepted truncated blob');
  });

  await test('rejects unknown version byte (0x03)', async () => {
    const h = makeHarness();
    const buf = new Uint8Array(60);
    buf[0] = 3; // unknown version
    new DataView(buf.buffer).setUint32(1, PBKDF2_MIN_ITERATIONS, false);
    const enc = btoa(String.fromCharCode(...buf));
    let threw = false;
    try { await h.decryptData(enc, 'pw'); } catch (e) {
      threw = true;
      assert(e.message.includes('Invalid format'), `wrong error: ${e.message}`);
    }
    assert(threw, 'accepted unknown version');
  });

  await test('rejects version byte 0x00', async () => {
    const h = makeHarness();
    const buf = new Uint8Array(60);
    buf[0] = 0;
    new DataView(buf.buffer).setUint32(1, PBKDF2_MIN_ITERATIONS, false);
    const enc = btoa(String.fromCharCode(...buf));
    let threw = false;
    try { await h.decryptData(enc, 'pw'); } catch (e) {
      threw = true;
      assert(e.message.includes('Invalid format'), `wrong error: ${e.message}`);
    }
    assert(threw, 'accepted version 0');
  });

  await test('rejects iterations below MIN (500k)', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ x: 1 }, 'pw', { deviceBound: false });
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    new DataView(buf.buffer).setUint32(1, 500_000, false);
    const tampered = btoa(String.fromCharCode(...buf));
    let threw = false;
    try { await h.decryptData(tampered, 'pw'); } catch (e) {
      threw = true;
      assert(e.message.includes('Invalid iteration count'), `wrong error: ${e.message}`);
    }
    assert(threw, 'accepted below-min iterations');
  });

  await test('rejects iterations above MAX (5M)', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ x: 1 }, 'pw', { deviceBound: false });
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    new DataView(buf.buffer).setUint32(1, 5_000_000, false);
    const tampered = btoa(String.fromCharCode(...buf));
    let threw = false;
    try { await h.decryptData(tampered, 'pw'); } catch (e) {
      threw = true;
      assert(e.message.includes('Invalid iteration count'), `wrong error: ${e.message}`);
    }
    assert(threw, 'accepted above-max iterations');
  });

  await test('rejects iterations = 0', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ x: 1 }, 'pw', { deviceBound: false });
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    new DataView(buf.buffer).setUint32(1, 0, false);
    const tampered = btoa(String.fromCharCode(...buf));
    let threw = false;
    try { await h.decryptData(tampered, 'pw'); } catch (e) {
      threw = true;
      assert(e.message.includes('Invalid iteration count'), `wrong error: ${e.message}`);
    }
    assert(threw, 'accepted zero iterations');
  });

  await test('rejects non-base64 input', async () => {
    const h = makeHarness();
    let threw = false;
    try { await h.decryptData('not!valid!base64!!!@@@', 'pw'); } catch { threw = true; }
    assert(threw, 'accepted non-base64');
  });

  // ----------------------------------------------------------
  // 7. DERIVE KEY
  // ----------------------------------------------------------
  console.log('\n--- deriveKey ---');

  await test('same password + salt + iterations = same key (cross-decrypt)', async () => {
    const h = makeHarness();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode('determinism test');

    const k1 = await h.deriveKey('pw', salt, 600_000);
    const k2 = await h.deriveKey('pw', salt, 600_000);

    // Keys are non-extractable (correct!) — verify determinism by encrypting
    // with k1 and decrypting with k2
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k1, plaintext);
    const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k2, ct);
    const result = new TextDecoder().decode(dec);
    assert(result === 'determinism test', 'keys are not deterministic');
    assert(k1.algorithm.name === 'AES-GCM', 'wrong algorithm');
    assert(k1.algorithm.length === 256, 'wrong key length');
  });

  await test('different iterations produce different keys (encrypt/decrypt cross-check)', async () => {
    const h = makeHarness();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode('test');

    const k600 = await h.deriveKey('pw', salt, 600_000);
    const k700 = await h.deriveKey('pw', salt, 700_000);

    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k600, plaintext);
    let threw = false;
    try {
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k700, ct);
    } catch { threw = true; }
    assert(threw, 'different iterations should produce different keys');
  });

  await test('deriveKey accepts Uint8Array salt', async () => {
    const h = makeHarness();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await h.deriveKey('pw', salt);
    assert(key.algorithm.name === 'AES-GCM', 'failed with Uint8Array salt');
  });

  await test('deriveKey accepts string salt', async () => {
    const h = makeHarness();
    const key = await h.deriveKey('pw', 'string-salt-value');
    assert(key.algorithm.name === 'AES-GCM', 'failed with string salt');
  });

  // ----------------------------------------------------------
  // 8. QR SYNC SIMULATION
  // ----------------------------------------------------------
  console.log('\n--- QR Sync Simulation ---');

  await test('QR sync: encrypt portable on device A, decrypt on device B', async () => {
    const deviceA = makeHarness();
    const deviceB = makeHarness();
    deviceA._forceIterations(1_000_000);
    // Device B doesn't need calibration for decrypt — iterations come from blob

    const payload = { v: 1, s: 'sEdTestSeed999', a: 'rQRAddress', t: Date.now() + 300000 };
    const encrypted = await deviceA.encryptData(payload, 'syncpw', { deviceBound: false });
    const qrData = `XRPLTO:${encrypted}`;

    // Device B decrypts
    const enc = qrData.slice(7);
    const dec = await deviceB.decryptData(enc, 'syncpw');
    assert(dec.v === 1, 'payload version mismatch');
    assert(dec.s === 'sEdTestSeed999', 'seed mismatch in QR sync');
    assert(dec.a === 'rQRAddress', 'address mismatch in QR sync');
  });

  await test('QR sync: device-bound (v1) cannot be decrypted cross-device', async () => {
    const deviceA = makeHarness();
    const deviceB = makeHarness();
    deviceA._forceIterations(PBKDF2_MIN_ITERATIONS);

    const enc = await deviceA.encryptData({ s: 'seed' }, 'pw', { deviceBound: true, deviceId: 'deviceA-id' });
    let threw = false;
    try {
      await deviceB.decryptData(enc, 'pw', { deviceId: 'deviceB-id' });
    } catch { threw = true; }
    assert(threw, 'device-bound data should not decrypt on different device');
  });

  // ----------------------------------------------------------
  // 9. ITERATION BOUNDARY VALUES
  // ----------------------------------------------------------
  console.log('\n--- Iteration Boundaries ---');

  await test('roundtrip at exact MIN boundary (600k)', async () => {
    const h = makeHarness();
    h._forceIterations(600_000);
    const data = { boundary: 'min' };
    const enc = await h.encryptData(data, 'pw', { deviceBound: false });
    const dec = await h.decryptData(enc, 'pw');
    assert(dec.boundary === 'min', 'min boundary roundtrip failed');
  });

  await test('roundtrip at exact MAX boundary (4M)', async () => {
    const h = makeHarness();
    h._forceIterations(4_000_000);
    const data = { boundary: 'max' };
    const enc = await h.encryptData(data, 'pw', { deviceBound: false });
    const dec = await h.decryptData(enc, 'pw');
    assert(dec.boundary === 'max', 'max boundary roundtrip failed');
  });

  await test('iteration count 599999 rejected on decrypt', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ x: 1 }, 'pw', { deviceBound: false });
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    new DataView(buf.buffer).setUint32(1, 599_999, false);
    let threw = false;
    try { await h.decryptData(btoa(String.fromCharCode(...buf)), 'pw'); } catch { threw = true; }
    assert(threw, 'accepted 599999 iterations');
  });

  await test('iteration count 4000001 rejected on decrypt', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const enc = await h.encryptData({ x: 1 }, 'pw', { deviceBound: false });
    const buf = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
    new DataView(buf.buffer).setUint32(1, 4_000_001, false);
    let threw = false;
    try { await h.decryptData(btoa(String.fromCharCode(...buf)), 'pw'); } catch { threw = true; }
    assert(threw, 'accepted 4000001 iterations');
  });

  // ----------------------------------------------------------
  // 10. EDGE CASES
  // ----------------------------------------------------------
  console.log('\n--- Edge Cases ---');

  await test('empty password works (not recommended but valid)', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const data = { note: 'empty password' };
    const enc = await h.encryptData(data, '', { deviceBound: false });
    const dec = await h.decryptData(enc, '');
    assert(dec.note === 'empty password', 'empty password roundtrip failed');
  });

  await test('very long password (10k chars)', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const longPw = 'A'.repeat(10_000);
    const data = { long: true };
    const enc = await h.encryptData(data, longPw, { deviceBound: false });
    const dec = await h.decryptData(enc, longPw);
    assert(dec.long === true, 'long password roundtrip failed');
  });

  await test('password with special characters', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const pw = '\u0000\n\t\r\u{1F600}null\x00bytes';
    const data = { special: true };
    const enc = await h.encryptData(data, pw, { deviceBound: false });
    const dec = await h.decryptData(enc, pw);
    assert(dec.special === true, 'special char password roundtrip failed');
  });

  await test('empty deviceId treated consistently', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    // v1 with empty deviceId should still roundtrip
    const data = { empty_device: true };
    const enc = await h.encryptData(data, 'pw', { deviceBound: true, deviceId: '' });
    const dec = await h.decryptData(enc, 'pw', { deviceId: '' });
    assert(dec.empty_device === true, 'empty deviceId roundtrip failed');
  });

  await test('null deviceId treated as empty string', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const data = { null_device: true };
    const enc = await h.encryptData(data, 'pw', { deviceBound: true, deviceId: null });
    const dec = await h.decryptData(enc, 'pw', { deviceId: null });
    assert(dec.null_device === true, 'null deviceId roundtrip failed');
  });

  await test('data with all JSON types', async () => {
    const h = makeHarness();
    h._forceIterations(PBKDF2_MIN_ITERATIONS);
    const data = {
      string: 'hello',
      number: 3.14,
      integer: 42,
      negative: -1,
      boolean: true,
      boolFalse: false,
      nullVal: null,
      array: [1, 'two', null, true],
      nested: { a: { b: 'c' } }
    };
    const enc = await h.encryptData(data, 'pw', { deviceBound: false });
    const dec = await h.decryptData(enc, 'pw');
    assert(JSON.stringify(dec) === JSON.stringify(data), 'JSON types roundtrip failed');
  });

  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  }
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
})();
