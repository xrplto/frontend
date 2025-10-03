import { useState, createContext, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Client } from 'xrpl';

import { Backdrop } from '@mui/material';

// Redux
import { Provider, useDispatch } from 'react-redux';
import { configureRedux } from 'src/redux/store';
import { update_metrics } from 'src/redux/statusSlice';

// Loader
import { PuffLoader } from './components/Spinners';

// Encrypted storage for sensitive data
import { UnifiedWalletStorage } from 'src/utils/encryptedWalletStorage';

export const AppContext = createContext({});

function ContextProviderInner({ children, data, openSnackbar }) {
  const dispatch = useDispatch();
  const BASE_URL = process.env.API_URL;
  const walletStorage = new UnifiedWalletStorage();

  const [sync, setSync] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [themeName, setThemeName] = useState('XrplToLightTheme');
  const [activeFiatCurrency, setActiveFiatCurrency] = useState('XRP');
  const [accountProfile, setAccountProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [deletingNfts, setDeletingNfts] = useState([]);

  const [open, setOpen] = useState(false);
  const [openWalletModal, setOpenWalletModal] = useState(false);
  const [accountBalance, setAccountBalance] = useState(null);
  const [watchList, setWatchList] = useState([]);
  const [metricsLoaded, setMetricsLoaded] = useState(false);

  const KEY_ACCOUNT_PROFILE = 'account_profile_2';
  const KEY_ACCOUNT_PROFILES = 'account_profiles_2';

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
          event.data.allDeviceAccounts.forEach(deviceProfile => {
            if (!allProfiles.find(p => p.account === deviceProfile.account)) {
              allProfiles.push(deviceProfile);
            }
          });
          setProfiles(allProfiles);
          window.localStorage.setItem('account_profiles_2', JSON.stringify(allProfiles));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [profiles]);

  useEffect(() => {
    const loadStoredData = async () => {
      const profile = await walletStorage.getSecureItem(KEY_ACCOUNT_PROFILE);
      if (profile) {
        setAccountProfile(profile);
      }

      const profiles = await walletStorage.getSecureItem(KEY_ACCOUNT_PROFILES);
      if (profiles) {
        setProfiles(profiles);
      }
    };
    loadStoredData();
  }, []);

  const setActiveProfile = async (account) => {
    const profile = profiles.find((x) => x.account === account);
    if (!profile) return;
    setAccountProfile(profile);
    await walletStorage.setSecureItem(KEY_ACCOUNT_PROFILE, profile);
  };

  const doLogIn = async (profile, profilesOverride = null) => {
    // Debug logging for admin login

    // Add token creation timestamp
    const profileWithTimestamp = {
      ...profile,
      tokenCreatedAt: Date.now()
    };

    setAccountProfile(profileWithTimestamp);
    await walletStorage.setSecureItem(KEY_ACCOUNT_PROFILE, profileWithTimestamp);

    // const old = profiles.find(x => x.account === profile.account);
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

    await walletStorage.setSecureItem(KEY_ACCOUNT_PROFILES, newProfiles);
    setProfiles(newProfiles);
  };

  const doLogOut = () => {
    walletStorage.removeSecureItem(KEY_ACCOUNT_PROFILE);
    walletStorage.removeSecureItem(KEY_ACCOUNT_PROFILES);
    setAccountProfile(null);
    setProfiles([]);

    // Clear OAuth session data
    window.sessionStorage.removeItem('oauth_temp_token');
    window.sessionStorage.removeItem('oauth_temp_provider');
    window.sessionStorage.removeItem('oauth_temp_user');
    window.sessionStorage.removeItem('oauth_action');
    window.sessionStorage.removeItem('oauth_backend_data');
    window.sessionStorage.removeItem('wallet_modal_open');
    window.sessionStorage.removeItem('code_used');

    // Clear OAuth auth data
    walletStorage.removeSecureItem('jwt');
    walletStorage.removeSecureItem('authMethod');
    walletStorage.removeSecureItem('user');

  };

  const removeProfile = async (account) => {
    const newProfiles = profiles.filter(function (obj) {
      return obj.account !== account;
    });
    await walletStorage.setSecureItem(KEY_ACCOUNT_PROFILES, newProfiles);
    setProfiles(newProfiles);
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
    setOpen(false);
    doLogOut();
  };

  useEffect(() => {
    async function getAccountInfo() {
      if (!accountProfile || !accountProfile.account) {
        return;
      }

      const account = accountProfile.account;
      const isDevelopment = true;

      if (isDevelopment) {
        try {
          const res = await axios.get(`${BASE_URL}/testnet-balance/${account}`);
          if (res.status === 200 && res.data) {
            setAccountBalance({
              curr1: {
                value: res.data.available?.xrp || res.data.balanceXRP
              },
              curr2: {
                value: res.data.reserve?.totalReserveXRP || '0'
              }
            });
            // Update profile with total balance
            if (accountProfile) {
              setAccountProfile({
                ...accountProfile,
                xrp: res.data.balanceXRP
              });
            }
          }
        } catch (err) {
          // Handle unactivated accounts (404) gracefully
          if (err.response?.status === 404) {
            // Account not activated yet - set balance to 0
            setAccountBalance({
              curr1: { value: '0' },
              curr2: { value: '0' }
            });
            if (accountProfile) {
              setAccountProfile({
                ...accountProfile,
                xrp: '0'
              });
            }
          } else {
            console.error('Testnet balance fetch error:', err);
          }
        }
      } else {
        // Production: use existing endpoint
        axios
          .get(
            `${BASE_URL}/account/info/${account}?curr1=XRP&issuer1=XRPL&curr2=534F4C4F00000000000000000000000000000000&issuer2=rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz`
          )
          .then((res) => {
            let ret = res.status === 200 ? res.data : undefined;
            if (ret) {
              setAccountBalance(ret.pair);
            }
          })
          .catch((err) => {
          })
          .then(function () {
            // always executed
          });
      }
    }
    getAccountInfo();
  }, [accountProfile, sync]);

  // Fetch metrics
  useEffect(() => {
    if (!metricsLoaded && BASE_URL) {
      const fetchMetrics = async () => {
        try {
          const metricsResponse = await axios.get(
            `${BASE_URL}/tokens?start=0&limit=50&sortBy=vol24hxrp&sortType=desc&filter=&skipMetrics=false`
          );
          if (metricsResponse.status === 200 && metricsResponse.data) {
            dispatch(update_metrics(metricsResponse.data));
            setMetricsLoaded(true);
          }
        } catch (error) {
          console.error('Error fetching metrics via REST API:', error);
        }
      };
      setTimeout(fetchMetrics, 100);
    }
  }, [metricsLoaded, BASE_URL, dispatch]);

  // Fetch watchlist
  useEffect(() => {
    const getWatchList = () => {
      const account = accountProfile?.account;
      if (!account) {
        setWatchList([]);
        return;
      }

      axios
        .get(`${BASE_URL}/watchlist/get_list?account=${account}`)
        .then((res) => {
          if (res.status === 200) {
            setWatchList(res.data.watchlist);
          }
        })
        .catch((err) => {});
    };
    getWatchList();
  }, [accountProfile, sync, BASE_URL]);

  const updateWatchList = async (md5) => {
    const account = accountProfile?.account;
    const accountToken = accountProfile?.token;

    if (!account || !accountToken) {
      openSnackbar('Please login!', 'error');
      return false;
    }

    const newWatchList = watchList.includes(md5)
      ? watchList.filter((item) => item !== md5)
      : [...watchList, md5];
    setWatchList(newWatchList);

    try {
      const action = watchList.includes(md5) ? 'remove' : 'add';
      const body = { md5, account, action };

      const res = await axios.post(`${BASE_URL}/watchlist/update_watchlist`, body, {
        headers: { 'x-access-token': accountToken }
      });

      if (res.status === 200) {
        const ret = res.data;
        if (ret.status) {
          openSnackbar('Watchlist updated successfully!', 'success');
          return true;
        } else {
          setWatchList(watchList);
          openSnackbar(ret.err || 'Failed to update watchlist', 'error');
          return false;
        }
      }
    } catch (err) {
      console.error(err);
      setWatchList(watchList);
      openSnackbar('Failed to update watchlist', 'error');
      return false;
    }
  };

  const contextValue = useMemo(
    () => ({
      toggleTheme,
      darkMode,
      setDarkMode,
      themeName,
      setTheme,
      accountProfile,
      setActiveProfile,
      profiles,
      setProfiles,
      removeProfile,
      doLogIn,
      doLogOut,
      setLoading,
      openSnackbar,
      sync,
      setSync,
      activeFiatCurrency,
      toggleFiatCurrency,
      open,
      setOpen,
      openWalletModal,
      setOpenWalletModal,
      accountBalance,
      setAccountBalance,
      handleOpen,
      handleClose,
      handleLogin,
      handleLogout,
      connecting,
      setConnecting,
      deletingNfts,
      setDeletingNfts,
      watchList,
      updateWatchList
    }),
    [
      darkMode,
      themeName,
      accountProfile,
      profiles,
      sync,
      activeFiatCurrency,
      open,
      openWalletModal,
      accountBalance,
      connecting,
      deletingNfts,
      watchList
      // Add any other dependencies that should trigger a re-creation of the context value
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      <Backdrop sx={{ color: '#000', zIndex: (theme) => theme.zIndex.drawer + 202 }} open={loading}>
        <PuffLoader color={'#00AB55'} size={50} />
      </Backdrop>
      {children}
    </AppContext.Provider>
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
