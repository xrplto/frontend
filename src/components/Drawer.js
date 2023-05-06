import React, { useContext } from 'react';

import { Drawer as MuiDrawer, styled, IconButton } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

import { AppContext } from 'src/AppContext';

const DrawerHeader = styled('div')(({ darkMode, style }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: darkMode ? '#17171A' : '#fff',
  paddingLeft: 18,
  paddingRight: 18,
  boxShadow:
    'rgba(128, 138, 157, 0.12) 0px 8px 32px, rgba(128, 138, 157, 0.08) 0px 1px 2px',
  ...style
}));

export default function Drawer({
  toggleDrawer,
  isOpen,
  title,
  children,
  headerStyle
}) {
  const { darkMode } = useContext(AppContext);

  return (
    <MuiDrawer
      open={isOpen}
      onClose={() => toggleDrawer(false)}
      PaperProps={{
        sx: {
          width: '100%'
        }
      }}
    >
      <DrawerHeader darkMode={darkMode} style={headerStyle}>
        {title}
        <IconButton aria-label="close" onClick={() => toggleDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </DrawerHeader>

      {children}
    </MuiDrawer>
  );
}
