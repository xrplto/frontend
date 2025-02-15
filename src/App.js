import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'dark', // or 'light'
    primary: {
      main: '#90caf9'
    },
    secondary: {
      main: '#f48fb1'
    },
    divider: '#707070', // example color, you can customize this
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa'
    }
  }
});

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
    </ThemeProvider>
  </React.StrictMode>
);
