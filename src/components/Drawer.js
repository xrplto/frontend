import React, { useContext } from 'react';
import { Drawer as MuiDrawer, styled, IconButton, alpha } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AppContext } from 'src/AppContext';

// Enhanced DrawerHeader with portfolio-style design
const DrawerHeader = styled('div', {
  shouldForwardProp: (prop) => prop !== 'darkMode'
})(({ theme, darkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
    theme.palette.background.paper,
    0.8
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 10,
  paddingBottom: 10,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}, 0 2px 8px ${alpha(
    theme.palette.primary.main,
    0.04
  )}`,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
    opacity: 0.8
  }
}));

// Enhanced Close Button
const EnhancedCloseButton = styled(IconButton)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.4
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  borderRadius: '12px',
  width: '40px',
  height: '40px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 12px ${alpha(
      theme.palette.error.main,
      0.15
    )}`,
    background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(
      theme.palette.error.main,
      0.05
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
    '& .MuiSvgIcon-root': {
      color: theme.palette.error.main
    }
  },
  '& .MuiSvgIcon-root': {
    fontSize: '20px',
    transition: 'color 0.3s ease'
  }
}));

export default function Drawer({ toggleDrawer, isOpen, title, children, headerStyle }) {
  const { darkMode } = useContext(AppContext);

  const handleClose = () => {
    toggleDrawer(false);
  };

  return (
    <MuiDrawer
      anchor="bottom"
      open={isOpen}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: '100%',
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.98)} 0%, ${alpha(
              theme.palette.background.default,
              0.95
            )} 100%)`,
          backdropFilter: 'blur(20px)',
          borderLeft: (theme) => `1px solid ${alpha(theme.palette.divider, 0.08)}`
        }
      }}
    >
      <DrawerHeader darkMode={darkMode} style={headerStyle}>
        {title}
        <EnhancedCloseButton aria-label="close" onClick={handleClose}>
          <CloseIcon />
        </EnhancedCloseButton>
      </DrawerHeader>

      {children}
    </MuiDrawer>
  );
}
