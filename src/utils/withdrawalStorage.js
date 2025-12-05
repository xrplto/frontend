/**
 * Withdrawal Address Storage
 *
 * Stores saved withdrawal addresses in IndexedDB with device-specific encryption.
 * Uses the same encryption pattern as encryptedWalletStorage.js for consistency.
 *
 * Data is encrypted with device-specific key (no password required).
 * Tied to current browser/device.
 */

// Reuse encryption utilities from wallet storage
import { UnifiedWalletStorage } from './encryptedWalletStorage';

class WithdrawalStorage {
  constructor() {
    this.dbName = 'XRPLWalletDB'; // Same DB as wallet storage
    this.storeName = 'withdrawals';

    // Reuse encryption methods from wallet storage
    this.walletStorage = new UnifiedWalletStorage();
  }

  async initDB() {
    // First, check current DB version and if store exists
    const currentVersion = await this.getCurrentVersion();

    return new Promise((resolve, reject) => {
      // Open without version to get current state
      const checkRequest = indexedDB.open(this.dbName);

      checkRequest.onsuccess = () => {
        const db = checkRequest.result;
        const hasStore = db.objectStoreNames.contains(this.storeName);
        const version = db.version;
        db.close();

        if (hasStore) {
          // Store exists, just open normally
          const openRequest = indexedDB.open(this.dbName, version);
          openRequest.onsuccess = () => resolve(openRequest.result);
          openRequest.onerror = () => reject(openRequest.error);
        } else {
          // Need to create store - bump version
          const upgradeRequest = indexedDB.open(this.dbName, version + 1);

          upgradeRequest.onerror = () => reject(upgradeRequest.error);
          upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);

          upgradeRequest.onupgradeneeded = (event) => {
            const upgradeDb = event.target.result;

            // Create withdrawals store
            if (!upgradeDb.objectStoreNames.contains(this.storeName)) {
              const store = upgradeDb.createObjectStore(this.storeName, {
                keyPath: 'id',
                autoIncrement: true
              });
              store.createIndex('userAddress', 'userAddress', { unique: false });
              store.createIndex('timestamp', 'timestamp', { unique: false });
            }
          };
        }
      };

      checkRequest.onerror = () => reject(checkRequest.error);

      checkRequest.onupgradeneeded = (event) => {
        // DB doesn't exist yet, create it with withdrawals store
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('userAddress', 'userAddress', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async getCurrentVersion() {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName);
      request.onsuccess = () => {
        const version = request.result.version;
        request.result.close();
        resolve(version);
      };
      request.onerror = () => resolve(1);
    });
  }

  /**
   * Encrypt data with fallback for non-secure contexts (dev)
   */
  async encrypt(data) {
    try {
      return await this.walletStorage.encryptForLocalStorage(data);
    } catch (e) {
      // Fallback: base64 encode for development (not secure, but functional)
      console.warn('Encryption unavailable, using base64 fallback');
      return '__b64__' + btoa(JSON.stringify(data));
    }
  }

  /**
   * Decrypt data with fallback
   */
  async decrypt(encrypted) {
    if (encrypted.startsWith('__b64__')) {
      return JSON.parse(atob(encrypted.slice(7)));
    }
    return await this.walletStorage.decryptFromLocalStorage(encrypted);
  }

  /**
   * Add a new withdrawal address
   * @param {string} userAddress - Current user's XRPL address (for multi-account support)
   * @param {object} withdrawal - { name, address, tag? }
   */
  async add(userAddress, withdrawal) {
    const db = await this.initDB();

    const data = {
      name: withdrawal.name,
      address: withdrawal.address,
      tag: withdrawal.tag || '',
      createdAt: Date.now()
    };

    // Encrypt the withdrawal data
    const encrypted = await this.encrypt(data);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const record = {
        userAddress, // Store in plaintext for filtering by user
        data: encrypted,
        timestamp: Date.now()
      };

      const request = store.add(record);
      request.onsuccess = () => resolve({ ...data, id: request.result });
      request.onerror = () => reject(new Error(request.error?.message || 'Failed to save'));
    });
  }

  /**
   * Get all withdrawal addresses for a user
   * @param {string} userAddress - Current user's XRPL address
   */
  async getAll(userAddress) {
    const db = await this.initDB();

    if (!db.objectStoreNames.contains(this.storeName)) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('userAddress');

      const request = index.getAll(userAddress);

      request.onsuccess = async () => {
        const records = request.result || [];
        const decrypted = [];

        for (const record of records) {
          try {
            const data = await this.decrypt(record.data);
            decrypted.push({
              id: record.id,
              ...data
            });
          } catch (e) {
            // Skip corrupted records
            console.warn('Failed to decrypt withdrawal record:', e);
          }
        }

        // Sort by creation date (newest first)
        decrypted.sort((a, b) => b.createdAt - a.createdAt);
        resolve(decrypted);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update a withdrawal address
   * @param {number} id - Record ID
   * @param {object} updates - { name?, address?, tag? }
   */
  async update(id, updates) {
    const db = await this.initDB();

    return new Promise(async (resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Get existing record
      const getRequest = store.get(id);

      getRequest.onsuccess = async () => {
        if (!getRequest.result) {
          reject(new Error('Withdrawal address not found'));
          return;
        }

        const existing = getRequest.result;

        // Decrypt existing data
        let data;
        try {
          data = await this.decrypt(existing.data);
        } catch (e) {
          reject(new Error('Failed to decrypt existing data'));
          return;
        }

        // Merge updates
        const updated = {
          ...data,
          ...updates,
          updatedAt: Date.now()
        };

        // Re-encrypt
        const encrypted = await this.encrypt(updated);

        // Save
        const record = {
          ...existing,
          data: encrypted,
          timestamp: Date.now()
        };

        const putRequest = store.put(record);
        putRequest.onsuccess = () => resolve({ id, ...updated });
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Delete a withdrawal address
   * @param {number} id - Record ID
   */
  async remove(id) {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if an address is already saved
   * @param {string} userAddress - Current user's XRPL address
   * @param {string} withdrawalAddress - Address to check
   */
  async exists(userAddress, withdrawalAddress) {
    const all = await this.getAll(userAddress);
    return all.some(w => w.address === withdrawalAddress);
  }

  /**
   * Clear all withdrawal addresses for a user
   * @param {string} userAddress - Current user's XRPL address
   */
  async clearAll(userAddress) {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('userAddress');

      const request = index.getAllKeys(userAddress);

      request.onsuccess = () => {
        const keys = request.result || [];
        let deleted = 0;

        if (keys.length === 0) {
          resolve(0);
          return;
        }

        keys.forEach(key => {
          const deleteRequest = store.delete(key);
          deleteRequest.onsuccess = () => {
            deleted++;
            if (deleted === keys.length) {
              resolve(deleted);
            }
          };
        });
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const withdrawalStorage = new WithdrawalStorage();

// Export class for testing
export { WithdrawalStorage };
