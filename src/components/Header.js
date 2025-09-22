import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import Image from 'next/image';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useTranslation } from 'react-i18next';
import {
  useState,
  useContext,
  useEffect,
  forwardRef,
  memo,
  useCallback,
  lazy,
  Suspense,
  useRef
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import sdk from "@crossmarkio/sdk";
import { AppContext } from 'src/AppContext';
import Logo from 'src/components/Logo';
import NavSearchBar from './NavSearchBar';
import SidebarDrawer from './SidebarDrawer';
const WalletConnectModal = lazy(() => import('./WalletConnectModal'));
const SearchModal = lazy(() => import('./SearchModal'));
import Wallet from 'src/components/Wallet';
import { GlobalNotificationButton } from 'src/components/PriceNotifications';
import { selectProcess, updateProcess } from 'src/redux/transactionSlice';

// Iconify
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

// Add XPMarket icon component
const XPMarketIcon = memo((props) => {
  // Filter out non-DOM props that might cause warnings
  const { darkMode, ...otherProps } = props;

  return (
    <SvgIcon {...otherProps} viewBox="0 0 32 32">
      <path
        d="M17.7872 2.625H4.41504L7.67032 7.88327H14.5L17.9149 13.4089H24.4574L17.7872 2.625Z"
        fill="inherit"
      />
      <path
        d="M1 18.6667L7.67014 29.4506L10.9573 24.1627L7.54248 18.6667L10.9573 13.1708L7.67014 7.88281L1 18.6667Z"
        fill="inherit"
      />
      <path
        d="M24.3292 24.1931L30.9994 13.4092H24.4569L21.042 18.9051H14.2123L10.957 24.1931H24.3292Z"
        fill="inherit"
      />
    </SvgIcon>
  );
});

const LedgerMemeIcon = memo(
  forwardRef((props, ref) => {
    // Filter out any non-DOM props that might cause warnings
    const { width, darkMode, ...otherProps } = props;

    return (
      <SvgIcon {...otherProps} ref={ref} viewBox="0 0 26 26">
        <g transform="scale(0.55)">
          <rect fill="#cfff04" width="36" height="36" rx="8" ry="8" x="0" y="0"></rect>
          <g>
            <g>
              <path
                fill="#262626"
                d="M25.74,9.68c0.64,0,1.24-0.26,1.69-0.72l2.69-2.76h-1.64l-1.87,1.92c-0.23,0.24-0.55,0.37-0.88,0.37s-0.64-0.13-0.88-0.37l-1.87-1.92h-1.64l2.69,2.76c0.45,0.46,1.05,0.72,1.69,0.72Z"
              ></path>
              <path
                fill="#262626"
                d="M27.43,10.62c-0.45-0.46-1.05-0.72-1.69-0.72s-1.24,0.26-1.69,0.72l-2.71,2.78h1.64l1.89-1.93c0.23-0.24,0.55-0.37,0.88-0.37s0.64,0.13,0.88,0.37l1.89,1.93h1.64l-2.71-2.78Z"
              ></path>
              <path
                fill="#262626"
                d="M10.22,9.68c0.64,0,1.24-0.26,1.69-0.72l2.69-2.76h-1.64l-1.87,1.92c-0.23,0.24-0.55,0.37-0.88,0.37s-0.64-0.13-0.88-0.37l-1.87-1.92h-1.64l2.69,2.76c0.45,0.46,1.05,0.72,1.69,0.72Z"
              ></path>
              <path
                fill="#262626"
                d="M10.22,9.90c-0.64,0-1.24,0.26-1.69,0.72l-2.71,2.78h1.64l1.89-1.93c0.23-0.24,0.55-0.37,0.88-0.37s0.64,0.13,0.88,0.37l1.89,1.93h1.64l-2.71-2.78c-0.45-0.46-1.05-0.72-1.69-0.72Z"
              ></path>
            </g>
            <path
              fill="#262626"
              d="M5.81,17.4c0,6.73,5.45,12.18,12.18,12.18s12.18-5.45,12.18-12.18H5.81Z"
            ></path>
          </g>
        </g>
      </SvgIcon>
    );
  })
);

LedgerMemeIcon.displayName = 'LedgerMemeIcon';

const HorizonIcon = memo(
  forwardRef((props, ref) => {
    const { width, darkMode, ...otherProps } = props;
    return (
      <SvgIcon
        {...otherProps}
        ref={ref}
        viewBox="0 0 24 24"
        sx={{
          '& circle, & path': {
            fill: 'none',
            stroke: '#f97316',
            strokeWidth: 2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
          },
          // Enhanced visibility on mobile
          '@media (max-width: 600px)': {
            '& circle, & path': {
              strokeWidth: 2.5
            }
          }
        }}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M4.93 4.93l1.41 1.41" />
        <path d="M17.66 17.66l1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="M6.34 17.66l-1.41 1.41" />
        <path d="M19.07 4.93l-1.41 1.41" />
      </SvgIcon>
    );
  })
);

HorizonIcon.displayName = 'HorizonIcon';

const HeaderWrapper = styled(Box)(
  ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(6)};
    margin-bottom: ${theme.spacing(0)};
    border-radius: 0px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1100;
    background: ${theme.header?.background || (theme.palette.mode === 'dark' ? '#000000' : '#ffffff')};
    border-bottom: 1px solid ${
      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
    };
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    overflow: hidden;
    
    ${theme.breakpoints.down('sm')} {
      height: ${theme.spacing(5)};
      background: ${theme.header?.background || (theme.palette.mode === 'dark' ? '#000000' : '#ffffff')};
    }
    
    &::before {
      display: none;
    }
    
    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(to right, 
        ${alpha(theme.palette.divider, 0)}, 
        ${alpha(theme.palette.divider, 0.15)}, 
        ${alpha(theme.palette.divider, 0)});
      opacity: 0.8;
    }
`
);

const StyledLink = styled(Link, {
  shouldForwardProp: (prop) => prop !== 'darkMode'
})(
  ({ darkMode, theme }) => `
    color: ${theme.palette.text.primary} !important;
    font-weight: 400;
    margin-right: 16px;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    background: transparent;
    border: none;
    font-size: 0.9rem;
    
    &:hover {
      color: ${theme.palette.primary.main} !important;
      background: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
      cursor: pointer;
    }
`
);

const StyledMenuItem = styled(MenuItem, {
  shouldForwardProp: (prop) => prop !== 'darkMode'
})(
  ({ darkMode, theme }) => `
    color: ${darkMode ? 'white' : theme.palette.text.primary};
    margin: 4px 8px;
    border-radius: 10px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: 'transparent';
    border: 1px solid ${alpha(theme.palette.divider, 0.1)};
    box-shadow: 
      0 1px 4px ${alpha(theme.palette.common.black, 0.05)}, 
      inset 0 1px 1px ${alpha(theme.palette.common.white, 0.05)};
    position: relative;
    overflow: hidden;
    
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, ${alpha(
        theme.palette.primary.main,
        0.08
      )}, transparent);
      transition: left 0.4s ease;
    }
    
    &:hover {
      color: ${theme.palette.primary.main};
      background: 'transparent';
      border: 1px solid ${alpha(theme.palette.primary.main, 0.2)};
      box-shadow: 
        0 4px 16px ${alpha(theme.palette.primary.main, 0.12)},
        inset 0 1px 2px ${alpha(theme.palette.common.white, 0.1)};
      
      &::before {
        left: 100%;
      }
    }
`
);

function Header({ notificationPanelOpen, onNotificationPanelToggle, ...props }) {
  const { t } = useTranslation(); // set translation const
  const theme = useTheme();
  const dispatch = useDispatch();
  const isProcessing = useSelector(selectProcess);
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isTabletOrMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const [fullSearch, setFullSearch] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const { darkMode, setDarkMode, accountProfile } = useContext(AppContext);
  const [tokensAnchorEl, setTokensAnchorEl] = useState(null);
  const [tokensMenuOpen, setTokensMenuOpen] = useState(false);
  const openTokensMenu = Boolean(tokensAnchorEl);
  const closeTimeoutRef = useRef(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Memoize menu items for better performance
  const discoverMenuItems = [
    {
      path: '/trending',
      name: 'Trending',
      icon: <LocalFireDepartmentIcon sx={{ fontSize: 16, color: '#ff6b35' }} />
    },
    {
      path: '/spotlight',
      name: 'Spotlight',
      icon: <TroubleshootIcon sx={{ fontSize: 16, color: '#4fc3f7' }} />
    },
    {
      path: '/most-viewed',
      name: 'Most Viewed',
      icon: <VisibilityIcon sx={{ fontSize: 16, color: '#9c27b0' }} />
    },
    {
      path: '/gainers/24h',
      name: 'Gainers',
      icon: <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50' }} />
    },
    { path: '/new', name: 'New', icon: <FiberNewIcon sx={{ fontSize: 16, color: '#ffc107' }} /> }
  ];

  const handleFullSearch = useCallback((e) => {
    setFullSearch(true);
    setSearchModalOpen(true);
  }, []);

  const toggleDrawer = useCallback((isOpen = true) => {
    setOpenDrawer(isOpen);
  }, []);

  const openSnackbar = useCallback((message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  const handleTokensOpen = useCallback((event) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setTokensAnchorEl(event.currentTarget);
    setTokensMenuOpen(true);
  }, []);

  const handleTokensClose = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setTokensAnchorEl(null);
      setTokensMenuOpen(false);
    }, 150);
  }, []);

  const handleTokenOptionSelect = useCallback(
    (path) => {
      window.location.href = path;
      handleTokensClose();
    },
    [handleTokensClose]
  );

  useEffect(() => {
    if (isProcessing === 1 && isClosed) {
      dispatch(updateProcess(3));
    }

    if (isClosed) {
      setIsClosed(false);
    }
  }, [isProcessing, isClosed]);

  useEffect(() => {
    let isMounted = true;
    let cleanup;

    const initializeCrossmark = async () => {
      if (isDesktop && typeof window !== 'undefined') {
        try {
          // Check if we're in a desktop browser environment before importing
          const userAgent = window.navigator.userAgent.toLowerCase();
          const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
            userAgent
          );

          if (isMobile) {
            return; // Don't attempt to load Crossmark on mobile devices
          }

          // Dynamically import the SDK with preconnect hint
          const link = document.createElement('link');
          link.rel = 'preconnect';
          link.href = 'https://crossmarkio.com';
          document.head.appendChild(link);

          const { default: CrossmarkSDK } = await import(
            /* webpackPreload: true */ '@crossmarkio/sdk'
          );

          if (isMounted && CrossmarkSDK && typeof CrossmarkSDK.on === 'function') {
            const handleClose = () => {
              if (isMounted) {
                setIsClosed(true);
              }
            };

            CrossmarkSDK.on('close', handleClose);

            cleanup = () => {
              if (CrossmarkSDK && typeof CrossmarkSDK.off === 'function') {
                CrossmarkSDK.off('close', handleClose);
              }
            };
          }
        } catch (error) {
          // Log error but don't display to user
          console.debug('Crossmark SDK not available:', error);
        }
      }
    };

    // Delay initialization to improve initial load
    const timer = setTimeout(initializeCrossmark, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (cleanup) cleanup();
    };
  }, [isDesktop]);

  return (
    <HeaderWrapper>
      <Container maxWidth={false} sx={{ px: { xs: 0, sm: 2, md: 3 } }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flex={2}
          sx={{ pl: 0, pr: { xs: 1, sm: 0 } }}
        >
          <Box
            id="logo-container-laptop"
            sx={{
              mr: { sm: 2, md: 3 },
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center'
            }}
          >
            <Logo
              alt="xrpl.to Logo"
              style={{ marginRight: '16px', width: 'auto', height: '32px' }}
            />
          </Box>

          {isDesktop && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Box
                onMouseEnter={(e) => handleTokensOpen(e)}
                onMouseLeave={handleTokensClose}
                sx={{ position: 'relative', display: 'inline-block' }}
              >
                <StyledLink underline="none" darkMode={darkMode} href="/">
                  {t('Tokens')}
                </StyledLink>

                {tokensMenuOpen && tokensAnchorEl && (
                  <Box
                    onMouseEnter={() => {
                      if (closeTimeoutRef.current) {
                        clearTimeout(closeTimeoutRef.current);
                        closeTimeoutRef.current = null;
                      }
                    }}
                    onMouseLeave={handleTokensClose}
                    sx={{
                      position: 'fixed',
                      top: '48px',
                      left: tokensAnchorEl ? tokensAnchorEl.offsetLeft : 0,
                      mt: 0,
                      minWidth: 600,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow:
                        theme.palette.mode === 'dark'
                          ? `0 4px 20px ${alpha('#000000', 0.3)}`
                          : `0 4px 20px ${alpha('#000000', 0.08)}`,
                      bgcolor:
                        theme.header?.background ||
                        (theme.palette.mode === 'dark'
                          ? alpha('#000000', 0.95)
                          : alpha('#ffffff', 0.98)),
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      overflow: 'hidden',
                      zIndex: 2147483647,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                          theme.palette.mode === 'dark'
                            ? `linear-gradient(135deg, ${alpha('#ffffff', 0.03)} 0%, ${alpha('#ffffff', 0.01)} 100%)`
                            : `linear-gradient(135deg, ${alpha('#ffffff', 0.6)} 0%, ${alpha('#ffffff', 0.3)} 100%)`,
                        pointerEvents: 'none',
                        zIndex: -1
                      }
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        p: 2,
                        gap: 2,
                        alignItems: 'flex-start'
                      }}
                    >
                      {/* Column 1: All Launchpads */}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="overline"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: theme.palette.text.secondary,
                            mb: 1,
                            display: 'block'
                          }}
                        >
                          {t('LAUNCHPADS')}
                        </Typography>
                        {[
                          {
                            path: '/view/firstledger',
                            name: 'FirstLedger',
                            icon: <OpenInNewIcon sx={{ fontSize: 16, color: '#013CFE' }} />
                          },
                          {
                            path: '/view/magnetic-x',
                            name: 'Magnetic X',
                            icon: (
                              <Image
                                src="/magneticx-logo.webp?v=1"
                                alt="Magnetic X"
                                width={16}
                                height={16}
                                quality={90}
                                loading="lazy"
                                style={{ width: 16, height: 16, objectFit: 'contain' }}
                              />
                            )
                          },
                          {
                            path: '/view/xpmarket',
                            name: 'XPmarket',
                            icon: <XPMarketIcon sx={{ fontSize: 16, color: '#6D1FEE' }} />
                          },
                          {
                            path: '/view/aigentrun',
                            name: 'aigent.run',
                            icon: (
                              <Image
                                src="/static/aigentrun.gif?v=1"
                                alt="Aigent.Run"
                                width={16}
                                height={16}
                                sizes="16px"
                                quality={90}
                                loading="lazy"
                                unoptimized={true}
                                style={{ objectFit: 'contain' }}
                              />
                            )
                          },
                          {
                            path: '/view/ledgermeme',
                            name: 'LedgerMeme',
                            icon: <LedgerMemeIcon sx={{ fontSize: 16 }} />
                          },
                          {
                            path: '/view/horizon',
                            name: 'Horizon',
                            icon: <HorizonIcon sx={{ fontSize: 16 }} />
                          }
                        ].map((item) => (
                          <Box
                            key={item.path}
                            onClick={() => handleTokenOptionSelect(item.path)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              py: 1,
                              px: 1.5,
                              borderRadius: 0,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                color: theme.palette.primary.main
                              }
                            }}
                          >
                            {item.icon}
                            <Typography variant="body2" fontSize={14}>
                              {item.name}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      {/* Column 2: Analytics */}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="overline"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: theme.palette.text.secondary,
                            mb: 1,
                            display: 'block'
                          }}
                        >
                          {t('ANALYTICS')}
                        </Typography>
                        {[
                          {
                            path: '/market-metrics',
                            name: t('Market Metrics'),
                            icon: <EmojiEventsIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                          },
                          {
                            path: '/rsi-analysis',
                            name: 'RSI Analysis',
                            icon: <TrendingUpIcon sx={{ fontSize: 16, color: '#2196f3' }} />
                          },
                          {
                            path: '/top-traders',
                            name: t('Top Traders'),
                            icon: <AutoAwesomeIcon sx={{ fontSize: 16, color: '#e91e63' }} />
                          }
                        ].map((item) => (
                          <Box
                            key={item.path}
                            onClick={() => handleTokenOptionSelect(item.path)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              py: 1,
                              px: 1.5,
                              borderRadius: 0,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                color: theme.palette.primary.main
                              }
                            }}
                          >
                            {item.icon}
                            <Typography variant="body2" fontSize={14}>
                              {item.name}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      {/* Column 3: Discover */}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="overline"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: theme.palette.text.secondary,
                            mb: 1,
                            display: 'block'
                          }}
                        >
                          {t('DISCOVER')}
                        </Typography>
                        {discoverMenuItems.map((item) => (
                          <Box
                            key={item.path}
                            onClick={() => handleTokenOptionSelect(item.path)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              py: 1,
                              px: 1.5,
                              borderRadius: 0,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                color: theme.palette.primary.main
                              }
                            }}
                          >
                            {item.icon}
                            <Typography variant="body2" fontSize={14}>
                              {item.name}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>

              <StyledLink underline="none" darkMode={darkMode} href="/collections">
                {t('NFTs')}
              </StyledLink>
              <StyledLink underline="none" darkMode={darkMode} href="/swap">
                {t('Swap')}
              </StyledLink>
              <StyledLink underline="none" darkMode={darkMode} href="/news">
                {t('News')}
              </StyledLink>
            </Box>
          )}

          <Suspense fallback={null}>
            <WalletConnectModal />
          </Suspense>

          {fullSearch && (
            <NavSearchBar
              id="id_search_tokens"
              placeholder="Search XRPL Tokens"
              fullSearch={fullSearch}
              setFullSearch={setFullSearch}
              onOpenSearchModal={() => setSearchModalOpen(true)}
            />
          )}

          {!fullSearch && (
            <Box
              id="logo-container-mobile"
              sx={{
                mr: 0,
                ml: { xs: 1, sm: 0 },
                display: { xs: 'flex', sm: 'none' },
                '& img': {
                  maxHeight: '28px',
                  width: 'auto'
                }
              }}
            >
              <Logo alt="xrpl.to Logo" style={{ width: 'auto', height: '28px' }} />
            </Box>
          )}

          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}
          >
            {!fullSearch && isDesktop && (
              <Stack mr={1}>
                <NavSearchBar
                  id="id_search_tokens"
                  placeholder="Search XRPL Tokens"
                  fullSearch={fullSearch}
                  setFullSearch={setFullSearch}
                  onOpenSearchModal={() => setSearchModalOpen(true)}
                />
              </Stack>
            )}

            {!fullSearch && isTabletOrMobile && (
              <IconButton
                aria-label="Open search"
                onClick={handleFullSearch}
                sx={{
                  padding: { xs: '8px', sm: '10px' },
                  minWidth: { xs: '40px', sm: '44px' },
                  minHeight: { xs: '40px', sm: '44px' }
                }}
              >
                <SearchIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
              </IconButton>
            )}

            {!fullSearch && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{ display: { xs: 'none', md: 'flex' }, mr: 0 }}
              >
                {accountProfile && (
                  <Link
                    underline="none"
                    color="inherit"
                    href={`/watchlist`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Chip
                      variant={'outlined'}
                      icon={<StarOutlineIcon fontSize="small" />}
                      label={'Watchlist'}
                      onClick={() => {}}
                      size="small"
                      sx={{
                        borderRadius: '12px',
                        height: '32px',
                        background: 'transparent',
                        border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                        boxShadow: `
                          0 2px 8px ${alpha(theme.palette.common.black, 0.08)}, 
                          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.08)}`,
                        color: theme.palette.text.primary,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(90deg, transparent, ${alpha(
                            theme.palette.primary.main,
                            0.1
                          )}, transparent)`,
                          transition: 'left 0.5s ease'
                        },
                        '&:hover': {
                          background: 'transparent',
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                          boxShadow: `
                            0 8px 24px ${alpha(theme.palette.primary.main, 0.15)},
                            inset 0 1px 2px ${alpha(theme.palette.common.white, 0.15)}`,
                          color: theme.palette.primary.main,
                          '&::before': {
                            left: '100%'
                          }
                        },
                        '& .MuiChip-label': {
                          px: 1.5,
                          fontWeight: 500,
                          fontSize: '0.875rem'
                        },
                        '& .MuiChip-icon': {
                          color: 'inherit',
                          fontSize: '1rem'
                        }
                      }}
                    />
                  </Link>
                )}
                <GlobalNotificationButton
                  sidebarOpen={notificationPanelOpen}
                  onSidebarToggle={onNotificationPanelToggle}
                />
                <Wallet style={{ marginRight: '4px' }} buttonOnly={true} />
              </Stack>
            )}

            {isTabletOrMobile && !fullSearch && (
              <IconButton
                aria-label="Open menu"
                onClick={() => toggleDrawer(true)}
                sx={{
                  padding: { xs: '8px', sm: '10px' },
                  minWidth: { xs: '40px', sm: '44px' },
                  minHeight: { xs: '40px', sm: '44px' },
                  ml: { xs: 0.5, sm: 1 }
                }}
              >
                <MenuIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
              </IconButton>
            )}

            <SidebarDrawer toggleDrawer={toggleDrawer} isOpen={openDrawer} />
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />

      <Suspense fallback={null}>
        <SearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
      </Suspense>
    </HeaderWrapper>
  );
}

export default memo(Header);
