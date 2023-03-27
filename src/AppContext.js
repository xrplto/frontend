import { useState, createContext, useEffect } from 'react';

import { Backdrop } from "@mui/material";

// Redux
import { Provider } from "react-redux";
import {configureRedux} from "src/redux/statusSlice";

// Loader
import { PuffLoader } from "react-spinners";

export const AppContext = createContext({});

export function ContextProvider({ children, data, openSnackbar }) {
    const [sync, setSync] = useState(0);
    const [loading, setLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [accountProfile, setAccountProfile] = useState(null);
    const [profiles, setProfiles] = useState([]);

    const [store, setStore] = useState(configureRedux(data));

    const KEY_ACCOUNT_PROFILE = "account_profile_2";
    const KEY_ACCOUNT_PROFILES = "account_profiles_2";

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
        const profile = window.localStorage.getItem(KEY_ACCOUNT_PROFILE);
        //const profile = '{"account":"rDsRQWRTRrtzAgK8HH7rcCAZnWeCsJm28K","uuid":"4a3eb58c-aa97-4d48-9ab2-92d90df9a75f"}';
        if (profile) {
            setAccountProfile(JSON.parse(profile));
        }

        const profiles = window.localStorage.getItem(KEY_ACCOUNT_PROFILES);
        if (profiles) {
            setProfiles(JSON.parse(profiles));
        }
    }, [])

    const setActiveProfile = (account) => {
        const profile = profiles.find(x => x.account === account);
        if (!profile) return;
        setAccountProfile(profile);
        window.localStorage.setItem(KEY_ACCOUNT_PROFILE, JSON.stringify(profile));
    };

    const doLogIn = (profile) => {
        setAccountProfile(profile);
        window.localStorage.setItem(KEY_ACCOUNT_PROFILE, JSON.stringify(profile));

        // const old = profiles.find(x => x.account === profile.account);
        let exist = false;
        const newProfiles = [];
        for (const p of profiles) {
            if (p.account === profile.account) {
                newProfiles.push(profile);
                exist = true;
            } else
                newProfiles.push(p);
        }

        if (!exist) {
            newProfiles.push(profile);
        }

        window.localStorage.setItem(KEY_ACCOUNT_PROFILES, JSON.stringify(newProfiles));
        setProfiles(newProfiles);
    };

    const doLogOut = () => {
        window.localStorage.setItem(KEY_ACCOUNT_PROFILE, JSON.stringify(null));
        window.localStorage.setItem(KEY_ACCOUNT_PROFILES, JSON.stringify([]));
        setAccountProfile(null);
        setProfiles([])
    }

    const removeProfile = (account) => {
        const newProfiles = profiles.filter(function( obj ) {
            return obj.account !== account;
        });
        window.localStorage.setItem(KEY_ACCOUNT_PROFILES, JSON.stringify(newProfiles));
        setProfiles(newProfiles);
    }

    return (
        <AppContext.Provider
            value={{ toggleTheme, darkMode, accountProfile, setActiveProfile, profiles, removeProfile, doLogIn, doLogOut, setLoading, openSnackbar, sync, setSync }}
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
