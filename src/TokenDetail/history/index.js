import axios from 'axios'
import { useState, useEffect } from 'react';

// Material
import { withStyles } from '@mui/styles';
import {
    styled, useTheme,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography
} from '@mui/material';

// Components
import HistoryData from './HistoryData';

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

// function getPair(issuer, currency) {
//     // issuer, currency, 'XRP', undefined
//     const t1 = 'undefined_XRP';
//     const t2 = issuer  + '_' +  currency;
//     let pair = t1 + t2;
//     if (t1.localeCompare(t2) > 0)
//         pair = t2 + t1;
//     return MD5(pair).toString();
// }

export default function History({token}) {
    const BASE_URL = 'https://api.xrpl.to/api';

    const [pairs, setPairs] = useState([]);
    const [pair, setPair] = useState(null);
    
    const handleChangePair = (event, value) => {
        const strPair = event.target.value;
        const newPair = pairs.find(e => e.pair === strPair);
        if (newPair)
            setPair(newPair);
    }

    useEffect(() => {
        function getPairs() {
            // https://api.xrpl.to/api/pairs?md5=0413ca7cfc258dfaf698c02fe304e607
            axios.get(`${BASE_URL}/pairs?md5=${token.md5}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        const newPairs = ret.pairs;
                        setPairs(newPairs);
                        if (!pair) {
                            setPair(newPairs[0]);
                        } else {
                            const check = newPairs.find(e => e.pair === pair.pair);
                            if (!check) {
                                setPair(newPairs[0]);
                            }
                        }
                    }
                }).catch(err => {
                    console.log("Error on getting pairs!!!", err);
                }).then(function () {
                    // always executed
                });
        }

        if (!pair && pairs.length === 0) {
            getPairs();
        }

        const timer = setInterval(getPairs, 10000);

        return () => {
            clearInterval(timer);
        }

    }, [token, pair, pairs]);

    return (
        <Stack>
            <Stack direction="row" alignItems="center">
                <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                    <InputLabel id="demo-select-small">Pairs</InputLabel>
                    {pair && 
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
                                        pair,
                                        curr1,
                                        curr2
                                    } = row;

                                    const name1 = curr1.name;
                                    const name2 = curr2.name;

                                    return (
                                        <MenuItem key={pair} value={pair}>
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
                    }
                </FormControl>
            </Stack>
            <HistoryData token={token} pair={pair}/>
        </Stack>
    );
}
