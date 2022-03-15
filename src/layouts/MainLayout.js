import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
// material
import { alpha, styled } from '@mui/material/styles';
import { AppBar } from '@mui/material';
//
import Topbar from './Topbar';
import Navbar from './Navbar';
import axios from 'axios'

import { useSelector, useDispatch } from "react-redux";
import { update_status, selectStatus, selectLoading } from "../redux/statusSlice";
import { update_tokens, selectTokens } from "../redux/tokenSlice";
// ----------------------------------------------------------------------
const APP_BAR_DESKTOP = 92;

const RootStyle = styled('div')({
  display: 'flex',
  minHeight: '100%',
  overflow: 'hidden'
});

const MainStyle = styled('div')(({ theme }) => ({
    flexGrow: 1,
    overflow: 'auto',
    minHeight: '100%',
    paddingTop: APP_BAR_DESKTOP + 24,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(10)
}));

const AppBarStyle = styled(AppBar)(({ theme }) => ({
    boxShadow: 'none',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    backgroundColor: alpha(theme.palette.background.paper, 0.0),
    borderRadius: '0px',
    color: theme.palette.text.primary
    //backgroundColor: alpha("#00AB88", 0.7),
}));

// ----------------------------------------------------------------------
export default function MainLayout() {
    const BASE_URL = 'https://ws.xrpl.to/api'; // 'http://localhost/api';

    const dispatch = useDispatch();
    //const status = useSelector(selectStatus);
    //console.log(status);

    useEffect(() => {
        function getStatus() {
            axios.get(`${BASE_URL}/status`)
            .then(res => {
                let status = res.status===200?res.data:undefined;
                if (status) {
                    dispatch(update_status(status));
                    console.log(status.USD);
                }
            }).catch(err => {
                console.log("error on getting exchange rates!!!", err);
            }).then(function () {
                // always executed
                // console.log("Heartbeat!");
            });
        }

        getStatus();

        const timer = setInterval(() => getStatus(), 5000)

        return () => {
            console.log("kill timer");
            clearInterval(timer);
        }
    }, []);

    return (
        <RootStyle>
            <AppBarStyle>
                <Topbar />
                <Navbar />
            </AppBarStyle>
            <MainStyle>
                <Outlet />
            </MainStyle>
        </RootStyle>
    );
}
