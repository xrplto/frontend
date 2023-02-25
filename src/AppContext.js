import { useState, createContext, useEffect } from 'react';

import { Backdrop } from "@mui/material";

// Redux
import { Provider } from "react-redux";
import {configureRedux} from "src/redux/statusSlice";

// Loader
import { PuffLoader } from "react-spinners";

export const AppContext = createContext({});

export function ContextProvider({ children, data, openSnackbar }) {
    const [loading, setLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [accountProfile, _setAccountProfile] = useState(null);

    const store = configureRedux(data);

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
        const profile = window.localStorage.getItem('accountProfile1');
        //const profile = '{"account":"rDsRQWRTRrtzAgK8HH7rcCAZnWeCsJm28K","uuid":"4a3eb58c-aa97-4d48-9ab2-92d90df9a75f"}';
        if (profile) {
            _setAccountProfile(JSON.parse(profile));
        }
    }, [])

    const setAccountProfile = (profile) => {
        window.localStorage.setItem('accountProfile1', JSON.stringify(profile));
        _setAccountProfile(profile);
    };

    return (
        <AppContext.Provider
            value={{ toggleTheme, darkMode, accountProfile, setAccountProfile, setLoading, openSnackbar }}
        >
            
            <Backdrop
                sx={{ color: "#000", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loading}
            >
                <PuffLoader color={"#00AB55"} size={50} />
            </Backdrop>
            
            <Provider store={store}>
                {children}
            </Provider>
        </AppContext.Provider>
    );
}
