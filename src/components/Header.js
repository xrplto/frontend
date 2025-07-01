import {
  alpha,
  Box,
  Chip,
  Container,
  IconButton,
  Link,
  Snackbar,
  Stack,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Divider,
  SvgIcon,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useTranslation } from 'react-i18next';
import { useState, useContext, useEffect, forwardRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import sdk from "@crossmarkio/sdk";
import { AppContext } from 'src/AppContext';
import Logo from 'src/components/Logo';
import NavSearchBar from './NavSearchBar';
import SidebarDrawer from './SidebarDrawer';
import WalletConnectModal from './WalletConnectModal';
import { selectProcess, updateProcess } from 'src/redux/transactionSlice';

// Iconify
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

// Add XPMarket icon component
const XPMarketIcon = (props) => {
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
};

const LedgerMemeIcon = forwardRef((props, ref) => {
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
});

LedgerMemeIcon.displayName = 'LedgerMemeIcon';

const HeaderWrapper = styled(Box)(
  ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(7)};
    margin-bottom: ${theme.spacing(0)};
    border-radius: 0px;
    border-bottom: 1px solid ${alpha(theme.palette.divider, 0.12)};
    position: relative;
    z-index: 1100;
    background: linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(
      theme.palette.background.paper,
      0.5
    )} 100%);
    backdrop-filter: blur(25px);
    box-shadow: 0 8px 32px 0 ${alpha(theme.palette.common.black, 0.1)};
    
    &::before {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(to right, ${alpha(
        theme.palette.divider,
        0
      )}, ${alpha(theme.palette.divider, 0.15)}, ${alpha(theme.palette.divider, 0)});
      opacity: 0.8;
    }
`
);

const StyledLink = styled(Link, {
  shouldForwardProp: (prop) => prop !== 'darkMode'
})(
  ({ darkMode, theme }) => `
    font-weight: 600;
    margin-right: 20px;
    padding: 8px 16px;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
    background: linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(
      theme.palette.background.paper,
      0.3
    )} 100%);
    backdrop-filter: blur(10px);
    border: 1px solid ${alpha(theme.palette.divider, 0.08)};
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
        0.1
      )}, transparent);
      transition: left 0.5s ease;
    }
    
    &:hover {
      color: ${darkMode ? theme.palette.success.main : theme.palette.primary.main};
      background: linear-gradient(135deg, ${alpha(
        darkMode ? theme.palette.success.main : theme.palette.primary.main,
        0.08
      )} 0%, ${alpha(
        darkMode ? theme.palette.success.main : theme.palette.primary.main,
        0.03
      )} 100%);
      border: 1px solid ${alpha(
        darkMode ? theme.palette.success.main : theme.palette.primary.main,
        0.15
      )};
      transform: translateY(-2px);
      box-shadow: 0 4px 16px ${alpha(
        darkMode ? theme.palette.success.main : theme.palette.primary.main,
        0.15
      )};
      cursor: pointer;
      
      &::before {
        left: 100%;
      }
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
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.4)} 0%, ${alpha(
      theme.palette.background.paper,
      0.2
    )} 100%);
    backdrop-filter: blur(10px);
    border: 1px solid ${alpha(theme.palette.divider, 0.06)};
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
      color: ${darkMode ? theme.palette.success.main : theme.palette.primary.main};
      background: linear-gradient(135deg, ${alpha(
        darkMode ? theme.palette.success.main : theme.palette.primary.main,
        0.08
      )} 0%, ${alpha(
        darkMode ? theme.palette.success.main : theme.palette.primary.main,
        0.03
      )} 100%);
      border: 1px solid ${alpha(
        darkMode ? theme.palette.success.main : theme.palette.primary.main,
        0.12
      )};
      transform: translateX(4px);
      box-shadow: 0 4px 12px ${alpha(
        darkMode ? theme.palette.success.main : theme.palette.primary.main,
        0.12
      )};
      
      &::before {
        left: 100%;
      }
    }
`
);

export default function Header(props) {
  const { t } = useTranslation(); // set translation const
  const theme = useTheme();
  const dispatch = useDispatch();
  const isProcessing = useSelector(selectProcess);
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isTabletOrMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [fullSearch, setFullSearch] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [isClosed, setClosed] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const { darkMode, setDarkMode } = useContext(AppContext);
  const [tokensAnchorEl, setTokensAnchorEl] = useState(null);
  const openTokensMenu = Boolean(tokensAnchorEl);

  const handleFullSearch = (e) => {
    setFullSearch(true);
  };

  const toggleDrawer = (isOpen = true) => {
    setOpenDrawer(isOpen);
  };

  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleTokensClick = (event) => {
    setTokensAnchorEl(event.currentTarget);
  };

  const handleTokensClose = () => {
    setTokensAnchorEl(null);
  };

  const handleTokenOptionSelect = (path) => {
    window.location.href = path;
    handleTokensClose();
  };

  useEffect(() => {
    if (isProcessing === 1 && isClosed) {
      dispatch(updateProcess(3));
    }

    if (isClosed) {
      setClosed(false);
    }
  }, [isProcessing, isClosed]);

  useEffect(() => {
    let isMounted = true;

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

          // Dynamically import the SDK
          const { default: CrossmarkSDK } = await import('@crossmarkio/sdk');

          if (isMounted && CrossmarkSDK && typeof CrossmarkSDK.on === 'function') {
            const handleClose = () => {
              if (isMounted) {
                setClosed(true);
              }
            };

            CrossmarkSDK.on('close', handleClose);

            return () => {
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

    initializeCrossmark();

    return () => {
      isMounted = false;
    };
  }, [isDesktop]);

  return (
    <HeaderWrapper>
      <Container maxWidth={false}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flex={2}
          sx={{ pl: 0, pr: 0 }}
        >
          <Box
            id="logo-container-laptop"
            sx={{
              mr: 2,
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center'
            }}
          >
            <Logo alt="xrpl.to Logo" style={{ marginRight: 35 }} />
          </Box>

          {isDesktop && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <StyledLink
                underline="none"
                color={darkMode ? 'white' : 'black'}
                darkMode={darkMode}
                theme={theme}
                onClick={handleTokensClick}
                style={{ cursor: 'pointer' }}
              >
                {t('Tokens')}
                <KeyboardArrowDownIcon />
              </StyledLink>

              <Menu
                anchorEl={tokensAnchorEl}
                open={openTokensMenu}
                onClose={handleTokensClose}
                MenuListProps={{
                  'aria-labelledby': 'tokens-button'
                }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.95
                    )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    boxShadow: `0 8px 32px ${alpha(
                      theme.palette.common.black,
                      0.08
                    )}, 0 2px 8px ${alpha(theme.palette.primary.main, 0.04)}`,
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                      opacity: 0.8
                    }
                  }
                }}
              >
                <StyledMenuItem
                  darkMode={darkMode}
                  theme={theme}
                  onClick={() => handleTokenOptionSelect('/')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon sx={{ fontSize: '16px', color: '#637381' }} />
                    <span>{t('All Tokens')}</span>
                  </Box>
                </StyledMenuItem>

                <Divider sx={{ my: 1 }} />

                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    pt: 1,
                    pb: 0,
                    fontWeight: 'bold',
                    color: 'text.secondary',
                    display: 'block'
                  }}
                >
                  {t('Launchpads')}
                </Typography>

                <StyledMenuItem
                  darkMode={darkMode}
                  theme={theme}
                  onClick={() => handleTokenOptionSelect('/view/firstledger')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <OpenInNewIcon sx={{ fontSize: '16px', color: '#0C53B7' }} />
                    <span>FirstLedger</span>
                  </Box>
                </StyledMenuItem>

                <StyledMenuItem
                  darkMode={darkMode}
                  theme={theme}
                  onClick={() => handleTokenOptionSelect('/view/magnetic-x')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="img"
                      src="/magneticx-logo.webp"
                      alt="Magnetic X"
                      sx={{
                        width: '16px',
                        height: '16px',
                        objectFit: 'contain'
                      }}
                    />
                    <span>Magnetic X</span>
                  </Box>
                </StyledMenuItem>

                <StyledMenuItem
                  darkMode={darkMode}
                  theme={theme}
                  onClick={() => handleTokenOptionSelect('/view/xpmarket')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <XPMarketIcon sx={{ fontSize: '16px', color: '#6D1FEE' }} />
                    <span>XPmarket</span>
                  </Box>
                </StyledMenuItem>

                <StyledMenuItem
                  darkMode={darkMode}
                  theme={theme}
                  onClick={() => handleTokenOptionSelect('/view/ledgermeme')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LedgerMemeIcon sx={{ fontSize: '16px', color: '#cfff04' }} />
                    <span>LedgerMeme</span>
                  </Box>
                </StyledMenuItem>

                <Divider sx={{ my: 1 }} />

                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    pt: 1,
                    pb: 0,
                    fontWeight: 'bold',
                    color: 'text.secondary',
                    display: 'block'
                  }}
                >
                  {t('Token Discovery')}
                </Typography>

                <StyledMenuItem
                  darkMode={darkMode}
                  theme={theme}
                  onClick={() => handleTokenOptionSelect('/trending')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalFireDepartmentIcon
                      sx={{ fontSize: '16px', color: darkMode ? '#FF5630' : '#B71D18' }}
                    />
                    <span>Trending</span>
                  </Box>
                </StyledMenuItem>

                <StyledMenuItem
                  darkMode={darkMode}
                  theme={theme}
                  onClick={() => handleTokenOptionSelect('/spotlight')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SearchIcon
                      sx={{ fontSize: '16px', color: darkMode ? '#2499EF' : '#0C53B7' }}
                    />
                    <span>Spotlight</span>
                  </Box>
                </StyledMenuItem>

                <StyledMenuItem
                  darkMode={darkMode}
                  theme={theme}
                  onClick={() => handleTokenOptionSelect('/most-viewed')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VisibilityIcon
                      sx={{ fontSize: '16px', color: darkMode ? '#9155FD' : '#7635DC' }}
                    />
                    <span>Most Viewed</span>
                  </Box>
                </StyledMenuItem>

                <StyledMenuItem
                  darkMode={darkMode}
                  theme={theme}
                  onClick={() => handleTokenOptionSelect('/gainers/24h')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon
                      sx={{ fontSize: '16px', color: darkMode ? '#00AB55' : '#007B55' }}
                    />
                    <span>Gainers</span>
                  </Box>
                </StyledMenuItem>

                <StyledMenuItem
                  darkMode={darkMode}
                  theme={theme}
                  onClick={() => handleTokenOptionSelect('/new')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FiberNewIcon
                      sx={{ fontSize: '16px', color: darkMode ? '#FFA000' : '#B76E00' }}
                    />
                    <span>New</span>
                  </Box>
                </StyledMenuItem>

                <Divider sx={{ my: 1 }} />

                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    pt: 1,
                    pb: 0,
                    fontWeight: 'bold',
                    color: 'text.secondary',
                    display: 'block'
                  }}
                >
                  {t('Market Analysis')}
                </Typography>

                <StyledMenuItem
                  darkMode={darkMode}
                  theme={theme}
                  onClick={() => handleTokenOptionSelect('/market-metrics')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TroubleshootIcon
                      sx={{ fontSize: '16px', color: darkMode ? '#2499EF' : '#0C53B7' }}
                    />
                    <span>{t('Market Metrics')}</span>
                  </Box>
                </StyledMenuItem>

                <StyledMenuItem
                  darkMode={darkMode}
                  theme={theme}
                  onClick={() => handleTokenOptionSelect('/top-traders')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiEventsIcon
                      sx={{ fontSize: '16px', color: darkMode ? '#FFC107' : '#B78100' }}
                    />
                    <span>{t('Top Traders')}</span>
                  </Box>
                </StyledMenuItem>
              </Menu>

              <StyledLink
                underline="none"
                color={darkMode ? 'white' : 'black'}
                darkMode={darkMode}
                theme={theme}
                href="/collections"
              >
                {t('NFTs')}
              </StyledLink>
              <StyledLink
                underline="none"
                color={darkMode ? 'white' : 'black'}
                darkMode={darkMode}
                theme={theme}
                href="/swap"
              >
                {t('Swap')}
              </StyledLink>
              {/* <StyledLink
                underline="none"
                color={darkMode ? 'white' : 'black'}
                sx={{
                  '&:hover': {
                    color: darkMode ? '#22B14C !important' : '#3366FF !important'
                  },
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                href="/news"
              >
                {t('News')}
              </StyledLink> */}
            </Box>
          )}

          <WalletConnectModal />

          {fullSearch && (
            <NavSearchBar
              id="id_search_tokens"
              placeholder="Search XRPL Tokens"
              fullSearch={fullSearch}
              setFullSearch={setFullSearch}
            />
          )}

          {!fullSearch && (
            <Box
              id="logo-container-mobile"
              sx={{
                mr: 2,
                display: { xs: 'flex', sm: 'none' }
              }}
            >
              <Logo alt="xrpl.to Logo" />
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
                />
              </Stack>
            )}

            {!fullSearch && isTabletOrMobile && (
              <IconButton aria-label="search" onClick={handleFullSearch}>
                <SearchIcon />
              </IconButton>
            )}

            {!fullSearch && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{ display: { xs: 'none', md: 'flex' }, mr: 0 }}
              >
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
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.8
                      )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
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
                        transform: 'translateY(-2px)',
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.primary.main,
                          0.08
                        )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
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
              </Stack>
            )}

            {isTabletOrMobile && !fullSearch && (
              <IconButton onClick={() => toggleDrawer(true)}>
                <MenuIcon />
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
    </HeaderWrapper>
  );
}
