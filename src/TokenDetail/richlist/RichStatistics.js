// Material
import { withStyles } from '@mui/styles';
import {
    alpha, styled, useTheme,
    CardHeader,
    Stack,
    Typography,
    Table,
    TableRow,
    TableBody,
    TableCell
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";

// Components
import BearBullLabel from 'src/layouts/BearBullLabel';

// Redux
import { useSelector/*, useDispatch*/ } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Utils
import { fIntNumber, fCurrency3, fNumber } from 'src/utils/formatNumber';

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
// ----------------------------------------------------------------------

export default function RichStatistics({token, richInfo}) {
    const theme = useTheme();
    const metrics = useSelector(selectMetrics);

    const {
        id,
        name,
        amount,
        exch,
        maxMin24h,
        pro24h,
        p24h,
        vol24h,
        vol24hxrp,
        vol24hx,
        /*
        pro7d,
        p7d,
        holders,
        offers,
        issuer,
        currency,
        date,
        trustlines,*/
    } = token;

    let user = token.user;
    if (!user) user = name;

    const marketcap = amount * exch / metrics.USD;
    let voldivmarket = 0;
    if (marketcap > 0)
        voldivmarket = fNumber(vol24hx / (amount * exch));
   
    let strPc24h;
    if (p24h < 0) {
        strPc24h = fNumber(-p24h);
        strPc24h = '-$' + strPc24h;
    } else {
        strPc24h = '$' + fNumber(p24h);
    }

    return (
        <StackStyle>
            <CardHeader title={`${name} Holders Statistics`}  subheader='' sx={{p:2}}/>
            <Table sx={{
                [`& .${tableCellClasses.root}`]: {
                    borderBottom: "1px solid",
                    borderBottomColor: theme.palette.divider
                }
            }}>
                <TableBody>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle2" noWrap >Total Addresses</Label></TableCell>
                        <TableCell align="left">{fIntNumber(richInfo.length)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >Active Addresses<span style={badge24hStyle}>24h</span></Label></TableCell>
                        <TableCell align="left">{fIntNumber(richInfo.active24H)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >Top 10 Holders</Label></TableCell>
                        <TableCell align="left">{richInfo.top10.toFixed(2)}%</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >Top 20 Holders</Label></TableCell>
                        <TableCell align="left">{richInfo.top20.toFixed(2)}%</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >Top 50 Holders</Label></TableCell>
                        <TableCell align="left">{richInfo.top50.toFixed(2)}%</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left"><Label variant="subtitle1" noWrap >Top 100 Holders</Label></TableCell>
                        <TableCell align="left">{richInfo.top100.toFixed(2)}%</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </StackStyle>
    );
}
