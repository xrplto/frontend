import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";

import Content from "./Content";

//import { useSelector, useDispatch } from "react-redux";
//import { selectStatus } from "../../redux/statusSlice";

//import TokenDialog from "./TokenDialog";

import UserDesc from "./detail/UserDesc";
import PriceDesc from "./detail/PriceDesc";
import ExtraDesc from "./detail/ExtraDesc";
import Graph from "./detail/Graph";

import {
    Container,
    Divider,
    Paper,
    Stack,
    Typography
} from '@mui/material';

import axios from 'axios'

import Page from '../../components/Page';

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
            axios.get(`${BASE_URL}/detail/${md5}`)
            .then(res => {
                let detail = res.status===200?res.data:undefined;
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
    
        let user = detail.user;
        if (!user) user = name;

        return (
            <Page title={user + ' price today'}>
                <Container maxWidth="xl" sx={{mt:5}}>
                    <Stack direction="row" spacing={5} sx={{mt:2}}>
                      <UserDesc token={detail.token}  />

                      <Divider orientation="vertical" variant="middle" flexItem />
                      
                      <PriceDesc token={detail.token} />

                      <Divider orientation="vertical" variant="middle" flexItem />

                      <ExtraDesc token={detail.token} />

                    </Stack>
                    <Graph detail={detail}/>
                  
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
            </Page>
        );
    }
}
