import { useState, useContext } from 'react';
import 'src/utils/i18n';
import { useTranslation } from 'react-i18next';
import { alpha, styled, useMediaQuery, useTheme, Box, Container, IconButton, Link, Stack, Menu, MenuItem } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as MuiLink } from '@mui/material'; // Importing MUI Link

// Context
import { AppContext } from 'src/AppContext';

// Components
import Logo from 'src/components/Logo';
import Wallet from 'src/components/Wallet';
import NavSearchBar from './NavSearchBar';
import SidebarDrawer from './SidebarDrawer';
import ThemeSwitcher from './ThemeSwitcher';

// Icon Imports
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WhatshotIcon from '@mui/icons-material/Whatshot'; // Gainers & Losers
import VisibilityIcon from '@mui/icons-material/Visibility'; // Most Viewed
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Recently Added
import StarIcon from '@mui/icons-material/Star'; // Spotlight

const HeaderWrapper = styled(Box)(({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(10)};
    margin-bottom: ${theme.spacing(0)};
    border-radius: 0px;
    border-bottom: 1px solid ${alpha('#CBCCD2', 0.2)};
`);

const StyledLink = styled(Link)(({ darkMode }) => `
    font-weight: 700;
    margin-right: 27px;
    padding: 8px 10px; // Increased padding
    border-radius: 8px;
    transition: background-color 0.3s;
    display: inline-block; // Ensure it's not inline
    &:hover {
      color: ${darkMode ? '#005E46' : '#4455CC'};
      cursor: pointer;
    }
`);

const MenuContainer = styled('div')({
  position: 'relative',
  display: 'inline-block', // Make sure this is an inline-block to properly wrap content
});

export default function Header(props) {
  const { t } = useTranslation();    // set translation const
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [fullSearch, setFullSearch] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const { darkMode, setDarkMode } = useContext(AppContext);

  const handleFullSearch = (e) => {
    setFullSearch(true);
  };

  const toggleDrawer = (isOpen = true) => {
    setOpenDrawer(isOpen);
  };

  // Dropdown menu state and functions
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <HeaderWrapper>
      <Container maxWidth="xl">
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
              alignItems: 'center',
            }}
          >
            <Logo alt="xrpl.to Logo" style={{ marginRight: 25 }} />

            {!isTablet && (
              <>
                <MenuContainer
                  onMouseEnter={handleMenuOpen}
                  onMouseLeave={handleMenuClose}
                >
                  <StyledLink 
                    underline="none" 
                    color={darkMode ? 'white' : 'black'} 
                    sx={{'&:hover': {color: darkMode ? '#22B14C !important' : '#3366FF !important'}}}
                    href="/"
                  >
                    {t("Tokens")}
                    <Menu
                      id="menu-appbar"
                      anchorEl={anchorEl}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                      open={open}
                      onClose={handleMenuClose}
                      sx={{ 
                        display: { xs: 'block', md: 'block' }, // Visible on all screen sizes
                        width: { xs: '100%', sm: 'auto' }, // Responsive width
                        maxWidth: { sm: 300 } // Max width on small devices
                      }}
                    >
                      <MenuItem onClick={handleMenuClose}>
                        <MuiLink href="/" color="inherit" underline="none" sx={{ display: 'flex', alignItems: 'center' }}>
                          <BarChartIcon sx={{ marginRight: theme.spacing(1) }} />
                          Ranking
                        </MuiLink>
                      </MenuItem>


  

  <MenuItem onClick={handleMenuClose}>
    <MuiLink href="/new" color="inherit" underline="none" sx={{ display: 'flex', alignItems: 'center' }}>
      <AddCircleOutlineIcon sx={{ marginRight: theme.spacing(1) }} />
      Recently Added
    </MuiLink>
  </MenuItem>

  <MenuItem onClick={handleMenuClose}>
  <MuiLink href="/best-tokens" color="inherit" underline="none" sx={{ display: 'flex', alignItems: 'center' }}>
    <StarIcon sx={{ marginRight: theme.spacing(1) }} /> 
    Spotlight
  </MuiLink>
</MenuItem>

  <MenuItem onClick={handleMenuClose}>
    <MuiLink href="/trending-tokens" color="inherit" underline="none" sx={{ display: 'flex', alignItems: 'center' }}>
      <TrendingUpIcon sx={{ marginRight: theme.spacing(1) }} />
      Trending
    </MuiLink>
  </MenuItem>
  <MenuItem onClick={handleMenuClose}>
    <MuiLink href="/gainers-losers" color="inherit" underline="none" sx={{ display: 'flex', alignItems: 'center' }}>
      <WhatshotIcon sx={{ marginRight: theme.spacing(1) }} />
      Gainers & Losers
    </MuiLink>
  </MenuItem>
  
  <MenuItem onClick={handleMenuClose}>
    <MuiLink href="/most-viewed-tokens" color="inherit" underline="none" sx={{ display: 'flex', alignItems: 'center' }}>
      <VisibilityIcon sx={{ marginRight: theme.spacing(1) }} />
      Most Viewed
    </MuiLink>
  </MenuItem>
  
  {/* Add more menu items here */}
</Menu>
    </StyledLink>
    </MenuContainer>
    <StyledLink underline="none" color={darkMode ? 'white' : 'black'} sx={{'&:hover': {color: darkMode ? '#22B14C !important' : '#3366FF !important'}}} href="/swap">
      {t("Swap")}
    </StyledLink>
    <StyledLink underline="none" color={darkMode ? 'white' : 'black'} sx={{'&:hover': {color: darkMode ? '#22B14C !important' : '#3366FF !important'}}} href="/buy-xrp">
      {t("Fiat")}
    </StyledLink>
              </>
            )}
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
              alignItems: 'center'
            }}
          >
            {!fullSearch && !isTablet && (
              <Stack mr={2}>
                <NavSearchBar
                  id="id_search_tokens"
                  placeholder="Search XRPL Tokens"
                  fullSearch={fullSearch}
                  setFullSearch={setFullSearch}
                />
              </Stack>
            )}

            {!fullSearch && isTablet && (
              <IconButton aria-label="search" onClick={handleFullSearch}>
                <SearchIcon />
              </IconButton>
            )}

            {!fullSearch && !isTablet && (
              <Wallet style={{ marginRight: '5px' }} />
            )}

            {!isTablet && <ThemeSwitcher darkMode={darkMode} setDarkMode={setDarkMode} />}

            {isTablet && !fullSearch && (
              <IconButton onClick={() => toggleDrawer(true)}>
                <MenuIcon />
              </IconButton>
            )}

            <SidebarDrawer toggleDrawer={toggleDrawer} isOpen={openDrawer} />
          </Box>
        </Box>
      </Container>
    </HeaderWrapper>
  );
}
