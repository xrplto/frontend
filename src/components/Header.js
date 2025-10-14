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
import NotificationsIcon from '@mui/icons-material/Notifications';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PaletteIcon from '@mui/icons-material/Palette';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckIcon from '@mui/icons-material/Check';
// Translation removed - not using i18n
import {
  useState,
  useContext,
  useEffect,
  forwardRef,
  memo,
  useCallback,
  lazy,
  Suspense,
  useRef,
  useMemo
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import Decimal from 'decimal.js-light';
import axios from 'axios';
import { throttle } from 'src/utils/formatters';
import { AppContext } from 'src/AppContext';
import Logo from 'src/components/Logo';
import NavSearchBar from './NavSearchBar';
const SearchModal = lazy(() => import('./SearchModal'));
import Wallet from 'src/components/Wallet';
import { selectProcess, updateProcess } from 'src/redux/transactionSlice';
import { selectMetrics, update_metrics } from 'src/redux/statusSlice';
const BASE_URL = 'https://api.xrpl.to/api';
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};
const currencyConfig = {
  availableFiatCurrencies: ['XRP', 'USD', 'EUR', 'JPY', 'CNH'],
  activeFiatCurrency: 'XRP'
};

// Dynamic imports for switchers
const CurrencySwitcher = dynamic(() => import('./CurrencySwitcher'), {
  loading: () => <Box sx={{ width: '100px', height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />,
  ssr: false
});
const ThemeSwitcher = dynamic(() => import('./ThemeSwitcher'), {
  loading: () => <Box sx={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />,
  ssr: false
});

// Iconify
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import InfoIcon from '@mui/icons-material/Info';
import WavesIcon from '@mui/icons-material/Waves';
import SetMealIcon from '@mui/icons-material/SetMeal';
import PetsIcon from '@mui/icons-material/Pets';
import WaterIcon from '@mui/icons-material/Water';
import CloseIcon from '@mui/icons-material/Close';

// Helper functions (from Topbar)
const abbreviateNumber = (num) => {
  if (Math.abs(num) < 1000) return num.toFixed(1);
  const suffixes = ['', 'k', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(Math.abs(num)) / 3);
  const scaled = num / Math.pow(10, magnitude * 3);
  return scaled.toFixed(2).replace(/\.?0+$/, '') + suffixes[magnitude];
};

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

const MoonvalveIcon = memo(
  forwardRef((props, ref) => {
    const { width, darkMode, ...otherProps } = props;
    return (
      <SvgIcon
        {...otherProps}
        ref={ref}
        viewBox="0 0 1080 1080"
        sx={{
          '& path': {
            fill: '#ff6b35'
          }
        }}
      >
        <g transform="matrix(0.21 0 0 -0.21 405.9 545.69)">
          <path d="M 4690 8839 C 4166 8779 3630 8512 3267 8130 C 2862 7705 2643 7206 2599 6608 C 2561 6084 2717 5513 3023 5055 C 3214 4769 3472 4512 3749 4333 C 4414 3901 5232 3796 5955 4050 C 6070 4091 6193 4147 6188 4157 C 6115 4302 6106 4421 6160 4563 C 6171 4591 6178 4615 6177 4617 C 6175 4618 6150 4613 6120 4604 C 5919 4550 5578 4525 5349 4549 C 4904 4595 4475 4772 4138 5047 C 4035 5132 3858 5318 3774 5430 C 3359 5983 3235 6685 3436 7347 C 3620 7955 4061 8447 4652 8706 C 4758 8752 4989 8830 5021 8830 C 5031 8830 5042 8835 5045 8840 C 5053 8852 4800 8851 4690 8839 z"
                transform="translate(-4390.76, -6381.14)" />
        </g>
        <g transform="matrix(0.21 0 0 -0.21 592.36 356.11)">
          <path d="M 4344 7780 C 4332 7775 4310 7755 4294 7735 C 4238 7661 4257 7531 4333 7476 C 4360 7456 4376 7455 4726 7452 L 5090 7449 L 5090 7245 L 5090 7040 L 4962 7040 C 4876 7040 4830 7036 4822 7028 C 4805 7011 4805 6789 4822 6772 C 4831 6763 4941 6760 5256 6760 C 5627 6760 5680 6762 5694 6776 C 5707 6788 5710 6815 5710 6899 C 5710 7042 5712 7040 5552 7040 L 5430 7040 L 5430 7245 L 5430 7449 L 5803 7452 L 6175 7455 L 6209 7479 C 6301 7545 6300 7713 6208 7770 C 6176 7790 6160 7790 5270 7789 C 4772 7789 4355 7785 4344 7780 z"
                transform="translate(-5269.57, -7274.67)" />
        </g>
        <g transform="matrix(0.21 0 0 -0.21 577.88 638.18)">
          <path d="M 4775 6606 C 4731 6586 4709 6557 4703 6508 C 4700 6484 4693 6459 4687 6453 C 4680 6443 4553 6440 4113 6440 C 3639 6440 3549 6438 3544 6426 C 3535 6402 3571 6230 3611 6105 C 3632 6039 3676 5933 3707 5870 L 3765 5755 L 4201 5750 L 4637 5745 L 4671 5717 C 4815 5600 4922 5539 5045 5505 C 5136 5480 5309 5474 5406 5493 C 5554 5521 5666 5576 5804 5689 L 5873 5745 L 5989 5748 C 6095 5751 6109 5749 6149 5728 C 6180 5711 6201 5690 6217 5660 C 6238 5620 6240 5605 6240 5454 C 6240 5303 6241 5290 6259 5280 C 6285 5266 6815 5266 6841 5280 C 6859 5290 6860 5304 6860 5534 C 6860 5797 6850 5868 6796 5985 C 6719 6155 6543 6322 6374 6389 C 6277 6426 6180 6440 6006 6440 C 5822 6440 5810 6444 5810 6504 C 5810 6545 5778 6588 5734 6606 C 5686 6626 4820 6626 4775 6606 z"
                transform="translate(-5201.3, -5945.25)" />
        </g>
        <g transform="matrix(0.21 0 0 -0.21 992.56 807.22)">
          <path d="M 7461 5547 C 7323 5341 7117 5124 6923 4978 C 6868 4936 6814 4898 6805 4893 C 6789 4884 6790 4880 6813 4844 C 6826 4822 6852 4776 6869 4742 C 6886 4708 6904 4680 6909 4680 C 6925 4680 7115 4886 7186 4980 C 7264 5083 7349 5218 7400 5319 C 7440 5400 7523 5610 7517 5617 C 7514 5619 7489 5588 7461 5547 z"
                transform="translate(-7155.74, -5148.55)" />
        </g>
        <g transform="matrix(0.21 0 0 -0.21 863.97 931.46)">
          <path d="M 6512 5023 C 6368 4810 6239 4568 6219 4470 C 6183 4296 6260 4139 6416 4068 C 6454 4051 6483 4046 6550 4046 C 6617 4046 6646 4051 6684 4068 C 6759 4102 6813 4152 6850 4221 C 6877 4273 6884 4299 6888 4360 C 6894 4470 6877 4535 6801 4683 C 6743 4797 6568 5080 6555 5080 C 6553 5080 6533 5054 6512 5023 z"
                transform="translate(-6549.68, -4563)" />
        </g>
      </SvgIcon>
    );
  })
);

MoonvalveIcon.displayName = 'MoonvalveIcon';

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
    border-bottom: 1.5px solid ${alpha(theme.palette.divider, 0.2)};
    box-shadow: none;
    overflow: hidden;

    ${theme.breakpoints.down('sm')} {
      height: ${theme.spacing(5)};
      background: ${theme.header?.background || (theme.palette.mode === 'dark' ? '#000000' : '#ffffff')};
    }

    &::before {
      display: none;
    }

    &::after {
      display: none;
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
    border-radius: 12px;
    background: transparent;
    border: 1.5px solid ${alpha(theme.palette.divider, 0.2)};
    box-shadow: none;
    position: relative;
    overflow: hidden;

    &::before {
      display: none;
    }

    &:hover {
      color: ${theme.palette.primary.main};
      background: ${alpha(theme.palette.primary.main, 0.04)};
      border: 1.5px solid ${alpha(theme.palette.primary.main, 0.3)};
      box-shadow: none;
    }
`
);

function Header({ notificationPanelOpen, onNotificationPanelToggle, ...props }) {
  // Translation removed - using hardcoded English text
  const theme = useTheme();
  const dispatch = useDispatch();
  const isProcessing = useSelector(selectProcess);
  const metrics = useSelector(selectMetrics);
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isTabletOrMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const [fullSearch, setFullSearch] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const { darkMode, setDarkMode, accountProfile, activeFiatCurrency, toggleFiatCurrency, themeName, setTheme } = useContext(AppContext);
  const [tokensAnchorEl, setTokensAnchorEl] = useState(null);
  const [tokensMenuOpen, setTokensMenuOpen] = useState(false);
  const openTokensMenu = Boolean(tokensAnchorEl);
  const closeTimeoutRef = useRef(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);


  // Check if metrics are properly loaded
  const metricsLoaded = useMemo(() => {
    return (
      metrics?.global?.total !== undefined &&
      metrics?.global?.totalAddresses !== undefined &&
      metrics?.H24?.transactions24H !== undefined &&
      metrics?.global?.total > 0
    );
  }, [metrics?.global?.total, metrics?.global?.totalAddresses, metrics?.H24?.transactions24H]);


  // Fetch metrics if not loaded
  useEffect(() => {
    if (!metricsLoaded) {
      const controller = new AbortController();
      const fetchMetrics = async () => {
        try {
          const response = await axios.get(
            'https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=',
            {
              signal: controller.signal
            }
          );
          if (response.status === 200 && response.data) {
            dispatch(update_metrics(response.data));
          }
        } catch (error) {
          if (!axios.isCancel(error)) {
            console.error('Error fetching metrics:', error);
          }
        }
      };
      fetchMetrics();
      return () => controller.abort();
    }
  }, [metricsLoaded, dispatch]);

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

  const handleSettingsOpen = useCallback((event) => {
    setSettingsAnchorEl(event.currentTarget);
    setSettingsMenuOpen(true);
  }, []);

  const handleSettingsClose = useCallback(() => {
    setSettingsAnchorEl(null);
    setSettingsMenuOpen(false);
  }, []);

  useEffect(() => {
    if (isProcessing === 1 && isClosed) {
      dispatch(updateProcess(3));
    }

    if (isClosed) {
      setIsClosed(false);
    }
  }, [isProcessing, isClosed]);



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
                  {'Tokens'}
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
                      borderRadius: '12px',
                      border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
                      boxShadow: 'none',
                      bgcolor:
                        theme.header?.background ||
                        (theme.palette.mode === 'dark'
                          ? alpha('#000000', 0.98)
                          : alpha('#ffffff', 0.98)),
                      overflow: 'hidden',
                      zIndex: 2147483647,
                      '&::before': {
                        display: 'none'
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
                          {'LAUNCHPADS'}
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
                                src="/static/magneticx-logo.webp"
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
                          },
                          {
                            path: '/view/moonvalve',
                            name: 'Moonvalve',
                            icon: <MoonvalveIcon sx={{ fontSize: 16 }} />
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
                          {'ANALYTICS'}
                        </Typography>
                        {[
                          {
                            path: '/market-metrics',
                            name: 'Market Metrics',
                            icon: <EmojiEventsIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                          },
                          {
                            path: '/rsi-analysis',
                            name: 'RSI Analysis',
                            icon: <TrendingUpIcon sx={{ fontSize: 16, color: '#2196f3' }} />
                          },
                          {
                            path: '/amm-pools',
                            name: 'AMM Pools',
                            icon: <WavesIcon sx={{ fontSize: 16, color: '#00bcd4' }} />
                          },
                          {
                            path: '/top-traders',
                            name: 'Top Traders',
                            icon: <AutoAwesomeIcon sx={{ fontSize: 16, color: '#e91e63' }} />
                          },
                          ...(accountProfile ? [{
                            path: '/watchlist',
                            name: 'Watchlist',
                            icon: <StarOutlineIcon sx={{ fontSize: 16, color: '#ffc107' }} />
                          }] : [])
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
                          {'DISCOVER'}
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
                {'NFTs'}
              </StyledLink>
              <StyledLink underline="none" darkMode={darkMode} href="/swap">
                {'Swap'}
              </StyledLink>
              <StyledLink underline="none" darkMode={darkMode} href="/news">
                {'News'}
              </StyledLink>
            </Box>
          )}


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
                ml: 0,
                pl: 0,
                display: { xs: 'flex', sm: 'none' },
                '& img': {
                  maxHeight: '28px',
                  width: 'auto'
                }
              }}
            >
              <Logo alt="xrpl.to Logo" style={{ width: 'auto', height: '28px', paddingLeft: 0 }} />
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

                {/* Settings Dropdown */}
                <IconButton
                  onClick={handleSettingsOpen}
                  size="small"
                  aria-label="Settings"
                  sx={{
                    padding: '6px',
                    minWidth: '32px',
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'transparent',
                    border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
                    borderRadius: '12px',
                    ml: 0.5,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      borderColor: alpha(theme.palette.primary.main, 0.3)
                    }
                  }}
                  title="Settings"
                >
                  <SettingsIcon sx={{ fontSize: 16 }} />
                </IconButton>

                {/* Settings Menu */}
                <Menu
                  anchorEl={settingsAnchorEl}
                  open={settingsMenuOpen}
                  onClose={handleSettingsClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                  }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 240,
                      borderRadius: '12px',
                      border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
                      background: theme.palette.mode === 'dark'
                        ? alpha('#000000', 0.98)
                        : alpha('#ffffff', 0.98),
                      boxShadow: 'none',
                      '& .MuiList-root': {
                        padding: '8px'
                      }
                    }
                  }}
                >
                  {/* Currency Section Header */}
                  <Typography
                    variant="overline"
                    sx={{
                      px: 2,
                      py: 1,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: theme.palette.text.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <SwapHorizIcon sx={{ fontSize: 14 }} />
                    CURRENCY
                  </Typography>

                  {/* Currency Options */}
                  {currencyConfig.availableFiatCurrencies.map((currency) => (
                    <MenuItem
                      key={currency}
                      onClick={() => {
                        toggleFiatCurrency(currency);
                        handleSettingsClose();
                      }}
                      selected={currency === activeFiatCurrency}
                      sx={{
                        mx: 1,
                        borderRadius: '6px',
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.15)
                          }
                        }
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                        <Typography variant="body2" sx={{ flex: 1, fontWeight: currency === activeFiatCurrency ? 600 : 400 }}>
                          {currencySymbols[currency] || ''}{currency}
                        </Typography>
                        {currency === activeFiatCurrency && (
                          <CheckIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                        )}
                      </Stack>
                    </MenuItem>
                  ))}

                  <Divider sx={{ my: 1 }} />

                  {/* Theme Section Header */}
                  <Typography
                    variant="overline"
                    sx={{
                      px: 2,
                      py: 1,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: theme.palette.text.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <PaletteIcon sx={{ fontSize: 14 }} />
                    THEME
                  </Typography>

                  {/* Theme Options */}
                  {[
                    { id: 'XrplToLightTheme', name: 'Light', color: '#ffffff', border: true },
                    { id: 'XrplToDarkTheme', name: 'Dark', color: '#000000' }
                  ].map((themeOption) => (
                    <MenuItem
                      key={themeOption.id}
                      onClick={() => {
                        setTheme(themeOption.id);
                        handleSettingsClose();
                      }}
                      selected={themeName === themeOption.id}
                      sx={{
                        mx: 1,
                        borderRadius: '6px',
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.15)
                          }
                        }
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: '4px',
                            backgroundColor: themeOption.color,
                            border: themeOption.border ? '1px solid #e0e0e0' : 'none',
                            boxShadow: themeOption.glow ? `0 0 8px ${themeOption.color}` : 'none'
                          }}
                        />
                        <Typography variant="body2" sx={{ flex: 1, fontWeight: themeName === themeOption.id ? 600 : 400 }}>
                          {themeOption.name}
                        </Typography>
                        {themeName === themeOption.id && (
                          <CheckIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                        )}
                      </Stack>
                    </MenuItem>
                  ))}
                </Menu>

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
