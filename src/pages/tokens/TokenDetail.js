import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

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
import RevenueLine from "./RevenueLine";
import PeopleDialog from "./PeopleDialog";

import {
    Avatar,
    Button,
    Chip,
    Paper,
    Rating,
    Typography,
    CircularProgress
} from '@mui/material';

const useStyles = makeStyles((theme) => ({
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
}));

export function SummaryCard({ title, value, component }) {
  const classes = useStyles();
  return (
    <Paper elevation={2} className={classes.summaryCard}>
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

export default function TokenDetail({ id }) {
  let token = { name: "Solo", id: 3, img: "/static/tokens/SOLO.jpg" };
  
  const classes = useStyles();
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
    <Content>
      <div
        style={{
          height: "200px",
          backgroundPosition: "center",
          backgroundSize: "cover",
          filter: "contrast(75%)",
          backgroundImage: "url(/static/crypto2.jpg)",
        }}
      />
      <div className={classes.headerContainer}>
        <div className={classes.header}>
          <Avatar
            alt={token.name}
            src={token.img}
            classes={{ root: classes.avatar, circle: classes.circle }}
          />
          <Typography variant={"h5"}>{token.name}</Typography>
          <Chip variant={"outlined"} icon={<TokenIcon />} label="Token" />
          <Rating name="read-only" value={4.3} readOnly />
          <div className={classes.spacer} />
          <div className={classes.actionGroup}>
            <PeopleDialog
              data={token}
              render={(open) => (
                <Button
                  color="primary"
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={open}
                >
                  Edit
                </Button>
              )}
            />
            <Button variant="outlined" startIcon={<DeleteIcon />}>
              Delete
            </Button>
          </div>
        </div>
      </div>
      <div className={classes.summaryCards}>
        <SummaryCard title={"Revenue"} value={"$" + fare} />
        <SummaryCard title={"Trips"} value={trips} />
        <SummaryCard title={"Miles"} value={distance} />
        <SummaryCard title={"Rating"} value={4.32} />
      </div>
      <div className={classes.summaryCards}>
        <SummaryCard title="Last 30 Days" component={<RevenueLine />} />
        <SummaryCard title="By Vehicle" component={<HoldersPie />} />
      </div>
      <SummaryCard title={"Recent expenses"} component={<ExpensesTable />} />
    </Content>
  );
}
