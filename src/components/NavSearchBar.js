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
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        borderRadius: '12px',
        cursor: 'pointer',
        px: 2,
        py: 1,
        height: '36px',
        width: '280px',
        backgroundColor: alpha(theme.palette.background.paper, 0.02),
        border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          borderColor: alpha(theme.palette.primary.main, 0.3)
        }
      }}
      onClick={openModal}
      {...props}
    >
      <SearchIcon
        sx={{
          fontSize: '18px',
          mr: 1.5,
          color: alpha(theme.palette.text.secondary, 0.6)
        }}
      />
      <Typography
        sx={{
          fontSize: '14px',
          flex: 1,
          color: alpha(theme.palette.text.secondary, 0.7),
          fontWeight: 400
        }}
      >
        {placeholder || 'Search'}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 1,
          height: '22px',
          borderRadius: '6px',
          backgroundColor: alpha(theme.palette.divider, 0.08),
          border: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
          color: alpha(theme.palette.text.secondary, 0.6),
          fontSize: '12px',
          fontWeight: 400,
          fontFamily: 'monospace'
        }}
      >
        /
      </Box>
    </Stack>
  );
};

export default NavSearchBar;
