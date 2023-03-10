
import axios from 'axios';
import { useState, useEffect } from 'react';

// Material
import {
    styled,
    Avatar,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    Link,
    MenuItem,
    Select,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';


// Iconify
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// ----------------------------------------------------------------------

const CustomSelect = styled(Select)(({ theme }) => ({
    // '& .MuiOutlinedInput-notchedOutline' : {
    //     border: 'none'
    // }
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

const StackDexStyle = styled(Stack)(({ theme }) => ({
    width: '100%',
    display: 'inline-block',
    marginLeft: '4px',
    marginRight: '4px',
    color: '#C4CDD5',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '18px',
    // backgroundColor: '#7A0C2E',
    borderRadius: '8px',
    border: `1px solid ${theme.palette.divider}`,
    padding: '0px 12px'
}));

export default function PairsSelect({ token, pair, setPair}) {
    const BASE_URL = 'https://api.xrpl.to/api';

    const [pairs, setPairs] = useState([]);

    useEffect(() => {
        function getPairs() {
            // https://api.xrpl.to/api/pairs?md5=0413ca7cfc258dfaf698c02fe304e607
            axios.get(`${BASE_URL}/pairs?md5=${token.md5}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        /*{
                            "pair": "fa99aff608a10186d3b1ff33b5cd665f",
                            "curr1": {
                                "currency": "534F4C4F00000000000000000000000000000000",
                                "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
                                "value": 460186.2755587654,
                                "md5": "0413ca7cfc258dfaf698c02fe304e607",
                                "name": "SOLO",
                                "user": "Sologenic",
                                "domain": "sologenic.com",
                                "verified": true,
                                "twitter": "realSologenic"
                            },
                            "curr2": {
                                "currency": "XRP",
                                "issuer": "XRPL",
                                "value": 328571.7821960003,
                                "md5": "84e5efeb89c4eae8f68188982dc290d8",
                                "name": "XRP"
                            },
                            "count": 1697,
                            "id": 1
                        }*/
                        const newPairs = ret.pairs;
                        setPairs(newPairs);
                        if (!pair) {
                            setPair(newPairs[0]);
                            updatePair(newPairs[0]);
                        } else {
                            const check = newPairs.find(e => e.pair === pair.pair);
                            if (!check) {
                                setPair(newPairs[0]);
                                updatePair(newPairs[0]);
                            }
                        }
                    }
                }).catch(err => {
                    console.log("Error on getting pairs!!!", err);
                }).then(function () {
                    // always executed
                });
        }

        if (pairs.length === 0) {
            getPairs();
        }

        const timer = setInterval(getPairs, 10000);

        return () => {
            clearInterval(timer);
        }

    }, [token, pairs]);

    const handleChangePair = (event, value) => {
        //const idx = parseInt(event.target.value, 10);
        const strPair = event.target.value;
        const newPair = pairs.find(e => e.pair === strPair);
        if (newPair)
            setPair(newPair);
    }
    
    const curr1 = pair.curr1;
    const curr2 = pair.curr2;

    let soloDexURL = `https://sologenic.org/trade?network=mainnet&market=${curr1.currency}%2B${curr1.issuer}%2F${curr2.currency}`;
    if (curr2.currency !== 'XRP')
        soloDexURL += `%2B${curr2.issuer}`;

    let gatehubDexURL = `https://gatehub.net/markets/${curr1.currency}+${curr1.issuer}/${curr2.currency}`;
    if (curr2.currency !== 'XRP')
        gatehubDexURL += `+${curr2.issuer}`;
        
    const xummDexURL = `https://xumm.app/detect/xapp:xumm.dex?issuer=${curr1.issuer}&currency=${curr1.currency}`;

    return (
        <Grid container spacing={0} sx={{p:0}}>
            <Grid item>
                <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                    <InputLabel id="demo-select-small">Pairs</InputLabel>
                        <CustomSelect
                            labelId="demo-select-small"
                            id="demo-select-small"
                            value={pair.pair}
                            label="Pair"
                            onChange={handleChangePair}
                        >
                            {
                                pairs.map((row) => {
                                    const {
                                        id,
                                        pair,
                                        curr1,
                                        curr2
                                    } = row;

                                    const name1 = curr1.name;
                                    const name2 = curr2.name;

                                    return (
                                        <MenuItem key={id} value={pair}>
                                            <Stack direction="row" alignItems='center'>
                                                <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{name1}</Typography>
                                                <Icon icon={arrowsExchange} width="16" height="16"/>
                                                <Typography variant="subtitle2" sx={{ color: '#007B55' }}>{name2}</Typography>
                                                <span style={badge24hStyle}>24h</span>
                                                <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{fNumber(curr1.value)}</Typography>
                                            </Stack>
                                        </MenuItem>
                                    );
                                })
                            }
                        </CustomSelect>
                </FormControl>
            </Grid>
            <Grid item>
                <Stack direction="row">
                    <StackDexStyle direction="row" sx={{ m: 1, minWidth: 120 }} spacing={2} alignItems="center">
                        DEX
                        <Tooltip title="Sologenic">
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={soloDexURL}
                                rel="noreferrer noopener nofollow"
                            >
                                <IconButton edge="end" aria-label="solo">
                                    <Avatar variant="rounded" alt="sologenic" src="/static/solo.jpg" sx={{ width: 24, height: 24 }} />
                                </IconButton>
                            </Link>
                        </Tooltip>
                        <Tooltip title="GateHub">
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={gatehubDexURL}
                                rel="noreferrer noopener nofollow"
                            >
                                <IconButton edge="end" aria-label="solo">
                                    <Avatar variant="rounded" alt="gatehub" src="/static/gatehub.jpg" sx={{ width: 24, height: 24 }} />
                                </IconButton>
                            </Link>
                        </Tooltip>
                        <Tooltip title="XUMM">
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={xummDexURL}
                                rel="noreferrer noopener nofollow"
                            >
                                <IconButton edge="end" aria-label="solo">
                                    <Avatar variant="rounded" alt="xumm" src="/static/xumm.jpg" sx={{ width: 24, height: 24 }} />
                                </IconButton>
                            </Link>
                        </Tooltip>
                    </StackDexStyle>
                </Stack>
            </Grid>
        </Grid>
    );
}
