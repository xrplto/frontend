import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from "react-router-dom";
import ScrollToTop from '../layouts/ScrollToTop';
import TopMark from '../layouts/TopMark';

import UserDesc from "./details/UserDesc";
import PriceDesc from "./details/PriceDesc";
import LinkDesc from "./details/LinkDesc";
import ExtraDesc from "./details/ExtraDesc";
import PriceChart from './details/PriceChart';
import PriceStatistics from './details/PriceStatistics';
import Description from './details/Description';

import {
    Container,
    Divider,
    Grid
} from '@mui/material';

// ----------------------------------------------------------------------
import axios from 'axios'
import { useDispatch } from "react-redux";
import { update_status } from "../redux/statusSlice";
// ----------------------------------------------------------------------

import Page from '../layouts/Page';

export default function Detail(props) {
    const BASE_URL = 'https://ws.xrpl.to/api'; // 'http://localhost/api';
    const [history, setHistory] = useState([]);
    const [range, setRange] = useState('1D');
    const [token, setToken] = useState(null); // JSON.parse(localStorage.getItem('selectToken')));
    const [searchParams, setSearchParams] = useSearchParams();

    const { md5 } = useParams();
       
    const id = searchParams.get("id");
    const sort = searchParams.get("sort");

    //const status = useSelector(selectStatus);
    const dispatch = useDispatch();

    useEffect(() => {
        function getDetail() {
            // https://ws.xrpl.to/api/detail/0413ca7cfc258dfaf698c02fe304e607?range=1D
            axios.get(`${BASE_URL}/detail/${md5}?range=${range}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        const status = {
                            session: 0,
                            USD: ret.exch.USD,
                            EUR: ret.exch.EUR,
                            JPY: ret.exch.JPY,
                            CNY: ret.exch.CNY,
                            token_count: ret.token_count
                        };
                        dispatch(update_status(status));
                        setHistory(ret.history);
                        setToken(ret.token);
                    }
                }).catch(err => {
                    console.log("error on getting details!!!", err);
                }).then(function () {
                    // always executed
                });
        }
        if (md5)
            getDetail();

    }, [md5, range, dispatch]);

    if (!token) {
        return (
            <>
                {/* <CircularProgress /> */}
            </>
        );
    } else {
        const {
            name,
            /*id,
            acct,
            code,
            date,
            amt,
            trline,
            holders,
            offers,
            exch*/
        } = token;

        let user = token.user;
        if (!user) user = name;

        // sx={{borderRight: '1px solid #323546'}}
        return (
            <Page title={`${user} price today, ${name} to USD live, marketcap and chart `}>
                <TopMark md5={md5}/>
                <Container maxWidth="xl">
                    <Grid item container direction="row" >
                        <Grid item xs={5} md={6} lg={5} sx={{ mt: 3 }}>
                            <UserDesc token={token} id={id} sort={sort} />
                        </Grid>
                        
                        <Grid item xs={7} md={6} lg={7} sx={{ mt: 3 }}>
                            <PriceDesc token={token} />
                        </Grid>

                        <Grid item xs={12} md={12} lg={5} sx={{ mt: 2 }}>
                            <LinkDesc token={token} />
                        </Grid>

                        <Grid item xs={12} md={12} lg={7} sx={{ mt: 2 }}>
                            <ExtraDesc token={token} />
                        </Grid>
                    </Grid>

                    <Divider orientation="horizontal" sx={{mt:2,mb:2}} variant="middle" flexItem />

                    <Grid container spacing={3} sx={{p:0}}>
                        <Grid item xs={12} md={6} lg={8} sx={{pl:0}}>
                            <PriceChart history={history} token={token} range={range} setRange={setRange} />
                        </Grid>

                        <Grid item xs={12} md={6} lg={4}>
                            {/* <Holders token={token} /> */}
                            <PriceStatistics token={token} />
                        </Grid>

                        <Grid item xs={12} md={6} lg={8}>
                            <Description token={token} />
                        </Grid>

                        {/* <Grid item xs={12} md={6} lg={4}>
                            <RadialChart />
                        </Grid> */}
                    </Grid>
                </Container>
                <ScrollToTop />
            </Page>
        );
    }
}
