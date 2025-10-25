import * as React from 'react';
import { useState, useContext, useEffect } from 'react';
import { Stack, Typography, alpha, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
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

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Don't trigger if user is typing in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        onOpenSearchModal();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onOpenSearchModal]);

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
          px: 2,
          py: 1,
          height: '34px',
          width: '280px',
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
            fontSize: '19px',
            mr: 1.5,
            color: isHovered
              ? alpha(theme.palette.primary.main, 0.8)
              : alpha(theme.palette.primary.main, 0.6),
            transition: 'all 0.25s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}
        />
        <Typography
          sx={{
            fontSize: '14px',
            flex: 1,
            color: darkMode
              ? alpha(theme.palette.text.primary, 0.85)
              : alpha(theme.palette.text.secondary, 0.9),
            fontWeight: 400,
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
            width: '22px',
            height: '22px',
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
