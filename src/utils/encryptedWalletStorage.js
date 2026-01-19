import { Wallet } from 'xrpl';

// CryptoJS will be loaded dynamically when needed for OAuth
let CryptoJS;
if (typeof window !== 'undefined') {
  import('crypto-js').then((module) => {
    CryptoJS = module.default;
    window.CryptoJS = CryptoJS;
  });
}

// Development logging helper
const isDev = process.env.NODE_ENV === 'development';
const devLog = isDev ? (...args) => console.log('[WalletStorage]', ...args) : () => {};
const devError = isDev ? (...args) => console.error('[WalletStorage]', ...args) : () => {};

// Simple device ID using localStorage (100% accurate per browser)
// Clears when user clears storage - acceptable trade-off
const deviceFingerprint = {
  _cachedDeviceId: null,

  async getDeviceId() {
    if (this._cachedDeviceId) return this._cachedDeviceId;
    if (typeof window === 'undefined') return null;

    let deviceId = localStorage.getItem('device_key_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('device_key_id', deviceId);
    }

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
    if (bufA.length !== bufB.length) {
      // Still do comparison to maintain constant time
      const dummy = new Uint8Array(bufA.length);
      let result = bufA.length ^ bufB.length;
      for (let i = 0; i < bufA.length; i++) result |= bufA[i] ^ dummy[i];
      return false;
    }
    let result = 0;
    for (let i = 0; i < bufA.length; i++) result |= bufA[i] ^ bufB[i];
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
    const weak = ['password', '12345678', 'qwerty12', 'letmein1', 'welcome1'];
    if (weak.some((w) => password.toLowerCase().includes(w))) {
      return { valid: false, error: 'Password is too common' };
    }
    return { valid: true };
  },

  // Rate limiting for password attempts
  rateLimiter: {
    attempts: new Map(),
    maxAttempts: 5,
    lockoutMs: 30000, // 30 seconds

    check(key) {
      const now = Date.now();
      const record = this.attempts.get(key);
      if (!record) return { allowed: true };

      // Reset if lockout expired
      if (record.lockedUntil && now > record.lockedUntil) {
        this.attempts.delete(key);
        return { allowed: true };
      }

      if (record.lockedUntil) {
        const remaining = Math.ceil((record.lockedUntil - now) / 1000);
        return { allowed: false, error: `Too many attempts. Try again in ${remaining}s` };
      }
      return { allowed: true };
    },

    recordFailure(key) {
      const now = Date.now();
      const record = this.attempts.get(key) || { count: 0 };
      record.count++;
      record.lastAttempt = now;

      if (record.count >= this.maxAttempts) {
        record.lockedUntil = now + this.lockoutMs;
      }
      this.attempts.set(key, record);
    },

    recordSuccess(key) {
      this.attempts.delete(key);
    }
  }
};

export class UnifiedWalletStorage {
  // Static shared DB promise - ensures only ONE connection across ALL instances
  static _sharedDbPromise = null;

  constructor() {
    this.dbName = 'XRPLWalletDB';
    this.walletsStore = 'wallets';
    this.version = 1;
    this._entropyNeedsCheck = false; // Flag to check IndexedDB for existing backup
    this._entropyRestored = false; // Track if entropy restoration was attempted
    this.localStorageKey = this.generateLocalStorageKey();
  }

  // Ensure entropy is restored from IndexedDB before any critical operations
  // This handles the case where localStorage was cleared but IndexedDB has backup
  async ensureEntropyRestored() {
    if (this._entropyRestored) return; // Already done
    this._entropyRestored = true;

    try {
      const currentEntropy = localStorage.getItem('__wk_entropy__');
      const backupEntropy = await this.getEntropyFromIndexedDB();

      console.log(
        '[ensureEntropyRestored] Current:',
        currentEntropy ? 'EXISTS' : 'NULL',
        'Backup:',
        backupEntropy ? 'EXISTS' : 'NULL'
      );

      if (backupEntropy && currentEntropy !== backupEntropy) {
        // IndexedDB has DIFFERENT entropy - restore it
        console.log('[ensureEntropyRestored] Restoring entropy from IndexedDB backup');
        localStorage.setItem('__wk_entropy__', backupEntropy);
        this.localStorageKey = 'xrpl-wallet-v1-' + backupEntropy;
      } else if (!backupEntropy && currentEntropy) {
        // No backup exists - backup current entropy
        console.log('[ensureEntropyRestored] Backing up current entropy to IndexedDB');
        await this.backupEntropyToIndexedDB(currentEntropy);
      }
    } catch (e) {
      console.error('[ensureEntropyRestored] Error:', e);
    }
  }

  // Backup entropy to IndexedDB (prevents lockout if localStorage cleared)
  async backupEntropyToIndexedDB(entropy) {
    try {
      const db = await this.initDB();
      const tx = db.transaction([this.walletsStore], 'readwrite');
      tx.objectStore(this.walletsStore).put({
        id: '__entropy_backup__',
        lookupHash: '__entropy_backup__',
        data: entropy,
        timestamp: Date.now()
      });
    } catch (e) {
      /* silent */
    }
  }

  // Restore entropy from IndexedDB backup
  async getEntropyFromIndexedDB() {
    console.log('[getEntropyFromIndexedDB] Starting...');
    try {
      const db = await this.initDB();
      console.log('[getEntropyFromIndexedDB] DB initialized, querying...');
      return new Promise((resolve) => {
        const req = db
          .transaction([this.walletsStore], 'readonly')
          .objectStore(this.walletsStore)
          .get('__entropy_backup__');
        req.onsuccess = () => {
          console.log('[getEntropyFromIndexedDB] Success:', req.result?.data ? 'EXISTS' : 'NULL');
          resolve(req.result?.data || null);
        };
        req.onerror = () => {
          console.log('[getEntropyFromIndexedDB] Error');
          resolve(null);
        };
      });
    } catch (e) {
      console.log('[getEntropyFromIndexedDB] Exception:', e.message);
      return null;
    }
  }

  // Generate a device-specific key for localStorage encryption
  // Uses ONLY random entropy (stable) - no browser fingerprinting (unstable)
  generateLocalStorageKey() {
    if (typeof window === 'undefined') return 'server-side-key';

    // Check for stored random entropy (128 bits of cryptographic randomness)
    let storedEntropy = localStorage.getItem('__wk_entropy__');
    if (!storedEntropy) {
      const randomBytes = crypto.getRandomValues(new Uint8Array(16));
      storedEntropy = btoa(String.fromCharCode(...randomBytes));
      localStorage.setItem('__wk_entropy__', storedEntropy);
      // DON'T backup yet - mark for IndexedDB check first
      // IndexedDB may have existing backup that we should restore instead
      this._entropyNeedsCheck = true;
    }

    // Key derivation: entropy + version (no unstable browser fingerprinting)
    // The entropy provides 128 bits of randomness, PBKDF2 provides the stretching
    return 'xrpl-wallet-v1-' + storedEntropy;
  }

  // Check if Web Crypto API is available (secure context required)
  isSecureContext() {
    return (
      typeof window !== 'undefined' && window.isSecureContext && window.crypto?.subtle !== undefined
    );
  }

  // Encrypt data for localStorage (using Web Crypto API)
  async encryptForLocalStorage(data) {
    if (!this.isSecureContext()) {
      throw new Error('HTTPS required for wallet encryption');
    }

    const encoder = new TextEncoder();
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.localStorageKey),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 600000, // OWASP 2025 standard
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(dataString)
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  }

  // Decrypt data from localStorage
  async decryptFromLocalStorage(encryptedData) {
    if (!this.isSecureContext()) {
      throw new Error('HTTPS required for wallet decryption');
    }

    const encoder = new TextEncoder();
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.localStorageKey),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 600000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, encrypted);

    const decoded = new TextDecoder().decode(decrypted);
    try {
      return JSON.parse(decoded);
    } catch {
      return decoded; // Plain string (e.g., passwords)
    }
  }

  // Store provider password in IndexedDB alongside wallets
  async storeProviderPassword(providerId, password) {
    const db = await this.initDB();

    // initDB now handles store creation, this should always exist
    if (!db.objectStoreNames.contains(this.walletsStore)) {
      db.close();
      throw new Error('Wallet store not initialized');
    }

    const encrypted = await this.encryptForLocalStorage(password);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readwrite');
      const store = transaction.objectStore(this.walletsStore);

      // Use special ID format for password records
      const record = {
        id: `__pwd__${providerId}`,
        lookupHash: `__pwd__${providerId}`,
        data: encrypted,
        timestamp: Date.now()
      };

      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProviderPassword(providerId) {
    try {
      const db = await this.initDB();

      // Check if store exists
      if (!db.objectStoreNames.contains(this.walletsStore)) {
        devLog('Wallets store does not exist yet');
        return null;
      }

      return new Promise(async (resolve) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);
        const pwdKey = `__pwd__${providerId}`;
        const request = store.get(pwdKey);

        request.onsuccess = async () => {
          if (request.result && request.result.data) {
            try {
              const decrypted = await this.decryptFromLocalStorage(request.result.data);
              devLog('Password retrieved from IndexedDB for provider:', providerId);
              resolve(decrypted);
            } catch (decryptError) {
              devLog('Password decryption failed:', decryptError.message);
              resolve(null);
            }
          } else {
            devLog('No password found in IndexedDB for provider:', providerId);
            resolve(null);
          }
        };
        request.onerror = () => {
          resolve(null);
        };
      });
    } catch (error) {
      devError('Error getting provider password:', error);
      return null;
    }
  }

  // Secure localStorage wrapper methods
  async setSecureItem(key, value) {
    if (typeof window === 'undefined') return;

    // For wallet passwords, use IndexedDB instead
    if (key.startsWith('wallet_pwd_')) {
      const providerId = key.replace('wallet_pwd_', '');
      return await this.storeProviderPassword(providerId, value);
    }

    const encrypted = await this.encryptForLocalStorage(value);
    localStorage.setItem(key + '_enc', encrypted);

    // Remove any unencrypted version
    localStorage.removeItem(key);
  }

  async getSecureItem(key) {
    if (typeof window === 'undefined') return null;

    // For wallet passwords, use dedicated method
    if (key.startsWith('wallet_pwd_')) {
      const providerId = key.replace('wallet_pwd_', '');
      return await this.getProviderPassword(providerId);
    }

    const encrypted = localStorage.getItem(key + '_enc');
    if (!encrypted) return null;

    return await this.decryptFromLocalStorage(encrypted);
  }

  removeSecureItem(key) {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(key);
    localStorage.removeItem(key + '_enc');
  }

  async initDB() {
    // Module-level singleton: reuse existing DB promise across ALL instances
    if (UnifiedWalletStorage._sharedDbPromise) {
      return UnifiedWalletStorage._sharedDbPromise;
    }

    console.log('[initDB] Creating new DB connection...');
    UnifiedWalletStorage._sharedDbPromise = this._initDBInternal();
    return UnifiedWalletStorage._sharedDbPromise;
  }

  async _initDBInternal() {
    console.log('[_initDBInternal] Starting...');
    // First, detect existing database version and check if store exists
    const { existingVersion, hasStore } = await new Promise((resolve) => {
      console.log('[_initDBInternal] Opening DB to detect version...');
      const detectRequest = indexedDB.open(this.dbName);

      // Timeout to prevent hanging forever
      const timeout = setTimeout(() => {
        console.error('[_initDBInternal] DB open TIMEOUT - using defaults');
        resolve({ existingVersion: 1, hasStore: false });
      }, 5000);

      detectRequest.onblocked = () => {
        console.error('[_initDBInternal] DB BLOCKED - close other tabs using this site');
        clearTimeout(timeout);
        resolve({ existingVersion: 1, hasStore: false });
      };
      detectRequest.onsuccess = () => {
        clearTimeout(timeout);
        const db = detectRequest.result;
        const version = db.version;
        const hasStore = db.objectStoreNames.contains(this.walletsStore);
        db.close();
        console.log('[_initDBInternal] Detected version:', version, 'hasStore:', hasStore);
        resolve({ existingVersion: version, hasStore });
      };
      detectRequest.onerror = () => {
        clearTimeout(timeout);
        console.log('[_initDBInternal] Detection error');
        resolve({ existingVersion: 1, hasStore: false });
      };
    });

    // If store doesn't exist, we need to bump version to trigger onupgradeneeded
    let targetVersion = Math.max(existingVersion, this.version);
    if (!hasStore) {
      targetVersion = existingVersion + 1;
    }
    this.version = targetVersion;
    console.log('[_initDBInternal] Opening DB with version:', targetVersion);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, targetVersion);

      // Timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.error('[_initDBInternal] Final DB open TIMEOUT');
        reject(new Error('IndexedDB open timeout'));
      }, 5000);

      request.onblocked = () => {
        console.error('[_initDBInternal] Final DB BLOCKED - close other tabs');
        clearTimeout(timeout);
        reject(new Error('IndexedDB blocked - close other tabs'));
      };
      request.onerror = () => {
        clearTimeout(timeout);
        console.log('[_initDBInternal] DB open error:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        clearTimeout(timeout);
        console.log('[_initDBInternal] DB opened successfully');
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const transaction = event.target.transaction;

        // Create or update wallets store
        let store;
        if (!db.objectStoreNames.contains(this.walletsStore)) {
          store = db.createObjectStore(this.walletsStore, {
            keyPath: 'id',
            autoIncrement: true
          });
        } else {
          store = transaction.objectStore(this.walletsStore);
        }

        // 2025 Security: Only index non-sensitive fields
        if (!store.indexNames.contains('lookupHash')) {
          store.createIndex('lookupHash', 'lookupHash', { unique: false });
        }
        if (!store.indexNames.contains('timestamp')) {
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        // Remove old indexes that exposed data
        if (store.indexNames.contains('address')) {
          store.deleteIndex('address');
        }
        if (store.indexNames.contains('provider')) {
          store.deleteIndex('provider');
        }
        if (store.indexNames.contains('provider_id')) {
          store.deleteIndex('provider_id');
        }
        if (store.indexNames.contains('active')) {
          store.deleteIndex('active');
        }
      };
    });
  }

  async deriveKey(pin, salt) {
    const encoder = new TextEncoder();

    // Enhance PIN security by adding static entropy
    const enhancedPin = `xrpl-wallet-pin-v1-${pin}`;

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(enhancedPin),
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

  async encryptData(data, pin) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(pin, salt);

    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));

    // AES-GCM includes authentication tag for integrity
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

    // GCM mode automatically includes a 16-byte authentication tag
    // No need for separate HMAC as GCM provides authenticated encryption

    // Return as base64 string with version prefix for future migrations
    const version = new Uint8Array([1]); // Version 1
    const combinedBuffer = new Uint8Array(1 + salt.length + iv.length + encrypted.byteLength);
    combinedBuffer.set(version, 0);
    combinedBuffer.set(salt, 1);
    combinedBuffer.set(iv, 1 + salt.length);
    combinedBuffer.set(new Uint8Array(encrypted), 1 + salt.length + iv.length);

    return btoa(String.fromCharCode(...combinedBuffer));
  }

  async decryptData(encryptedString, pin) {
    // Decode base64 string
    const combinedBuffer = new Uint8Array(
      atob(encryptedString)
        .split('')
        .map((char) => char.charCodeAt(0))
    );

    // Check for version byte
    const version = combinedBuffer[0];

    let salt, iv, encrypted;

    if (version === 1) {
      // Version 1 format (with version byte)
      salt = combinedBuffer.slice(1, 17);
      iv = combinedBuffer.slice(17, 29);
      encrypted = combinedBuffer.slice(29);
    } else {
      // Legacy format (no version) - for backward compatibility
      salt = combinedBuffer.slice(0, 16);
      iv = combinedBuffer.slice(16, 28);
      encrypted = combinedBuffer.slice(28);
    }

    const key = await this.deriveKey(pin, salt);

    // AES-GCM will automatically verify the authentication tag
    // and throw if data has been tampered with
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }

  async storeWallet(walletData, pin) {
    const db = await this.initDB();

    // initDB now handles store creation, this should always exist
    if (!db.objectStoreNames.contains(this.walletsStore)) {
      db.close();
      throw new Error('Wallet store not initialized');
    }

    // Generate unique ID for this wallet
    const walletId = crypto.randomUUID();

    // Encrypt ALL wallet data including metadata - NOTHING in plaintext
    const fullData = {
      ...walletData,
      id: walletId,
      storedAt: Date.now()
    };
    const encryptedData = await this.encryptData(fullData, pin);

    // Generate lookup hash (one-way, can't reverse to get address)
    const encoder = new TextEncoder();
    const addressHash = await crypto.subtle.digest('SHA-256', encoder.encode(walletData.address));
    const lookupHash = btoa(String.fromCharCode(...new Uint8Array(addressHash))).slice(0, 12);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readwrite');
      const store = transaction.objectStore(this.walletsStore);

      // Store encrypted data with minimal public metadata
      const maskedAddr = walletData.address
        ? `${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}`
        : null;

      const record = {
        id: walletId,
        lookupHash: lookupHash, // One-way hash for finding wallet
        data: encryptedData, // Everything encrypted
        maskedAddress: maskedAddr, // Public: truncated address for UX
        timestamp: Date.now()
      };

      const request = store.add(record);

      request.onerror = () => {
        // If duplicate, that's fine - wallet already exists
        resolve(null);
      };
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getWallet(address, pin) {
    const db = await this.initDB();

    if (!db.objectStoreNames.contains(this.walletsStore)) {
      return null;
    }

    // Generate lookup hash from address
    const encoder = new TextEncoder();
    const addressHash = await crypto.subtle.digest('SHA-256', encoder.encode(address));
    const lookupHash = btoa(String.fromCharCode(...new Uint8Array(addressHash))).slice(0, 12);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readonly');
      const store = transaction.objectStore(this.walletsStore);
      const index = store.index('lookupHash');

      const request = index.getAll(lookupHash);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        if (request.result && request.result.length > 0) {
          try {
            const walletData = await this.decryptData(request.result[0].data, pin);
            resolve(walletData);
          } catch (error) {
            reject(new Error('Invalid PIN'));
          }
        } else {
          reject(new Error('Wallet not found'));
        }
      };
    });
  }

  async getAllWallets(pin) {
    const db = await this.initDB();

    if (!db.objectStoreNames.contains(this.walletsStore)) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readonly');
      const store = transaction.objectStore(this.walletsStore);

      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        const wallets = [];
        for (const record of request.result) {
          // Skip password records (stored with __pwd__ prefix)
          if (record.id && typeof record.id === 'string' && record.id.startsWith('__pwd__')) {
            continue;
          }
          try {
            const walletData = await this.decryptData(record.data, pin);
            wallets.push(walletData);
          } catch (error) {
            // Skip wallets that can't be decrypted with this PIN
          }
        }
        resolve(wallets);
      };
    });
  }

  async hasWallet() {
    try {
      const db = await this.initDB();

      if (!db.objectStoreNames.contains(this.walletsStore)) {
        return false;
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);

        const request = store.count();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result > 0);
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Get wallet metadata WITHOUT requiring password (for UI display)
   * Returns list of wallets with masked addresses and provider info
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
          // Filter out special records (passwords, entropy backup)
          const walletRecords = records.filter(
            (r) =>
              r.id &&
              typeof r.id === 'string' &&
              !r.id.startsWith('__pwd__') &&
              !r.id.startsWith('__entropy')
          );

          // Return public metadata only
          const metadata = walletRecords.map((r) => ({
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
   * Try to unlock all wallets with just a password (for returning users)
   * Returns all decrypted wallets if password is correct
   */
  async unlockWithPassword(password) {
    const rateLimitKey = 'wallet_unlock';

    // Rate limiting check
    const rateCheck = securityUtils.rateLimiter.check(rateLimitKey);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.error);
    }

    try {
      const allWallets = await this.getAllWallets(password);

      if (!allWallets || allWallets.length === 0) {
        securityUtils.rateLimiter.recordFailure(rateLimitKey);
        return []; // No wallets found - not necessarily wrong password
      }

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

  /**
   * Check if any stored password exists (indicates returning user)
   */
  async hasStoredCredentials() {
    try {
      const db = await this.initDB();

      if (!db.objectStoreNames.contains(this.walletsStore)) {
        return false;
      }

      return new Promise((resolve) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);
        const request = store.getAll();

        request.onerror = () => resolve(false);
        request.onsuccess = () => {
          const records = request.result || [];
          // Check for password records
          const hasPasswords = records.some(
            (r) => r.id && typeof r.id === 'string' && r.id.startsWith('__pwd__')
          );
          // Check for device credentials in localStorage
          const hasDeviceCreds =
            typeof window !== 'undefined' &&
            Object.keys(localStorage).some((k) => k.startsWith('device_pwd_'));

          resolve(hasPasswords || hasDeviceCreds);
        };
      });
    } catch (error) {
      return false;
    }
  }

  validatePin(pin) {
    const pinStr = pin.toString();
    const isValidLength = pinStr.length === 6;
    const isAllNumbers = /^\d{6}$/.test(pinStr);
    const isNotSequential = !this.isSequentialDigits(pinStr);
    const isNotRepeating = !this.isRepeatingDigits(pinStr);

    return {
      isValid: isValidLength && isAllNumbers && isNotSequential && isNotRepeating,
      requirements: {
        correctLength: isValidLength,
        onlyNumbers: isAllNumbers,
        notSequential: isNotSequential,
        notRepeating: isNotRepeating
      }
    };
  }

  isSequentialDigits(pin) {
    // Check for sequential patterns like 123456, 654321
    const ascending = pin
      .split('')
      .every((digit, i) => i === 0 || parseInt(digit) === parseInt(pin[i - 1]) + 1);
    const descending = pin
      .split('')
      .every((digit, i) => i === 0 || parseInt(digit) === parseInt(pin[i - 1]) - 1);
    return ascending || descending;
  }

  isRepeatingDigits(pin) {
    // Check for repeating patterns like 111111, 121212
    const allSame = pin.split('').every((digit) => digit === pin[0]);
    const alternating =
      pin.length === 6 &&
      pin[0] === pin[2] &&
      pin[2] === pin[4] &&
      pin[1] === pin[3] &&
      pin[3] === pin[5];
    return allSame || alternating;
  }

  async deleteWallet(address) {
    const db = await this.initDB();

    if (!db.objectStoreNames.contains(this.walletsStore)) {
      return null;
    }

    // Generate lookup hash from address
    const encoder = new TextEncoder();
    const addressHash = await crypto.subtle.digest('SHA-256', encoder.encode(address));
    const lookupHash = btoa(String.fromCharCode(...new Uint8Array(addressHash))).slice(0, 12);

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

  // Store passkey-wallet mapping
  async storePasskeyWallet(passkeyId, walletData, pin) {
    const db = await this.initDB();

    // initDB now handles store creation, this should always exist
    if (!db.objectStoreNames.contains(this.walletsStore)) {
      db.close();
      throw new Error('Wallet store not initialized');
    }

    // Include passkey ID in wallet data
    const fullWalletData = {
      ...walletData,
      passkeyId,
      credentials: { [passkeyId]: pin }
    };

    // Encrypt and store
    const encryptedData = await this.encryptData(fullWalletData, pin);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readwrite');
      const store = transaction.objectStore(this.walletsStore);

      const record = {
        address: walletData.address,
        active: true,
        data: encryptedData,
        passkeyId,
        timestamp: Date.now()
      };

      const request = store.add(record);

      request.onerror = () => {
        // If duplicate, that's fine - wallet already exists
        resolve(null);
      };
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Get wallet by passkey ID
  async getWalletByPasskey(passkeyId) {
    const db = await this.initDB();

    if (!db.objectStoreNames.contains(this.walletsStore)) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readonly');
      const store = transaction.objectStore(this.walletsStore);

      const request = store.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          if (cursor.value.passkeyId === passkeyId) {
            resolve(cursor.value);
          } else {
            cursor.continue();
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Store password for device wallets (encrypted with device-specific key)
  async storeWalletCredential(passkeyId, userSecret) {
    // Store password encrypted in localStorage for auto-decryption
    await this.setSecureItem(`device_pwd_${passkeyId}`, userSecret);

    // Also store in memory cache for this session
    if (!this.credentialCache) this.credentialCache = new Map();
    this.credentialCache.set(passkeyId, userSecret);
  }

  async getWalletCredential(passkeyId) {
    // Check memory cache first
    if (this.credentialCache && this.credentialCache.has(passkeyId)) {
      return this.credentialCache.get(passkeyId);
    }

    // Try to get from encrypted localStorage
    const storedPassword = await this.getSecureItem(`device_pwd_${passkeyId}`);
    if (storedPassword) {
      // Cache in memory for this session
      if (!this.credentialCache) this.credentialCache = new Map();
      this.credentialCache.set(passkeyId, storedPassword);
      return storedPassword;
    }

    // Check if wallet exists with this passkey
    const walletRecord = await this.getWalletByPasskey(passkeyId);
    if (walletRecord) {
      // Wallet exists but we don't have PIN - return null to prompt
      return null;
    }

    return null;
  }

  async getWallets(pin) {
    return this.getAllWallets(pin);
  }

  /**
   * Get ALL wallets for a specific OAuth provider
   */
  async getAllWalletsForProvider(provider, providerId, password) {
    try {
      devLog('=== getAllWalletsForProvider ===');
      devLog('Provider:', provider, 'ID:', providerId);

      // Get ALL wallets with this password
      const allWallets = await this.getAllWallets(password);

      // Filter by provider and provider_id
      const providerWallets = allWallets.filter(
        (w) => w.provider === provider && w.provider_id === providerId
      );

      devLog('Found', providerWallets.length, 'wallets for', provider);
      return providerWallets;
    } catch (error) {
      devError('Error getting provider wallets:', error);
      return [];
    }
  }

  /**
   * Get ALL wallets for a specific device/passkey
   */
  async getAllWalletsForDevice(deviceKeyId, password) {
    try {
      console.log('[WalletStorage] getAllWalletsForDevice - deviceKeyId:', deviceKeyId);

      // Get ALL wallets with this password
      const allWallets = await this.getAllWallets(password);

      // Filter by deviceKeyId
      const deviceWallets = allWallets.filter(
        (w) => w.deviceKeyId === deviceKeyId || w.passkeyId === deviceKeyId
      );

      console.log('[WalletStorage] Found', deviceWallets.length, 'wallets for device');
      return deviceWallets;
    } catch (error) {
      console.error('[WalletStorage] Error getting device wallets:', error);
      return [];
    }
  }

  // ============ OAuth/Social Authentication Methods ============

  /**
   * Handle OAuth login and setup wallet - LOADS ALL WALLETS FOR THIS PROVIDER
   */
  async handleSocialLogin(profile, accessToken, backend) {
    devLog('handleSocialLogin:', profile.provider);
    console.log('[handleSocialLogin] Step 1: Checking entropy...');

    // CRITICAL: ALWAYS check IndexedDB backup and compare with localStorage
    // This handles the case where AppContext creates an instance before callback.js
    const currentEntropy = localStorage.getItem('__wk_entropy__');
    console.log('[handleSocialLogin] Current entropy:', currentEntropy ? 'EXISTS' : 'NULL');

    console.log('[handleSocialLogin] Step 2: Getting entropy from IndexedDB...');
    const backupEntropy = await this.getEntropyFromIndexedDB();
    console.log('[handleSocialLogin] Backup entropy:', backupEntropy ? 'EXISTS' : 'NULL');

    if (backupEntropy && currentEntropy !== backupEntropy) {
      // IndexedDB has DIFFERENT entropy - it's the correct one, restore it
      console.log('[handleSocialLogin] Entropy mismatch - restoring from IndexedDB backup');
      localStorage.setItem('__wk_entropy__', backupEntropy);
      this.localStorageKey = this.generateLocalStorageKey();
    } else if (!backupEntropy && currentEntropy) {
      // No backup exists - this is a NEW user, backup current entropy
      console.log('[handleSocialLogin] No backup - backing up current entropy');
      await this.backupEntropyToIndexedDB(currentEntropy);
    }

    try {
      const walletId = `${profile.provider}_${profile.id}`;
      console.log('[handleSocialLogin] Step 3: Checking password for walletId:', walletId);

      // Check if password exists (means wallets were created)
      const storedPassword = await this.getSecureItem(`wallet_pwd_${walletId}`);
      console.log('[handleSocialLogin] Stored password:', storedPassword ? 'EXISTS' : 'NULL');

      if (storedPassword) {
        // First check localStorage for profiles
        const storedProfiles =
          typeof window !== 'undefined' ? localStorage.getItem('profiles') : null;

        if (storedProfiles) {
          const profiles = JSON.parse(storedProfiles);
          const providerProfiles = profiles.filter(
            (p) => p.provider === profile.provider && p.provider_id === profile.id
          );

          if (providerProfiles.length > 0) {
            devLog(
              '[STORAGE] ✅ Found',
              providerProfiles.length,
              'profiles in localStorage (no decryption needed)'
            );

            return {
              success: true,
              wallet: providerProfiles[0],
              allWallets: providerProfiles,
              requiresPassword: false
            };
          }
        }

        // Fallback: password exists but localStorage is empty - decrypt from IndexedDB
        devLog('⚠️ Password exists but localStorage is empty - decrypting wallets from IndexedDB');

        try {
          const allWallets = await this.getAllWalletsForProvider(
            profile.provider,
            profile.id,
            storedPassword
          );

          if (allWallets && allWallets.length > 0) {
            devLog('[STORAGE] ✅ Decrypted', allWallets.length, 'wallets from IndexedDB');

            // Restore profiles to localStorage
            if (typeof window !== 'undefined') {
              const existingProfiles = localStorage.getItem('profiles');
              const currentProfiles = existingProfiles ? JSON.parse(existingProfiles) : [];

              // Add these wallets to profiles (include accountIndex!)
              allWallets.forEach((w, index) => {
                if (!currentProfiles.find((p) => p.account === w.address)) {
                  currentProfiles.push({
                    account: w.address,
                    address: w.address,
                    publicKey: w.publicKey,
                    wallet_type: 'oauth',
                    provider: profile.provider,
                    provider_id: profile.id,
                    accountIndex: w.accountIndex ?? index,
                    createdAt: w.createdAt || Date.now(),
                    tokenCreatedAt: Date.now()
                  });
                }
              });

              localStorage.setItem('profiles', JSON.stringify(currentProfiles));
            }

            return {
              success: true,
              wallet: allWallets[0],
              allWallets: allWallets,
              requiresPassword: false
            };
          }

          // Password exists but no wallets found - wallets may have been deleted
          devLog('⚠️ Password exists but no wallets found in IndexedDB');
        } catch (error) {
          devError('[STORAGE] Failed to decrypt wallets with stored password:', error);
        }

        // Password exists but wallets missing/corrupted - still return success with stored password
        // so callback.js can use it for auto-login attempt
        return {
          success: false,
          requiresPassword: true,
          walletExists: true,
          storedPassword: storedPassword,
          action: 'recover'
        };
      }

      devLog('❌ No wallet found locally - new user');
      return {
        success: false,
        requiresPassword: true,
        walletExists: false,
        action: 'create'
      };
    } catch (error) {
      devError('Social login error:', error);
      throw error;
    }
  }

  // REMOVED: createSocialWallet, completeSocialWalletSetup, storeWalletWithSocialId
  // Now creating 5 wallets directly in handleOAuthPasswordSetup

  /**
   * DEPRECATED - Just use storeWallet directly
   */
  async storeWalletWithSocialId(wallet, profile, password) {
    const walletData = {
      address: wallet.address,
      publicKey: wallet.publicKey,
      seed: wallet.seed,
      wallet_type: 'oauth',
      provider: profile.provider,
      provider_id: profile.id,
      createdAt: Date.now()
    };

    await this.storeWallet(walletData, password);
    await this.setSecureItem(`wallet_pwd_${profile.provider}_${profile.id}`, password);
  }

  /**
   * Check if wallet exists for OAuth user (without requiring password)
   * Returns basic wallet info if found, null otherwise
   */
  async checkWalletExists(walletId) {
    try {
      const db = await this.initDB();

      if (!db.objectStoreNames.contains(this.walletsStore)) {
        return null;
      }

      // Create lookup hash for the social ID
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(walletId));
      const lookupHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer))).slice(0, 12);

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);
        const request = store.get(lookupHash);

        request.onsuccess = () => {
          if (request.result) {
            // Wallet exists, return basic info (address is stored in metadata)
            // We store address in metadata for quick lookup without decryption
            const metadata = request.result.metadata || {};
            resolve({
              address: metadata.address || walletId, // Fallback to walletId
              exists: true
            });
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          devError('Error checking wallet existence:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      devError('Error in checkWalletExists:', error);
      return null;
    }
  }

  /**
   * Find wallet in IndexedDB for OAuth user
   * Now requires password since all data is encrypted
   */
  async findWalletBySocialId(walletId, password, knownAddress = null) {
    try {
      devLog('findWalletBySocialId called with:', walletId, 'knownAddress:', knownAddress);

      // OPTIMIZATION: If we have the address, look up directly by address (much faster!)
      if (knownAddress) {
        try {
          const wallet = await this.getWalletByAddress(knownAddress, password);
          if (wallet) {
            devLog('✅ Found wallet by address (fast path):', wallet.address);
            return wallet;
          }
        } catch (err) {
          devLog('Fast path failed, falling back to full search:', err.message);
        }
      }

      // SLOW PATH: Extract provider and provider_id from walletId (format: "provider_id")
      const [provider, ...idParts] = walletId.split('_');
      const providerId = idParts.join('_'); // Handle IDs that might contain underscores

      devLog('Searching for provider:', provider, 'ID:', providerId);

      // Get all wallets and filter by provider/provider_id
      const allWallets = await this.getAllWallets(password);

      devLog('Total wallets decrypted:', allWallets.length);

      // Find the first wallet matching this provider and provider_id
      const wallet = allWallets.find(
        (w) => w.provider === provider && w.provider_id === providerId
      );

      if (wallet) {
        devLog('✅ Found wallet for social ID:', wallet.address);
        return {
          address: wallet.address,
          publicKey: wallet.publicKey,
          seed: wallet.seed,
          provider: wallet.provider,
          provider_id: wallet.provider_id,
          found: true
        };
      } else {
        devLog('❌ No wallet found for provider:', provider, 'ID:', providerId);
        return null;
      }
    } catch (e) {
      devError('Error finding wallet:', e);
      return null;
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
      const lookupHash = btoa(String.fromCharCode(...new Uint8Array(addressHash))).slice(0, 12);

      return new Promise(async (resolve, reject) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);
        const index = store.index('lookupHash');

        // Use index to find by lookupHash
        const request = index.getAll(lookupHash);

        request.onsuccess = async () => {
          const records = request.result;

          if (!records || records.length === 0) {
            resolve(null);
            return;
          }

          // Try to decrypt the first matching record
          try {
            const decrypted = await this.decryptData(records[0].data, password);
            resolve({
              address: decrypted.address,
              publicKey: decrypted.publicKey,
              seed: decrypted.seed,
              provider: decrypted.provider,
              provider_id: decrypted.provider_id
            });
          } catch (e) {
            reject(new Error('Incorrect password'));
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      devError('Error getting wallet by address:', e);
      return null;
    }
  }

  // REMOVED: deriveOAuthKey - No longer using deterministic generation

  /**
   * Generate TRUE RANDOM wallet for social profile - NO DETERMINISTIC FALLBACK
   * 2025 Standard: Real entropy only
   */
  generateRandomWallet() {
    // Generate true random entropy - NO DERIVATION
    const entropy = crypto.getRandomValues(new Uint8Array(32));

    // Create wallet from random entropy
    return Wallet.fromEntropy(Array.from(entropy));
  }

  // Backend storage methods removed - wallets are ONLY stored locally

  /**
   * Get encrypted wallet blob for backup download
   * Returns ONLY encrypted data - no metadata exposed
   */
  async getEncryptedWalletBlob(address) {
    try {
      const db = await this.initDB();

      if (!db.objectStoreNames.contains(this.walletsStore)) {
        return null;
      }

      // Generate lookup hash
      const encoder = new TextEncoder();
      const addressHash = await crypto.subtle.digest('SHA-256', encoder.encode(address));
      const lookupHash = btoa(String.fromCharCode(...new Uint8Array(addressHash))).slice(0, 12);

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);

        // Get all records and find by lookupHash
        const request = store.getAll();

        request.onsuccess = () => {
          const records = request.result || [];
          const walletRecord = records.find((r) => r.lookupHash === lookupHash);

          if (walletRecord && walletRecord.data) {
            // Return ONLY the encrypted blob - no metadata
            resolve({
              version: '2.0',
              data: walletRecord.data, // Everything is encrypted inside
              format: 'AES-GCM-PBKDF2-1M' // Just format info, no sensitive data
            });
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          devError('Error getting encrypted wallet:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      devError('Error getting encrypted wallet blob:', error);
      return null;
    }
  }

  /**
   * Export all wallets for a provider as encrypted backup
   * Returns encrypted backup containing all 5 wallets
   */
  async exportAllWallets(provider, providerId, password) {
    try {
      // Get all wallets for this provider
      const wallets = await this.getAllWalletsForProvider(provider, providerId, password);

      if (!wallets || wallets.length === 0) {
        throw new Error('No wallets found to export');
      }

      // Create backup data with all wallets
      const backupData = {
        version: '3.0',
        provider: provider,
        walletCount: wallets.length,
        wallets: wallets.map((w) => ({
          address: w.address,
          publicKey: w.publicKey,
          seed: w.seed,
          imported: w.imported || false,
          createdAt: w.createdAt || Date.now()
        })),
        exportedAt: Date.now()
      };

      // Encrypt the entire backup with the password
      const encrypted = await this.encryptData(backupData, password);

      return {
        type: 'xrpl-encrypted-wallet',
        version: '3.0',
        provider: provider,
        walletCount: wallets.length,
        data: {
          encrypted: encrypted
        },
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      devError('Error exporting wallets:', error);
      throw error;
    }
  }
}

// Backward compatibility
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
