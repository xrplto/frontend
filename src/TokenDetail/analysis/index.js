import axios from 'axios'
import { useState, useEffect } from 'react';

// Material
import {
    styled,
    Box,
    Stack,
    Table,
    TableBody,
    Typography
} from '@mui/material';

// Loader
import { PuffLoader } from "react-spinners";

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Components
import TokenListHead from './TokenListHead';
import {TokenRow} from './TokenRow';
import TokenListToolbar from './TokenListToolbar';
import EditTokenDialog from 'src/components/EditTokenDialog';
import TrustSetDialog from 'src/components/TrustSetDialog';
import { useRef } from 'react';

// ----------------------------------------------------------------------

const ConnectWalletContainer = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: '10vh'
});

// ----------------------------------------------------------------------

export default function AnalysisData({token}) {
    const metrics = useSelector(selectMetrics);
    const BASE_URL = 'https://api.xrpl.to/api';

    const { accountProfile } = useContext(AppContext);
    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [count, setCount] = useState(0);
    const [tokens, setTokens] = useState([]);

    const [editToken, setEditToken] = useState(null);
    const [trustToken, setTrustToken] = useState(null);

    const [loading, setLoading] = useState(false);
    
    const {
        issuer,
        currency,
        md5
    } = token;

    useEffect(() => {
        function getTokens() {
            setLoading(true);
            // https://api.xrpl.to/api/other_tokens?md5=c9ac9a6c44763c1bd9ccc6e47572fd26&issuer=rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B&page=0&limit=10
            axios.get(`${BASE_URL}/other_tokens?md5=${md5}&issuer=${issuer}&page=${page}&limit=${rows}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setCount(ret.count);
                        setTokens(ret.tokens);
                    }
                }).catch(err => {
                    console.log("Error on getting tokens!!!", err);
                }).then(function () {
                    // always executed
                    setLoading(false);
                });
        }
        getTokens();
    }, [page, rows]);

    const tableRef = useRef(null);
    const [scrollLeft, setScrollLeft] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollLeft(tableRef?.current?.scrollLeft > 0);
        };

        tableRef?.current?.addEventListener('scroll', handleScroll);

        return () => {
            tableRef?.current?.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <>
            {editToken && <EditTokenDialog token={editToken} setToken={setEditToken} /> }
            {trustToken && <TrustSetDialog token={trustToken} setToken={setTrustToken} /> }
            <Typography variant="s2">Other tokens by this issuer</Typography>
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
                ref={tableRef}
            >
                <Table sx={{
                    "& .MuiTableCell-root": {
                        borderBottom: "none",
                        boxShadow: "inset 0 -1px 0 rgba(68 67 67), inset 0 -1px 0 rgba(255, 255, 255, 0.1)"
                    }
                }}>
                    {count > 0 &&
                        <TokenListHead scrollLeft={scrollLeft} tokens={tokens} />
                    }
                    <TableBody>
                        {
                            tokens.map((row, idx) => {
                                    return (
                                        <TokenRow
                                            key={idx}
                                            mUSD = {metrics.USD}
                                            time={row.time}
                                            token={row}
                                            admin={isAdmin}
                                            setEditToken={setEditToken}
                                            setTrustToken={setTrustToken}
                                            scrollLeft={scrollLeft}
                                        />
                                    );
                                })
                        }
                        {/* {emptyRows > 0 && (
                                <TableRow style={{ height: 53 * emptyRows }}>
                                    <TableCell colSpan={6} />
                                </TableRow>
                            )} */}
                    </TableBody>
                </Table>
            </Box>
            {count > 0 ?
                <TokenListToolbar
                    count={count}
                    rows={rows}
                    setRows={setRows}
                    page={page}
                    setPage={setPage}
                />
                :
                loading ?
                    <Stack alignItems="center" sx={{mt: 5, mb: 5}}>
                        <PuffLoader color={"#00AB55"} size={35} sx={{mt:5, mb:5}}/>
                    </Stack>
                    :
                    <ConnectWalletContainer>
                        <Typography variant='subtitle2' color='error'>No other tokens by this issuer</Typography>
                    </ConnectWalletContainer>
            }
        </>
    );
}
