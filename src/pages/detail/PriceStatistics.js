import { merge } from 'lodash';
import ReactApexChart from 'react-apexcharts';
// material
import { useTheme, styled, alpha } from '@mui/material/styles';
import { CardHeader } from '@mui/material';
// utils
import { fCurrency5, fNumber } from '../../utils/formatNumber';
//
//import ChartOptions from './ChartOptions';
import { withStyles } from '@mui/styles';

import {
    Button,
    Box,
    Card,
    Chip,
    Divider,
    Stack,
    Typography,
    Table,
    TableRow,
    TableBody,
    TableCell,
    Tooltip
} from '@mui/material';

import { useSelector/*, useDispatch*/ } from "react-redux";
import { selectStatus } from "../../redux/statusSlice";
// ----------------------------------------------------------------------
const RootStyle = styled(Card)(({ theme }) => ({
    boxShadow: 'none',
    textAlign: 'center',
    padding: theme.spacing(5, 0),
    color: theme.palette.warning.darker,
    backgroundColor: theme.palette.warning.lighter
}));

const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    //backgroundColor: alpha(theme.palette.background.default, 0.0),
    borderRadius: '13px',
    padding: '0em 0.5em 1.5em 0.5em',
    backgroundColor: alpha("#919EAB", 0.03),
}));

const Label = withStyles({
    root: {
        color: alpha('#637381', 0.99)
    }
})(Typography);

const badge24hStyle = {
    display: 'inline-block',
    marginLeft: '4px',
    color: '#C4CDD5',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '18px',
    backgroundColor: '#323546',
    borderRadius: '4px',
    padding: '2px 4px'
};
// ----------------------------------------------------------------------

export default function PriceStatistics({token}) {
    const theme = useTheme();
    const status = useSelector(selectStatus);

    const {
        name,
        holders,
        offers,
        id,
        acct,
        code,
        date,
        amt,
        trline,
        exch
    } = token;

    let user = token.user;
    if (!user) user = name;

    const marketcap = fNumber(amt * exch / status.USD);

    return (
        <StackStyle>
            <CardHeader title={`${name} Price Statistics`}  subheader='' sx={{p:2}}/>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle2" noWrap >{user} Price Today</Label></TableCell>
                        <TableCell align="left"></TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell align="left"><Label variant="subtitle1" noWrap >{user} Price</Label></TableCell>
                        <TableCell align="left">$ {fCurrency5(exch / status.USD)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >Price Change<span style={badge24hStyle}>24h</span></Label></TableCell>
                        <TableCell align="left">{0}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >24h Low / 24h High</Label></TableCell>
                        <TableCell align="left">{0} / {0}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >Trading Volume<span style={badge24hStyle}>24h</span></Label></TableCell>
                        <TableCell align="left">{0}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >Volume / Market Cap</Label></TableCell>
                        <TableCell align="left">{0}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >Market Dominance</Label></TableCell>
                        <TableCell align="left">No Data</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >Market Rank</Label></TableCell>
                        <TableCell align="left">{'#' + id}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >Market Cap</Label></TableCell>
                        <TableCell align="left">$ {marketcap}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            {/* <ReactApexChart type="pie" series={CHART_DATA} options={chartOptions} height={280} /> */}
        </StackStyle>
    );
}
