import React from "react";
import { useParams, useLocation } from "react-router-dom";

import Content from "./Content";

import { makeStyles } from "@mui/styles";
import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';
import { withStyles } from '@mui/styles';
import { fCurrency5, fNumber } from '../../utils/formatNumber';
import {
    Token as TokenIcon,
    Delete as DeleteIcon,
    Edit as EditIcon
} from '@mui/icons-material';

import { Icon } from '@iconify/react';
import linkChain from '@iconify/icons-akar-icons/link-chain';
import link45deg from '@iconify/icons-bi/link-45deg';
import chatIcon from '@iconify/icons-bi/chat';
import linkExternal from '@iconify/icons-charm/link-external';
import zoomIcon from '@iconify/icons-cil/zoom';
import codeIcon from '@iconify/icons-bytesize/code';
import personFill from '@iconify/icons-bi/person-fill';
import downOutlined from '@iconify/icons-ant-design/down-outlined';
import caretDown from '@iconify/icons-bx/caret-down';
import caretUp from '@iconify/icons-bx/caret-up';

import { useSelector, useDispatch } from "react-redux";
import { selectStatus } from "../../redux/statusSlice";


//import { selectPeople } from "../ReduxTable/peopleSlice";
import ExpensesTable from "./ExpensesTable";

import Dashboard from "./Dashboard";
import TokenDialog from "./TokenDialog";

import {
    Avatar,
    Button,
    Box,
    Chip,
    Container,
    Divider,
    Paper,
    Rating,
    Stack,
    Typography,
    CircularProgress
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

const BearishChip = withStyles({
  root: {
    backgroundColor: "#B72136"
  }
})(Chip);

const BullishChip = withStyles({
  root: {
    backgroundColor: "#007B55"
  }
})(Chip);

const ActionButton = withStyles({
  root: {
    backgroundColor: "#007B55"
  }
})(Button);

const HoldersTypography = withStyles({
  root: {
  color: "#3366FF"
  }
}) (Typography);

const OffersTypography = withStyles({
  root: {
  color: "#FF6C40"
  }
})(Typography);

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
    const [value, setValue] = React.useState(2);

    const BASE_URL = 'https://ws.xrpl.to/api'; // 'http://localhost/api';

    const token = JSON.parse(localStorage.getItem('selectToken'));
    //const { md5 } = useParams();
    const EXCH = useSelector(selectStatus);

    const {
      id,
      acct,
      name,
      code,
      date,
      amt,
      trline,
      holders,
      offers,
      md5,
      pro7d,
      pro24h,
      price} = token;

      const imgUrl = `/static/tokens/${name}.jpg`;
    
    let user = token.user;
    if (!user) user = token.name;

    let strPro7d = 0;
    if (pro7d < 0) {
      strPro7d = -pro7d;
      strPro7d = strPro7d + ' %';
    } else {
      strPro7d = pro7d + ' %';
    }

    let strPro24h = 0;
    if (pro24h < 0) {
      strPro24h = -pro24h;
      strPro24h = strPro24h + ' %';
    } else {
      strPro24h = pro24h + ' %';
    }

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
    const handleDelete = () => {
    }

    return (
        <Page title={user + ' price today'}>
          <Container maxWidth="xl" sx={{mt:5}}>
          <Stack direction="row" spacing={5} sx={{mt:2}}>
            <Stack sx={{mt:1}}>
              <Stack direction="row" spacing={1} alignItems='center'>
                <Avatar
                  alt={user}
                  src={imgUrl}
                  sx={{ width: 56, height: 56 }}
                />
                <Stack spacing={0.2}>
                  <Typography variant={"h4"}>{user}</Typography>
                  <Rating
                    name="simple-controlled"
                    value={value}
                    onChange={(event, newValue) => {
                      setValue(newValue);
                    }}
                  />
                </Stack>
                <Chip variant={"outlined"} icon={<TokenIcon />} label={name} />
              </Stack>
              <Stack direction="row" spacing={1} sx={{mt:2}}>
                <Chip label={'Rank #' + id} color="primary" size="small"/>
                <Chip label="Token" color="success" size="small"/>
                <Chip label="On 3,634,131 watchlists" color="secondary" size="small"/>
              </Stack>
              <Stack direction="row" spacing={1} sx={{mt:5}}>
                <Chip label="www.sologenic.com"
                    deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                    onDelete={handleDelete} onClick={handleDelete}
                    icon={<Icon icon={link45deg} width="16" height="16" />} />
                <Chip label="Explorers"
                    deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                    onDelete={handleDelete} onClick={handleDelete}
                    icon={<Icon icon={zoomIcon} width="16" height="16" />} />
                <Chip label="Chat"
                    deleteIcon={<Icon icon={downOutlined} width="16" height="16"/>}
                    onDelete={handleDelete} onClick={handleDelete}
                    icon={<Icon icon={chatIcon} width="16" height="16" />} />
              </Stack>
              <Stack direction="row" spacing={1} sx={{mt:1}}>
                <Chip label="Source code"
                    deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                    onDelete={handleDelete} onClick={handleDelete}
                    icon={<Icon icon={codeIcon} width="16" height="16" />} />
                <Chip label="Community"
                    deleteIcon={<Icon icon={downOutlined} width="16" height="16"/>}
                    onDelete={handleDelete} onClick={handleDelete}
                    icon={<Icon icon={personFill} width="16" height="16" />} />
              </Stack>
            </Stack>
            <Divider orientation="vertical" variant="middle" flexItem />
            <Stack>
              <Stack direction="row" spacing={2}>
                <Typography variant="subtitle1">{user} Price ({name})</Typography>
                <Chip size="small" variant={"outlined"} icon={<Avatar sx={{ width: 24, height: 24 }} alt="xumm" src="/static/sponsor.png"/>} label='Sponsored' />
              </Stack>
              <Stack direction="row" spacing={2} sx={{mt:1}} alignItems='center'>
                <Stack>
                  <Typography variant="h3" noWrap>
                    $ {fCurrency5(price / EXCH.USD)}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                  <Typography variant="subtitle1">
                  {fCurrency5(price)} XRP
                  </Typography>
                    {pro24h < 0 ? (
                        <BearishChip
                            icon={<Icon icon={caretDown} width="16" height="16" />}
                            size="small"
                            label={<Typography variant="subtitle2">{strPro24h}</Typography>}
                            variant="h3" />
                    ) : (
                        <BullishChip 
                            icon={<Icon icon={caretUp} width="16" height="16" />}
                            size="small"
                            label={<Typography variant="subtitle2">{strPro24h}</Typography>}
                            variant="h3" />
                    )}
                    {pro7d < 0 ? (
                        <BearishChip
                            icon={<Icon icon={caretDown} width="16" height="16" />}
                            size="small"
                            label={<Typography variant="subtitle2">{strPro7d}</Typography>}
                            variant="h3" />
                    ) : (
                        <BullishChip 
                            icon={<Icon icon={caretUp} width="16" height="16" />}
                            size="small"
                            label={<Typography variant="subtitle2">{strPro7d}</Typography>}
                            variant="h3" />
                    )}
                  </Stack>
                </Stack>
              </Stack>
              <Box
                component="img"
                alt=""
                sx={{ maxWidth:'none', width: 270, height: 100, mt: 2 }}
                src={`${BASE_URL}/sparkline/${md5}`}
              />
            </Stack>

            <Divider orientation="vertical" variant="middle" flexItem />

            <Stack spacing={5}>
              <Stack direction="row" spacing={1} alignItems='start' justify="top">
                <ActionButton variant="contained" endIcon={<Icon icon={caretDown} width="16" height="16" />}>
                  Buy
                </ActionButton>
                <ActionButton variant="contained" endIcon={<Icon icon={caretDown} width="16" height="16" />}>
                  Exchange
                </ActionButton>
                <ActionButton variant="contained" endIcon={<Icon icon={caretDown} width="16" height="16" />}>
                  Gaming
                </ActionButton>
                <ActionButton variant="contained" endIcon={<Icon icon={caretDown} width="16" height="16" />}>
                  Earn Crypto
                </ActionButton>
              </Stack>
              <Divider orientation="horizontal" variant="middle" flexItem />
              <Stack direction="row" spacing={5}>
                <Stack spacing={1} alignItems='center'>
                  <Typography variant="h6">
                    Holders
                  </Typography>
                  <HoldersTypography variant="h5">
                  {fNumber(holders)}
                  </HoldersTypography>
                </Stack>
                <Stack spacing={1} alignItems='center'>
                  <Typography variant="h6">
                    Offers
                  </Typography>
                  <OffersTypography variant="h5">
                  {fNumber(offers)}
                  </OffersTypography>
                </Stack>
              </Stack>
            </Stack>
            

          </Stack>
          <Dashboard/>
          
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
