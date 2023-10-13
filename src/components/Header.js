import { useState } from 'react';

// import i18n (needs to be bundled ;))
import 'locales/i18n';

// Material
import {
  alpha,
  styled,
  useMediaQuery,
  useTheme,
  Box,
  Container,
  IconButton,
  Link,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';

// Translations
import { useTranslation } from 'react-i18next';
// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import Logo from 'src/components/Logo';
import Wallet from 'src/components/Wallet';
import NavSearchBar from './NavSearchBar';
import SidebarDrawer from './SidebarDrawer';
import ThemeSwitcher from './ThemeSwitcher';




const HeaderWrapper = styled(Box)(
  ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(10)};
    margin-bottom: ${theme.spacing(0)};
    border-radius: 0px;
    border-bottom: 1px solid ${alpha('#CBCCD2', 0.2)};
`
);

const StyledLink = styled(Link)(
  ({ darkMode }) => `
    font-weight: 700;
    margin-right: 27px;
    transition: background-color 0.3s;
    padding: 6px 6px; 
    border-radius: 8px; 
    &:hover {
      background-color: ${darkMode ? 'rgba(229, 232, 255, 0.4) !important' : 'rgba(217, 220, 224, .4)'}; 
      color: ${darkMode ? '#005E46' : '#4455CC'};
      cursor: pointer;
    }
  `
);

export default function Header(props) {
  const { t } = useTranslation();    // set translation const
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  // const data = props.data;

  const [fullSearch, setFullSearch] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const { darkMode, setDarkMode } = useContext(AppContext);

  const handleFullSearch = (e) => {
    setFullSearch(true);
  };

  const toggleDrawer = (isOpen = true) => {
    setOpenDrawer(isOpen);
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
              '& .MuiLink-root': {
                '&:hover': {
                  color: '#6188ff'
                }
              }
            }}
          >
            <Logo alt="xrpl.to Logo" style={{ marginRight: 25 }} />

            {!isTablet && (
              <>
                  <StyledLink underline="none" color={ darkMode ? 'white': 'black' } sx={{'&:hover': {color:  darkMode ? '#22B14C !important': '#3366FF !important' ,},}} href="/">
                  {t('description.part1')}
                  </StyledLink>
                  <StyledLink underline="none"  color={ darkMode ? 'white': 'black' } sx={{'&:hover': {color:  darkMode ? '#22B14C !important': '#3366FF !important' ,},}} href="/swap">
                  {t('description.part2')}
                  </StyledLink>
                  <StyledLink underline="none"  color={ darkMode ? 'white': 'black' } sx={{'&:hover': {color:  darkMode ? '#22B14C !important': '#3366FF !important' ,},}} href="/buy-xrp">
                  {t('description.part3')}
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
