import { Link as MuiLink } from '@mui/material';
import { styled, Menu, useTheme, MenuItem } from '@mui/material';
// Icon Imports
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WhatshotIcon from '@mui/icons-material/Whatshot'; // Gainers & Losers
import VisibilityIcon from '@mui/icons-material/Visibility'; // Most Viewed
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Recently Added
import StarIcon from '@mui/icons-material/Star'; // Spotlight
import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from 'src/AppContext';
import { useTranslation } from 'react-i18next';

const StyledLink = styled('div')(
  () => `
      font-weight: 700;
      margin-right: 27px;
      padding: 8px 10px; // Increased padding
      border-radius: 8px;
      transition: background-color 0.3s;
      display: inline-block; // Ensure it's not inline
      cursor: pointer;
      position: relative; // Add relative positioning
  `
);

// Add styled component for dropdown container
const DropdownContainer = styled('ul')(
  ({ theme, darkMode }) => `
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1500;
    background: ${darkMode ? 'rgb(23, 23, 26)' : 'rgb(244, 245, 251)'};
    border: ${darkMode ? '1px solid rgb(33, 37, 43)' : '1px solid rgb(220, 220, 220)'};
    color: ${darkMode ? 'white' : '#343434'};
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 12px;
    width: 400px;
    list-style: none;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    margin-top: 4px;
  `
);

const DropDownMenu = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { darkMode } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // Small delay before closing
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <ul
        id="dropdown_menu"
        style={{ position: 'relative' }}
        ref={menuRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <li>
          <StyledLink
            sx={{
              color: darkMode ? 'white' : 'black',
              '&:hover': {
                color: darkMode ? '#22B14C' : '#3366FF'
              }
            }}
          >
            {t('Tokens')}

            {isOpen && (
              <DropdownContainer
                darkMode={darkMode}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <li id={darkMode ? 'darkItem' : 'lightItem'}>
                  <MuiLink
                    href="/"
                    color="inherit"
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: darkMode
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    <BarChartIcon sx={{ marginRight: theme.spacing(1) }} />
                    Ranking
                  </MuiLink>
                </li>
                <li id={darkMode ? 'darkItem' : 'lightItem'}>
                  <MuiLink
                    href="/new"
                    color="inherit"
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: darkMode
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    <AddCircleOutlineIcon sx={{ marginRight: theme.spacing(1) }} />
                    Recently Added
                  </MuiLink>
                </li>
                <li id={darkMode ? 'darkItem' : 'lightItem'}>
                  <MuiLink
                    href="/best-tokens"
                    color="inherit"
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: darkMode
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    <StarIcon sx={{ marginRight: theme.spacing(1) }} />
                    Spotlight
                  </MuiLink>
                </li>
                <li id={darkMode ? 'darkItem' : 'lightItem'}>
                  <MuiLink
                    href="/trending-tokens"
                    color="inherit"
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: darkMode
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    <TrendingUpIcon sx={{ marginRight: theme.spacing(1) }} />
                    Trending
                  </MuiLink>
                </li>
                <li id={darkMode ? 'darkItem' : 'lightItem'}>
                  <MuiLink
                    href="/gainers-losers"
                    color="inherit"
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: darkMode
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    <WhatshotIcon sx={{ marginRight: theme.spacing(1) }} />
                    Gainers & Losers
                  </MuiLink>
                </li>
                <li id={darkMode ? 'darkItem' : 'lightItem'}>
                  <MuiLink
                    href="/most-viewed-tokens"
                    color="inherit"
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: darkMode
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    <VisibilityIcon sx={{ marginRight: theme.spacing(1) }} />
                    Most Viewed
                  </MuiLink>
                </li>
              </DropdownContainer>
            )}
          </StyledLink>
        </li>
      </ul>
    </>
  );
};

export default DropDownMenu;
