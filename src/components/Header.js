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
  SvgIcon
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTranslation } from 'react-i18next';
import { useState, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import sdk from "@crossmarkio/sdk";
import { AppContext } from 'src/AppContext';
import Logo from 'src/components/Logo';
import NavSearchBar from './NavSearchBar';
import SidebarDrawer from './SidebarDrawer';
import WalletConnectModal from './WalletConnectModal';
import { selectProcess, updateProcess } from 'src/redux/transactionSlice';

// Iconify
import { Icon } from '@iconify/react';
import chartLineUp from '@iconify/icons-ph/chart-line-up';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

// Add XPMarket icon component
const XPMarketIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 32 32">
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

const HeaderWrapper = styled(Box)(
  ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(7)};
    margin-bottom: ${theme.spacing(0)};
    border-radius: 0px;
    border-bottom: 1px solid ${alpha('#CBCCD2', 0.2)};
    position: relative;
    z-index: 1200;
    background-color: ${theme.palette.background.paper};
`
);

const StyledLink = styled(Link)(
  ({ darkMode }) => `
    font-weight: 700;
    margin-right: 20px;
    padding: 6px 10px;
    border-radius: 10px;
    transition: all 0.2s ease-in-out;
    display: inline-flex;
    align-items: center;
    background: transparent;
    &:hover {
      color: ${darkMode ? '#22B14C' : '#3366FF'};
      background: ${darkMode ? 'rgba(34, 177, 76, 0.1)' : 'rgba(51, 102, 255, 0.1)'};
      cursor: pointer;
    }
`
);

const StyledMenuItem = styled(MenuItem)(
  ({ darkMode }) => `
    color: ${darkMode ? 'white' : 'black'};
    &:hover {
      color: ${darkMode ? '#22B14C' : '#3366FF'};
      background: ${darkMode ? 'rgba(34, 177, 76, 0.1)' : 'rgba(51, 102, 255, 0.1)'};
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
          console.error('Failed to load Crossmark SDK:', error);
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
                sx={{
                  '&:hover': {
                    color: darkMode ? '#22B14C !important' : '#3366FF !important'
                  },
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
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
                    backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.9)' : 'white',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <StyledMenuItem
                  darkMode={darkMode}
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

                <StyledMenuItem
                  darkMode={darkMode}
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
                  onClick={() => handleTokenOptionSelect('/view/xrpfun')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon
                      icon={chartLineUp}
                      style={{
                        fontSize: '16px',
                        color: '#B72136',
                        backgroundColor: '#fff',
                        borderRadius: '2px'
                      }}
                    />
                    <span>xrp.fun</span>
                  </Box>
                </StyledMenuItem>

                <Divider sx={{ my: 1 }} />

                <StyledMenuItem
                  darkMode={darkMode}
                  onClick={() => handleTokenOptionSelect('/?sort=trendingScore&order=desc')}
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
                  onClick={() => handleTokenOptionSelect('/?sort=assessmentScore&order=desc')}
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
                  onClick={() => handleTokenOptionSelect('/?sort=views&order=desc')}
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
                  onClick={() => handleTokenOptionSelect('/?sort=pro24h&order=desc')}
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
                  onClick={() => handleTokenOptionSelect('/?sort=dateon&order=desc')}
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

                <StyledMenuItem
                  darkMode={darkMode}
                  onClick={() => handleTokenOptionSelect('/market-metrics')}
                >
                  {t('Market Metrics')}
                </StyledMenuItem>

                <StyledMenuItem
                  darkMode={darkMode}
                  onClick={() => handleTokenOptionSelect('/top-traders')}
                >
                  {t('Top Traders')}
                </StyledMenuItem>
              </Menu>

              <StyledLink
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
                href="/collections"
              >
                {t('NFTs')}
              </StyledLink>
              <StyledLink
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
                      borderRadius: '8px',
                      height: '28px',
                      '& .MuiChip-label': {
                        px: 1
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
