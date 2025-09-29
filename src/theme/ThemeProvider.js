import { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from 'src/AppContext';
import { ThemeProvider } from '@mui/material/styles';
import { themeCreator } from './base';
import { StyledEngineProvider } from '@mui/material/styles';

const ThemeProviderWrapper = (props) => {
  const [isMounted, setIsMounted] = useState(false);
  const { darkMode } = useContext(AppContext);

  // Memoize theme creation to avoid recreating on every render
  const theme = useMemo(
    () => themeCreator(darkMode ? 'XrplToDarkTheme' : 'XrplToLightTheme'),
    [darkMode]
  );

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
