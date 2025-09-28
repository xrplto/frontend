import { Wallet } from 'xrpl';

export class UnifiedWalletStorage {
  constructor() {
    this.dbName = 'XRPLWalletDB';
    this.walletsStore = 'encrypted_wallets';
    this.profilesStore = 'profiles';
    this.credentialsStore = 'wallet_credentials'; // Store for passkey-PIN mappings
    this.version = 3; // Increment for schema changes
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Encrypted wallets store
        if (!db.objectStoreNames.contains(this.walletsStore)) {
          db.createObjectStore(this.walletsStore, { keyPath: 'id' });
        }

        // Profiles store
        if (!db.objectStoreNames.contains(this.profilesStore)) {
          const store = db.createObjectStore(this.profilesStore, { keyPath: 'account' });
          store.createIndex('wallet_type', 'wallet_type', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Credentials store for passkey-PIN mappings
        if (!db.objectStoreNames.contains(this.credentialsStore)) {
          db.createObjectStore(this.credentialsStore, { keyPath: 'passkeyId' });
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

    // Use higher iterations to compensate for shorter PIN
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: typeof salt === 'string' ? encoder.encode(salt) : salt,
        iterations: 500000, // Double iterations for PIN security
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptWallet(walletData, pin) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(pin, salt);

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(walletData));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return {
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
      salt: Array.from(salt),
      timestamp: Date.now()
    };
  }

  async decryptWallet(encryptedData, pin) {
    const { encrypted, iv, salt } = encryptedData;
    const key = await this.deriveKey(pin, new Uint8Array(salt));

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(encrypted)
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }

  async storeWallet(walletData, pin) {
    const db = await this.initDB();
    const encryptedData = await this.encryptWallet(walletData, pin);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readwrite');
      const store = transaction.objectStore(this.walletsStore);

      const request = store.put({ id: 'main_wallet', ...encryptedData });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getWallet(pin) {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readonly');
      const store = transaction.objectStore(this.walletsStore);

      const request = store.get('main_wallet');

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        if (request.result) {
          try {
            const walletData = await this.decryptWallet(request.result, pin);
            // Handle both single wallet and multi-wallet formats
            if (walletData.wallets && Array.isArray(walletData.wallets)) {
              resolve(walletData.wallets[0]); // Return only first wallet
            } else {
              resolve(walletData);
            }
          } catch (error) {
            reject(new Error('Invalid PIN'));
          }
        } else {
          reject(new Error('No wallet found'));
        }
      };
    });
  }

  async hasWallet() {
    try {
      const db = await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.walletsStore], 'readonly');
        const store = transaction.objectStore(this.walletsStore);

        const request = store.get('main_wallet');

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(!!request.result);
      });
    } catch (error) {
      return false;
    }
  }

  async deleteWallet() {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readwrite');
      const store = transaction.objectStore(this.walletsStore);

      const request = store.delete('main_wallet');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
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

  async createWalletFromPin(pin) {
    const wallets = [];

    // Create only 1 wallet for performance
    const i = 0;
    const enhancedPin = `xrpl-wallet-pin-v1-${pin}-account-${i}`;
    const wallet = Wallet.generate();

    const walletData = {
      seed: wallet.seed,
      address: wallet.address,
      publicKey: wallet.publicKey,
      createdAt: Date.now(),
      wallet_type: 'pin',
      accountIndex: i
    };

    wallets.push(walletData);

    // Store wallet
    await this.storeWallet(walletData, pin);
    return wallets;
  }

  async storeWallets(wallets, pin) {
    const db = await this.initDB();
    const encryptedData = await this.encryptWallet({ wallets }, pin);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readwrite');
      const store = transaction.objectStore(this.walletsStore);

      const request = store.put({ id: 'main_wallet', ...encryptedData });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getWallets(pin) {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.walletsStore], 'readonly');
      const store = transaction.objectStore(this.walletsStore);

      const request = store.get('main_wallet');

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        if (request.result) {
          try {
            const data = await this.decryptWallet(request.result, pin);
            // Only return the first wallet to avoid duplicates from old data
            if (data.wallets && Array.isArray(data.wallets)) {
              resolve([data.wallets[0]]); // Return only first wallet
            } else {
              resolve([data]); // Single wallet format
            }
          } catch (error) {
            reject(new Error('Invalid PIN'));
          }
        } else {
          reject(new Error('No wallet found'));
        }
      };
    });
  }

  // Profile Management Methods
  async storeProfiles(profiles) {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.profilesStore], 'readwrite');
      const store = transaction.objectStore(this.profilesStore);

      // Clear existing profiles first
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        // Add all profiles
        let completed = 0;
        const total = profiles.length;

        if (total === 0) {
          resolve();
          return;
        }

        profiles.forEach(profile => {
          const addRequest = store.put(profile);
          addRequest.onsuccess = () => {
            completed++;
            if (completed === total) {
              resolve();
            }
          };
          addRequest.onerror = () => reject(addRequest.error);
        });
      };

      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  async getProfiles() {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.profilesStore], 'readonly');
      const store = transaction.objectStore(this.profilesStore);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async addProfile(profile) {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.profilesStore], 'readwrite');
      const store = transaction.objectStore(this.profilesStore);
      const request = store.put(profile);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async removeProfile(account) {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.profilesStore], 'readwrite');
      const store = transaction.objectStore(this.profilesStore);
      const request = store.delete(account);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Store encrypted passkey-PIN mapping
  async storeWalletCredential(passkeyId, userSecret) {
    const db = await this.initDB();

    // Encrypt the PIN with a device-specific key
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await this.deriveKey('device-local-key', salt);

    const encoder = new TextEncoder();
    const data = encoder.encode(userSecret);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.credentialsStore], 'readwrite');
      const store = transaction.objectStore(this.credentialsStore);
      const request = store.put({
        passkeyId,
        encryptedPin: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv),
        salt: Array.from(salt),
        timestamp: Date.now()
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Retrieve and decrypt wallet credential
  async getWalletCredential(passkeyId) {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.credentialsStore], 'readonly');
      const store = transaction.objectStore(this.credentialsStore);
      const request = store.get(passkeyId);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        if (!request.result) {
          resolve(null);
          return;
        }

        try {
          const { encryptedPin, iv, salt } = request.result;
          const key = await this.deriveKey('device-local-key', new Uint8Array(salt));

          const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(iv) },
            key,
            new Uint8Array(encryptedPin)
          );

          const decoder = new TextDecoder();
          resolve(decoder.decode(decrypted));
        } catch (error) {
          resolve(null); // Return null if decryption fails
        }
      };
    });
  }

  // Clear stored credentials
  async clearWalletCredentials() {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.credentialsStore], 'readwrite');
      const store = transaction.objectStore(this.credentialsStore);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

// Backward compatibility
export const EncryptedWalletStorage = UnifiedWalletStorage;