import axios from 'axios';
import React from 'react';
import { useState, useEffect, useRef } from 'react';

// Material
import {
    Box,
    Table,
    TableBody,
    TableCell,
    ToggleButton,
    ToggleButtonGroup,
    useMediaQuery,
    useTheme
} from '@mui/material';

// Utils
import { CollectionListType } from 'src/utils/constants';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
// import SearchToolbar from './SearchToolbar';
import Row from './Row';
import ListHead from './ListHead';
import ListToolbar from './ListToolbar';

export default function CollectionList({ type, category }) {
    const BASE_URL = 'https://api.xrpnft.com/api';

    const { accountProfile, openSnackbar } = useContext(AppContext);
    const account = accountProfile?.account;
    const accountToken = accountProfile?.token;

    const [filter, setFilter] = useState('');
    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('vol24h');

    const [total, setTotal] = useState(0);
    const [collections, setCollections] = useState([]);

    const [choice, setChoice] = useState('verified');

    const [sync, setSync] = useState(0);

    const isMine = type === CollectionListType.MINE;

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const loadCollections = () => {
            if (isMine && (!account || !accountToken)) {
                openSnackbar('Please login', 'error');
                return;
            }

            const body = {
                filter,
                type,
                page,
                limit: rows,
                order,
                orderBy,
                choice
            };

            if (type === CollectionListType.ALL) {
            } else if (type === CollectionListType.MINE) {
                body.account = account;
            } else if (type === CollectionListType.CATEGORY) {
                body.category = category;
            } else if (type === CollectionListType.LANDING) {
            }

            axios
                .post(`${BASE_URL}/collection/getlistbyorder`, body, {
                    headers: { 'x-access-token': accountToken }
                })
                .then((res) => {
                    try {
                        if (res.status === 200 && res.data) {
                            const ret = res.data;
                            setTotal(ret.count);
                            setCollections(ret.collections);
                        }
                    } catch (error) {
                        console.log(error);
                    }
                })
                .catch((err) => {
                    console.log('err->>', err);
                })
                .then(function () {
                    // Always executed
                });
        };
        loadCollections();
    }, [sync, order, orderBy, page, rows, account]);

    useEffect(() => {
        var timer = null;

        const handleValue = () => {
            setPage(0);
            setSync(sync + 1);
        };

        timer = setTimeout(handleValue, 500);
        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [filter]);

    const handleRequestSort = (event, id) => {
        const isDesc = orderBy === id && order === 'desc';
        setOrder(isDesc ? 'asc' : 'desc');
        setOrderBy(id);
        setPage(0);
        setSync(sync + 1);
    };

    const handleChangeChoice = (event, newValue) => {
        if (newValue && choice !== newValue) {
            setChoice(newValue);
            setSync(sync + 1);
        }
    };

    return (
        <>
            {/* <SearchToolbar
                filter={filter}
                setFilter={setFilter}
                rows={rows}
                setRows={setRows}
            /> */}

            {type !== CollectionListType.LANDING && (
                <ToggleButtonGroup
                    color="primary"
                    value={choice}
                    exclusive
                    onChange={handleChangeChoice}
                >
                    <ToggleButton
                        value="all"
                        sx={{ pl: 2, pr: 2, pt: 0.3, pb: 0.3 }}
                        style={{ textTransform: 'none' }}
                    >
                        All
                    </ToggleButton>
                    <ToggleButton
                        value="verified"
                        sx={{ pl: 2, pr: 2, pt: 0.3, pb: 0.3 }}
                        style={{ textTransform: 'none' }}
                    >
                        Verified
                    </ToggleButton>
                </ToggleButtonGroup>
            )}

            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    py: 1,
                    overflow: 'auto',
                    width: '100%',
                    '& > *': {
                        scrollSnapAlign: 'center'
                    },
                    '::-webkit-scrollbar': { display: 'none' }
                }}
            >
                <Table style={{ minWidth: isMobile ? undefined : '1000px' }}>
                    <ListHead
                        order={order}
                        orderBy={orderBy}
                        onRequestSort={handleRequestSort}
                    />
                    <TableBody>
                        {collections.map((row, idx) => {
                            return (
                                <Row
                                    key={idx}
                                    id={page * rows + idx + 1}
                                    item={row}
                                    isMine={isMine}
                                />
                            );
                        })}
                    </TableBody>
                </Table>
            </Box>
            <ListToolbar
                rows={rows}
                setRows={setRows}
                page={page}
                setPage={setPage}
                total={total}
            />
        </>
    );
}
