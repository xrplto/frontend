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

  const currentTheme = themes.find((t) => t.id === themeName) || themes[0];

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
          borderRadius: '6px',
          padding: '4px',
          minWidth: '32px',
          width: '32px',
          height: '32px',
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
                backgroundColor: (t) => alpha(t.palette.primary.main, 0.08),
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
                  border:
                    theme.id === 'XrplToLightTheme'
                      ? '1px solid #e0e0e0'
                      : 'none',
                  boxShadow: 'none'
                }}
              >
                <PaletteIcon
                  sx={{
                    fontSize: 16,
                    color: '#fff'
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
