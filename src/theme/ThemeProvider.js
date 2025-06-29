import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material';
import { themeCreator } from './base';
import { StyledEngineProvider } from '@mui/material/styles';

const ThemeProviderWrapper = (props) => {
  const [isMounted, setIsMounted] = useState(false);

  const { darkMode } = useContext(AppContext);

  const theme = themeCreator(darkMode);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>{isMounted && props.children}</ThemeProvider>
    </StyledEngineProvider>
  );
};

export default ThemeProviderWrapper;
