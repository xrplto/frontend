// material
import { withStyles } from '@mui/styles';
import { alpha, styled } from '@mui/material/styles';
import {
    CardHeader,
    Stack,
    Typography,
    Table,
    TableRow,
    TableBody,
    TableCell
} from '@mui/material';
// ----------------------------------------------------------------------
// utils
import { fCurrency5, fNumber, fPercent, fCurrency51 } from '../../utils/formatNumber';
// ----------------------------------------------------------------------
// Redux
import { useSelector/*, useDispatch*/ } from "react-redux";
import { selectStatus } from "../../redux/statusSlice";
// ----------------------------------------------------------------------
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

const HighTypography = withStyles({
    root: {
        color: "#FF6C40"
    }
})(Typography);

const LowTypography = withStyles({
    root: {
        color: "#54D62C"
    }
})(Typography);

const BearishTypography = withStyles({
    root: {
        color: "#FF6C40"
    }
})(Typography);

const BullishTypography = withStyles({
    root: {
        color: "#54D62C"
    }
})(Typography);
// ----------------------------------------------------------------------

export default function PriceStatistics({token}) {
    const status = useSelector(selectStatus);

    const {
        id,
        name,
        amt,
        exch,
        maxmin24h,
        p24h,
        /*
        p7d,
        holders,
        offers,
        acct,
        code,
        date,
        trline,*/
    } = token;

    let user = token.user;
    if (!user) user = name;

    const marketcap = fNumber(amt * exch / status.USD);
    
    const pro24 = fPercent(p24h[0]);
    let strPro24h = 0;
    if (pro24 < 0) {
        strPro24h = -pro24;
        strPro24h = '-' + strPro24h + '%';
    } else {
        strPro24h = '+' + pro24 + '%';
    }

    const pc24 = p24h[1];
    let strPc24h;
    if (pc24 < 0) {
        strPc24h = fNumber(-pc24);
        strPc24h = '-$' + strPc24h;
    } else {
        strPc24h = '$' + fNumber(pc24);
    }

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
                        <TableCell align="left">${fCurrency5(exch / status.USD)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >Price Change<span style={badge24hStyle}>24h</span></Label></TableCell>
                        <TableCell align="left">
                            <Stack>
                            {strPc24h}
                            {pro24 < 0 ? (
                                <BearishTypography variant="subtitle2" noWrap>
                                    {strPro24h}
                                </BearishTypography>
                            ) : (
                                <BullishTypography variant="subtitle2" noWrap>
                                    {strPro24h}
                                </BullishTypography>
                            )}
                            </Stack>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >24h Low / 24h High</Label></TableCell>
                        <TableCell align="left">
                            <Typography variant="subtitle2">${fCurrency5(maxmin24h[1])} / ${fCurrency5(maxmin24h[0])}</Typography>
                        </TableCell>
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
