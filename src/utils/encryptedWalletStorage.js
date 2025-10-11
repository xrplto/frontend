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
const devLog = (...args) => isDev && console.log(...args);
const devError = (...args) => isDev && console.error(...args);

export class UnifiedWalletStorage {
  constructor() {
    this.dbName = 'XRPLWalletDB';
    this.walletsStore = 'wallets';
    this.version = 5;
    this.localStorageKey = this.generateLocalStorageKey();
  }

  // Generate a device-specific key for localStorage encryption
  generateLocalStorageKey() {
    if (typeof window === 'undefined') return 'server-side-key';

    // Use browser fingerprinting for key generation
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      navigator.hardwareConcurrency,
      new Date().getTimezoneOffset(),
      window.screen?.colorDepth,
      'xrpl-wallet-storage-v1'
    ].join('|');

    // Simple hash for consistent key
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
      hash = hash & hash;
    }
    return 'wallet-key-' + Math.abs(hash).toString(36);
  }

  // Check if Web Crypto API is available (secure context required)
  isSecureContext() {
    return typeof window !== 'undefined' &&
           window.isSecureContext &&
           window.crypto?.subtle !== undefined;
  }

  // Encrypt data for localStorage (using Web Crypto API)
  async encryptForLocalStorage(data) {
    // Fallback for non-secure contexts (HTTP over IP)
    if (!this.isSecureContext()) {
      devLog('Warning: Using base64 encoding instead of encryption (insecure context)');
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      return btoa(unescape(encodeURIComponent(dataString)));
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
    try {
      // Fallback for non-secure contexts (HTTP over IP)
      if (!this.isSecureContext()) {
        const decoded = decodeURIComponent(escape(atob(encryptedData)));
        try {
          return JSON.parse(decoded);
        } catch {
          return decoded;
        }
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
          iterations: 600000, // OWASP 2025 standard
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
        return decoded; // Return as string if not JSON
      }
    } catch (error) {
      devError('Decryption failed:', error);
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

    // Try encrypted version first
    const encrypted = localStorage.getItem(key + '_enc');
    if (encrypted) {
      return await this.decryptFromLocalStorage(encrypted);
    }

    // Check for unencrypted version (for migration)
    const unencrypted = localStorage.getItem(key);
    if (unencrypted) {
      try {
        const parsed = JSON.parse(unencrypted);
        // Migrate to encrypted storage
        await this.setSecureItem(key, parsed);
        return parsed;
      } catch {
        // Migrate plain string
        await this.setSecureItem(key, unencrypted);
        return unencrypted;
      }
    }

    return null;
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

      // Store ONLY encrypted data and lookup hash
      const record = {
        id: walletId,
        lookupHash: lookupHash, // One-way hash for finding wallet
        data: encryptedData, // Everything encrypted
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

  // ============ OAuth/Social Authentication Methods ============

  /**
   * Handle OAuth login and setup wallet
   */
  async handleSocialLogin(profile, accessToken, backend) {
    devLog('=== handleSocialLogin START ===');
    devLog('Profile:', profile);

    try {
      // Check if user has any wallet with this social ID
      const walletId = `${profile.provider}_${profile.id}`;
      devLog('Looking for wallet with ID:', walletId);

      // Check if wallet exists in IndexedDB (without decrypting)
      const walletExists = await this.checkWalletExists(walletId);

      if (walletExists) {
        devLog('✅ WALLET FOUND - auto-decrypting with stored password');

        // Try to get stored password for auto-decryption
        const storedPassword = await this.getSecureItem(`wallet_pwd_${walletId}`);
        devLog('[STORAGE] Checking stored password for:', walletId, 'found:', !!storedPassword);

        if (storedPassword) {
          // Auto-decrypt wallet with stored password
          devLog('[STORAGE] Attempting auto-decrypt...');
          const walletData = await this.findWalletBySocialId(walletId, storedPassword);

          if (walletData && walletData.seed) {
            devLog('[STORAGE] ✅ Auto-decrypted successfully, seed length:', walletData.seed?.length);
            const result = {
              success: true,
              wallet: {
                account: walletData.address,
                address: walletData.address,
                publicKey: walletData.publicKey,
                seed: walletData.seed,
                wallet_type: 'oauth',
                provider: profile.provider,
                provider_id: profile.id
              },
              requiresPassword: false
            };
            return result;
          }
        }

        // Fallback: return without seed (will need password later)
        devLog('⚠️ No stored password - will need password for transactions');
        const result = {
          success: true,
          wallet: {
            account: walletExists.address,
            address: walletExists.address,
            publicKey: '',
            seed: '',
            wallet_type: 'oauth',
            provider: profile.provider,
            provider_id: profile.id
          },
          requiresPassword: false
        };
        return result;
      }

      devLog('❌ No wallet found locally - new user');
      // No backend check needed since we don't support cloud backup
      // Brand new user - need to create wallet with password
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

  /**
   * Create new wallet with user-provided password (one time only)
   */
  async createSocialWallet(profile, password) {
    // Validate password
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Generate wallet
    // Generate TRUE RANDOM wallet - NO DETERMINISTIC (2025 standard)
    const wallet = this.generateRandomWallet();

    // Store ONLY locally with user's password - no backend storage
    await this.storeWalletWithSocialId(wallet, profile, password);

    return {
      success: true,
      wallet: {
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        seed: wallet.seed,
        wallet_type: 'oauth',
        provider: profile.provider,
        provider_id: profile.id
      }
    };
  }


  /**
   * Complete wallet setup flow (called after password is provided)
   */
  async completeSocialWalletSetup(profile, password, action) {
    // Only support create action - no backend storage/recovery
    if (action === 'create') {
      return await this.createSocialWallet(profile, password);
    } else {
      throw new Error('Invalid action');
    }
  }

  /**
   * Store wallet with OAuth metadata for finding later
   */
  async storeWalletWithSocialId(wallet, profile, password) {
    devLog('=== storeWalletWithSocialId START ===');
    devLog('Wallet address:', wallet.address);
    devLog('Profile:', profile);

    const walletId = `${profile.provider}_${profile.id}`;
    devLog('WalletId:', walletId);

    const db = await this.initDB();
    devLog('DB initialized:', db.name, 'version:', db.version);

    // Create a unique ID for the wallet record
    const recordId = crypto.randomUUID();
    devLog('Record ID:', recordId);

    // Encrypt all wallet data
    const fullData = {
      seed: wallet.seed,
      address: wallet.address,
      publicKey: wallet.publicKey,
      wallet_type: 'social',
      provider: profile.provider,
      provider_id: profile.id,
      oauth_key: walletId,
      id: recordId,
      storedAt: Date.now()
    };
    devLog('Full data to encrypt:', { ...fullData, seed: '[HIDDEN]' });

    const encryptedData = await this.encryptData(fullData, password);
    devLog('Encrypted data length:', encryptedData.length);

    // Store password encrypted with device-specific key for auto-decryption
    await this.setSecureItem(`wallet_pwd_${walletId}`, password);
    devLog('[STORAGE] ✅ Password stored for auto-decryption, key:', `wallet_pwd_${walletId}`);

    // Use OAuth walletId for lookup hash (not address)
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(walletId));
    const lookupHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer))).slice(0, 12);
    devLog('Lookup hash:', lookupHash);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readwrite');
      const store = transaction.objectStore(this.walletsStore);

      transaction.oncomplete = () => {
        devLog('=== Transaction completed successfully ===');
      };

      transaction.onerror = () => {
        devError('=== Transaction failed ===:', transaction.error);
      };

      transaction.onabort = () => {
        devError('=== Transaction aborted ===');
      };

      // Store with metadata for quick lookup
      // Use lookupHash as the id since the store uses inline keys
      const record = {
        id: lookupHash, // Use lookupHash as the id for inline key
        lookupHash: lookupHash, // Also store for consistency
        data: encryptedData,
        timestamp: Date.now(), // Add timestamp at record level for visibility
        metadata: {
          address: wallet.address // Store address for quick auto-login check
        }
      };
      devLog('Record to store:', { ...record, data: '[ENCRYPTED]' });

      // First check if a wallet with this lookupHash already exists
      const getRequest = store.get(lookupHash);
      devLog('Checking for existing wallet with hash:', lookupHash);

      getRequest.onsuccess = () => {
        devLog('Get request success, result:', getRequest.result ? 'Found existing' : 'Not found');

        if (getRequest.result) {
          // Wallet already exists, update it
          devLog('Updating existing wallet...');
          const updateRequest = store.put(record);
          updateRequest.onsuccess = () => {
            devLog('OAuth wallet updated successfully');
            devLog('Checking if really stored...');
            const checkRequest = store.get(lookupHash);
            checkRequest.onsuccess = () => {
              devLog('Verification: wallet in DB:', checkRequest.result ? 'YES' : 'NO');
              resolve();
            };
          };
          updateRequest.onerror = () => {
            devError('Failed to update OAuth wallet:', updateRequest.error);
            reject(updateRequest.error);
          };
        } else {
          // New wallet, add it
          devLog('Adding new wallet...');
          const addRequest = store.add(record);
          addRequest.onsuccess = () => {
            devLog('OAuth wallet stored successfully, key:', addRequest.result);
            devLog('Checking if really stored...');
            const checkRequest = store.get(lookupHash);
            checkRequest.onsuccess = () => {
              devLog('Verification: wallet in DB:', checkRequest.result ? 'YES' : 'NO');
              if (checkRequest.result) {
                devLog('Stored record:', { ...checkRequest.result, data: '[ENCRYPTED]' });
              }
              resolve();
            };
          };
          addRequest.onerror = () => {
            devError('Failed to store OAuth wallet:', addRequest.error);
            devError('Error details:', addRequest.error?.name, addRequest.error?.message);
            reject(addRequest.error);
          };
        }
      };

      getRequest.onerror = () => {
        devError('Failed to check for existing wallet:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  /**
   * Check if wallet exists for OAuth user (without requiring password)
   * Returns basic wallet info if found, null otherwise
   */
  async checkWalletExists(walletId) {
    try {
      const db = await this.initDB();

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
  async findWalletBySocialId(walletId, password) {
    try {
      devLog('findWalletBySocialId called with:', walletId);
      const db = await this.initDB();

      // Create lookup hash for direct access
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(walletId));
      const lookupHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer))).slice(0, 12);
      devLog('Looking up with hash:', lookupHash);

      return new Promise(async (resolve, reject) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);

        // Direct lookup using the hash
        const request = store.get(lookupHash);

        request.onsuccess = async () => {
          const record = request.result;

          if (!record) {
            devLog('❌ No wallet found for social ID');
            resolve(null);
            return;
          }

          try {
            // Decrypt the wallet data
            const decrypted = await this.decryptData(record.data, password);
            devLog('✅ Found and decrypted wallet for social ID');
            resolve({
              address: decrypted.address,
              publicKey: decrypted.publicKey,
              seed: decrypted.seed,
              provider: decrypted.provider,
              provider_id: decrypted.provider_id,
              found: true
            });
          } catch (e) {
            // Decryption failed - wrong password
            devError('❌ Decryption failed:', e.message);
            reject(new Error('Incorrect password'));
          }
        };

        request.onerror = () => {
          devError('Error finding wallet:', request.error);
          reject(request.error);
        };
      });
    } catch (e) {
      devError('Error finding wallet:', e);
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
}

// Backward compatibility
export const EncryptedWalletStorage = UnifiedWalletStorage;