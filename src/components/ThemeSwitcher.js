import React, { useContext } from 'react';
import { IconButton, alpha } from '@mui/material';
import { Icon } from '@iconify/react';
import baselineBrightnessHigh from '@iconify/icons-ic/baseline-brightness-high';
import baselineBrightness4 from '@iconify/icons-ic/baseline-brightness-4';
import { AppContext } from 'src/AppContext';

export default function ThemeSwitcher() {
  const { darkMode, toggleTheme } = useContext(AppContext);

  return (
    <IconButton
      onClick={toggleTheme}
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
      <Icon icon={darkMode ? baselineBrightness4 : baselineBrightnessHigh} fontSize={20} />
    </IconButton>
  );
}
