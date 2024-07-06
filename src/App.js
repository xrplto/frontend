import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Portfolio from './portfolio';

const theme = createTheme({
  palette: {
    mode: 'dark', // or 'light'
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    divider: '#707070', // example color, you can customize this
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa',
    },
  },
});

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Portfolio account="example" limit={10} collection="exampleCollection" type="exampleType" />
  </ThemeProvider>,
  document.getElementById('root')
);
