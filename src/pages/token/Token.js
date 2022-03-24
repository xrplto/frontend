import { filter } from 'lodash';
//import { Icon } from '@iconify/react';
//import searchFill from '@iconify/icons-eva/search-fill';
//import { sentenceCase } from 'change-case';
import { useState, useEffect } from 'react';
//import plusFill from '@iconify/icons-eva/plus-fill';
//import { normalizer } from '../utils/normalizers';
import { fCurrency5, fNumber } from '../../utils/formatNumber';
import { withStyles } from '@mui/styles';
import { Link } from 'react-router-dom'

import ScrollToTop from './ScrollToTop';
// material
import {
    Avatar,
    Box,
    Container,
    Stack,
    Table,
    TableRow,
    TableBody,
    TableCell,
    Typography,
    Toolbar,
} from '@mui/material';
// components
import Page from '../../layouts/Page';
//import SearchNotFound from '../../components/SearchNotFound';
import { TokenListHead, TokenListToolbar, SearchToolbar, TokenMoreMenu } from './components';

// ----------------------------------------------------------------------
import { useSelector, useDispatch } from "react-redux";
import { selectStatus } from "../../redux/statusSlice";
import {
    setOrder,
    setOrderBy,
    setPage,
    selectContent,
    loadTokens
} from "../../redux/tokenSlice";
// ----------------------------------------------------------------------

const CoinNameTypography = withStyles({
    root: {
        color: "#3366FF"
    }
})(Typography);

const BearishTypography = withStyles({
    root: {
        color: "#FF6C40"
    }
})(Typography);

const BullishTypography = withStyles({
    root: {
        color: "#54D62C"
    }
})(Typography);

const TABLE_HEAD = [
    { id: 'id', label: '#', align: 'left', order: false },
    { id: 'name', label: 'Name', align: 'left', order: true },
    { id: 'price', label: 'Price', align: 'left', order: true },
    { id: 'percent_24h', label: '24h (%)', align: 'left', order: false },
    { id: 'percent_7d', label: '7d (%)', align: 'left', order: false },
    { id: 'amount', label: 'Total Supply', align: 'left', order: true },
    { id: 'volume', label: 'Volume(24H)', align: 'left', order: true },
    { id: 'marketcap', label: 'Market Cap', align: 'left', order: true },
    //    { id: 'holders', label: 'Holders', align: 'left', order: true },
    //    { id: 'offers', label: 'Offers', align: 'left', order: true },
    { id: 'trline', label: 'Trust Lines', align: 'left', order: true },
    { id: 'historyGraph', label: 'Last 7 Days', align: 'left', order: false },
    { id: '' }
];

// ----------------------------------------------------------------------
function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

function getComparator(order, orderBy) {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    if (query) {
        return filter(array, (_token) => _token.name.toLowerCase().indexOf(query.toLowerCase()) !== -1);
    }
    /*let idx = 1;
    const res = stabilizedThis.map((el) => {
        el[0].id = idx++;
        return el[0];
    });
    return res;*/
    return stabilizedThis.map((el) => el[0]);
}

export default function Token(props) {
    const BASE_URL = 'https://ws.xrpl.to/api'; // 'http://localhost/api';

    const [filterName, setFilterName] = useState('');

    const status = useSelector(selectStatus);
    const content = useSelector(selectContent);

    const dispatch = useDispatch();

    useEffect(() => {
        if (content.tokens.length < 1000)
            dispatch(loadTokens(0));
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const timer = setInterval(() => {}, 5000)

        return () => {
            clearInterval(timer);
        }
    }, []);
    //let i = 0;

    useEffect(() => {
        if (filterName && content.page > 0)
            dispatch(setPage(0));
    }, [filterName, content.page]);

    const handleRequestSort = (event, property) => {
        const isAsc = content.orderBy === property && content.order === 'asc';
        dispatch(setOrder(isAsc ? 'desc' : 'asc'));
        dispatch(setOrderBy(property));
    };

    const emptyRows = content.page > 0 ? Math.max(0, (1 + content.page) * content.rowsPerPage - content.tokens.length) : 0;

    const filteredTokens = applySortFilter(content.tokens, getComparator(content.order, content.orderBy), filterName);

    //const isTokenNotFound = filteredTokens.length === 0;

    /*const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = tokens.map((n) => n.id);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };*/

    /*const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1)
            );
        }
        setSelected(newSelected);
    };*/

    const handleFilterByName = (event) => {
        setFilterName(event.target.value);
    };

    // style={{border: '1px solid red'}}

    return (
        <Page title="Tokens">
            <Container maxWidth="xl">

            <Toolbar id="back-to-top-anchor" />

            <SearchToolbar
                filterName={filterName}
                onFilterName={handleFilterByName}
            />

            <Table stickyHeader>
                <TokenListHead
                    order={content.order}
                    orderBy={content.orderBy}
                    headLabel={TABLE_HEAD}
                    onRequestSort={handleRequestSort}
                />
                <TableBody>
                    {filteredTokens.slice(content.page * content.rowsPerPage, content.page * content.rowsPerPage + content.rowsPerPage)
                        .map((row) => {
                            const {
                                id,
                                acct,
                                name,
                                code,
                                date,
                                amt,
                                marketcap,
                                trline,
                                //holders,
                                //offers,
                                md5,
                                user,
                                pro7d,
                                pro24h,
                                price } = row;
                            const imgUrl = `/static/tokens/${name}.jpg`;
                            const isItemSelected = false;//selected.indexOf(id) !== -1;
                            const vol24h = 0;

                            let strPro7d = 0;
                            if (pro7d < 0) {
                                strPro7d = -pro7d;
                                strPro7d = '-' + strPro7d + '%';
                            } else {
                                strPro7d = '+' + pro7d + '%';
                            }

                            let strPro24h = 0;
                            if (pro24h < 0) {
                                strPro24h = -pro24h;
                                strPro24h = '-' + strPro24h + '%';
                            } else {
                                strPro24h = '+' + pro24h + '%';
                            }

                            let date_fixed = '';
                            try {
                                if (date) {
                                    date_fixed = date.split('T')[0];
                                }
                            } catch (e) { }
                            return (
                                <TableRow
                                    hover
                                    key={id}
                                    tabIndex={-1}
                                    role="checkbox"
                                    selected={isItemSelected}
                                    aria-checked={isItemSelected}
                                >
                                    {/* <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={isItemSelected}
                                        onChange={(event) => handleClick(event, id)}
                                    />
                                    </TableCell> */}
                                    <TableCell align="left">{id}</TableCell>
                                    <TableCell component="th" scope="row" padding="none">
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Avatar alt={name} src={imgUrl} />
                                            <Stack>
                                                <Link
                                                    style={{ textDecoration: 'none' }}
                                                    underline="hover"
                                                    color="inherit"
                                                    to={`detail/${md5}`}
                                                    onClick={() => { localStorage.setItem("selectToken", JSON.stringify(row)); }}
                                                >
                                                    <CoinNameTypography variant="subtitle1" noWrap>
                                                        {name}
                                                    </CoinNameTypography>
                                                </Link>
                                                <Typography variant="caption">
                                                    {user}
                                                </Typography>
                                                <Typography variant="caption">
                                                    {date_fixed}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left">
                                        <Stack>
                                            <Typography variant="subtitle1" noWrap>
                                                $ {fCurrency5(price / status.USD)}
                                            </Typography>
                                            <Typography variant="caption">
                                                {fCurrency5(price)} XRP
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left">
                                        {pro24h < 0 ? (
                                            <BearishTypography variant="subtitle1" noWrap>
                                                {strPro24h}
                                            </BearishTypography>
                                        ) : (
                                            <BullishTypography variant="subtitle1" noWrap>
                                                {strPro24h}
                                            </BullishTypography>
                                        )}
                                    </TableCell>
                                    <TableCell align="left">
                                        {pro7d < 0 ? (
                                            <BearishTypography variant="subtitle1" noWrap>
                                                {strPro7d}
                                            </BearishTypography>
                                        ) : (
                                            <BullishTypography variant="subtitle1" noWrap>
                                                {strPro7d}
                                            </BullishTypography>
                                        )}
                                    </TableCell>
                                    <TableCell align="left">{fNumber(amt)}</TableCell>
                                    <TableCell align="left">{fNumber(vol24h)}</TableCell>
                                    <TableCell align="left">$ {fNumber(marketcap / status.USD)}</TableCell>
                                    {/* <TableCell align="left">{holders}</TableCell>
                                    <TableCell align="left">{offers}</TableCell> */}
                                    <TableCell align="left">{trline}</TableCell>
                                    <TableCell align="left">
                                        {/* {Str(acct).limit(10, '...').get()} */}
                                        <Box
                                            component="img"
                                            alt=""
                                            sx={{ maxWidth: 'none' }}
                                            src={`${BASE_URL}/sparkline/${md5}`}
                                        />
                                    </TableCell>
                                    {/*
                                    <a href={`https://bithomp.com/explorer/${acct}`} target="_blank" rel="noreferrer noopener"> 
                                    </a>
                                    <TableCell align="left">{price}</TableCell>
                                    <TableCell align="left">{dailypercent}</TableCell>
                                    <TableCell align="left">{marketcap}</TableCell>
                                    <TableCell align="left">{holders}</TableCell>
                                    <TableCell align="left">{role}</TableCell>
                                    <TableCell align="left">{isVerified ? 'Yes' : 'No'}</TableCell>
                                    <TableCell align="left">
                                    <Label
                                        variant="ghost"
                                        color={(status === 'kyc' && 'error') || 'success'}
                                    >
                                        {sentenceCase(status)}
                                    </Label>
                                    </TableCell> */}

                                    <TableCell align="right">
                                        <TokenMoreMenu acct={acct} currency={code} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    {emptyRows > 0 && (
                            <TableRow style={{ height: 53 * emptyRows }}>
                                <TableCell colSpan={6} />
                            </TableRow>
                        )}
                </TableBody>
                {/*isTokenNotFound && (
                    <TableBody>
                        <TableRow>
                            <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                                    <SearchNotFound searchQuery={filterName} />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                )*/}
            </Table>
            <TokenListToolbar />
            <ScrollToTop />
            </Container>
            {/* <NFTWidget/> */}
        </Page>
    );
}
