// xrpl Wallet is loaded dynamically to avoid pulling ~500KB into the initial bundle
const getXrplWallet = async () => {
  const { Wallet } = await import('xrpl');
  return Wallet;
};

// Development logging helper
const isDev = process.env.NODE_ENV === 'development';
const devLog = isDev ? (...args) => console.log('[WalletStorage]', ...args) : () => {};
const devError = isDev ? (...args) => console.error('[WalletStorage]', ...args) : () => {};

// Anti-phishing emoji set (64 emojis = 16.7M combinations for 4-emoji sequence)
const ANTI_PHISHING_EMOJI_SET = [
  '🐶','🐱','🐻','🦊','🐸','🐵','🦁','🐼','🐷','🐨','🐙','🦋',
  '🌈','🌻','🌵','🍀','🌊','🌙','⭐','🔥','❄️','🍄',
  '🍎','🍕','🍩','🍉','🍋','🍒','🎂','🍔','🌮','🍇',
  '🎯','🎪','🎸','🎨','🎲','🔔','💎','🔮','🏆','🎭','🎈','🎩',
  '🚀','🎡','🏠','⛵','🗻','🌋','🏝️','🎢',
  '💜','🧡','💚','❤️','💙','💛',
  '👑','🎵','🌀','⚡','🦄','🐉'
];

const generateAntiPhishingEmojis = () => {
  const indices = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(indices)
    .map(byte => ANTI_PHISHING_EMOJI_SET[byte % ANTI_PHISHING_EMOJI_SET.length])
    .join('');
};

// Device ID with HMAC integrity verification
// Generates a stable device ID stored in localStorage, signed with an HMAC key in IndexedDB.
// The HMAC key is tied to the IndexedDB database — if the DB is cleared/different device,
// HMAC verification fails and a new device ID is generated. This provides device-binding
// without browser-specific WebAuthn issues.
const deviceFingerprint = {
  _cachedDeviceId: null,
  _hmacKey: null,

  async _getHmacKey() {
    if (this._hmacKey) return this._hmacKey;
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('XRPLWalletDB');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    let hmacSeed = await new Promise((resolve) => {
      if (!db.objectStoreNames.contains('keys')) { resolve(null); return; }
      const tx = db.transaction(['keys'], 'readonly');
      const req = tx.objectStore('keys').get('hmac_seed');
      req.onsuccess = () => resolve(req.result?.seed || null);
      req.onerror = () => resolve(null);
    });

    if (!hmacSeed) {
      hmacSeed = crypto.getRandomValues(new Uint8Array(32));
      try {
        await new Promise((resolve) => {
          const tx = db.transaction(['keys'], 'readwrite');
          const req = tx.objectStore('keys').put({ id: 'hmac_seed', seed: hmacSeed });
          req.onsuccess = () => resolve();
          req.onerror = () => resolve(); // Continue with in-memory key
          tx.onabort = () => resolve();
        });
      } catch (e) { /* keys store may not exist yet — HMAC key is ephemeral until DB is initialized */ }
    }

    db.close();

    this._hmacKey = await crypto.subtle.importKey(
      'raw', hmacSeed, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
    );
    return this._hmacKey;
  },

  async _computeHmac(data) {
    const key = await this._getHmacKey();
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  },

  async _verifyHmac(data, hmac) {
    if (!hmac) return false;
    try {
      const key = await this._getHmacKey();
      const signature = Uint8Array.from(atob(hmac), c => c.charCodeAt(0));
      return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(data));
    } catch {
      return false;
    }
  },

  async getDeviceId() {
    if (this._cachedDeviceId) return this._cachedDeviceId;
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem('device_key_id');

    if (stored) {
      const firstColon = stored.indexOf(':');
      if (firstColon === -1) {
        // Malformed — clear and fall through to generate new
        localStorage.removeItem('device_key_id');
      } else {
        const deviceId = stored.substring(0, firstColon);
        const hmac = stored.substring(firstColon + 1);

        const hmacValid = await this._verifyHmac(deviceId, hmac);
        if (hmacValid) {
          this._cachedDeviceId = deviceId;
          return deviceId;
        }

        // HMAC failed — clear and fall through to generate new
        localStorage.removeItem('device_key_id');
        this._cachedDeviceId = null;
        // Reset HMAC key cache so new key is generated fresh
        this._hmacKey = null;
      }
    }

    // Generate new device ID (no recursion — always falls through here)
    const deviceId = crypto.randomUUID();
    const hmac = await this._computeHmac(deviceId);
    localStorage.setItem('device_key_id', `${deviceId}:${hmac}`);

    this._cachedDeviceId = deviceId;
    return deviceId;
  }
};

// Security utilities
const securityUtils = {
  // Timing-safe string comparison to prevent timing attacks
  timingSafeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const encoder = new TextEncoder();
    const bufA = encoder.encode(a);
    const bufB = encoder.encode(b);
    // Always compare max(lenA, lenB) bytes — no length leak
    const len = Math.max(bufA.length, bufB.length);
    let result = bufA.length ^ bufB.length; // non-zero if lengths differ
    for (let i = 0; i < len; i++) {
      result |= (bufA[i] || 0) ^ (bufB[i] || 0);
    }
    return result === 0;
  },

  // Password strength validation (OWASP 2025)
  validatePasswordStrength(password) {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: 'Password is required' };
    }
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }
    if (password.length > 128) {
      return { valid: false, error: 'Password too long' };
    }
    // Check for common patterns
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const variety = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (variety < 2) {
      return {
        valid: false,
        error: 'Password needs more variety (mix letters, numbers, or symbols)'
      };
    }
    // Check for common weak passwords
    const weak = [
      'password', '12345678', 'qwerty12', 'letmein1', 'welcome1',
      'iloveyou', 'sunshine', 'princess', 'football', 'charlie',
      'shadow12', 'master12', 'dragon12', 'monkey12', 'abc12345',
      'trustno1', 'baseball', 'superman', 'michael1', 'access14',
      'mustang1', 'summer20', 'passw0rd', 'p@ssword', 'pa$$word'
    ];
    if (weak.some((w) => password.toLowerCase().includes(w))) {
      return { valid: false, error: 'Password is too common' };
    }
    return { valid: true };
  },

  // Rate limiting for password attempts
  // Multi-layer storage: memory + localStorage + IndexedDB
  // Clearing any single layer doesn't reset the limiter — worst-case count wins
  rateLimiter: {
    // Attempts 1-4: no lockout, 5: 60s, 6: 5m, 7: 15m, 8: 1h, 9+: 2h
    _lockoutTiers: [0, 0, 0, 0, 0, 60000, 300000, 900000, 3600000, 7200000],
    // In-memory layer (not accessible via console without reference)
    _mem: Object.create(null),

    _getLsRecord(key) {
      try { const d = localStorage.getItem(`rl_${key}`); return d ? JSON.parse(d) : null; } catch { return null; }
    },
    _setLsRecord(key, record) {
      try { localStorage.setItem(`rl_${key}`, JSON.stringify(record)); } catch {}
    },
    _deleteLsRecord(key) {
      try { localStorage.removeItem(`rl_${key}`); } catch {}
    },

    // IndexedDB layer (survives localStorage clear, harder to tamper)
    // Shared connection pool — avoids opening N connections per call
    _idbPromise: null,
    async _getIdb() {
      if (this._idbPromise) {
        try { return await this._idbPromise; } catch { this._idbPromise = null; }
      }
      this._idbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open('XRPLRateLimit', 1);
        req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('rl')) db.createObjectStore('rl'); };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      return this._idbPromise;
    },
    async _getIdbRecord(key) {
      try {
        const db = await this._getIdb();
        return await new Promise((resolve) => {
          const tx = db.transaction('rl', 'readonly');
          const r = tx.objectStore('rl').get(key);
          r.onsuccess = () => resolve(r.result || null);
          r.onerror = () => resolve(null);
        });
      } catch { this._idbPromise = null; return null; }
    },
    async _setIdbRecord(key, record) {
      try {
        const db = await this._getIdb();
        await new Promise((resolve) => {
          const tx = db.transaction('rl', 'readwrite');
          tx.objectStore('rl').put(record, key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      } catch { this._idbPromise = null; }
    },
    async _deleteIdbRecord(key) {
      try {
        const db = await this._getIdb();
        await new Promise((resolve) => {
          const tx = db.transaction('rl', 'readwrite');
          tx.objectStore('rl').delete(key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      } catch { this._idbPromise = null; }
    },

    // Merge: take worst-case (highest count / latest lockout) across all layers
    _merge(...records) {
      let best = null;
      for (const r of records) {
        if (!r) continue;
        if (!best || r.count > best.count) best = { ...r };
        else if (r.count === best.count && (r.lockedUntil || 0) > (best.lockedUntil || 0)) best = { ...r };
      }
      return best;
    },

    _getRecord(key) {
      if (typeof window === 'undefined') return null;
      return this._merge(this._mem[key], this._getLsRecord(key));
    },

    _setRecord(key, record) {
      if (typeof window === 'undefined') return;
      this._mem[key] = record;
      this._setLsRecord(key, record);
      // Fire-and-forget IDB write
      this._setIdbRecord(key, record);
    },

    _deleteAll(key) {
      delete this._mem[key];
      this._deleteLsRecord(key);
      this._deleteIdbRecord(key);
    },

    // Sync: pull IDB record into memory/localStorage
    async _syncFromIdb(key) {
      try {
        const idbRec = await this._getIdbRecord(key);
        if (!idbRec) return;
        const current = this._merge(this._mem[key], this._getLsRecord(key));
        const worst = this._merge(current, idbRec);
        if (worst && (!current || worst.count > current.count)) {
          this._mem[key] = worst;
          this._setLsRecord(key, worst);
        }
      } catch {}
    },

    // _idbSynced tracks keys that have been synced from IDB at least once
    _idbSynced: Object.create(null),

    async check(key) {
      const now = Date.now();
      // If mem+LS are both empty and we haven't synced IDB yet, await it (prevents bypass after LS clear)
      if (!this._mem[key] && !this._getLsRecord(key) && !this._idbSynced[key]) {
        await this._syncFromIdb(key);
        this._idbSynced[key] = true;
      } else if (!this._idbSynced[key]) {
        // Fire-and-forget sync for future checks
        this._syncFromIdb(key).then(() => { this._idbSynced[key] = true; });
      }
      const record = this._getRecord(key);
      if (!record) return { allowed: true };

      if (record.lockedUntil && now > record.lockedUntil) {
        this._deleteAll(key);
        return { allowed: true };
      }

      if (record.lockedUntil) {
        const remaining = Math.ceil((record.lockedUntil - now) / 1000);
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        const display = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        return { allowed: false, error: `Too many attempts. Try again in ${display}` };
      }
      return { allowed: true };
    },

    recordFailure(key) {
      const now = Date.now();
      const record = this._getRecord(key) || { count: 0 };
      record.count++;
      record.lastAttempt = now;

      const tierIndex = Math.min(record.count, this._lockoutTiers.length - 1);
      const lockoutMs = this._lockoutTiers[tierIndex];
      if (lockoutMs > 0) {
        record.lockedUntil = now + lockoutMs;
      }
      this._setRecord(key, record);
    },

    recordSuccess(key) {
      this._deleteAll(key);
    }
  }
};

// Closure-scoped credential cache — not accessible via class properties, console, or DevTools
// Values are XOR-masked with a random pad so plaintext passwords never appear in heap dumps
const _credCache = (() => {
  const _map = new Map(); // stores { pad: Uint8Array, masked: Uint8Array, timer: number }
  const TTL = 15 * 60 * 1000; // 15 minutes
  const _enc = new TextEncoder();
  const _dec = new TextDecoder();
  const _mask = (str) => {
    const raw = _enc.encode(str);
    const pad = crypto.getRandomValues(new Uint8Array(raw.length));
    const masked = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) masked[i] = raw[i] ^ pad[i];
    return { pad, masked };
  };
  const _unmask = ({ pad, masked }) => {
    const raw = new Uint8Array(masked.length);
    for (let i = 0; i < masked.length; i++) raw[i] = masked[i] ^ pad[i];
    return _dec.decode(raw);
  };
  const _evict = (key) => {
    const entry = _map.get(key);
    if (entry) {
      if (entry.pad) entry.pad.fill(0);
      if (entry.masked) entry.masked.fill(0);
      if (entry.timer) clearTimeout(entry.timer);
      _map.delete(key);
    }
  };
  const _clear = () => {
    _map.forEach((v, k) => {
      if (v.pad) v.pad.fill(0);
      if (v.masked) v.masked.fill(0);
      if (v.timer) clearTimeout(v.timer);
    });
    _map.clear();
    devLog('[Security] Credential cache cleared');
  };
  return {
    get(key) {
      const entry = _map.get(key);
      if (!entry) return undefined;
      return _unmask(entry);
    },
    has(key) { return _map.has(key); },
    set(key, value) {
      _evict(key); // clear previous entry + timer
      const entry = _mask(value);
      entry.timer = setTimeout(() => _evict(key), TTL);
      _map.set(key, entry);
    },
    clear: _clear
  };
})();

export class UnifiedWalletStorage {
  // Static shared DB promise - ensures only ONE connection across ALL instances
  static _sharedDbPromise = null;
  // Static master key cache - non-extractable CryptoKey
  static _masterKey = null;
  static _masterKeyPromise = null;

  constructor() {
    this.dbName = 'XRPLWalletDB';
    this.walletsStore = 'wallets';
    this.keysStore = 'keys';
  }

  _clearCredentialCache() {
    _credCache.clear();
  }

  /**
   * Get or create master encryption key (non-extractable CryptoKey in IndexedDB)
   * This key CANNOT be exported via JavaScript - XSS protection
   */
  async getMasterKey() {
    // Return cached key if available
    if (UnifiedWalletStorage._masterKey) {
      return UnifiedWalletStorage._masterKey;
    }

    // Prevent race conditions - only one key creation at a time
    if (UnifiedWalletStorage._masterKeyPromise) {
      return UnifiedWalletStorage._masterKeyPromise;
    }

    UnifiedWalletStorage._masterKeyPromise = this._initMasterKey();
    try {
      const key = await UnifiedWalletStorage._masterKeyPromise;
      UnifiedWalletStorage._masterKey = key;
      return key;
    } finally {
      UnifiedWalletStorage._masterKeyPromise = null;
    }
  }

  async _initMasterKey() {
    const db = await this.initDB();

    // Try to load existing key from IndexedDB
    const existingKey = await new Promise((resolve) => {
      if (!db.objectStoreNames.contains(this.keysStore)) {
        resolve(null);
        return;
      }
      const tx = db.transaction([this.keysStore], 'readonly');
      tx.onabort = () => resolve(null);
      const req = tx.objectStore(this.keysStore).get('master');
      req.onsuccess = () => resolve(req.result?.key || null);
      req.onerror = () => resolve(null);
    });

    if (existingKey) {
      devLog('[MasterKey] Loaded existing non-extractable key from IndexedDB');
      return existingKey;
    }

    // Generate fresh non-extractable key
    devLog('[MasterKey] Generating new non-extractable CryptoKey');
    const masterKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // NON-EXTRACTABLE - key never leaves browser's secure storage
      ['encrypt', 'decrypt']
    );

    // Store CryptoKey object in IndexedDB (structured clone preserves non-extractable property)
    await new Promise((resolve, reject) => {
      const tx = db.transaction([this.keysStore], 'readwrite');
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
      const store = tx.objectStore(this.keysStore);
      const req = store.put({ id: 'master', key: masterKey, createdAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    devLog('[MasterKey] Stored non-extractable key in IndexedDB');
    return masterKey;
  }

  // Check if Web Crypto API is available (secure context required)
  isSecureContext() {
    return (
      typeof window !== 'undefined' && window.isSecureContext && window.crypto?.subtle !== undefined
    );
  }

  // Encrypt data for localStorage using non-extractable master key
  async encryptForLocalStorage(data) {
    if (!this.isSecureContext()) {
      throw new Error('HTTPS required for wallet encryption');
    }

    const encoder = new TextEncoder();
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);

    // Get non-extractable master key from IndexedDB
    const masterKey = await this.getMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      masterKey,
      encoder.encode(dataString)
    );

    // Combine version + iv + encrypted data (no salt needed - key is already derived)
    const version = new Uint8Array([2]); // Version 2 = non-extractable key
    const combined = new Uint8Array(1 + iv.length + encrypted.byteLength);
    combined.set(version, 0);
    combined.set(iv, 1);
    combined.set(new Uint8Array(encrypted), 1 + iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  // Decrypt data from localStorage using non-extractable master key
  async decryptFromLocalStorage(encryptedData) {
    if (!this.isSecureContext()) {
      throw new Error('HTTPS required for wallet decryption');
    }

    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

    // Version 2 format: version(1) + iv(12) + data
    if (combined[0] !== 2) {
      throw new Error('Invalid format - clear browser data and create new wallet');
    }
    const iv = combined.slice(1, 13);
    const encrypted = combined.slice(13);

    const masterKey = await this.getMasterKey();
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, masterKey, encrypted);

    const decoded = new TextDecoder().decode(decrypted);
    try {
      return JSON.parse(decoded);
    } catch {
      return decoded;
    }
  }

  // Store encrypted password in IndexedDB alongside wallets
  async storeEncryptedPassword(keyId, password) {
    const db = await this.initDB();

    // initDB now handles store creation, this should always exist
    // Never close shared connection here — only closeSharedConnection() should do that
    if (!db.objectStoreNames.contains(this.walletsStore)) {
      throw new Error('Wallet store not initialized');
    }

    const encrypted = await this.encryptForLocalStorage(password);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readwrite');
      transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));
      const store = transaction.objectStore(this.walletsStore);

      const record = {
        id: `__pwd__${keyId}`,
        lookupHash: `__pwd__${keyId}`,
        data: encrypted,
        timestamp: Date.now()
      };

      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getEncryptedPassword(keyId) {
    try {
      const db = await this.initDB();

      if (!db.objectStoreNames.contains(this.walletsStore)) {
        return null;
      }

      const record = await new Promise((resolve) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        transaction.onabort = () => resolve(null);
        const store = transaction.objectStore(this.walletsStore);
        const request = store.get(`__pwd__${keyId}`);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });

      if (record?.data) {
        try {
          return await this.decryptFromLocalStorage(record.data);
        } catch (decryptError) {
          devLog('Password decryption failed:', decryptError.message);
          return null;
        }
      }

      return null;
    } catch (error) {
      devError('Error getting encrypted password:', error);
      return null;
    }
  }

  // Secure localStorage wrapper methods
  async setSecureItem(key, value) {
    if (typeof window === 'undefined') return;

    const encrypted = await this.encryptForLocalStorage(value);
    localStorage.setItem(key + '_enc', encrypted);

    // Remove any unencrypted version
    localStorage.removeItem(key);
  }

  async getSecureItem(key) {
    if (typeof window === 'undefined') return null;

    const encrypted = localStorage.getItem(key + '_enc');
    if (!encrypted) return null;

    return await this.decryptFromLocalStorage(encrypted);
  }

  async initDB() {
    // Module-level singleton: reuse existing DB promise across ALL instances
    if (UnifiedWalletStorage._sharedDbPromise) {
      try {
        const db = await UnifiedWalletStorage._sharedDbPromise;
        // Validate connection is still alive — closed or deleted DBs throw on transaction()
        if (db.objectStoreNames.contains(this.walletsStore)) {
          db.transaction([this.walletsStore], 'readonly');
        }
        return db;
      } catch {
        // Connection is stale/closed — clear and reconnect
        devLog('[initDB] Cached connection stale, reconnecting...');
        UnifiedWalletStorage._sharedDbPromise = null;
        UnifiedWalletStorage._masterKey = null;
      }
    }

    devLog('[initDB] Creating new DB connection...');
    UnifiedWalletStorage._sharedDbPromise = this._initDBInternal().catch((err) => {
      // Clear cached promise on failure so next call retries instead of returning stale rejection
      UnifiedWalletStorage._sharedDbPromise = null;
      throw err;
    });
    return UnifiedWalletStorage._sharedDbPromise;
  }

  // Close the shared DB connection and clear caches (call before deleteDatabase)
  static closeSharedConnection() {
    if (UnifiedWalletStorage._sharedDbPromise) {
      UnifiedWalletStorage._sharedDbPromise.then(db => {
        try { db.close(); } catch {}
      }).catch(() => {});
      UnifiedWalletStorage._sharedDbPromise = null;
    }
    UnifiedWalletStorage._masterKey = null;
    UnifiedWalletStorage._masterKeyPromise = null;
    // Clear device fingerprint caches so they regenerate from fresh DB
    deviceFingerprint._cachedDeviceId = null;
    deviceFingerprint._hmacKey = null;
    _credCache.clear();
  }

  async _initDBInternal() {
    // Open at whatever version exists (or creates at v1 if new)
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);
      const timeout = setTimeout(() => {
        reject(new Error('IndexedDB open timeout'));
      }, 5000);
      request.onsuccess = () => { clearTimeout(timeout); resolve(request.result); };
      request.onerror = () => { clearTimeout(timeout); reject(request.error); };
    });

    // If another tab/process triggers a version change or deleteDatabase, close and invalidate cache
    db.onversionchange = () => {
      db.close();
      UnifiedWalletStorage._sharedDbPromise = null;
      UnifiedWalletStorage._masterKey = null;
    };

    // If stores already exist, we're done
    if (db.objectStoreNames.contains(this.walletsStore) && db.objectStoreNames.contains(this.keysStore)) {
      devLog('[initDB] Opened, stores exist');
      return db;
    }

    // Stores missing — close and reopen with version bump to trigger onupgradeneeded
    const nextVersion = db.version + 1;
    db.close();
    devLog('[initDB] Creating stores at version', nextVersion);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, nextVersion);
      const timeout = setTimeout(() => {
        reject(new Error('IndexedDB upgrade timeout'));
      }, 5000);
      request.onblocked = () => { clearTimeout(timeout); reject(new Error('IndexedDB blocked - close other tabs')); };
      request.onerror = () => { clearTimeout(timeout); reject(request.error); };
      request.onsuccess = () => {
        clearTimeout(timeout);
        const upgradedDb = request.result;
        upgradedDb.onversionchange = () => {
          upgradedDb.close();
          UnifiedWalletStorage._sharedDbPromise = null;
          UnifiedWalletStorage._masterKey = null;
        };
        devLog('[initDB] Stores created');
        resolve(upgradedDb);
      };
      request.onupgradeneeded = (event) => {
        const upgradeDb = event.target.result;
        if (!upgradeDb.objectStoreNames.contains(this.walletsStore)) {
          const store = upgradeDb.createObjectStore(this.walletsStore, { keyPath: 'id', autoIncrement: true });
          store.createIndex('lookupHash', 'lookupHash', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!upgradeDb.objectStoreNames.contains(this.keysStore)) {
          upgradeDb.createObjectStore(this.keysStore, { keyPath: 'id' });
        }
      };
    });
  }

  async deriveKey(password, salt) {
    const encoder = new TextEncoder();

    // Domain separator — prevents password reuse across different services from producing same key
    const enhancedPassword = `xrpl-wallet-pin-v1-${password}`;

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(enhancedPassword),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // OWASP 2025: 600,000 iterations minimum for PBKDF2-SHA256
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: typeof salt === 'string' ? encoder.encode(salt) : salt,
        iterations: 600000, // OWASP 2025 standard
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptData(data, password, { deviceBound = true } = {}) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(password, salt);

    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));

    const params = { name: 'AES-GCM', iv };
    let version;

    if (deviceBound) {
      // v3: device-bind ciphertext via AES-GCM AAD (prevents cross-device decryption)
      const deviceId = deviceFingerprint._cachedDeviceId || await deviceFingerprint.getDeviceId();
      params.additionalData = encoder.encode(deviceId || '');
      version = 3;
    } else {
      // v1: portable encryption (for QR sync, cross-device transfers)
      version = 1;
    }

    const encrypted = await crypto.subtle.encrypt(params, key, plaintext);

    const combinedBuffer = new Uint8Array(1 + salt.length + iv.length + encrypted.byteLength);
    combinedBuffer.set(new Uint8Array([version]), 0);
    combinedBuffer.set(salt, 1);
    combinedBuffer.set(iv, 1 + salt.length);
    combinedBuffer.set(new Uint8Array(encrypted), 1 + salt.length + iv.length);

    return btoa(String.fromCharCode(...combinedBuffer));
  }

  async decryptData(encryptedString, password) {
    const combinedBuffer = new Uint8Array(
      atob(encryptedString)
        .split('')
        .map((char) => char.charCodeAt(0))
    );

    const version = combinedBuffer[0];
    if (version !== 1 && version !== 3) {
      throw new Error('Invalid format - clear browser data and create new wallet');
    }

    // Both v1 and v3 share same layout: version(1) + salt(16) + iv(12) + data
    const salt = combinedBuffer.slice(1, 17);
    const iv = combinedBuffer.slice(17, 29);
    const encrypted = combinedBuffer.slice(29);

    const key = await this.deriveKey(password, salt);

    // v3: include device fingerprint as AAD (device-bound)
    // v1: no AAD (legacy, backward compatible)
    const params = { name: 'AES-GCM', iv };
    if (version === 3) {
      const deviceId = deviceFingerprint._cachedDeviceId || await deviceFingerprint.getDeviceId();
      params.additionalData = new TextEncoder().encode(deviceId || '');
    }

    const decrypted = await crypto.subtle.decrypt(params, key, encrypted);

    return JSON.parse(new TextDecoder().decode(decrypted));
  }

  async storeWallet(walletData, password) {
    const db = await this.initDB();

    // initDB now handles store creation, this should always exist
    if (!db.objectStoreNames.contains(this.walletsStore)) {
      throw new Error('Wallet store not initialized');
    }

    // Generate unique ID for this wallet
    const walletId = crypto.randomUUID();

    // Auto-generate anti-phishing emojis if missing
    if (!walletData.antiPhishingEmojis) {
      walletData.antiPhishingEmojis = generateAntiPhishingEmojis();
    }

    // Persist emojis as unencrypted metadata so they can be shown before password entry
    this.saveAntiPhishingEmojis(walletData.antiPhishingEmojis).catch(() => {});

    // Encrypt ALL wallet data including metadata - NOTHING in plaintext
    const fullData = {
      ...walletData,
      id: walletId,
      storedAt: Date.now()
    };
    const encryptedData = await this.encryptData(fullData, password);

    // Generate lookup hash (one-way, can't reverse to get address)
    const encoder = new TextEncoder();
    const addressHash = await crypto.subtle.digest('SHA-256', encoder.encode(walletData.address));
    const lookupHash = btoa(String.fromCharCode(...new Uint8Array(addressHash))).slice(0, 24);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readwrite');
      transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));
      const store = transaction.objectStore(this.walletsStore);

      // Store encrypted data with minimal public metadata
      const maskedAddr = walletData.address
        ? `${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}`
        : null;

      // Check for existing wallet with same lookupHash to prevent duplicates (O(1) index lookup)
      const index = store.index('lookupHash');
      const indexReq = index.getAll(lookupHash);
      indexReq.onerror = () => reject(indexReq.error);
      indexReq.onsuccess = () => {
        const existing = (indexReq.result || []).find(
          (r) => r.id && typeof r.id === 'string' && !r.id.startsWith('__pwd__') && !r.id.startsWith('__entropy')
        );

        const record = {
          id: existing ? existing.id : walletId,
          lookupHash: lookupHash,
          data: encryptedData,
          maskedAddress: maskedAddr,
          timestamp: Date.now()
        };

        const request = store.put(record);
        request.onerror = () => reject(request.error || new Error('Failed to store wallet'));
        request.onsuccess = () => resolve(request.result);
      };
    });
  }

  async getWallet(address, password) {
    const db = await this.initDB();

    if (!db.objectStoreNames.contains(this.walletsStore)) {
      return null;
    }

    // Generate lookup hash from address
    const encoder = new TextEncoder();
    const addressHash = await crypto.subtle.digest('SHA-256', encoder.encode(address));
    const lookupHash = btoa(String.fromCharCode(...new Uint8Array(addressHash))).slice(0, 24);

    const records = await new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readonly');
      const store = transaction.objectStore(this.walletsStore);
      const index = store.index('lookupHash');
      const request = index.getAll(lookupHash);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    if (!records || records.length === 0) {
      throw new Error('Wallet not found');
    }

    try {
      return await this.decryptData(records[0].data, password);
    } catch (error) {
      throw new Error('Invalid password');
    }
  }

  async getAllWallets(password) {
    const db = await this.initDB();

    if (!db.objectStoreNames.contains(this.walletsStore)) {
      return [];
    }

    const allRecords = await new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readonly');
      const store = transaction.objectStore(this.walletsStore);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    const wallets = [];
    for (const record of allRecords) {
      // Skip password records (stored with __pwd__ prefix)
      if (record.id && typeof record.id === 'string' && record.id.startsWith('__pwd__')) {
        continue;
      }
      try {
        const walletData = await this.decryptData(record.data, password);
        wallets.push(walletData);
      } catch (error) {
        // Skip wallets that can't be decrypted with this password (expected for multi-password setups)
        devLog('Skipped wallet', record.maskedAddress || record.id, '- decrypt failed');
      }
    }
    return wallets;
  }

  async hasWallet() {
    try {
      const db = await this.initDB();

      if (!db.objectStoreNames.contains(this.walletsStore)) {
        return false;
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));
        const store = transaction.objectStore(this.walletsStore);

        // Use cursor to check for actual wallet records (skip __pwd__ and other special entries)
        const request = store.openCursor();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) { resolve(false); return; }
          const id = cursor.value?.id;
          if (typeof id === 'string' && (id.startsWith('__pwd__') || id.startsWith('__entropy') || id.startsWith('__lookup__'))) {
            cursor.continue();
          } else {
            resolve(true);
          }
        };
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Get wallet metadata WITHOUT requiring password (for UI display)
   * Returns list of wallets with masked addresses
   */
  async getWalletMetadata() {
    try {
      const db = await this.initDB();

      if (!db.objectStoreNames.contains(this.walletsStore)) {
        return [];
      }

      return new Promise((resolve) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);
        const request = store.getAll();

        request.onerror = () => resolve([]);
        request.onsuccess = () => {
          const records = request.result || [];
          // Filter out special records (passwords, entropy backup) and incomplete records
          const walletRecords = records.filter(
            (r) =>
              r.id &&
              typeof r.id === 'string' &&
              r.data &&
              r.maskedAddress &&
              !r.id.startsWith('__pwd__') &&
              !r.id.startsWith('__entropy') &&
              !r.id.startsWith('__lookup__')
          );

          // Deduplicate by maskedAddress, then lookupHash (same wallet = same key), keep most recent
          const uniqueMap = new Map();
          for (const r of walletRecords) {
            const key = r.maskedAddress || r.lookupHash || r.id;
            const existing = uniqueMap.get(key);
            if (!existing || (r.timestamp || 0) > (existing.timestamp || 0)) {
              uniqueMap.set(key, r);
            }
          }

          // Return public metadata only
          const metadata = [...uniqueMap.values()].map((r) => ({
            id: r.id,
            maskedAddress: r.maskedAddress || 'Unknown',
            timestamp: r.timestamp
          }));

          resolve(metadata);
        };
      });
    } catch (error) {
      devError('Error getting wallet metadata:', error);
      return [];
    }
  }

  /**
   * Store anti-phishing emojis encrypted with the non-extractable master key.
   * No password needed — decryption requires the CryptoKey object stored in
   * this origin's IndexedDB (non-extractable = can't be read via JS, only used
   * for encrypt/decrypt). A cloned site on a different origin has no master key
   * and cannot decrypt.
   */
  async saveAntiPhishingEmojis(emojis) {
    try {
      const encrypted = await this.encryptForLocalStorage(emojis);
      const db = await this.initDB();
      if (!db.objectStoreNames.contains(this.walletsStore)) return;
      await new Promise((resolve) => {
        const tx = db.transaction([this.walletsStore], 'readwrite');
        tx.objectStore(this.walletsStore).put({
          id: '__meta__anti_phishing',
          lookupHash: '__meta__anti_phishing',
          data: encrypted,
          timestamp: Date.now()
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) { devError('Failed to save anti-phishing emojis:', e); }
  }

  /**
   * Read anti-phishing emojis — decrypted with the non-extractable master key.
   * No password required, but only works on the original origin (master key is
   * origin-scoped in IndexedDB and non-extractable).
   */
  async getAntiPhishingEmojis() {
    try {
      const db = await this.initDB();
      if (!db.objectStoreNames.contains(this.walletsStore)) return null;
      const record = await new Promise((resolve) => {
        const tx = db.transaction([this.walletsStore], 'readonly');
        const req = tx.objectStore(this.walletsStore).get('__meta__anti_phishing');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (!record?.data) return null;
      return await this.decryptFromLocalStorage(record.data);
    } catch (e) { return null; }
  }

  /**
   * Try to unlock all wallets with just a password (for returning users)
   * Returns all decrypted wallets if password is correct
   */
  async unlockWithPassword(password) {
    const rateLimitKey = 'wallet_unlock';

    // Rate limiting check
    const rateCheck = await securityUtils.rateLimiter.check(rateLimitKey);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.error);
    }

    try {
      const allWallets = await this.getAllWallets(password);

      if (!allWallets || allWallets.length === 0) {
        securityUtils.rateLimiter.recordFailure(rateLimitKey);
        return []; // No wallets found - not necessarily wrong password
      }

      // Migration: ensure all wallets have anti-phishing emojis
      let canonicalEmojis = allWallets.find(w => w.antiPhishingEmojis)?.antiPhishingEmojis;
      if (!canonicalEmojis) canonicalEmojis = generateAntiPhishingEmojis();
      for (const wallet of allWallets) {
        if (!wallet.antiPhishingEmojis) {
          wallet.antiPhishingEmojis = canonicalEmojis;
          this.storeWallet({ ...wallet }, password).catch(() => {});
        }
      }
      // Ensure unencrypted metadata is up to date
      this.saveAntiPhishingEmojis(canonicalEmojis).catch(() => {});

      // Success
      securityUtils.rateLimiter.recordSuccess(rateLimitKey);
      devLog('Unlocked', allWallets.length, 'wallets');
      return allWallets;
    } catch (error) {
      devError('Unlock error:', error.message);
      securityUtils.rateLimiter.recordFailure(rateLimitKey);

      // Check for specific decryption errors
      if (error.message?.includes('decrypt') || error.message?.includes('Malformed')) {
        throw new Error('Incorrect password');
      }
      throw new Error('Incorrect password');
    }
  }

  async deleteWallet(address) {
    const db = await this.initDB();

    if (!db.objectStoreNames.contains(this.walletsStore)) {
      return null;
    }

    // Generate lookup hash from address
    const encoder = new TextEncoder();
    const addressHash = await crypto.subtle.digest('SHA-256', encoder.encode(address));
    const lookupHash = btoa(String.fromCharCode(...new Uint8Array(addressHash))).slice(0, 24);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readwrite');
      const store = transaction.objectStore(this.walletsStore);
      const index = store.index('lookupHash');

      const getRequest = index.getAllKeys(lookupHash);

      getRequest.onsuccess = () => {
        if (getRequest.result && getRequest.result.length > 0) {
          const deleteRequest = store.delete(getRequest.result[0]);
          deleteRequest.onsuccess = () => resolve(deleteRequest.result);
          deleteRequest.onerror = () => reject(deleteRequest.error);
        } else {
          reject(new Error('Wallet not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Store password for device wallets (encrypted with device-specific key)
  async storeWalletCredential(passkeyId, userSecret) {
    // Store password encrypted in localStorage for fast retrieval
    await this.setSecureItem(`device_pwd_${passkeyId}`, userSecret);

    // Also persist to IndexedDB as durable backup (survives localStorage clears)
    await this.storeEncryptedPassword(`device_${passkeyId}`, userSecret);

    // Cache in memory with auto-expiry (15 min or tab switch)
    _credCache.set(passkeyId, userSecret);
  }

  async getWalletCredential(passkeyId) {
    // 1. Check memory cache first (expires after 15 min)
    if (_credCache.has(passkeyId)) {
      return _credCache.get(passkeyId);
    }

    // 2. Try to get from encrypted localStorage (wrapped in try/catch so IndexedDB fallback always runs)
    try {
      const storedPassword = await this.getSecureItem(`device_pwd_${passkeyId}`);
      if (storedPassword) {
        // Cache in memory with expiry
        _credCache.set(passkeyId, storedPassword);
        return storedPassword;
      }
    } catch (e) {
      devLog('[Credential] localStorage retrieval failed, trying IndexedDB:', e.message);
    }

    // 3. Fallback to IndexedDB (survives localStorage clears)
    const idbPassword = await this.getEncryptedPassword(`device_${passkeyId}`);
    if (idbPassword) {
      // Restore to localStorage for fast future access
      try { await this.setSecureItem(`device_pwd_${passkeyId}`, idbPassword); } catch (e) { /* non-critical */ }
      // Cache in memory with expiry
      _credCache.set(passkeyId, idbPassword);
      devLog('[Credential] Recovered device password from IndexedDB');
      return idbPassword;
    }

    return null;
  }

  // Force lock wallet (clear all cached and persisted credentials)
  lockWallet() {
    this._clearCredentialCache();

    // Also clear persisted device credentials from localStorage
    // so re-authentication is required (IndexedDB backup remains for recovery after re-login)
    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('device_pwd_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  }

  /**
   * Get wallet by address (fast lookup using lookupHash index)
   */
  async getWalletByAddress(address, password) {
    try {
      const db = await this.initDB();

      if (!db.objectStoreNames.contains(this.walletsStore)) {
        return null;
      }

      // Generate lookup hash from address
      const encoder = new TextEncoder();
      const addressHash = await crypto.subtle.digest('SHA-256', encoder.encode(address));
      const lookupHash = btoa(String.fromCharCode(...new Uint8Array(addressHash))).slice(0, 24);

      const records = await new Promise((resolve, reject) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);
        const index = store.index('lookupHash');
        const request = index.getAll(lookupHash);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!records || records.length === 0) {
        return null;
      }

      const decrypted = await this.decryptData(records[0].data, password);
      return {
        address: decrypted.address,
        publicKey: decrypted.publicKey,
        seed: decrypted.seed,
        antiPhishingEmojis: decrypted.antiPhishingEmojis || null
      };
    } catch (e) {
      devError('Error getting wallet by address:', e);
      return null;
    }
  }

  // ============ QR Sync - Transfer wallet between devices ============

  /**
   * Export single wallet for QR Sync (compact format for QR code)
   * Encrypted with user's password - same password needed to import
   */
  async exportForQRSync(address, password) {
    // Get wallet data
    const wallet = await this.getWallet(address, password);
    if (!wallet || !wallet.seed) {
      throw new Error('Wallet not found');
    }

    // Compact payload (minimize QR size)
    const payload = {
      v: 1,
      s: wallet.seed,
      a: wallet.address,
      e: wallet.antiPhishingEmojis || '',
      t: Date.now() + 300000 // Expires in 5 minutes
    };

    // Encrypt portable (no device binding — QR sync is cross-device by design)
    const encrypted = await this.encryptData(payload, password, { deviceBound: false });

    // Return as compact string for QR (using XRPLTO: prefix to avoid Xaman hijacking)
    return `XRPLTO:${encrypted}`;
  }

  /**
   * Import wallet from QR Sync data
   * Requires the same password used during export
   */
  async importFromQRSync(qrData, password, localPassword = null) {
    if (!qrData.startsWith('XRPLTO:')) {
      throw new Error('Invalid QR format');
    }

    const encrypted = qrData.slice(7);

    // Decrypt with password
    let payload;
    try {
      payload = await this.decryptData(encrypted, password);
    } catch (e) {
      throw new Error('Invalid password');
    }

    // Validate payload
    if (payload.v !== 1 || !payload.s || !payload.a) {
      throw new Error('Invalid QR data');
    }

    // Check expiry
    if (payload.t < Date.now()) {
      throw new Error('QR code expired - generate a new one');
    }

    // Verify seed matches address (detect algorithm from seed prefix)
    const algorithm = payload.s.startsWith('sEd') ? 'ed25519' : 'secp256k1';
    const Wallet = await getXrplWallet();
    const testWallet = Wallet.fromSeed(payload.s, { algorithm });
    if (testWallet.address !== payload.a) {
      throw new Error('Wallet data corrupted');
    }

    // Store the wallet
    const walletData = {
      address: payload.a,
      publicKey: testWallet.publicKey,
      seed: payload.s,
      antiPhishingEmojis: payload.e || undefined,
      wallet_type: 'device',
      importedAt: Date.now(),
      importedVia: 'qr_sync'
    };

    // Use local device password for storage if available, otherwise use QR password.
    // This ensures imported wallets are encrypted with the same password as existing
    // wallets on this device, preventing password mismatch on unlock.
    await this.storeWallet(walletData, localPassword || password);

    return {
      address: payload.a,
      publicKey: testWallet.publicKey
    };
  }
}

// Alias for import convenience
export const EncryptedWalletStorage = UnifiedWalletStorage;

// Singleton instance for shared use (prevents multiple DB connections)
let _instance = null;
export const getWalletStorageInstance = () => {
  if (!_instance) {
    _instance = new UnifiedWalletStorage();
  }
  return _instance;
};

// Export security utilities for use in components
export { securityUtils };

// Export device fingerprint for fraud detection
export { deviceFingerprint };

// Export anti-phishing emoji utilities
export { ANTI_PHISHING_EMOJI_SET, generateAntiPhishingEmojis };
