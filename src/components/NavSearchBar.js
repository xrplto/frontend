import * as React from 'react';
import { useState, useContext } from 'react';
import { Stack, Typography, alpha, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import useKeypress from 'react-use-keypress';

import { Box } from '@mui/material';
import { AppContext } from 'src/AppContext';

const NavSearchBar = ({
  id,
  placeholder,
  fullSearch,
  setFullSearch,
  onOpenSearchModal,
  ...props
}) => {
  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  useKeypress('/', () => {
    onOpenSearchModal();
  });

  const openModal = (event) => {
    event.stopPropagation();
    onOpenSearchModal();
  };

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          borderRadius: '14px',
          cursor: 'pointer',
          px: 2.5,
          py: 1.5,
          height: '46px',
          width: '270px',
          backgroundColor: 'transparent',
          backdropFilter: 'blur(10px) saturate(150%)',
          WebkitBackdropFilter: 'blur(10px) saturate(150%)',
          border: `0.5px solid ${alpha(theme.palette.primary.main, darkMode ? 0.12 : 0.18)}`,
          boxShadow: 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          '&:hover': {
            backgroundColor: 'transparent',
            border: `0.5px solid ${alpha(theme.palette.primary.main, darkMode ? 0.25 : 0.35)}`,
            boxShadow: 'none',
            transform: 'translateY(-1px)'
          },
          '&:active': {
            transform: 'translateY(0)',
            transition: 'all 0.1s ease'
          }
        }}
        onClick={openModal}
        {...props}
      >
        <SearchIcon
          sx={{
            fontSize: '1.3rem',
            mr: 2,
            color: isHovered
              ? alpha(theme.palette.primary.main, 0.8)
              : alpha(theme.palette.primary.main, 0.6),
            transition: 'all 0.25s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}
        />
        <Typography
          sx={{
            fontSize: '0.96rem',
            flex: 1,
            color: darkMode
              ? alpha(theme.palette.text.primary, 0.85)
              : alpha(theme.palette.text.secondary, 0.9),
            fontWeight: 500,
            letterSpacing: '0.02em',
            lineHeight: 1.2,
            transition: 'color 0.2s ease'
          }}
        >
          {placeholder || 'Search'}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            backgroundColor: alpha(theme.palette.primary.main, darkMode ? 0.08 : 0.12),
            border: `0.5px solid ${alpha(theme.palette.primary.main, darkMode ? 0.15 : 0.2)}`,
            color: alpha(theme.palette.primary.main, darkMode ? 0.7 : 0.8),
            fontSize: '12px',
            fontWeight: '600',
            fontFamily: 'SF Mono, Monaco, Consolas, monospace',
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          /
        </Box>
      </Stack>
    </>
  );
};

export default NavSearchBar;
