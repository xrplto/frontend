import PropTypes from 'prop-types';
import { /*useContext, useMemo,*/ useState, useEffect } from 'react';
// material
import { CssBaseline } from '@mui/material';
import { /*useTheme, */ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import Context from '../Context'
//
import shape from './shape';
import { palette_light, palette_dark } from './palette';
import typography from './typography';
import componentsOverride from './overrides';
import shadows, { customShadows } from './shadows';
import * as React from 'react';
// ----------------------------------------------------------------------

ThemeConfig.propTypes = {
    children: PropTypes.node
};

export default function ThemeConfig({ children }) {
    const persistKey = 'theme';
    const [isDarkMode, setIsDarkMode] = useState(true)
    const isDarkModeKey = `${persistKey}:isDarkMode`

    const toggleThisTheme = (mode) => {
        if (mode === 'isDarkMode')
            setIsDarkMode(!isDarkMode)
    }

    useEffect(() => {
        const persistIsDarkMode = localStorage.getItem(isDarkModeKey)

        if (persistIsDarkMode) {
            // convert to boolean
            setIsDarkMode(persistIsDarkMode === 'true')
        }
    }, [isDarkModeKey])

    useEffect(() => {
        try {
            localStorage.setItem(isDarkModeKey, isDarkMode)
        } catch (error) {
            console.warn(error)
        }
    }, [isDarkMode, isDarkModeKey])

    const palette = isDarkMode ? palette_dark : palette_light;

    const themeOptions = {
        palette: { ...palette, mode: isDarkMode ? 'dark' : 'light' },
        shape,
        typography,
        shadows,
        customShadows
    };
    
    const theme = createTheme(themeOptions);
    theme.components = componentsOverride(theme);

    return (
        <StyledEngineProvider injectFirst>
            <Context.Provider
                value={{
                    isDarkMode,
                    toggleThisTheme,
                }}
                >
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    {children}
                </ThemeProvider>
            
            </Context.Provider>
        </StyledEngineProvider>
    );
}
