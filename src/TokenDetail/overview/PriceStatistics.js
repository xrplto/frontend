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
import BearBullLabel from './BearBullLabel';

// Redux
import { useSelector/*, useDispatch*/ } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Utils
import { fNumber } from 'src/utils/formatNumber';

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
            <CardHeader title={`${name} Price Statistics`} subheader='' sx={{p:2}}/>
            <Table sx={{
                [`& .${tableCellClasses.root}`]: {
                    borderBottom: "1px solid",
                    borderBottomColor: theme.palette.divider
                }
            }}>
                <TableBody>
                    <TableRow>
                        <TableCell align="left" sx={{pr:0}}><Typography variant="label1" noWrap >{user} Price Today</Typography></TableCell>
                        <TableCell align="left"></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left" sx={{pr:0}}><Typography variant="label1" noWrap >{user} Price</Typography></TableCell>
                        <TableCell align="left">${fNumber(exch / metrics.USD)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left" sx={{pr:0}}><Typography variant="label1" noWrap >Price Change<span style={badge24hStyle}>24h</span></Typography></TableCell>
                        <TableCell align="left">
                            <Stack>
                            {strPc24h}
                            <BearBullLabel value={pro24h} variant="small"/>
                            </Stack>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left" sx={{pr:0}}><Typography variant="label1" noWrap >24h Low / 24h High</Typography></TableCell>
                        <TableCell align="left">
                            ${fNumber(maxMin24h[1])} / ${fNumber(maxMin24h[0])}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left" sx={{pr:0}}><Typography variant="label1" noWrap >Trading Volume<span style={badge24hStyle}>24h</span></Typography></TableCell>
                        <TableCell align="left">${fNumber(vol24hxrp / metrics.USD)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left" sx={{pr:0}}><Typography variant="label1" noWrap >Volume / Market Cap</Typography></TableCell>
                        <TableCell align="left">{voldivmarket}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left" sx={{pr:0}}><Typography variant="label1" noWrap >Market Dominance</Typography></TableCell>
                        <TableCell align="left">No Data</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left" sx={{pr:0}}><Typography variant="label1" noWrap >Market Rank</Typography></TableCell>
                        <TableCell align="left">{'#' + id}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left" sx={{pr:0}}><Typography variant="label1" noWrap >Market Cap</Typography></TableCell>
                        <TableCell align="left">$ {fNumber(marketcap)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </StackStyle>
    );
}
