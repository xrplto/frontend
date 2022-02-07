import PropTypes from 'prop-types';
import { useMemo/*, useState*/ } from 'react';
// material
import { CssBaseline } from '@mui/material';
import { /*useTheme, */ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
//
import shape from './shape';
import palette from './palette';
import typography from './typography';
import componentsOverride from './overrides';
import shadows, { customShadows } from './shadows';

import * as React from 'react';
//import IconButton from '@mui/material/IconButton';
//import Box from '@mui/material/Box';

// ----------------------------------------------------------------------
//const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

ThemeConfig.propTypes = {
  children: PropTypes.node
};

export default function ThemeConfig({ children }) {
    /*const [mode, setMode] = useState('dark');
    const colorMode = useMemo(() => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );*/
   const themeOptions = useMemo(
     () => ({
       palette,
       shape,
       typography,
       shadows,
       customShadows
     }),
     []
   );

  const theme = createTheme(themeOptions);
  theme.components = componentsOverride(theme);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
      </StyledEngineProvider>
  );
}
