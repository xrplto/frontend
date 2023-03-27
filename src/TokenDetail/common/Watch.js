import axios from 'axios';
import { useState, useEffect } from 'react';

// Material
import {
    useTheme,
    Chip,
    Tooltip
} from '@mui/material';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import StarRateIcon from '@mui/icons-material/StarRate';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// ----------------------------------------------------------------------
export default function Watch({token}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const theme = useTheme();
    const { accountProfile, openSnackbar, setLoading } = useContext(AppContext);

    const [watchList, setWatchList] = useState([]);

    const {
        name,
        ext,
        md5,
        exch,
    } = token;

    let user = token.user;
    if (!user) user = name;

    useEffect(() => {
        function getWatchList() {
            const account = accountProfile?.account;
            if (!account) {
                setWatchList([]);
                return;
            }
            // https://api.xrpl.to/api/watchlist/get_list?account=r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm
            axios.get(`${BASE_URL}/watchlist/get_list?account=${account}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setWatchList(ret.watchlist);
                    }
                }).catch(err => {
                    console.log("Error on getting watchlist!", err);
                }).then(function () {
                    // always executed
                });
        }
        getWatchList();
    }, [accountProfile]);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeWatchList = async (md5) => {
        const account = accountProfile?.account;
        const accountToken = accountProfile?.token;

        if (!account || !accountToken) {
            openSnackbar('Please login!', 'error');
            return;
        }

        setLoading(true);
        try {
            let res;

            let action = 'add';

            if (watchList.includes(md5)) {
                action = 'remove';
            }

            const body = {md5, account, action};

            res = await axios.post(`${BASE_URL}/watchlist/update_watchlist`, body, {
                headers: { 'x-access-token': accountToken }
            });

            if (res.status === 200) {
                const ret = res.data;
                if (ret.status) {
                    setWatchList(ret.watchlist);
                    openSnackbar('Successful!', 'success');
                } else {
                    const err = ret.err;
                    openSnackbar(err, 'error');
                }
            }
        } catch (err) {
            console.log(err);
        }
        setLoading(false);
    }

    return (
        <>
            {watchList.includes(md5) ?
                <Tooltip title="Remove from Watchlist">
                    <Chip
                        variant={"outlined"}
                        icon={
                            <StarRateIcon fontSize="small" />
                        }
                        label={'Watch'}
                        onClick={() => {onChangeWatchList(md5)}}
                        sx={{
                            "& .MuiChip-icon": {
                                color: '#F6B87E'
                            }
                        }}
                    />
                </Tooltip>
                :
                <Tooltip title="Add to Watchlist and follow token">
                    <Chip
                        variant={"outlined"}
                        icon={
                            <StarOutlineIcon fontSize="small" />
                        }
                        label={'Watch'}
                        onClick={() => {onChangeWatchList(md5)}}
                        sx={{
                            // cursor: 'pointer',
                            '&:hover': {
                                // color: '#F6B87E',
                                "& .MuiChip-icon": {
                                    color: '#F6B87E'
                                }
                            },
                        }}
                    />
                </Tooltip>
            }
        </>
    );
}
