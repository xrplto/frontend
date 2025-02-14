import * as React from 'react';
import { useState, useContext } from 'react';
import { Stack, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import useKeypress from 'react-use-keypress';

import { Box } from '@mui/material';
import { AppContext } from 'src/AppContext';
import SearchModal from './SearchModal';

const NavSearchBar = () => {
  const { darkMode } = useContext(AppContext);
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
        bgcolor={darkMode ? '#1C1C1C' : '#F8F9FA'}
        alignItems="center"
        sx={{
          borderRadius: '8px',
          cursor: 'pointer',
          p: 0.75,
          height: '36px',
          width: '240px',
          '&:hover': {
            bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
          }
        }}
        onClick={openModal}
      >
        <SearchIcon sx={{ fontSize: '1.2rem', mr: 1 }} />
        <Typography
          sx={{
            fontSize: '0.9rem',
            width: '160px',
            color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
          }}
        >
          Search
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
            fontSize: '11px',
            fontWeight: 'bold'
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
