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
  ListItemIcon,
  Typography,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
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

const SettingsButton = styled(IconButton)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2)
  }
}));

const Settings = () => {
  const { darkMode, setDarkMode, activeFiatCurrency, setActiveFiatCurrency } =
    useContext(AppContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeChange = () => {
    setDarkMode(!darkMode);
  };

  const handleCurrencyChange = (currency) => {
    setActiveFiatCurrency(currency);
    handleClose();
  };

  return (
    <>
      <SettingsButton
        onClick={handleClick}
        aria-controls={open ? 'settings-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <SettingsIcon />
      </SettingsButton>
      <Menu
        id="settings-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'settings-button'
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: theme.shadows[3]
          }
        }}
      >
        <MenuItem onClick={handleThemeChange}>
          <ListItemIcon>
            {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </ListItemIcon>
          <Typography variant="body2">{darkMode ? 'Light Mode' : 'Dark Mode'}</Typography>
        </MenuItem>
        <Divider />
        <Typography
          variant="caption"
          sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary' }}
        >
          Currency
        </Typography>
        {['USD', 'EUR', 'GBP', 'JPY', 'CNY'].map((currency) => (
          <MenuItem
            key={currency}
            onClick={() => handleCurrencyChange(currency)}
            selected={currency === activeFiatCurrency}
          >
            <ListItemIcon>
              <AttachMoneyIcon fontSize="small" />
            </ListItemIcon>
            <Typography variant="body2">{currency}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

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
            <Logo alt="xrpl.to Logo" style={{ marginRight: 25 }} />

            {isDesktop && (
              <>
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
                  href="/"
                >
                  {t('Tokens')}
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
                  href="/news"
                >
                  {t('News')}
                </StyledLink>
              </>
            )}

            <WalletConnectModal />
          </Box>

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
              alignItems: 'center',
              gap: 2
            }}
          >
            {!fullSearch && isDesktop && (
              <>
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
                <NavSearchBar
                  id="id_search_tokens"
                  placeholder="Search XRPL Tokens"
                  fullSearch={fullSearch}
                  setFullSearch={setFullSearch}
                />
              </>
            )}

            {!fullSearch && isTabletOrMobile && (
              <IconButton aria-label="search" onClick={handleFullSearch}>
                <SearchIcon />
              </IconButton>
            )}

            {!fullSearch && (
              <>
                <Settings />
              </>
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
