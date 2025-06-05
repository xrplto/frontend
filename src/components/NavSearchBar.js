import * as React from 'react';
import { useState, useContext } from 'react';
import { Stack, Typography, alpha, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import useKeypress from 'react-use-keypress';

import { Box } from '@mui/material';
import { AppContext } from 'src/AppContext';
import SearchModal from './SearchModal';

const NavSearchBar = ({ id, placeholder, fullSearch, setFullSearch, ...props }) => {
  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  useKeypress('/', () => {
    setOpen(true);
  });

  const openModal = (event) => {
    event.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          borderRadius: '12px',
          cursor: 'pointer',
          p: 1,
          height: '40px',
          width: '240px',
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.8
          )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
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
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.08
            )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            transform: 'translateY(-2px)',
            boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
            '&::before': {
              left: '100%'
            }
          }
        }}
        onClick={openModal}
        {...props}
      >
        <SearchIcon
          sx={{
            fontSize: '1.2rem',
            mr: 1,
            color: theme.palette.text.secondary,
            transition: 'color 0.2s ease'
          }}
        />
        <Typography
          sx={{
            fontSize: '0.9rem',
            width: '160px',
            color: theme.palette.text.secondary,
            fontWeight: 500,
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
            borderRadius: '6px',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.1
            )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            color: theme.palette.text.secondary,
            fontSize: '11px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
        >
          /
        </Box>
      </Stack>
      <SearchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default NavSearchBar;
