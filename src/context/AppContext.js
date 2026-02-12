import { useState, createContext, useEffect, useMemo } from 'react';
import api from 'src/utils/api';

// Redux
import { Provider, useDispatch } from 'react-redux';
import { configureRedux } from 'src/redux/store';

// Loader
import { PuffLoader } from 'src/components/Spinners';

// Encrypted storage for sensitive data
import { EncryptedWalletStorage } from 'src/utils/encryptedWalletStorage';

// Split contexts for performance — consumers only re-render when their slice changes
export const ThemeContext = createContext({});
export const WalletContext = createContext({});
export const AppContext = createContext({});

// Module-level singleton to prevent re-initialization on every render
let _walletStorageSingleton = null;
const getWalletStorage = () => {
  if (!_walletStorageSingleton) {
    _walletStorageSingleton = new EncryptedWalletStorage();
  }
  return _walletStorageSingleton;
};

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
  const walletStorage = useMemo(() => getWalletStorage(), []);

  // Define constants first before using them
  const KEY_ACCOUNT_PROFILE = 'account_profile_2';
  const KEY_ACCOUNT_PROFILES = 'account_profiles_2';

  const [sync, setSync] = useState(0);
  const [trustlineUpdate, setTrustlineUpdate] = useState(null); // { issuer, currency, hasTrustline }
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem('appThemeName');
    if (saved) return saved === 'XrplToDarkTheme';
    return window.localStorage.getItem('appTheme') === 'true';
  });
  const [themeName, setThemeName] = useState(() => {
    if (typeof window === 'undefined') return 'XrplToLightTheme';
    const saved = window.localStorage.getItem('appThemeName');
    if (saved) return saved;
    const isDark = window.localStorage.getItem('appTheme');
    return isDark === 'true' ? 'XrplToDarkTheme' : 'XrplToLightTheme';
  });
  const [activeFiatCurrency, setActiveFiatCurrency] = useState('XRP');

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
  const [accountBalance, setAccountBalance] = useState(null);
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
    const fiatCurrency = window.localStorage.getItem('appFiatCurrency');

    if (fiatCurrency) {
      setActiveFiatCurrency(fiatCurrency);
    } else {
      // Set XRP as default and save to localStorage
      setActiveFiatCurrency('XRP');
      window.localStorage.setItem('appFiatCurrency', 'XRP');
    }

    // Load the theme
    if (savedThemeName) {
      setThemeName(savedThemeName);
      setDarkMode(savedThemeName === 'XrplToDarkTheme');
    } else if (isDarkMode) {
      // Backward compatibility: convert boolean to theme name
      const theme = isDarkMode === 'true' ? 'XrplToDarkTheme' : 'XrplToLightTheme';
      setThemeName(theme);
      setDarkMode(isDarkMode === 'true');
    }
  }, []);

  useEffect(() => {
    // Listen for device login messages from popup
    const handleMessage = (event) => {
      if (event.data.type === 'DEVICE_LOGIN_SUCCESS') {
        doLogIn(event.data.profile);

        // If device accounts exist, restore them all
        if (event.data.allDeviceAccounts && event.data.allDeviceAccounts.length >= 1) {
          const allProfiles = [...profiles];
          event.data.allDeviceAccounts.forEach((deviceProfile) => {
            if (!allProfiles.find((p) => p.account === deviceProfile.account)) {
              allProfiles.push(deviceProfile);
            }
          });
          const safeAllProfiles = stripSeedArray(allProfiles);
          setProfiles(safeAllProfiles);
          window.localStorage.setItem('profiles', JSON.stringify(safeAllProfiles));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [profiles]);

  // Listen for storage changes (e.g., from OAuth callback updating profiles)
  useEffect(() => {
    const handleStorageChange = () => {
      // Update profiles
      const storedProfiles = localStorage.getItem('profiles');
      if (storedProfiles) {
        const newProfiles = JSON.parse(storedProfiles);
        setProfiles(newProfiles);
      }
      // Also update accountProfile (critical for OAuth redirects)
      const storedProfile = localStorage.getItem(KEY_ACCOUNT_PROFILE);
      if (storedProfile) {
        try {
          const profile = JSON.parse(storedProfile);
          if (
            profile &&
            profile.account &&
            (!accountProfile || accountProfile.account !== profile.account)
          ) {
            setAccountProfile(profile);
          }
        } catch (e) {
          /* ignore parse errors */
        }
      }
    };

    window.addEventListener('storage-updated', handleStorageChange);
    return () => window.removeEventListener('storage-updated', handleStorageChange);
  }, [accountProfile]);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        // Handle encrypted profile migration (if exists)
        const encryptedProfile = localStorage.getItem(KEY_ACCOUNT_PROFILE + '_enc');
        if (encryptedProfile) {
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
            if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
              // OAuth/social: use provider password from IndexedDB
              const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
              const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
              if (storedPassword) {
                const wallet = await walletStorage.findWalletBySocialId(
                  walletId,
                  storedPassword,
                  accountProfile.account || accountProfile.address
                );
                if (wallet?.seed) {
                  setAccountProfile(prev => prev ? { ...prev, seed: wallet.seed } : prev);
                }
              }
            } else if (accountProfile.wallet_type === 'device') {
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
            }
          } catch (err) {
            // Could not decrypt seed on load — user will be prompted when needed
          }
        }

        // Handle encrypted profiles migration (if exists)
        const encryptedProfiles = localStorage.getItem('account_profiles_2_enc');
        if (encryptedProfiles) {
          try {
            const migratedProfiles = await walletStorage.getSecureItem(KEY_ACCOUNT_PROFILES);
            if (migratedProfiles) {
              const safeMigrated = Array.isArray(migratedProfiles) ? stripSeedArray(migratedProfiles) : migratedProfiles;
              localStorage.setItem('profiles', JSON.stringify(safeMigrated));
              localStorage.removeItem('account_profiles_2_enc');
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
  };

  const doLogIn = async (profile, profilesOverride = null) => {
    // Add token creation timestamp and generate access token
    const profileWithTimestamp = {
      ...profile,
      tokenCreatedAt: Date.now(),
      // Generate token from account address for API authentication
      token: profile.token || profile.account
    };

    // For OAuth wallets, ensure seed is included
    if (
      (profileWithTimestamp.wallet_type === 'oauth' ||
        profileWithTimestamp.wallet_type === 'social') &&
      !profileWithTimestamp.seed
    ) {
      try {
        const walletId = `${profileWithTimestamp.provider}_${profileWithTimestamp.provider_id}`;
        const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);

        if (storedPassword) {
          // Pass known address for fast lookup (only decrypts 1 wallet instead of 25!)
          const wallet = await walletStorage.findWalletBySocialId(
            walletId,
            storedPassword,
            profileWithTimestamp.account || profileWithTimestamp.address
          );
          if (wallet?.seed) {
            profileWithTimestamp.seed = wallet.seed;
          }
        }
      } catch (err) {
        // Could not decrypt seed during login
      }
    }

    setAccountProfile(profileWithTimestamp); // seed stays in memory
    localStorage.setItem(KEY_ACCOUNT_PROFILE, JSON.stringify(stripSeed(profileWithTimestamp)));

    let exist = false;
    const newProfiles = [];
    const currentProfiles = profilesOverride || profiles;
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
    localStorage.setItem('profiles', JSON.stringify(safeProfiles));
    setProfiles(safeProfiles);
  };

  const doLogOut = () => {
    // CRITICAL: Preserve keys that must survive logout
    // Without entropy, encrypted data in IndexedDB becomes unrecoverable
    // Without device_key_id, stored credentials in IndexedDB become orphaned
    const entropy = localStorage.getItem('__wk_entropy__');
    const avatars = localStorage.getItem('__user_avatars__');
    const deviceKeyId = localStorage.getItem('device_key_id');

    // Clear credential cache (seeds in memory)
    try { walletStorage.lockWallet(); } catch (e) { /* ignore */ }

    // Clear everything - wallets + passwords in IndexedDB are safe
    localStorage.clear();
    sessionStorage.clear();

    // Restore keys that must persist across sessions
    if (entropy) {
      localStorage.setItem('__wk_entropy__', entropy);
    }
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
  };

  const removeProfile = async (account) => {
    const newProfiles = profiles.filter((obj) => obj.account !== account);
    localStorage.setItem('profiles', JSON.stringify(stripSeedArray(newProfiles)));
    setProfiles(newProfiles);
    // Clean up encrypted wallet data and backup flag
    try {
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
    let attempts = 0;
    const MAX_RECONNECT = 5;

    const connect = async () => {
      try {
        const res = await fetch(`/api/ws/session?type=balance&id=${account}`);
        const { wsUrl } = await res.json();
        ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        attempts = 0; // Reset on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Handle both initial and update events
          if (data.type === 'initial' || data.e === 'balance') {
            setAccountBalance({
              curr1: { value: data.balance ?? '0' },
              curr2: { value: data.reserve ?? '0' }
            });
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
      if (ws) {
        ws.onclose = null; // Prevent reconnect on intentional close
        ws.close();
      }
    };
  }, [accountProfile?.account, sync]);

  // Fetch watchlist
  useEffect(() => {
    const getWatchList = () => {
      const account = accountProfile?.account;
      if (!account) {
        setWatchList([]);
        return;
      }

      api
        .get(`${BASE_URL}/watchlist?account=${account}`)
        .then((res) => {
          if (res.status === 200 && res.data.success) {
            setWatchList(res.data.watchlist || []);
          }
        })
        .catch((err) => {});
    };
    getWatchList();
  }, [accountProfile, sync, BASE_URL]);

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

  // Wallet context — changes on login/logout/balance updates
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
      open,
      setOpen,
      openWalletModal,
      setOpenWalletModal,
      pendingWalletAuth,
      setPendingWalletAuth,
      connecting,
      setConnecting,
      handleOpen,
      handleClose,
      handleLogin,
      handleLogout
    }),
    [accountProfile, profiles, accountBalance, open, openWalletModal, pendingWalletAuth, connecting]
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
        <AppContext.Provider value={appValue}>
          {loading && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md">
              <PuffLoader color={'#00AB55'} size={50} />
            </div>
          )}
          {children}
        </AppContext.Provider>
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
