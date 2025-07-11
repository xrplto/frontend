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
import { Icon } from '@iconify/react';
import baselineBrightnessHigh from '@iconify/icons-ic/baseline-brightness-high';
import baselineBrightness4 from '@iconify/icons-ic/baseline-brightness-4';
import baselinePalette from '@iconify/icons-ic/baseline-palette';
import baselineWaves from '@iconify/icons-ic/baseline-waves';
import baselineLocalFlorist from '@iconify/icons-ic/baseline-local-florist';
import baselinePets from '@iconify/icons-ic/baseline-pets';
import { AppContext } from 'src/AppContext';

const themes = [
  {
    id: 'XrplToLightTheme',
    name: 'Light',
    icon: baselineBrightnessHigh,
    color: '#ffffff'
  },
  {
    id: 'XrplToDarkTheme',
    name: 'Dark',
    icon: baselineBrightness4,
    color: '#000000'
  },
  {
    id: 'SyncWaveTheme',
    name: 'Sync Wave',
    icon: baselinePalette,
    color: '#00ffff'
  },
  {
    id: 'RippleBlueTheme',
    name: 'Ripple Blue',
    icon: baselineWaves,
    color: '#0080ff'
  },
  {
    id: 'XShroomTheme',
    name: 'XShroom',
    icon: baselineLocalFlorist,
    color: '#FFB84D'
  },
  {
    id: 'BoredApeTheme',
    name: 'Bored Ape',
    icon: baselinePets,
    color: '#40E0D0'
  },
  {
    id: 'BirdTheme',
    name: 'Minimal Bird',
    icon: baselinePalette,
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
          borderRadius: '8px',
          padding: '6px',
          '&:hover': {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2)
          }
        }}
      >
        <Icon icon={currentTheme.icon} fontSize={20} />
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
                  boxShadow: theme.id === 'SyncWaveTheme' || theme.id === 'RippleBlueTheme' || theme.id === 'XShroomTheme' || theme.id === 'BoredApeTheme'
                    ? `0 0 10px ${theme.color}` 
                    : 'none'
                }}
              >
                <Icon 
                  icon={theme.icon} 
                  fontSize={16} 
                  color={theme.id === 'XrplToLightTheme' || theme.id === 'BirdTheme' ? '#fff' : theme.id === 'XrplToDarkTheme' ? '#fff' : '#fff'}
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
