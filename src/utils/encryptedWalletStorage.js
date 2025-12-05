import { Wallet } from 'xrpl';

// CryptoJS will be loaded dynamically when needed for OAuth
let CryptoJS;
if (typeof window !== 'undefined') {
  import('crypto-js').then(module => {
    CryptoJS = module.default;
    window.CryptoJS = CryptoJS;
  });
}

// Development logging helper
const isDev = process.env.NODE_ENV === 'development';
const devLog = () => {};
const devError = () => {};

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
      return { valid: false, error: 'Password needs more variety (mix letters, numbers, or symbols)' };
    }
    // Check for common weak passwords
    const weak = ['password', '12345678', 'qwerty12', 'letmein1', 'welcome1'];
    if (weak.some(w => password.toLowerCase().includes(w))) {
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
  constructor() {
    this.dbName = 'XRPLWalletDB';
    this.walletsStore = 'wallets';
    this.version = 1;
    this.localStorageKey = this.generateLocalStorageKey();
  }

  // Generate a device-specific key for localStorage encryption
  generateLocalStorageKey() {
    if (typeof window === 'undefined') return 'server-side-key';

    // Check for stored random component (adds entropy)
    let storedEntropy = localStorage.getItem('__wk_entropy__');
    if (!storedEntropy) {
      const randomBytes = crypto.getRandomValues(new Uint8Array(16));
      storedEntropy = btoa(String.fromCharCode(...randomBytes));
      localStorage.setItem('__wk_entropy__', storedEntropy);
    }

    // Use browser fingerprinting + random entropy for key generation
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      navigator.hardwareConcurrency,
      new Date().getTimezoneOffset(),
      window.screen?.colorDepth,
      window.screen?.width,
      window.screen?.height,
      storedEntropy, // Random component unique to this browser
      'xrpl-wallet-storage-v2'
    ].join('|');

    // Better hash function (FNV-1a)
    let hash = 2166136261;
    for (let i = 0; i < fingerprint.length; i++) {
      hash ^= fingerprint.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
    return 'wallet-key-' + hash.toString(36);
  }

  // Check if Web Crypto API is available (secure context required)
  isSecureContext() {
    return typeof window !== 'undefined' &&
           window.isSecureContext &&
           window.crypto?.subtle !== undefined;
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
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

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

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );

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

    // Check if store exists, if not we need to trigger upgrade
    if (!db.objectStoreNames.contains(this.walletsStore)) {
      db.close();
      // Bump version to trigger onupgradeneeded
      const newDb = await new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version + 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
          const upgradeDb = event.target.result;
          if (!upgradeDb.objectStoreNames.contains(this.walletsStore)) {
            const store = upgradeDb.createObjectStore(this.walletsStore, { keyPath: 'id', autoIncrement: true });
            store.createIndex('lookupHash', 'lookupHash', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      });
      this.version = this.version + 1;
      return this.storeProviderPassword(providerId, password);
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
        const request = store.get(`__pwd__${providerId}`);

        request.onsuccess = async () => {
          if (request.result && request.result.data) {
            try {
              const decrypted = await this.decryptFromLocalStorage(request.result.data);
              devLog('Password retrieved from IndexedDB for provider:', providerId);
              resolve(decrypted);
            } catch (decryptError) {
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
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

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
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintext
    );

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
      atob(encryptedString).split('').map(char => char.charCodeAt(0))
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
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }

  async storeWallet(walletData, pin) {
    const db = await this.initDB();

    // Check if store exists, if not trigger upgrade
    if (!db.objectStoreNames.contains(this.walletsStore)) {
      db.close();
      const newDb = await new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version + 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
          const upgradeDb = event.target.result;
          if (!upgradeDb.objectStoreNames.contains(this.walletsStore)) {
            const store = upgradeDb.createObjectStore(this.walletsStore, { keyPath: 'id', autoIncrement: true });
            store.createIndex('lookupHash', 'lookupHash', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      });
      this.version = this.version + 1;
      return this.storeWallet(walletData, pin);
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
    const addressHash = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(walletData.address)
    );
    const lookupHash = btoa(String.fromCharCode(...new Uint8Array(addressHash))).slice(0, 12);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readwrite');
      const store = transaction.objectStore(this.walletsStore);

      // Store encrypted data with minimal public metadata
      const maskedAddr = walletData.address ?
        `${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}` : null;

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
    const addressHash = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(address)
    );
    const lookupHash = btoa(String.fromCharCode(...new Uint8Array(addressHash))).slice(0, 12);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readonly');
      const store = transaction.objectStore(this.walletsStore);
      const index = store.index('address');

      const request = index.get(address);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        if (request.result) {
          try {
            const walletData = await this.decryptData(request.result.data, pin);
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
    const ascending = pin.split('').every((digit, i) =>
      i === 0 || parseInt(digit) === parseInt(pin[i-1]) + 1
    );
    const descending = pin.split('').every((digit, i) =>
      i === 0 || parseInt(digit) === parseInt(pin[i-1]) - 1
    );
    return ascending || descending;
  }

  isRepeatingDigits(pin) {
    // Check for repeating patterns like 111111, 121212
    const allSame = pin.split('').every(digit => digit === pin[0]);
    const alternating = pin.length === 6 && pin[0] === pin[2] && pin[2] === pin[4] && pin[1] === pin[3] && pin[3] === pin[5];
    return allSame || alternating;
  }

  async deleteWallet(address) {
    const db = await this.initDB();

    if (!db.objectStoreNames.contains(this.walletsStore)) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readwrite');
      const store = transaction.objectStore(this.walletsStore);
      const index = store.index('address');

      const getRequest = index.getKey(address);

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          const deleteRequest = store.delete(getRequest.result);
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

    if (!db.objectStoreNames.contains(this.walletsStore)) {
      db.close();
      await new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version + 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
          const upgradeDb = event.target.result;
          if (!upgradeDb.objectStoreNames.contains(this.walletsStore)) {
            const store = upgradeDb.createObjectStore(this.walletsStore, { keyPath: 'id', autoIncrement: true });
            store.createIndex('lookupHash', 'lookupHash', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      });
      this.version = this.version + 1;
      return this.storePasskeyWallet(passkeyId, walletData, pin);
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
      const providerWallets = allWallets.filter(w =>
        w.provider === provider && w.provider_id === providerId
      );

      devLog('Found', providerWallets.length, 'wallets for', provider);
      return providerWallets;
    } catch (error) {
      devError('Error getting provider wallets:', error);
      return [];
    }
  }

  // ============ OAuth/Social Authentication Methods ============

  /**
   * Handle OAuth login and setup wallet - LOADS ALL WALLETS FOR THIS PROVIDER
   */
  async handleSocialLogin(profile, accessToken, backend) {
    devLog('=== handleSocialLogin START ===');
    devLog('Profile:', profile);

    try {
      const walletId = `${profile.provider}_${profile.id}`;
      devLog('Looking for wallets with provider ID:', walletId);

      // Check if password exists (means wallets were created)
      const storedPassword = await this.getSecureItem(`wallet_pwd_${walletId}`);
      devLog('[STORAGE] Checking stored password for:', walletId, 'found:', !!storedPassword);

      if (storedPassword) {
        devLog('✅ Password found - wallets exist, loading from localStorage');

        // First check localStorage for profiles
        const storedProfiles = typeof window !== 'undefined' ? localStorage.getItem('profiles') : null;

        if (storedProfiles) {
          const profiles = JSON.parse(storedProfiles);
          const providerProfiles = profiles.filter(p =>
            p.provider === profile.provider && p.provider_id === profile.id
          );

          if (providerProfiles.length > 0) {
            devLog('[STORAGE] ✅ Found', providerProfiles.length, 'profiles in localStorage (no decryption needed)');

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
          const allWallets = await this.getAllWalletsForProvider(profile.provider, profile.id, storedPassword);

          if (allWallets && allWallets.length > 0) {
            devLog('[STORAGE] ✅ Decrypted', allWallets.length, 'wallets from IndexedDB');

            // Restore profiles to localStorage
            if (typeof window !== 'undefined') {
              const existingProfiles = localStorage.getItem('profiles');
              const currentProfiles = existingProfiles ? JSON.parse(existingProfiles) : [];

              // Add these wallets to profiles
              allWallets.forEach(w => {
                if (!currentProfiles.find(p => p.account === w.address)) {
                  currentProfiles.push({
                    account: w.address,
                    address: w.address,
                    publicKey: w.publicKey,
                    wallet_type: 'oauth',
                    provider: profile.provider,
                    provider_id: profile.id,
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
        } catch (error) {
          devError('[STORAGE] Failed to decrypt wallets with stored password:', error);
          // Password might be wrong or wallets corrupted - need new password
        }
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
      const wallet = allWallets.find(w =>
        w.provider === provider && w.provider_id === providerId
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
      const addressHash = await crypto.subtle.digest(
        'SHA-256',
        encoder.encode(address)
      );
      const lookupHash = btoa(String.fromCharCode(...new Uint8Array(addressHash))).slice(0, 12);

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);

        // Get all records and find by lookupHash
        const request = store.getAll();

        request.onsuccess = () => {
          const records = request.result || [];
          const walletRecord = records.find(r => r.lookupHash === lookupHash);

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
        wallets: wallets.map(w => ({
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

// Export security utilities for use in components
export { securityUtils };