import { filter } from 'lodash';
//import { Icon } from '@iconify/react';
//import { sentenceCase } from 'change-case';
import { useState, useEffect } from 'react';
//import plusFill from '@iconify/icons-eva/plus-fill';
//import { normalizer } from '../utils/normalizers';
import { limitNumber, fCurrency5, fCurrency3 } from '../utils/formatNumber';
import { withStyles } from '@mui/styles';
import {TOKENS} from './tokens';
// material
import {
    Box,
    Backdrop,
    Card,
    Table,
    Stack,
    Avatar,
    Link,
    Checkbox,
    TableRow,
    TableBody,
    TableCell,
    Typography,
    TableContainer,
    /*TablePagination*/
} from '@mui/material';
import {
    HashLoader,
} from "react-spinners";
// components
import Page from '../components/Page';
//import Label from '../components/Label';
import Scrollbar from '../components/Scrollbar';
import SearchNotFound from '../components/SearchNotFound';
import { TokenListHead, TokenListToolbar, TokenMoreMenu, NFTWidget } from '../components/token';

import axios from 'axios'
const BASE_URL = 'https://ws.xrpl.to/api';
//const BASE_URL = 'http://localhost/api';
//
//import TOKENLIST from '../_mocks_/tokens';
// ----------------------------------------------------------------------
const TABLE_HEAD = [
    { id: 'id', label: '#', alignRight: false, enableOrder: false},
    { id: 'name', label: 'Name', alignRight: false, enableOrder: true},
    { id: 'price', label: 'Price', alignRight: false, enableOrder: true },
    { id: 'percent_24h', label: '24h (%)', alignRight: false, enableOrder: false },
    { id: 'percent_7d', label: '7d (%)', alignRight: false, enableOrder: false },
    { id: 'amount', label: 'Amount', alignRight: false, enableOrder: true },
    { id: 'holders', label: 'Holders', alignRight: false, enableOrder: true },
    { id: 'offers', label: 'Offers', alignRight: false, enableOrder: true },
    { id: 'trline', label: 'Trust Lines', alignRight: false, enableOrder: true },
    { id: 'history', label: 'Last 7 Days', alignRight: false, enableOrder: false },
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

export default function Token() {
    const [page, setPage] = useState(0);
    const [order, setOrder] = useState('desc');
    const [selected, setSelected] = useState([]);
    const [orderBy, setOrderBy] = useState('trline');
    const [filterName, setFilterName] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [labelRowsPerPage/*, setLabelRowsPerPage*/] = useState('Rows');
    const [ offset, setOffset ] = useState(-1);
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exch_usd, setUSD] = useState(100);
    const [exch_eur, setEUR] = useState(100);
    const [exch_jpy, setJPY] = useState(100);
    const [exch_cny, setCNY] = useState(100);

    useEffect(() => {
        loadTokens(offset);

        // eslint-disable-next-line react-hooks/exhaustive-deps
        //getExchangeRate();

        const timer = setInterval(() => getExchangeRate(), 5000)

        return () => {
          clearInterval(timer);
        }
    }, [offset]);
    //let i = 0;
    function getExchangeRate() {
        axios.get(`${BASE_URL}/exchangerate`)
        .then(res => {
            const rates = res.status===200?res.data:undefined;
            if (rates) {
                //i++;
                //setUSD(i);
                //console.log(i);
                setUSD(rates.USD);
                setEUR(rates.EUR);
                setJPY(rates.JPY);
                setCNY(rates.CNY);
                console.log(rates.USD);
            }
        }).catch(err => {
            console.log("error on getting exchange rates!!!", err);
        }).then(function () {
            // always executed
            // console.log("Heartbeat!");
        });
    }
    function loadTokens(offset) {
        console.log("Loading tokens!!!");
        let tokenList = [];
        if (TOKENS.USD > 0) {
            setUSD(TOKENS.USD);
        }
        if (TOKENS.EUR > 0) {
            setEUR(TOKENS.EUR);
        }
        if (TOKENS.JPY > 0) {
            setJPY(TOKENS.JPY);
        }
        if (TOKENS.CNY > 0) {
            setCNY(TOKENS.CNY);
        }
        for (var i in TOKENS.tokens) {
            let token = TOKENS.tokens[i];
            token.price = limitNumber(token.exch);
            token.amount = token.amt;
            token.pro7d = 0;
            token.pro24h = 0;
            tokenList.push(token);
        }
        setTokens(tokenList);

        //setLoading(true);
        axios.get(`${BASE_URL}/tokens/${offset}`)
        .then(res => {
            try {
                if (res.status === 200 && res.data) {
                    let tokenList = [];
                    if (res.data.USD > 0) {
                        setUSD(res.data.USD);
                    }
                    if (res.data.EUR > 0) {
                        setEUR(res.data.EUR);
                    }
                    if (res.data.JPY > 0) {
                        setJPY(res.data.JPY);
                    }
                    if (res.data.CNY > 0) {
                        setCNY(res.data.CNY);
                    }
                    for (var i in res.data.tokens) {
                        let token = res.data.tokens[i];
                        token.price = limitNumber(token.exch);
                        token.amount = token.amt;
                        token.pro7d = fCurrency5(token.pro7d);
                        token.pro24h = fCurrency5(token.pro24h);
                        tokenList.push(token);
                    }
                    setTokens(tokenList);
                }
            } catch (error) {
                console.log(error);
            }
            //dispatch(concatinate(res.data.assets));
            //if(res.data.assets.length < 20) setHasMore(false);
            //setOffset(offset + 1);
        }).catch(err => {
            console.log("err->>", err);
        }).then(function () {
            // always executed
            //setLoading(false);
        });
    }

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = tokens.map((n) => n.id);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, id) => {
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
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFilterByName = (event) => {
        setFilterName(event.target.value);
    };

    const handleCloudRefresh = (event) => {
        loadTokens(offset);
    };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - tokens.length) : 0;

  const filteredTokens = applySortFilter(tokens, getComparator(order, orderBy), filterName);

  const isTokenNotFound = filteredTokens.length === 0;

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

  // style={{border: '1px solid red'}}
  
  return (
    
    <Page title="Tokens">
        <Backdrop
            sx={{ color: '#000', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={loading}
        >
            <HashLoader
                color={'#00AB55'}
                size={50}/>
        </Backdrop >
          <TokenListToolbar
              numSelected={selected.length}
              filterName={filterName}
              onFilterName={handleFilterByName}
      		    count={tokens.length}
              rowsPerPage={rowsPerPage}
              labelRowsPerPage={labelRowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              onCloudRefresh={handleCloudRefresh}
              EXCH_USD = {exch_usd}
              EXCH_EUR = {exch_eur}
              EXCH_JPY = {exch_jpy}
              EXCH_CNY = {exch_cny}
          />

          <Scrollbar>
              <TableContainer sx={{ minWidth: 800 }}>
                  <Table>
                      <TokenListHead
                        order={order}
                        orderBy={orderBy}
                        headLabel={TABLE_HEAD}
                        rowCount={tokens.length}
                        numSelected={selected.length}
                        onRequestSort={handleRequestSort}
                        onSelectAllClick={handleSelectAllClick}
                      />
                      <TableBody>
                          {filteredTokens.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                              .map((row) => {
                                  const {
                                      id,
                                      acct,
                                      name,
                                      date,
                                      amt,
                                      trline,
                                      holders,
                                      offers,
                                      md5,
                                      user,
                                      pro7d,
                                      pro24h,
                                      price} = row;
                                  const imgUrl = `/static/tokens/${name}.jpg`;
                                  const isItemSelected = selected.indexOf(id) !== -1;

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
                                  } catch(e) {}
                                  return (
                                    <TableRow
                                        hover
                                        key={id}
                                        tabIndex={-1}
                                        role="checkbox"
                                        selected={isItemSelected}
                                        aria-checked={isItemSelected}
                                    >
                                        <TableCell padding="checkbox">
                                          <Checkbox
                                            checked={isItemSelected}
                                            onChange={(event) => handleClick(event, id)}
                                          />
                                        </TableCell>
                                        <TableCell align="left">{id}</TableCell>
                                        <TableCell component="th" scope="row" padding="none">
                                          <Stack direction="row" alignItems="center" spacing={2}>
                                            <Avatar alt={name} src={imgUrl} />
                                            <Stack>
                                                <CoinNameTypography variant="subtitle1" noWrap>
                                                <Link
                                                    underline="hover"
                                                    color="inherit"
                                                    target="_blank"
                                                    href={`https://bithomp.com/explorer/${acct}`}
                                                    rel="noreferrer noopener"
                                                >
                                                    {name}
                                                </Link>
                                                </CoinNameTypography>
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
                                                    $ {fCurrency5(price / exch_usd)}
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
                                        <TableCell align="left">{fCurrency5(amt)||0}</TableCell>
                                        <TableCell align="left">{holders}</TableCell>
                                        <TableCell align="left">{offers}</TableCell>
                                        <TableCell align="left">{trline}</TableCell>
                                        <TableCell align="left">
                                              {/* {Str(acct).limit(10, '...').get()} */}
                                              <Box
                                                component="img"
                                                alt=""
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
                                          <TokenMoreMenu />
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
                      {isTokenNotFound && (
                          <TableBody>
                              <TableRow>
                                  <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                                        <SearchNotFound searchQuery={filterName} />
                                  </TableCell>
                              </TableRow>
                          </TableBody>
                      )}
                  </Table>
              </TableContainer>
          </Scrollbar>
        <NFTWidget/>
    </Page>
  );
}
