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

        // Ensure indexes exist (address is NOT unique to allow duplicates)
        if (!store.indexNames.contains('active')) {
          store.createIndex('active', 'active', { unique: false });
        }
        if (!store.indexNames.contains('address')) {
          store.createIndex('address', 'address', { unique: false });
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

    // OWASP 2025: 600k iterations for PBKDF2-HMAC-SHA256
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

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintext
    );

    // Return as base64 string like in the screenshot
    const combinedBuffer = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combinedBuffer.set(salt, 0);
    combinedBuffer.set(iv, salt.length);
    combinedBuffer.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...combinedBuffer));
  }

  async decryptData(encryptedString, pin) {
    // Decode base64 string
    const combinedBuffer = new Uint8Array(
      atob(encryptedString).split('').map(char => char.charCodeAt(0))
    );

    // Extract salt, iv, and encrypted data
    const salt = combinedBuffer.slice(0, 16);
    const iv = combinedBuffer.slice(16, 28);
    const encrypted = combinedBuffer.slice(28);

    const key = await this.deriveKey(pin, salt);

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

    // Encrypt entire wallet data into single string
    const encryptedData = await this.encryptData(walletData, pin);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readwrite');
      const store = transaction.objectStore(this.walletsStore);

      // Don't set id - let autoIncrement handle it
      const record = {
        address: walletData.address,
        active: true,
        data: encryptedData,
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

      // Try to find existing wallet
      const existingWallet = await this.findWalletBySocialId(walletId);
      console.log('findWalletBySocialId result:', existingWallet);

      if (existingWallet) {
        console.log('✅ WALLET FOUND - Should auto-login');
        // Wallet exists - user already set password before
        // OAuth proves identity, so unlock automatically
        const result = {
          success: true,
          wallet: {
            account: existingWallet.address,
            address: existingWallet.address,
            publicKey: existingWallet.publicKey,
            seed: existingWallet.seed,
            wallet_type: 'oauth'
          },
          requiresPassword: false
        };
        console.log('Returning success result:', result);
        return result;
      }

      console.log('❌ No wallet found locally, checking backend...');
      // Check backend for existing wallet
      const response = await backend.get(`/api/wallets/social/${profile.provider}/${profile.id}`);

      if (response.data) {
        console.log('Found wallet on backend, needs local storage');
        // Wallet exists on server but not locally
        // Need password to store locally
        return {
          success: false,
          requiresPassword: true,
          walletExists: true,
          backendData: response.data,
          action: 'recover'
        };
      } else {
        console.log('No wallet on backend either - new user');
        // Brand new user - need to create wallet with password
        return {
          success: false,
          requiresPassword: true,
          walletExists: false,
          action: 'create'
        };
      }
    } catch (error) {
      console.error('Social login error:', error);
      throw error;
    }
  }

  /**
   * Create new wallet with user-provided password (one time only)
   */
  async createSocialWallet(profile, password, backend) {
    // Validate password
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Generate wallet
    const wallet = this.generateDeterministicWallet(profile);

    // Store on backend (server-encrypted)
    const serverEncrypted = this.encryptForServer(wallet, profile);
    await backend.post('/api/wallets/social', {
      provider: profile.provider,
      provider_id: profile.id,
      address: wallet.address,
      public_key: wallet.publicKey,
      encrypted_seed: serverEncrypted,
      created_at: Date.now()
    });

    // Store locally with user's password and OAuth key
    await this.storeWalletWithSocialId(wallet, profile, password);

    return {
      success: true,
      wallet: {
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        seed: wallet.seed,
        wallet_type: 'oauth'
      }
    };
  }

  /**
   * Recover wallet from backend with user password (one time only)
   */
  async recoverSocialWallet(backendData, profile, password, backend) {
    const seed = this.decryptFromServer(backendData.encrypted_seed, profile);
    const wallet = Wallet.fromSeed(seed);

    // Store locally with user's password
    await this.storeWalletWithSocialId(wallet, profile, password);

    return {
      success: true,
      wallet: {
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        seed: wallet.seed,
        wallet_type: 'oauth'
      }
    };
  }

  /**
   * Complete wallet setup flow (called after password is provided)
   */
  async completeSocialWalletSetup(profile, password, action, backendData, backend) {
    if (action === 'create') {
      return await this.createSocialWallet(profile, password, backend);
    } else if (action === 'recover' && backendData) {
      return await this.recoverSocialWallet(backendData, profile, password, backend);
    } else {
      throw new Error('Invalid action');
    }
  }

  /**
   * Store wallet with dual encryption:
   * 1. Password encryption in IndexedDB (for security)
   * 2. OAuth-derived key encryption (for auto-unlock)
   */
  async storeWalletWithSocialId(wallet, profile, password) {
    const walletId = `${profile.provider}_${profile.id}`;

    // Store only once with user's password
    await this.storeWallet({
      seed: wallet.seed,
      address: wallet.address,
      publicKey: wallet.publicKey,
      wallet_type: 'social',
      provider: profile.provider,
      provider_id: profile.id,
      oauth_key: walletId
    }, password);
  }

  /**
   * Find wallet in IndexedDB for OAuth user
   */
  async findWalletBySocialId(walletId) {
    try {
      console.log('findWalletBySocialId called with:', walletId);
      const db = await this.initDB();
      const [provider, ...idParts] = walletId.split('_');
      const id = idParts.join('_'); // Handle IDs that might contain underscores

      // Generate deterministic wallet to get the expected address
      const profile = { provider, id };
      const deterministicWallet = this.generateDeterministicWallet(profile);
      const expectedAddress = deterministicWallet.address;
      console.log('Looking for wallet with address:', expectedAddress);

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);
        const index = store.index('address');

        // Look up wallet by exact address match
        const request = index.get(expectedAddress);

        request.onsuccess = () => {
          const walletRecord = request.result;
          if (walletRecord) {
            console.log('✅ Found wallet by address:', walletRecord.address);

            // Return the wallet data with regenerated seed
            resolve({
              address: walletRecord.address,
              publicKey: deterministicWallet.publicKey,
              seed: deterministicWallet.seed,
              provider,
              provider_id: id,
              found: true
            });
          } else {
            console.log('❌ No wallet found with address:', expectedAddress);
            resolve(null);
          }
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


  /**
   * Derive deterministic key from OAuth profile
   */
  deriveOAuthKey(profile) {
    const secret = process.env.NEXT_PUBLIC_OAUTH_SECRET || 'xrpl-oauth-2025';
    return `${secret}-${profile.provider}-${profile.id}`;
  }

  /**
   * Generate deterministic wallet from social profile
   */
  generateDeterministicWallet(profile) {
    // CryptoJS should be available at this point
    const CryptoJS = window.CryptoJS;
    if (!CryptoJS) {
      throw new Error('CryptoJS not available for wallet generation');
    }
    const serverSecret = process.env.NEXT_PUBLIC_WALLET_SECRET || 'default-secret';

    // IMPORTANT: Only use stable, immutable values for deterministic generation
    // Do NOT use email or username as they might be missing or change
    // Only use provider and id which are guaranteed to be consistent
    const seed = CryptoJS.PBKDF2(
      `xrpl-social-${profile.provider}-${profile.id}`,
      `${serverSecret}-${profile.provider}-${profile.id}`,
      {
        keySize: 256/32,
        iterations: 100000,
        hasher: CryptoJS.algo.SHA256
      }
    );

    // Convert to entropy
    const seedHex = seed.toString();
    const entropy = [];
    for (let i = 0; i < 32; i++) {
      entropy.push(parseInt(seedHex.substr(i * 2, 2), 16));
    }

    return Wallet.fromEntropy(entropy);
  }

  /**
   * Encrypt wallet for server storage
   */
  encryptForServer(wallet, profile) {
    if (typeof window === 'undefined' || !window.CryptoJS) {
      throw new Error('CryptoJS not available');
    }

    const CryptoJS = window.CryptoJS;
    const serverSecret = process.env.NEXT_PUBLIC_SERVER_SECRET || 'server-secret-2025';
    const key = `${serverSecret}-${profile.provider}-${profile.id}`;
    return CryptoJS.AES.encrypt(wallet.seed, key).toString();
  }

  /**
   * Decrypt wallet from server storage
   */
  decryptFromServer(encryptedSeed, profile) {
    if (typeof window === 'undefined' || !window.CryptoJS) {
      throw new Error('CryptoJS not available');
    }

    const CryptoJS = window.CryptoJS;
    const serverSecret = process.env.NEXT_PUBLIC_SERVER_SECRET || 'server-secret-2025';
    const key = `${serverSecret}-${profile.provider}-${profile.id}`;
    const decrypted = CryptoJS.AES.decrypt(encryptedSeed, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Get encrypted wallet blob for backup download
   */
  async getEncryptedWalletBlob(address) {
    try {
      const db = await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);
        const index = store.index('address');
        const request = index.get(address);

        request.onsuccess = () => {
          const walletRecord = request.result;
          if (walletRecord && walletRecord.encrypted) {
            // Return the encrypted data that's already stored
            resolve({
              encrypted: walletRecord.encrypted,
              salt: walletRecord.salt,
              iterations: walletRecord.iterations || 600000,
              algorithm: 'AES-GCM',
              keyDerivation: 'PBKDF2'
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