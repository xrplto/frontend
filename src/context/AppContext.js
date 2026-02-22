import { useState, createContext, useEffect, useMemo } from 'react';
import api from 'src/utils/api';

// Redux
import { Provider, useDispatch } from 'react-redux';
import { configureRedux } from 'src/redux/store';

// Loader
import { PuffLoader } from 'src/components/Spinners';

// Split contexts for performance — consumers only re-render when their slice changes
export const ThemeContext = createContext({});
export const WalletContext = createContext({});
export const WalletUIContext = createContext({});
export const AppContext = createContext({});

// Lazy-loaded singleton — keeps EncryptedWalletStorage + crypto-js out of the initial bundle
let _walletStorageSingleton = null;
const getWalletStorage = async () => {
  if (!_walletStorageSingleton) {
    const { EncryptedWalletStorage } = await import('src/utils/encryptedWalletStorage');
    _walletStorageSingleton = new EncryptedWalletStorage();
  }
  return _walletStorageSingleton;
};

// Plain IndexedDB helpers for non-sensitive metadata (survives localStorage clearing)
const IDB_META_KEY = '__meta__active_wallet';
const saveActiveWalletToIDB = (address) => {
  try {
    const req = indexedDB.open('XRPLWalletDB');
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('wallets')) { db.close(); return; }
      const tx = db.transaction(['wallets'], 'readwrite');
      tx.objectStore('wallets').put({ id: IDB_META_KEY, lookupHash: IDB_META_KEY, data: address, timestamp: Date.now() });
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    };
  } catch (e) { /* best-effort */ }
};
const getActiveWalletFromIDB = () => new Promise((resolve) => {
  try {
    const req = indexedDB.open('XRPLWalletDB');
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('wallets')) { db.close(); return resolve(null); }
      const tx = db.transaction(['wallets'], 'readonly');
      const get = tx.objectStore('wallets').get(IDB_META_KEY);
      get.onsuccess = () => { db.close(); resolve(get.result?.data || null); };
      get.onerror = () => { db.close(); resolve(null); };
    };
    req.onerror = () => resolve(null);
  } catch (e) { resolve(null); }
});

// Strip sensitive fields before writing to localStorage (seeds stay in memory only)
const stripSeed = (profile) => {
  if (!profile) return profile;
  const { seed, ...safe } = profile;
  return safe;
};
const stripSeedArray = (profiles) => profiles.map(stripSeed);

function ContextProviderInner({ children, data, openSnackbar }) {
  const dispatch = useDispatch();
  const BASE_URL = 'https://api.xrpl.to/v1';

  // Define constants first before using them
  const KEY_ACCOUNT_PROFILE = 'account_profile';
  const KEY_ACCOUNT_PROFILES = 'account_profiles';

  const [sync, setSync] = useState(0);
  const [trustlineUpdate, setTrustlineUpdate] = useState(null); // { issuer, currency, hasTrustline }
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem('appThemeName');
    if (saved) return saved === 'XrplToDarkTheme';
    const legacy = window.localStorage.getItem('appTheme');
    return legacy !== null ? legacy === 'true' : true;
  });
  const [themeName, setThemeName] = useState(() => {
    if (typeof window === 'undefined') return 'XrplToDarkTheme';
    const saved = window.localStorage.getItem('appThemeName');
    if (saved) return saved;
    const isDark = window.localStorage.getItem('appTheme');
    return isDark === 'false' ? 'XrplToLightTheme' : 'XrplToDarkTheme';
  });
  const [activeFiatCurrency, setActiveFiatCurrency] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('appFiatCurrency') || 'XRP';
    }
    return 'XRP';
  });

  // Load profile synchronously on mount to avoid flash of "No wallet connected"
  const [accountProfile, setAccountProfile] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const profileStr = localStorage.getItem(KEY_ACCOUNT_PROFILE);
      if (profileStr) {
        return JSON.parse(profileStr);
      }
    } catch (err) {
      console.error('Failed to load profile on init:', err);
    }
    return null;
  });

  const [profiles, setProfiles] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const profilesStr = localStorage.getItem('profiles');
      if (profilesStr) {
        return JSON.parse(profilesStr);
      }
    } catch (err) {
      console.error('Failed to load profiles on init:', err);
    }
    return [];
  });
  const [deletingNfts, setDeletingNfts] = useState([]);

  const [open, setOpen] = useState(false);
  const [openWalletModal, setOpenWalletModal] = useState(false);
  const [pendingWalletAuth, setPendingWalletAuth] = useState(null);
  const [accountBalance, setAccountBalance] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const c = localStorage.getItem('xrpl_balance');
      return c ? JSON.parse(c) : null;
    } catch { return null; }
  });
  const [watchList, setWatchList] = useState([]);

  const toggleTheme = () => {
    window.localStorage.setItem('appTheme', !darkMode);
    setDarkMode(!darkMode);
  };

  const setTheme = (newThemeName) => {
    window.localStorage.setItem('appThemeName', newThemeName);
    setThemeName(newThemeName);
    // Update darkMode for backward compatibility
    setDarkMode(newThemeName === 'XrplToDarkTheme');
  };

  const toggleFiatCurrency = (newValue) => {
    window.localStorage.setItem('appFiatCurrency', newValue);
    setActiveFiatCurrency(newValue);
  };

  useEffect(() => {
    const savedThemeName = window.localStorage.getItem('appThemeName');
    const isDarkMode = window.localStorage.getItem('appTheme');
    // fiatCurrency already initialized synchronously from localStorage in useState
    if (!window.localStorage.getItem('appFiatCurrency')) {
      window.localStorage.setItem('appFiatCurrency', 'XRP');
    }

    // Load the theme
    if (savedThemeName) {
      setThemeName(savedThemeName);
      setDarkMode(savedThemeName === 'XrplToDarkTheme');
    } else if (isDarkMode !== null) {
      // Backward compatibility: convert boolean to theme name
      const theme = isDarkMode === 'false' ? 'XrplToLightTheme' : 'XrplToDarkTheme';
      setThemeName(theme);
      setDarkMode(isDarkMode !== 'false');
    }
  }, []);

  useEffect(() => {
    // Listen for device login messages from popup
    const handleMessage = (event) => {
      // Only accept messages from same origin to prevent cross-origin injection
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'DEVICE_LOGIN_SUCCESS') {
        doLogIn(event.data.profile);

        // If device accounts exist, restore them all
        if (event.data.allDeviceAccounts && event.data.allDeviceAccounts.length >= 1) {
          setProfiles((prev) => {
            const allProfiles = [...prev];
            event.data.allDeviceAccounts.forEach((deviceProfile) => {
              if (!allProfiles.find((p) => p.account === deviceProfile.account)) {
                allProfiles.push(deviceProfile);
              }
            });
            const safeAllProfiles = stripSeedArray(allProfiles);
            window.localStorage.setItem('profiles', JSON.stringify(safeAllProfiles));
            return safeAllProfiles;
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for storage changes (e.g., from OAuth callback updating profiles)
  useEffect(() => {
    const handleStorageChange = () => {
      // Update profiles
      const storedProfiles = localStorage.getItem('profiles');
      if (storedProfiles) {
        try {
          const newProfiles = JSON.parse(storedProfiles);
          setProfiles(newProfiles);
        } catch (e) { /* ignore corrupted profiles */ }
      }
      // Also update accountProfile (critical for OAuth redirects)
      const storedProfile = localStorage.getItem(KEY_ACCOUNT_PROFILE);
      if (storedProfile) {
        try {
          const profile = JSON.parse(storedProfile);
          if (profile && profile.account) {
            setAccountProfile((prev) =>
              !prev || prev.account !== profile.account ? profile : prev
            );
          }
        } catch (e) {
          /* ignore parse errors */
        }
      }
    };

    window.addEventListener('storage-updated', handleStorageChange);
    return () => window.removeEventListener('storage-updated', handleStorageChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const walletStorage = await getWalletStorage();

        // Handle encrypted profile migration (if exists)
        const encProfile = localStorage.getItem(KEY_ACCOUNT_PROFILE + '_enc');
        if (encProfile) {
          try {
            const profile = await walletStorage.getSecureItem(KEY_ACCOUNT_PROFILE);
            if (profile) {
              localStorage.setItem(KEY_ACCOUNT_PROFILE, JSON.stringify(stripSeed(profile)));
              localStorage.removeItem(KEY_ACCOUNT_PROFILE + '_enc');
              setAccountProfile(profile);
            }
          } catch (err) {
            // Crypto operation failed
          }
        }

        // Auto-decrypt seed on load — seed stays in React state only (never localStorage)
        if (accountProfile && !accountProfile.seed) {
          try {
            // Device: use device fingerprint + encrypted credential
            const { deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
            const deviceKeyId = await deviceFingerprint.getDeviceId();
            if (deviceKeyId) {
              const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
              if (storedPassword) {
                const wallet = await walletStorage.getWalletByAddress(
                  accountProfile.account || accountProfile.address,
                  storedPassword
                );
                if (wallet?.seed) {
                  setAccountProfile(prev => prev ? { ...prev, seed: wallet.seed } : prev);
                }
              }
            }
          } catch (err) {
            // Could not decrypt seed on load — user will be prompted when needed
          }
        }

        // Handle encrypted profiles migration (if exists)
        const encKey = localStorage.getItem(KEY_ACCOUNT_PROFILES + '_enc');
        if (encKey) {
          try {
            const migratedProfiles = await walletStorage.getSecureItem(KEY_ACCOUNT_PROFILES);
            if (migratedProfiles) {
              const safeMigrated = Array.isArray(migratedProfiles) ? stripSeedArray(migratedProfiles) : migratedProfiles;
              localStorage.setItem('profiles', JSON.stringify(safeMigrated));
              localStorage.removeItem(KEY_ACCOUNT_PROFILES + '_enc');
              setProfiles(safeMigrated);
            }
          } catch (err) {
            // Crypto operation failed
          }
        }
      } catch (error) {
        // App init error
      }
    };
    loadStoredData();
  }, []);

  const setActiveProfile = (account) => {
    const profile = profiles.find((x) => x.account === account);
    if (!profile) return;
    setAccountProfile(profile);
    localStorage.setItem(KEY_ACCOUNT_PROFILE, JSON.stringify(stripSeed(profile)));
    window.dispatchEvent(new StorageEvent('storage', { key: KEY_ACCOUNT_PROFILE }));
    // Persist active wallet in IndexedDB so it survives localStorage clearing
    saveActiveWalletToIDB(account);
  };

  const doLogIn = async (profile, profilesOverride = null) => {
    // Add token creation timestamp and generate access token
    const profileWithTimestamp = {
      ...profile,
      tokenCreatedAt: Date.now(),
      // Generate token from account address for API authentication
      token: profile.token || profile.account
    };

    setAccountProfile(profileWithTimestamp); // seed stays in memory
    localStorage.setItem(KEY_ACCOUNT_PROFILE, JSON.stringify(stripSeed(profileWithTimestamp)));
    // Notify same-tab listeners (storage event only fires cross-tab)
    window.dispatchEvent(new StorageEvent('storage', { key: KEY_ACCOUNT_PROFILE }));
    // Persist active wallet in IndexedDB so it survives localStorage clearing
    saveActiveWalletToIDB(profileWithTimestamp.account);

    setProfiles(prev => {
      const currentProfiles = profilesOverride || prev;
      let exist = false;
      const newProfiles = [];
      for (const p of currentProfiles) {
        if (p.account === profileWithTimestamp.account) {
          newProfiles.push(profileWithTimestamp);
          exist = true;
        } else newProfiles.push(p);
      }
      if (!exist) {
        newProfiles.push(profileWithTimestamp);
      }
      const safeProfiles = stripSeedArray(newProfiles);
      try { localStorage.setItem('profiles', JSON.stringify(safeProfiles)); } catch {}
      return safeProfiles;
    });
  };

  const doLogOut = async () => {
    // CRITICAL: Preserve keys that must survive logout
    // Without device_key_id, stored credentials in IndexedDB become orphaned
    const avatars = localStorage.getItem('__user_avatars__');
    const deviceKeyId = localStorage.getItem('device_key_id');

    // Clear credential cache (seeds in memory)
    try { (await getWalletStorage()).lockWallet(); } catch (e) { /* ignore */ }

    // Clear everything - wallets + passwords in IndexedDB are safe
    localStorage.clear();
    sessionStorage.clear();

    // Restore keys that must persist across sessions
    if (avatars) {
      localStorage.setItem('__user_avatars__', avatars);
    }
    if (deviceKeyId) {
      localStorage.setItem('device_key_id', deviceKeyId);
    }

    // Clear React state
    setAccountProfile(null);
    setProfiles([]);
    setAccountBalance(null);
    // Notify same-tab listeners (storage event only fires cross-tab)
    window.dispatchEvent(new StorageEvent('storage', { key: KEY_ACCOUNT_PROFILE }));
  };

  const removeProfile = async (account) => {
    const newProfiles = profiles.filter((obj) => obj.account !== account);
    localStorage.setItem('profiles', JSON.stringify(stripSeedArray(newProfiles)));
    setProfiles(newProfiles);
    // Clean up encrypted wallet data and backup flag
    try {
      const walletStorage = await getWalletStorage();
      await walletStorage.deleteWallet(account);
      localStorage.removeItem(`wallet_needs_backup_${account}`);
    } catch (err) {
      console.warn('Failed to clean up wallet data:', err);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleLogin = () => {
    setOpen(false);
    setOpenWalletModal(true);
  };

  const handleLogout = () => {
    doLogOut();
    // No reload needed - state is already cleared
  };

  // WebSocket-based real-time balance updates
  useEffect(() => {
    if (!accountProfile || !accountProfile.account) {
      setAccountBalance(null);
      return;
    }

    const account = accountProfile.account;
    let ws = null;
    let reconnectTimeout = null;
    let connectTimer = null;
    let attempts = 0;
    const MAX_RECONNECT = 5;

    const connect = async () => {
      try {
        const { getSessionWsUrl } = await import('src/utils/wsToken');
        const wsUrl = await getSessionWsUrl('balance', account);
        if (!wsUrl) return;
        ws = new WebSocket(wsUrl);

      // Connection timeout — abort if not open within 10s
      connectTimer = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN) {
          ws.close();
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectTimer);
        attempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Handle both initial and update events
          if (data.type === 'initial' || data.e === 'balance') {
            const newBalance = {
              curr1: { value: data.balance ?? '0' },
              curr2: { value: data.reserve ?? '0' }
            };
            setAccountBalance(newBalance);
            try { localStorage.setItem('xrpl_balance', JSON.stringify(newBalance)); } catch {}
            if (accountProfile && accountProfile.xrp !== data.total) {
              setAccountProfile((prev) => prev ? { ...prev, xrp: data.total } : prev);
            }
          }
        } catch (err) {
          console.error('[Balance WS] Parse error:', err);
        }
      };

      ws.onerror = () => {};

      ws.onclose = (ev) => {
          if (ev.code === 4011) return;
          if (attempts < MAX_RECONNECT) {
            const delay = Math.min(3000 * Math.pow(2, attempts), 60000);
            attempts++;
            reconnectTimeout = setTimeout(connect, delay);
          }
        };
      } catch (e) {
        if (attempts < MAX_RECONNECT) {
          const delay = Math.min(3000 * Math.pow(2, attempts), 60000);
          attempts++;
          reconnectTimeout = setTimeout(connect, delay);
        }
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (connectTimer) clearTimeout(connectTimer);
      if (ws) {
        ws.onclose = null; // Prevent reconnect on intentional close
        ws.close();
      }
    };
  }, [accountProfile?.account, sync]);

  // Fetch watchlist
  const accountAddress = accountProfile?.account;
  useEffect(() => {
    const getWatchList = () => {
      if (!accountAddress) {
        setWatchList([]);
        return;
      }

      api
        .get(`${BASE_URL}/watchlist?account=${accountAddress}`)
        .then((res) => {
          if (res.status === 200 && res.data.success) {
            setWatchList(res.data.watchlist || []);
          }
        })
        .catch((err) => {});
    };
    getWatchList();
  }, [accountAddress, sync, BASE_URL]);

  const updateWatchList = async (md5) => {
    const account = accountProfile?.account;

    if (!account) {
      openSnackbar('Please login to use watchlist', 'info');
      setOpenWalletModal(true);
      return false;
    }

    const newWatchList = watchList.includes(md5)
      ? watchList.filter((item) => item !== md5)
      : [...watchList, md5];
    setWatchList(newWatchList);

    try {
      const action = watchList.includes(md5) ? 'remove' : 'add';
      const body = { md5, account, action };

      const res = await api.post(`${BASE_URL}/watchlist`, body);

      if (res.status === 200 && res.data.success) {
        setWatchList(res.data.watchlist || []);
        openSnackbar('Watchlist updated!', 'success');
        return true;
      } else {
        setWatchList(watchList);
        openSnackbar('Failed to update watchlist', 'error');
        return false;
      }
    } catch (err) {
      console.error(err);
      setWatchList(watchList);
      openSnackbar('Failed to update watchlist', 'error');
      return false;
    }
  };

  // Theme context — changes rarely (only on theme toggle)
  const themeValue = useMemo(
    () => ({
      toggleTheme,
      darkMode,
      setDarkMode,
      themeName,
      setTheme
    }),
    [darkMode, themeName]
  );

  // Wallet context — identity & balance (consumed by 40+ components)
  // Setters are stable (React guarantees identity) so they don't trigger re-renders
  const walletValue = useMemo(
    () => ({
      accountProfile,
      setActiveProfile,
      profiles,
      setProfiles,
      removeProfile,
      doLogIn,
      doLogOut,
      accountBalance,
      setAccountBalance,
      setOpenWalletModal,
      setPendingWalletAuth,
      handleLogin,
      handleLogout,
      getActiveWalletFromIDB
    }),
    [accountProfile, profiles, accountBalance]
  );

  // Wallet UI context — transient dialog/modal state (consumed only by Wallet.js)
  const walletUIValue = useMemo(
    () => ({
      open,
      setOpen,
      openWalletModal,
      setOpenWalletModal,
      pendingWalletAuth,
      setPendingWalletAuth,
      connecting,
      setConnecting,
      handleOpen,
      handleClose
    }),
    [open, openWalletModal, pendingWalletAuth, connecting]
  );

  // App context — misc state (sync, currency, NFTs, watchlist, snackbar)
  const appValue = useMemo(
    () => ({
      setLoading,
      openSnackbar,
      sync,
      setSync,
      activeFiatCurrency,
      toggleFiatCurrency,
      deletingNfts,
      setDeletingNfts,
      watchList,
      updateWatchList,
      trustlineUpdate,
      setTrustlineUpdate
    }),
    [sync, activeFiatCurrency, deletingNfts, watchList, trustlineUpdate]
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <WalletContext.Provider value={walletValue}>
        <WalletUIContext.Provider value={walletUIValue}>
          <AppContext.Provider value={appValue}>
            {loading && (
              <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md max-sm:h-dvh">
                <PuffLoader color={'#00AB55'} size={50} />
              </div>
            )}
            {children}
          </AppContext.Provider>
        </WalletUIContext.Provider>
      </WalletContext.Provider>
    </ThemeContext.Provider>
  );
}

export function ContextProvider({ children, data, openSnackbar }) {
  const [store, setStore] = useState(() => configureRedux(data));

  return (
    <Provider store={store}>
      <ContextProviderInner data={data} openSnackbar={openSnackbar}>
        {children}
      </ContextProviderInner>
    </Provider>
  );
}
