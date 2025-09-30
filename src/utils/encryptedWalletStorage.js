import { Wallet } from 'xrpl';

// CryptoJS will be loaded dynamically when needed for OAuth
let CryptoJS;
if (typeof window !== 'undefined') {
  import('crypto-js').then(module => {
    CryptoJS = module.default;
    window.CryptoJS = CryptoJS;
  });
}

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

  // Encrypt data for localStorage (using Web Crypto API)
  async encryptForLocalStorage(data) {
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
        iterations: 100000, // Less iterations for localStorage (faster)
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
          iterations: 100000,
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
      console.error('Decryption failed:', error);
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

    // 2025 Security: 1M iterations minimum
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: typeof salt === 'string' ? encoder.encode(salt) : salt,
        iterations: 1000000, // 1 million for 2025
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

  // Backward compatibility - store credential mapping
  async storeWalletCredential(passkeyId, userSecret) {
    // Store PIN temporarily in memory for this session
    // This allows checking if passkey has been used before
    if (!this.credentialCache) this.credentialCache = new Map();
    this.credentialCache.set(passkeyId, userSecret);
  }

  async getWalletCredential(passkeyId) {
    // Check memory cache first
    if (this.credentialCache && this.credentialCache.has(passkeyId)) {
      return this.credentialCache.get(passkeyId);
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
    console.log('=== handleSocialLogin START ===');
    console.log('Profile:', profile);

    try {
      // Check if user has any wallet with this social ID
      const walletId = `${profile.provider}_${profile.id}`;
      console.log('Looking for wallet with ID:', walletId);

      // Check localStorage mapping first (fast lookup)
      const socialMapping = JSON.parse(localStorage.getItem('social_wallet_mapping') || '{}');
      const mappedWallet = socialMapping[walletId];

      if (mappedWallet && mappedWallet.address) {
        console.log('✅ WALLET FOUND in mapping - auto-login without password');

        // Wallet exists locally - user already logged in before
        // Return the address so they can be logged in
        // The actual wallet data will be decrypted when needed
        const result = {
          success: true,
          wallet: {
            account: mappedWallet.address,
            address: mappedWallet.address,
            publicKey: '', // Will be filled from profile later
            seed: '', // Not needed for login, will be decrypted when needed
            wallet_type: 'oauth',
            provider: profile.provider,
            provider_id: profile.id
          },
          requiresPassword: false
        };
        console.log('Returning auto-login result:', result);
        return result;
      }

      console.log('❌ No wallet found locally - new user');
      // No backend check needed since we don't support cloud backup
      // Brand new user - need to create wallet with password
      return {
        success: false,
        requiresPassword: true,
        walletExists: false,
        action: 'create'
      };
    } catch (error) {
      console.error('Social login error:', error);
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
    const walletId = `${profile.provider}_${profile.id}`;

    // Store wallet with password encryption but include social ID in metadata
    await this.storeWallet({
      seed: wallet.seed,
      address: wallet.address,
      publicKey: wallet.publicKey,
      wallet_type: 'social',
      provider: profile.provider,
      provider_id: profile.id,
      oauth_key: walletId
    }, password);

    // Store social ID -> address mapping in localStorage for quick lookup
    const socialMapping = JSON.parse(localStorage.getItem('social_wallet_mapping') || '{}');
    socialMapping[walletId] = {
      address: wallet.address,
      createdAt: Date.now()
    };
    localStorage.setItem('social_wallet_mapping', JSON.stringify(socialMapping));
  }

  /**
   * Find wallet in IndexedDB for OAuth user
   * Now requires password since all data is encrypted
   */
  async findWalletBySocialId(walletId, password) {
    try {
      console.log('findWalletBySocialId called with:', walletId);
      const db = await this.initDB();
      const [provider, ...idParts] = walletId.split('_');
      const id = idParts.join('_');

      return new Promise(async (resolve, reject) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);

        // Must decrypt all wallets to find the right one
        // This is slower but secure - no metadata exposed
        const request = store.getAll();

        request.onsuccess = async () => {
          const records = request.result || [];

          // Try to decrypt each wallet to find matching social ID
          for (const record of records) {
            try {
              const decrypted = await this.decryptData(record.data, password);
              if (decrypted.provider === provider && decrypted.provider_id === id) {
                console.log('✅ Found wallet for social ID');
                resolve({
                  address: decrypted.address,
                  publicKey: decrypted.publicKey,
                  seed: decrypted.seed,
                  provider,
                  provider_id: id,
                  found: true
                });
                return;
              }
            } catch (e) {
              // Wrong password or different wallet, continue
              continue;
            }
          }

          console.log('❌ No wallet found for social ID:', walletId);
          resolve(null);
        };

        request.onerror = () => {
          console.error('Error searching for wallet:', request.error);
          resolve(null);
        };
      });
    } catch (e) {
      console.error('Error finding wallet:', e);
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
          console.error('Error getting encrypted wallet:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.error('Error getting encrypted wallet blob:', error);
      return null;
    }
  }
}

// Backward compatibility
export const EncryptedWalletStorage = UnifiedWalletStorage;