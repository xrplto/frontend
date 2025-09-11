import React, { useContext, useState } from 'react';
import { 
  IconButton, 
  alpha, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Typography,
  Box
} from '@mui/material';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import PaletteIcon from '@mui/icons-material/Palette';
import WavesIcon from '@mui/icons-material/Waves';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { AppContext } from 'src/AppContext';

const themes = [
  {
    id: 'XrplToLightTheme',
    name: 'Light',
    icon: <Brightness7Icon />,
    color: '#ffffff'
  },
  {
    id: 'XrplToDarkTheme',
    name: 'Dark',
    icon: <Brightness4Icon />,
    color: '#000000'
  },
  {
    id: 'SyncWaveTheme',
    name: 'Sync Wave',
    icon: <PaletteIcon />,
    color: '#00ffff'
  },
  {
    id: 'RippleBlueTheme',
    name: 'Ripple Blue',
    icon: WavesIcon,
    color: '#0080ff'
  },
  {
    id: 'LiquidLedgerTheme',
    name: 'Liquid Ledger',
    icon: WaterDropIcon,
    color: '#00D4E6'
  },
  {
    id: 'BirdTheme',
    name: 'birdjpg',
    icon: <PaletteIcon />,
    color: '#1A1A1A'
  }
];

export default function ThemeSwitcher() {
  const { themeName, setTheme } = useContext(AppContext);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleThemeChange = (themeId) => {
    setTheme(themeId);
    handleClose();
  };
  
  const currentTheme = themes.find(t => t.id === themeName) || themes[0];

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
          borderRadius: '6px',
          padding: '4px',
          minWidth: '26px',
          width: '26px',
          height: '26px',
          '&:hover': {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2)
          }
        }}
      >
        <PaletteIcon sx={{ fontSize: 16 }} />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 160,
            '& .MuiMenuItem-root': {
              borderRadius: 1,
              mx: 0.5,
              mb: 0.5
            }
          }
        }}
      >
        {themes.map((theme) => (
          <MenuItem
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            selected={themeName === theme.id}
            sx={{
              '&.Mui-selected': {
                backgroundColor: (t) => alpha(t.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: (t) => alpha(t.palette.primary.main, 0.2)
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  backgroundColor: theme.color,
                  border: theme.id === 'XrplToLightTheme' ? '1px solid #e0e0e0' : theme.id === 'BirdTheme' ? '1px solid #1A1A1A' : 'none',
                  boxShadow: theme.id === 'SyncWaveTheme' || theme.id === 'RippleBlueTheme' || theme.id === 'LiquidLedgerTheme'
                    ? `0 0 10px ${theme.color}` 
                    : 'none'
                }}
              >
                <PaletteIcon 
                  sx={{ 
                    fontSize: 16, 
                    color: theme.id === 'XrplToLightTheme' || theme.id === 'BirdTheme' ? '#fff' : theme.id === 'XrplToDarkTheme' ? '#fff' : '#fff'
                  }}
                />
              </Box>
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2">{theme.name}</Typography>
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
