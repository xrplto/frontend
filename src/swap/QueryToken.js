import React from 'react';
import axios from 'axios'
import { useState, useEffect, useRef } from 'react';
import { ClipLoader } from "react-spinners";
import { LazyLoadImage, LazyLoadComponent } from 'react-lazy-load-image-component';

// Material
import {
    styled,
    Avatar,
    IconButton,
    InputAdornment,
    Link,
    MenuItem,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { XRP_TOKEN } from 'src/utils/constants';

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
    borderRadius: '50%',
    overflow: 'hidden'
}));

const CustomSelect = styled(Select)(({ theme }) => ({
    '& .MuiOutlinedInput-notchedOutline' : {
        border: 'none'
    }
}));

function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + '... ' : str;
};

export default function QueryToken({token, onChangeToken}) {
    const BASE_URL = 'https://api.xrpl.to/api';

    const [loading, setLoading] = useState(false);

    const [tokens, setTokens] = useState([XRP_TOKEN]);
    const [filter, setFilter] = useState('');

    const loadTokens = () => {
        setLoading(true);
        // https://api.xrpl.to/api/xrpnft/tokens?filter=
        axios.get(`${BASE_URL}/xrpnft/tokens?filter=${filter}`)
        .then(res => {
            try {
                if (res.status === 200 && res.data) {
                    const ret = res.data;

                    const exist = (ret.tokens || []).find(t => t.md5 === token.md5);

                    if (exist) {
                        setTokens(ret.tokens);
                    } else {
                        const newTokens = [token].concat(ret.tokens);
                        setTokens(newTokens);
                    }
                    // if (ret.tokens.length > 0)
                    //     setTokens(ret.tokens);
                }
            } catch (error) {
                console.log(error);
            }
        }).catch(err => {
            console.log("err->>", err);
        }).then(function () {
            // Always executed
            setLoading(false);
        });
    };

    useEffect(() => {
        loadTokens();
    }, [filter]);

    const handleChangeToken = (e) => {
        const value = e.target.value;

        const newToken = tokens.find(t => t.md5 === value);
        if (newToken) {
            onChangeToken(newToken);
        }
    };

    const handleChangeFilter = (e) => {
        setFilter(e.target.value);
    }

    return (
        <Stack spacing={2}>
            <Stack spacing={2}>
                <CustomSelect
                    id='select_token'
                    value={token.md5}
                    onChange={handleChangeToken}
                    MenuProps={{ disableScrollLock: true }}
                    // renderValue={(idx) => (
                    //     <>
                    //     {(collections.length > 0 && idx > -1 && collections.length > idx) &&
                    //         <Stack direction='row' alignItems="center">
                    //             <Avatar alt="C" src={`https://s1.xrpnft.com/collection/${collections[idx].logoImage}`} sx={{ mr:2, width: 32, height: 32 }} />
                    //             <Typography variant='d4'>{collections[idx].name}</Typography>
                    //         </Stack>
                    //     }
                    //     </>
                    // )}
                >
                    <TextField
                        id='textFilter'
                        // autoFocus
                        fullWidth
                        variant='standard'
                        placeholder='Filter'
                        margin='dense'
                        onChange={handleChangeFilter}
                        autoComplete='new-password'
                        inputProps={{autoComplete: 'off'}}
                        value={filter}
                        onFocus={event => {
                            event.target.select();
                        }}
                        sx={{
                            pl:2,pr:2,pb:2,pt:2.5
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="start">
                                    {loading && <ClipLoader color='#ff0000' size={15} /> }
                                </InputAdornment>
                            ),
                        }}
                    />
                    {
                        tokens.map((row, idx) => {
                            const {
                                md5,
                                name,
                                user,
                                kyc,
                                isOMCF
                            } = row;

                            const imgUrl = `https://s1.xrpl.to/token/${md5}`;
                            // const imgUrl = `/static/tokens/${md5}.${ext}`;

                            return (
                                <MenuItem
                                    key={md5 + "_token1"}
                                    value={md5}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{p:0}}>
                                        <TokenImage
                                            src={imgUrl} // use normal <img> attributes as props
                                            width={48}
                                            height={48}
                                            onError={(event) => event.target.src = '/static/alt.png'}
                                        />
                                        <Stack>
                                            <Typography variant="token" color={isOMCF!=='yes'?'#222531':''} noWrap>{truncate(name, 8)}</Typography>
                                            <Typography variant="caption" color={isOMCF!=='yes'?'#222531':''} noWrap>
                                                {truncate(user, 13)}
                                                {kyc && (<Typography variant='kyc' sx={{ml: 0.2}}>KYC</Typography>)}
                                            </Typography>
                                            {/* <Typography variant="small" color={isOMCF!=='yes'?'#222531':''}>{date}</Typography> */}
                                        </Stack>
                                    </Stack>
                                </MenuItem>
                            );
                        })
                    }
                </CustomSelect>
            </Stack>

            
        </Stack>
    );
}
