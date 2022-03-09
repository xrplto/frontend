import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
// material
import { alpha, styled } from '@mui/material/styles';
import { Box, Stack, AppBar, Toolbar, IconButton } from '@mui/material';
//
import Pricebar from './Pricebar';
import Navbar from './Navbar';
import axios from 'axios'
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
    //backgroundColor: alpha("#00AB88", 0.7),
}));

// ----------------------------------------------------------------------
export default function MainLayout() {
    const BASE_URL = 'https://ws.xrpl.to/api'; // 'http://localhost/api';

    const [exch_usd, setUSD] = useState(100);
    const [exch_eur, setEUR] = useState(100); 
    const [exch_jpy, setJPY] = useState(100);
    const [exch_cny, setCNY] = useState(100);

    useEffect(() => {
        function getExchangeRate() {
            axios.get(`${BASE_URL}/exchangerate`)
            .then(res => {
                const rates = res.status===200?res.data:undefined;
                if (rates) {
                    //i++;
                    //setUSD(i);
                    //console.log(i);
                    setUSD(rates.USD);
                    setEUR(rates.EUR);
                    setJPY(rates.JPY);
                    setCNY(rates.CNY);
                    console.log(rates.USD);
                }
            }).catch(err => {
                console.log("error on getting exchange rates!!!", err);
            }).then(function () {
                // always executed
                // console.log("Heartbeat!");
            });
        }

        getExchangeRate();

        const timer = setInterval(() => getExchangeRate(), 5000)

        return () => {
            clearInterval(timer);
        }
    }, []);

    return (
        <RootStyle>
            <AppBarStyle>
                <Pricebar />
                <Navbar />
            </AppBarStyle>
            <MainStyle>
                <Outlet />
            </MainStyle>
        </RootStyle>
    );
}
