import React from "react";
import { useParams, useLocation } from "react-router-dom";

import Content from "./Content";

import { makeStyles } from "@mui/styles";
import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';
import {
    Token as TokenIcon,
    Delete as DeleteIcon,
    Edit as EditIcon
} from '@mui/icons-material';


//import { selectPeople } from "../ReduxTable/peopleSlice";
import ExpensesTable from "./ExpensesTable";

import HoldersPie from "./HoldersPie";
import PriceLine from "./PriceLine";
import TokenDialog from "./TokenDialog";

import {
    Avatar,
    Button,
    Chip,
    Paper,
    Rating,
    Stack,
    Typography,
    CircularProgress
} from '@mui/material';

import axios from 'axios'

import Page from '../../components/Page';

import { useSelector, useDispatch } from "react-redux";
import { selectContent } from "../../redux/tokenSlice";

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
    let token = { name: "Solo", id: 3, img: "/static/tokens/SOLO.jpg" };
    const { md5 } = useParams();
    const { state } = useLocation();
    console.log("state " + JSON.stringify(state));
    console.log(JSON.stringify(props));

    //const token = useSelector(selectContent).tokens.find(token => token.md5 === md5);
    //const token = useSelector(selectTokens)[id-1];
    //console.log(token);
    const loading = false;

    if (loading) {
        return (
            <Content>
                <CircularProgress />
            </Content>
        );
    }

    const trips = 4;
    const distance = 0;
    const fare = 0;
    return (
        <Page title={token.name + ' price today'}>
          <Stack direction="row" spacing={1} sx={{mt:2}} alignItems='center'>
            <Avatar
              alt={token.name}
              src={token.img}
            />
            <Typography variant={"h3"}>{token.name}</Typography>
            <Chip variant={"outlined"} icon={<TokenIcon />} label="Token" />
            <Rating name="read-only" value={4.3} readOnly />
          </Stack>
            <div>
              <SummaryCard title={"Holders"} value={"$" + fare} />
              <SummaryCard title={"Offers"} value={trips} />
              <SummaryCard title={"Market"} value={distance} />
              <SummaryCard title={"Rating"} value={4.32} />
            </div>
            <div>
              <SummaryCard title="Last 30 Days" component={<PriceLine />} />
              <SummaryCard title="By Accounts" component={<HoldersPie />} />
            </div>
            <SummaryCard title={"Recent Orders"} component={<ExpensesTable />} />
        </Page>
    );
}
