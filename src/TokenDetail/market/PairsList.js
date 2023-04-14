// Material
import {
    styled, useTheme,
    Avatar,
    Box,
    IconButton,
    Link,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";

// Iconify
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// ----------------------------------------------------------------------
const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    //backdropFilter: 'blur(2px)',
    //WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    //backgroundColor: alpha(theme.palette.background.default, 0.0),
    // borderRadius: '1px',
    // border: '1px solid #323546',
    //padding: '0em 0.5em 1.5em 0.5em',
    //backgroundColor: alpha("#919EAB", 0.03),
}));

// ----------------------------------------------------------------------

const badge24hStyle = {
    display: 'inline-block',
    marginLeft: '4px',
    marginRight: '4px',
    color: '#C4CDD5',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '18px',
    //backgroundColor: '#323546',
    borderRadius: '4px',
    border: '1px solid #323546',
    padding: '1px 4px'
};

const badgeDEXStyle = {
    display: 'inline-block',
    marginLeft: '4px',
    marginRight: '4px',
    color: '#C4CDD5',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '18px',
    // backgroundColor: '#7A0C2E',
    borderRadius: '4px',
    border: '1px solid #B78103',
    padding: '1px 4px'
};

function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

export default function PairsList({token, pairs}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const theme = useTheme();
    // const {
    //     issuer,
    //     currency,
    //     md5
    // } = token;
    // https://api.xrpl.to/api/pairs?md5=0413ca7cfc258dfaf698c02fe304e607
    return (
        <StackStyle>
            <Typography variant="h5" sx={{ pl: 2, pt: 2 }}>Pairs<span style={badge24hStyle}>24h</span></Typography>
            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    py: 1,
                    overflow: "auto",
                    width: "100%",
                    "& > *": {
                        scrollSnapAlign: "center",
                    },
                    "::-webkit-scrollbar": { display: "none" },
                }}
            >
                <Table stickyHeader sx={{
                    [`& .${tableCellClasses.root}`]: {
                        borderBottom: "0px solid",
                        borderBottomColor: theme.palette.divider
                    }
                }}>
                    <TableHead>
                        <TableRow>
                            <TableCell align="left">#</TableCell>
                            <TableCell align="left">Pair</TableCell>
                            <TableCell align="left">Domain</TableCell>
                            <TableCell align="left">Last 7 Days</TableCell>
                            <TableCell align="left">Volume<span style={badge24hStyle}>24h</span></TableCell>
                            <TableCell align="left">Trades</TableCell>
                            <TableCell align="left">Issuer</TableCell>
                            <TableCell align="left"><span style={badgeDEXStyle}>DEX</span></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {
                        // exchs.slice(page * rows, page * rows + rows)
                        pairs.map((row) => {
                            const {
                                id,
                                pair,
                                curr1,
                                curr2,
                                count
                            } = row;
                            const name1 = curr1.name;
                            const name2 = curr2.name;

                            let user1 = curr1.user;
                            let user2 = curr2.user;
                            
                            if (!user1) user1 = curr1.issuer;
                            if (!user2) user2 = curr2.issuer;

                            user1 = truncate(user1, 12);
                            user2 = truncate(user2, 12);

                            // market=434F524500000000000000000000000000000000%2BrcoreNywaoz2ZCQ8Lg2EbSLnGuRBmun6D%2F534F4C4F00000000000000000000000000000000%2BrsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz
                            let soloDexURL = `https://sologenic.org/trade?network=mainnet&market=${curr1.currency}%2B${curr1.issuer}%2F${curr2.currency}`;
                            if (curr2.currency !== 'XRP')
                                soloDexURL += `%2B${curr2.issuer}`;

                            let gatehubDexURL = `https://gatehub.net/markets/${curr1.currency}+${curr1.issuer}/${curr2.currency}`;
                            if (curr2.currency !== 'XRP')
                                gatehubDexURL += `+${curr2.issuer}`;


                                let xpmarketDexURL = `https://xpmarket.com/dex/${curr1.currency}+${curr1.issuer}/${curr2.currency}`;
                                if (curr2.currency !== 'XRP')
                                    xpmarketDexURL += `+${curr2.issuer}`;

                            let xummDexURL = `https://xumm.app/detect/xapp:xumm.dex?issuer=${curr1.issuer}&currency=${curr1.currency}`;

                            let sparkline = '';
                            if (id === 1)
                                sparkline = curr1.md5;
                            else if (curr2.issuer)
                                sparkline = curr2.md5;
                            
                            return (
                                <TableRow
                                    hover
                                    key={pair}
                                >
                                    <TableCell align="left" sx={{pt:0.5, pb:0.5}}>
                                        {fNumber(id)}
                                    </TableCell>
                                    <TableCell align="left" sx={{pt:0.5, pb:0.5}}>
                                        <Stack direction="row" alignItems='center'>
                                            <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{name1}</Typography>
                                            <Icon icon={arrowsExchange} width="16" height="16"/>
                                            <Typography variant="subtitle2" sx={{ color: '#007B55' }}>{name2}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left" sx={{p:0.5, pb:0.5}}>
                                        <Stack>
                                            {id === 1 && curr1.domain && (
                                                <Link
                                                    underline="none"
                                                    color="inherit"
                                                    target="_blank"
                                                    href={`https://${curr1.domain}`}
                                                    rel="noreferrer noopener nofollow"
                                                >
                                                    <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{curr1.domain}</Typography>
                                                </Link>
                                            )}
                                            {curr2.domain && (
                                                <Link
                                                    underline="none"
                                                    color="inherit"
                                                    target="_blank"
                                                    href={`https://${curr2.domain}`}
                                                    rel="noreferrer noopener nofollow"
                                                >
                                                    <Typography variant="subtitle2" sx={{ color: '#007B55' }}>{curr2.domain}</Typography>
                                                </Link>
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left" sx={{p:0.5, pb:0.5}}>
                                        {sparkline && (
                                            <Box
                                                component="img"
                                                alt=""
                                                sx={{ maxWidth: 'none' }}
                                                src={`${BASE_URL}/sparkline/${sparkline}`}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell align="left" sx={{p:0.5, pb:0.5}}>
                                        <Stack>
                                            <Stack direction="row" spacing={1} alignItems='center'>
                                                <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{fNumber(curr1.value)}</Typography>
                                                <Typography variant="caption" sx={{ color: '#B72136' }}>{name1}</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={1} alignItems='center'>
                                                <Typography variant="subtitle2" sx={{ color: '#007B55' }}>{fNumber(curr2.value)}</Typography>
                                                <Typography variant="caption" sx={{ color: '#007B55' }}>{name2}</Typography>
                                            </Stack>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left" sx={{pt:0.5, pb:0.5}}>
                                        {fNumber(count)}
                                    </TableCell>
                                    <TableCell align="left" sx={{p:0.5, pb:0.5}}>
                                        <Stack>
                                            {id === 1 && (
                                                <Stack direction="row" alignItems='center'>
                                                    <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{user1}</Typography>
                                                    <Link
                                                        underline="none"
                                                        color="inherit"
                                                        target="_blank"
                                                        href={`https://bithomp.com/explorer/${curr1.issuer}`}
                                                        rel="noreferrer noopener nofollow"
                                                    >
                                                        <IconButton edge="end" aria-label="bithomp">
                                                            <Avatar alt="bithomp" src="/static/bithomp.ico" sx={{ width: 16, height: 16 }} />
                                                        </IconButton>
                                                    </Link>
                                                </Stack>
                                            )}
                                            {curr2.issuer && curr2.issuer !== 'XRPL' && (
                                                <Stack direction="row" alignItems='center'>
                                                    <Typography variant="subtitle2" sx={{ color: '#007B55' }}>{user2}</Typography>
                                                    <Link
                                                        underline="none"
                                                        color="inherit"
                                                        target="_blank"
                                                        href={`https://bithomp.com/explorer/${curr2.issuer}`}
                                                        rel="noreferrer noopener nofollow"
                                                    >
                                                        <IconButton edge="end" aria-label="bithomp">
                                                            <Avatar alt="bithomp" src="/static/bithomp.ico" sx={{ width: 16, height: 16 }} />
                                                        </IconButton>
                                                    </Link>
                                                </Stack>
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left" sx={{ pt:0.5, pb:0.5 }}>
                                        <Stack direction="row" spacing={1}>
                                            <Link
                                                underline="none"
                                                color="inherit"
                                                target="_blank"
                                                href={soloDexURL}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                <IconButton edge="end" aria-label="solo">
                                                    <Avatar alt="Sologenic" src="/static/solo.jpg" sx={{ width: 24, height: 24 }} />
                                                </IconButton>
                                            </Link>
                                            <Link
                                                underline="none"
                                                color="inherit"
                                                target="_blank"
                                                href={gatehubDexURL}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                <IconButton edge="end" aria-label="solo">
                                                    <Avatar alt="Gatehub" src="/static/gatehub.jpg" sx={{ width: 24, height: 24 }} />
                                                </IconButton>
                                            </Link>
                                            <Link
                                                underline="none"
                                                color="inherit"
                                                target="_blank"
                                                href={xummDexURL}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                <IconButton edge="end" aria-label="solo">
                                                    <Avatar alt="XUMM" src="/static/xumm.jpg" sx={{ width: 24, height: 24 }} />
                                                </IconButton>
                                            </Link>

                                            <Link
                                                underline="none"
                                                color="inherit"
                                                target="_blank"
                                                href={xpmarketDexURL}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                <IconButton edge="end" aria-label="solo">
                                                    <Avatar alt="xpmarket" src="/static/xpmarket.jpg" sx={{ width: 24, height: 24 }} />
                                                </IconButton>
                                            </Link>


                                            
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Box>
        </StackStyle>
    );
}
