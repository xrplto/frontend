import { useState, createContext, useEffect } from 'react';

export const AppContext = createContext({});

export function ContextProvider({ children }) {
    const [sidebarToggle, setSidebarToggle] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [accountProfile, _setAccountProfile] = useState(null);

    const toggleSidebar = () => {
        setSidebarToggle(!sidebarToggle);
    };

    const closeSidebar = () => {
        setSidebarToggle(false);
    };

    const toggleTheme = () => {
        window.localStorage.setItem('appTheme', !darkMode);
        setDarkMode(!darkMode);
    }

    useEffect(() => {
        const isDarkMode = window.localStorage.getItem('appTheme');
        if (isDarkMode) {
            // convert to boolean
            setDarkMode(isDarkMode === 'true')
        }
    }, []);

    useEffect(() => {
        const profile = window.localStorage.getItem('accountProfile');
        //const profile = '{"account":"rDsRQWRTRrtzAgK8HH7rcCAZnWeCsJm28K","uuid":"4a3eb58c-aa97-4d48-9ab2-92d90df9a75f"}';
       if (profile) {
            _setAccountProfile(JSON.parse(profile));
        }
    }, [])

    const setAccountProfile = (profile) => {
        window.localStorage.setItem('accountProfile', JSON.stringify(profile));
        _setAccountProfile(profile);
    };

    return (
        <AppContext.Provider
          value={{ sidebarToggle, toggleSidebar, closeSidebar, toggleTheme, darkMode, accountProfile, setAccountProfile }}
        >
            {children}
        </AppContext.Provider>
    );
}
