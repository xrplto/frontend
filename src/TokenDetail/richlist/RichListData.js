import axios from 'axios';
import { useState, useEffect } from 'react';

// Material
import {
    useTheme,
    Avatar,
    Box,
    Checkbox,
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

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Components
import RichListToolbar from './RichListToolbar';

// Iconify
import { Icon } from '@iconify/react';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';
import checkIcon from '@iconify/icons-akar-icons/check';

// Utils
import { fNumber, fPercent } from 'src/utils/formatNumber';

// ----------------------------------------------------------------------
function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

export default function RichListData({token}) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api';
    const metrics = useSelector(selectMetrics);

    const { accountProfile, setLoading, openSnackbar } = useContext(AppContext);
    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;
    
    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(20);
    const [frozen, setFrozen] = useState(false);
    const [count, setCount] = useState(0);
    const [richList, setRichList] = useState([]);
    const [wallets, setWallets] = useState([]); // Team Wallets

    const {
        name,
        exch,
        urlSlug
    } = token;

    useEffect(() => {
        function getRichList() {
            // https://api.xrpl.to/api/richlist/0413ca7cfc258dfaf698c02fe304e607?start=0&limit=100&freeze=false
            axios.get(`${BASE_URL}/richlist/${token.md5}?start=${page*rows}&limit=${rows}&freeze=${frozen}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setCount(ret.length);
                        setRichList(ret.richList);
                    }
                }).catch(err => {
                    console.log("Error on getting richlist!", err);
                }).then(function () {
                    // always executed
                });
        }
        getRichList();
    }, [page, rows, frozen]);

    useEffect(() => {
        function getTeamWallets() {
            const accountAdmin = accountProfile.account;
            const accountToken = accountProfile.token;
            // https://api.xrpl.to/api/admin/get_team_wallets/0413ca7cfc258dfaf698c02fe304e607
            axios.get(`${BASE_URL}/admin/get_team_wallets/${token.md5}`, {
                headers: { 'x-access-account': accountAdmin, 'x-access-token': accountToken }
            })
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setWallets(ret.wallets);
                    }
                }).catch(err => {
                    console.log("Error on getting team wallets!", err);
                }).then(function () {
                    // always executed
                });
        }
        if (isAdmin)
            getTeamWallets();
    }, [isAdmin]);

    const onChangeTeamWallet = async (account) => {
        setLoading(true);
        try {
            let res;

            const accountAdmin = accountProfile.account;
            const accountToken = accountProfile.token;

            let action = 'add';

            if (wallets.includes(account)) {
                action = 'remove';
            }

            const body = {md5: token.md5, account, action};

            res = await axios.post(`${BASE_URL}/admin/update_team_wallets`, body, {
                headers: { 'x-access-account': accountAdmin, 'x-access-token': accountToken }
            });

            if (res.status === 200) {
                const ret = res.data;
                if (ret.status) {
                    setWallets(ret.wallets);
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

    const onChangeFrozen = (e) => {
        setFrozen(!frozen);
    }

    return (
        <>
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
                        borderBottom: "1px solid",
                        borderBottomColor: theme.palette.divider
                    }
                }}>
                    <TableHead>
                        <TableRow>
                            <TableCell align="left">#</TableCell>
                            <TableCell align="left">Address</TableCell>
                            <TableCell align="left">
                                <Link
                                    component="button"
                                    underline="hover"
                                    variant="body2"
                                    color="inherit"
                                    onClick={onChangeFrozen}
                                >
                                    Frozen ({frozen?'YES':'ALL'})
                                </Link>
                            </TableCell>
                            <TableCell align="left">Balance({name})</TableCell>
                            <TableCell align="left">Holding</TableCell>
                            <TableCell align="left">Value</TableCell>
                            {isAdmin &&
                                <TableCell align="left">Team Wallet</TableCell>
                            }
                            <TableCell align="left"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {
                        // exchs.slice(page * rows, page * rows + rows)
                        richList.map((row) => {
                                const {
                                    id,
                                    account,
                                    freeze,
                                    balance,
                                    holding,
                                } = row;
                                
                                return (
                                    <TableRow
                                        hover
                                        key={id}
                                        // sx={{
                                        //     [`& .${tableCellClasses.root}`]: {
                                        //         color: (/*buy*/dir === 'sell' ? '#007B55' : '#B72136')
                                        //     }
                                        // }}
                                    >
                                        <TableCell align="left">
                                            <Typography variant="subtitle1">{id}</Typography>
                                        </TableCell>
                                        <TableCell align="left">
                                            <Link
                                                underline="none"
                                                color="inherit"
                                                target="_blank"
                                                href={`https://bithomp.com/explorer/${account}`}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                <Typography variant="subtitle1">{truncate(account, 20)}</Typography>
                                            </Link>
                                        </TableCell>
                                        <TableCell align="left">
                                            {freeze && <Icon icon={checkIcon}/>}
                                        </TableCell>
                                        <TableCell align="left">
                                            <Typography variant="subtitle1">{fNumber(balance)}</Typography>
                                        </TableCell>
                                        <TableCell align="left">
                                            <Typography variant="subtitle1">{fPercent(holding)} %</Typography>
                                        </TableCell>
                                        <TableCell align="left">
                                            <Stack>
                                            <Typography variant="h4" noWrap>$ {fNumber(exch * balance / metrics.USD)}</Typography>
                                            <Stack direction="row" spacing={0.5} alignItems='center'>
                                                <Icon icon={rippleSolid} width='12' height='12'/>
                                                <Typography variant="subtitle1" noWrap>{fNumber(exch * balance)}</Typography>
                                            </Stack>
                                            </Stack>
                                        </TableCell>

                                        {isAdmin &&
                                            <TableCell align="left">
                                                <Checkbox
                                                    checked={wallets.includes(account)}
                                                    // onChange={onChangeTeamWallet(account)}
                                                    onClick={() => {onChangeTeamWallet(account)}}
                                                    inputProps={{ 'aria-label': 'controlled' }}
                                                />
                                            </TableCell>
                                        }
                                        <TableCell align="left">
                                            <Stack direction="row" alignItems='center' spacing={2}>
                                                <Link
                                                    underline="none"
                                                    color="inherit"
                                                    target="_blank"
                                                    href={`https://bithomp.com/explorer/${account}`}
                                                    rel="noreferrer noopener nofollow"
                                                >
                                                    <IconButton edge="end" aria-label="bithomp">
                                                        <Avatar alt="livenetxrplorg" src="/static/bithomp.ico" sx={{ width: 20, height: 20 }} />
                                                    </IconButton>
                                                </Link>

                                                <Link
                                                    underline="none"
                                                    color="inherit"
                                                    target="_blank"
                                                    href={`https://livenet.xrpl.org/accounts/${account}`}
                                                    rel="noreferrer noopener nofollow"
                                                >
                                                    <IconButton edge="end" aria-label="livenetxrplorg">
                                                        <Avatar alt="livenetxrplorg" src="/static/livenetxrplorg.ico" sx={{ width: 20, height: 20 }} />
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
            <RichListToolbar
                count={count}
                rows={rows}
                setRows={setRows}
                page={page}
                setPage={setPage}
            />
        </>
    );
}
