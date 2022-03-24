import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import ScrollToTop from './ScrollToTop';

import Content from "./Content";

//import { useSelector, useDispatch } from "react-redux";
//import { selectStatus } from "../../redux/statusSlice";

//import TokenDialog from "./TokenDialog";

import UserDesc from "./detail/UserDesc";
import PriceDesc from "./detail/PriceDesc";
import ExtraDesc from "./detail/ExtraDesc";
import Holders from "./detail/Holders";
import PriceChart from './detail/PriceChart';

import {
    Container,
    Grid,
    Paper,
    Toolbar,
    Typography
} from '@mui/material';

import axios from 'axios'

import Page from '../../layouts/Page';

import {
    AppCurrentSubject,
    AppConversionRates
} from './detail/app';



/*const useStyles = makeStyles((theme) => ({
    headerContainer: {
        position: "relative",
        height: "100px",
    },
    header: {
        display: "flex",
        position: "absolute",
        width: "calc(100%)",
        top: "-70px",
        alignItems: "flex-end",
        "& > *": {
            margin: `${theme.spacing(3)}px ${theme.spacing(1)}px`,
        },
    },
    spacer: {
        flexGrow: "1",
    },
    avatar: {
        border: `3px solid white`,
        width: theme.spacing(13),
        height: theme.spacing(13),
        boxShadow: theme.shadows[3],
    },
    actionGroup: {
        display: "flex",
        width: "330px",
        justifyContent: "space-between",
        marginRight: 0,
    },
    summaryCards: {
        display: "flex",
        flexWrap: "wrap",
    },
    summaryCard: {
        margin: theme.spacing(1),
        flexGrow: 1,
        padding: theme.spacing(3),
    },
    tripCard: {
        margin: theme.spacing(1),
        padding: theme.spacing(2),
    },
}));*/

export function SummaryCard({ title, value, component }) {
    //const classes = useStyles();
    return (
        <Paper elevation={2}>
            <Typography color={"textSecondary"} variant="h5" gutterBottom>
                {title}
            </Typography>
            {component || (
                <Typography color={"primary"} variant="h3">
                    {value}
                </Typography>
            )}
        </Paper>
    );
}

export default function TokenDetail(props) {
    const BASE_URL = 'https://ws.xrpl.to/api'; // 'http://localhost/api';
    const [detail, setDetail] = useState(null);
    //const [token, setToken] = useState(JSON.parse(localStorage.getItem('selectToken')));

    const { md5 } = useParams();

    //const status = useSelector(selectStatus);
    //const dispatch = useDispatch();

    useEffect(() => {
        function getDetail() {
            // https://ws.xrpl.to/api/detail/0413ca7cfc258dfaf698c02fe304e607?range=1D
            axios.get(`${BASE_URL}/detail/${md5}?range=1D`)
                .then(res => {
                    let detail = res.status === 200 ? res.data : undefined;
                    if (detail) {
                        //dispatch(update_status(status));
                        console.log(detail);
                        setDetail(detail);
                    }
                }).catch(err => {
                    console.log("error on getting details!!!", err);
                }).then(function () {
                    // always executed
                    // console.log("Heartbeat!");
                });
        }

        if (md5)
            getDetail();

    }, [md5]);

    if (!detail) {
        return (
            <Content>
                {/* <CircularProgress /> */}
            </Content>
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
        } = detail.token;

        let user = detail.token.user;
        if (!user) user = name;

        return (
            <Page title={`${user} price today, ${name} to USD live, marketcap and chart `}>
                <Toolbar id="back-to-top-anchor" />
                <Container maxWidth="xl" sx={{ mt: 4 }}>
                    <Grid item container direction="row" >
                        <Grid item xs={6} md={6} lg={3.5} sx={{borderRight: '1px solid #323546'}}>
                            <UserDesc token={detail.token} />
                        </Grid>
                        
                        <Grid item xs={6} md={6} lg={3.5} sx={{pl:3, borderRight: '1px solid #323546'}}>
                            <PriceDesc token={detail.token} />
                        </Grid>

                        <Grid item xs={12} md={12} lg={5} sx={{pl:3}}>
                            <ExtraDesc token={detail.token} />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3} sx={{p:0}}>
                        <Grid item xs={12} md={6} lg={8} sx={{pl:0}}>
                            <PriceChart detail={detail} />
                        </Grid>

                        <Grid item xs={12} md={6} lg={4}>
                            <Holders token={detail.token} />
                        </Grid>

                        <Grid item xs={12} md={6} lg={8}>
                            <AppConversionRates />
                        </Grid>

                        <Grid item xs={12} md={6} lg={4}>
                            <AppCurrentSubject />
                        </Grid>
                    </Grid>

                    {/* <div>
                      <SummaryCard title={"Holders"} value={"$" + fare} />
                      <SummaryCard title={"Offers"} value={trips} />
                      <SummaryCard title={"Market"} value={distance} />
                      <SummaryCard title={"Rating"} value={4.32} />
                    </div>
                    <div>
                      <SummaryCard title="Last 30 Days" component={<PriceLine />} />
                      <SummaryCard title="By Accounts" component={<HoldersPie />} />
                    </div>
                    <SummaryCard title={"Recent Orders"} component={<ExpensesTable />} /> */}
                </Container>
                <ScrollToTop />
            </Page>
        );
    }
}
