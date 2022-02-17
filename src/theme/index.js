import PropTypes from 'prop-types';
import { useContext, useMemo/*, useState*/ } from 'react';
// material
import { CssBaseline } from '@mui/material';
import { /*useTheme, */ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import Context from './Context'
//
import shape from './shape';
import palette from './palette';
import typography from './typography';
import componentsOverride from './overrides';
import shadows, { customShadows } from './shadows';
import AppThemeProvider from './Provider'
import * as React from 'react';
//import IconButton from '@mui/material/IconButton';
//import Box from '@mui/material/Box';

// ----------------------------------------------------------------------
//const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

ThemeConfig.propTypes = {
    children: PropTypes.node
};

/*
import { useEffect, useState } from 'react';
export const useDarkMode = () => {
    const [theme, setTheme] = useState('light');

    const setMode = mode => {
        window.localStorage.setItem('theme', mode)
        setTheme(mode)
    };

    const themeToggler = () => {
        theme === 'light' ? setMode('dark') : setMode('light')
    };

    useEffect(() => {
        const localTheme = window.localStorage.getItem('theme');
        localTheme && setTheme(localTheme)
    }, []);
    return [theme, themeToggler]
};

*/
function useTheme() {
    return useContext(Context)
}

const getThemeSource = (id, ts, isDarkMode, isRTL) => {
    if (ts) {
        for (let i = 0; i < ts.length; i++) {
        if (ts[i]['id'] === id) {
            const source = ts[i]['source']
            const palette = source != null ? source.palette : {}
            return createTheme({
            ...source,
            palette: { ...palette, mode: isDarkMode ? 'dark' : 'light' },
            direction: isRTL ? 'rtl' : 'ltr',
            })
        }
        }
    }

    return createTheme({
        palette: { mode: isDarkMode ? 'dark' : 'light' },
        shape,
        typography,
        shadows,
        customShadows,
        direction: isRTL ? 'rtl' : 'ltr',
    })
}

export default function ThemeConfig({ children }) {
    // const [theme, setTheme] = useState(window.localStorage.getItem('theme') || 'light');
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

    //const intl = useIntl()
    //const { appConfig } = useConfig()
    //const { themeID, isDarkMode, isRTL } = useContext(Context);
    //const { theme: themeConfig, pwa, notistack } = appConfig || {}
    //const { useiOSPWAPrompt, iOSPWAPromptProps } = pwa || {}
    //const themeConfig = {};
    //const { themes = [] } = themeConfig || {}
    //const theme = getThemeSource(themeID, themes, isDarkMode, isRTL)

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
