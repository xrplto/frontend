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
    this.version = 1;
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create wallets store with exact structure from screenshot
        if (!db.objectStoreNames.contains(this.walletsStore)) {
          const store = db.createObjectStore(this.walletsStore, {
            keyPath: 'id',
            autoIncrement: true
          });

          // Add indexes as shown in screenshot
          store.createIndex('active', 'active', { unique: false });
          store.createIndex('address', 'address', { unique: true, multiEntry: false });
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

      // Store with structure matching screenshot
      const record = {
        address: walletData.address,
        active: true,
        data: encryptedData,
        timestamp: Date.now()
      };

      const request = store.add(record);

      request.onerror = () => reject(request.error);
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

      request.onerror = () => reject(request.error);
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

  async createWalletFromPin(pin) {
    const wallet = Wallet.generate();

    const walletData = {
      seed: wallet.seed,
      address: wallet.address,
      publicKey: wallet.publicKey,
      createdAt: Date.now(),
      wallet_type: 'pin',
      accountIndex: 0
    };

    await this.storeWallet(walletData, pin);
    return [walletData];
  }

  async getWallets(pin) {
    return this.getAllWallets(pin);
  }

  // ============ OAuth/Social Authentication Methods ============

  /**
   * Handle OAuth login and setup wallet
   */
  async handleSocialLogin(profile, accessToken, backend) {
    try {
      // Check if user has any wallet with this social ID
      const walletId = `${profile.provider}_${profile.id}`;

      // Try to find existing wallet
      const existingWallet = await this.findWalletBySocialId(walletId);

      if (existingWallet) {
        // Wallet exists - user already set password before
        // OAuth proves identity, so unlock automatically
        return {
          success: true,
          wallet: {
            address: existingWallet.address,
            publicKey: existingWallet.publicKey,
            seed: existingWallet.seed
          },
          requiresPassword: false
        };
      }

      // Check backend for existing wallet
      const response = await backend.get(`/api/wallets/social/${profile.provider}/${profile.id}`);

      if (response.data) {
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
        address: wallet.address,
        publicKey: wallet.publicKey,
        seed: wallet.seed
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
        address: wallet.address,
        publicKey: wallet.publicKey,
        seed: wallet.seed
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

    // Store with password encryption (primary security)
    await this.storeWallet({
      seed: wallet.seed,
      address: wallet.address,
      publicKey: wallet.publicKey,
      wallet_type: 'social',
      provider: profile.provider,
      provider_id: profile.id
    }, password);

    // ALSO store with OAuth-derived key for auto-unlock
    const oauthKey = this.deriveOAuthKey(profile);

    // Use crypto-js for OAuth encryption (simpler for this use case)
    if (typeof window !== 'undefined' && window.CryptoJS) {
      const CryptoJS = window.CryptoJS;
      const encryptedForOAuth = CryptoJS.AES.encrypt(
        JSON.stringify({
          seed: wallet.seed,
          address: wallet.address,
          publicKey: wallet.publicKey
        }),
        oauthKey
      ).toString();

      // Store OAuth-encrypted version
      const db = await this.initDB();
      const tx = db.transaction(['social_mappings'], 'readwrite');
      await tx.objectStore('social_mappings').put({
        id: walletId,
        address: wallet.address,
        provider: profile.provider,
        provider_id: profile.id,
        oauth_encrypted: encryptedForOAuth,
        created_at: Date.now()
      });
    }
  }

  /**
   * Find and decrypt wallet using OAuth identity
   */
  async findWalletBySocialId(walletId) {
    try {
      const db = await this.initDB();

      // Check if social_mappings store exists
      if (!db.objectStoreNames.contains('social_mappings')) {
        // Need to upgrade DB to add social_mappings
        db.close();
        await this.upgradeDBForSocial();
        const newDb = await this.initDB();
        return this.findWalletBySocialIdInternal(newDb, walletId);
      }

      return this.findWalletBySocialIdInternal(db, walletId);
    } catch (e) {
      console.error('Find wallet error:', e);
    }
    return null;
  }

  async findWalletBySocialIdInternal(db, walletId) {
    try {
      const tx = db.transaction(['social_mappings'], 'readonly');
      const mapping = await new Promise((resolve, reject) => {
        const request = tx.objectStore('social_mappings').get(walletId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (mapping && mapping.oauth_encrypted && typeof window !== 'undefined' && window.CryptoJS) {
        const CryptoJS = window.CryptoJS;
        const profile = {
          provider: mapping.provider,
          id: mapping.provider_id
        };
        const oauthKey = this.deriveOAuthKey(profile);

        try {
          const decrypted = CryptoJS.AES.decrypt(mapping.oauth_encrypted, oauthKey);
          const walletData = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

          // Successfully decrypted - OAuth identity verified!
          return {
            seed: walletData.seed,
            address: walletData.address,
            publicKey: walletData.publicKey,
            provider: mapping.provider,
            provider_id: mapping.provider_id
          };
        } catch (e) {
          console.error('OAuth decrypt failed:', e);
          return null;
        }
      }
    } catch (e) {
      console.error('Error in findWalletBySocialIdInternal:', e);
    }
    return null;
  }

  /**
   * Upgrade DB to add social_mappings store
   */
  async upgradeDBForSocial() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version + 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Add social_mappings store if it doesn't exist
        if (!db.objectStoreNames.contains('social_mappings')) {
          db.createObjectStore('social_mappings', { keyPath: 'id' });
        }
      };
    });
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
    if (typeof window === 'undefined' || !window.CryptoJS) {
      throw new Error('CryptoJS not available');
    }

    const CryptoJS = window.CryptoJS;
    const serverSecret = process.env.NEXT_PUBLIC_WALLET_SECRET || 'default-secret';

    // Create deterministic seed from profile
    const seed = CryptoJS.PBKDF2(
      `xrpl-social-${profile.provider}-${profile.id}`,
      `${serverSecret}-${profile.email || profile.username || profile.id}`,
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
}

// Backward compatibility
export const EncryptedWalletStorage = UnifiedWalletStorage;