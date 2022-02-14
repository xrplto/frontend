import { filter } from 'lodash';
//import { Icon } from '@iconify/react';
//import { sentenceCase } from 'change-case';
import { useState, useEffect } from 'react';
//import { Link } from "react-router-dom";
//import plusFill from '@iconify/icons-eva/plus-fill';
//import { Link as RouterLink } from 'react-router-dom';
//import { normalizer } from '../utils/normalizers';
// material
import {
    Backdrop,
    Card,
    Table,
    Stack,
    Avatar,
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
import { TokenListHead, TokenListToolbar, TokenMoreMenu } from '../components/token';
import axios from 'axios'
//
//import TOKENLIST from '../_mocks_/tokens';
// ----------------------------------------------------------------------
const TABLE_HEAD = [
    { id: 'id', label: '#', alignRight: false, enableOrder: false},
    { id: 'name', label: 'Name', alignRight: false, enableOrder: true},
    { id: 'price_xrp', label: 'Price (XRP)', alignRight: false, enableOrder: true },
    { id: 'price_usd', label: 'Price ($)', alignRight: false, enableOrder: true },
    { id: 'amount', label: 'Amount', alignRight: false, enableOrder: true },
    { id: 'trline', label: 'Trust Lines', alignRight: false, enableOrder: true },
    { id: 'acct', label: 'Account', alignRight: false, enableOrder: false },
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
    let idx = 1;
    const res = stabilizedThis.map((el) => {
        el[0].id = idx++;
        return el[0];
    });
    return res;
    //return stabilizedThis.map((el) => el[0]);
}

export default function Token() {
    const [page, setPage] = useState(0);
    const [order, setOrder] = useState('desc');
    const [selected, setSelected] = useState([]);
    const [orderBy, setOrderBy] = useState('trline');
    const [filterName, setFilterName] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [labelRowsPerPage/*, setLabelRowsPerPage*/] = useState('Rows');
    const [ offset, setOffset ] = useState(0);
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exch_usd, setUSD] = useState(100);

    useEffect(() => {
        setLoading(true);
        loadTokens(offset);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        getExchangeRate();
        const interval = setInterval(() => getExchangeRate(), 5000)
        
        /*var promise = Promise.resolve(true);

        const interval = setInterval(function () {
            promise = promise.then(function () {
                return new Promise(function (resolve) {
                    getExchangeRate(resolve);
                });
            });
        }, 5000);*/

        return () => {
          clearInterval(interval);
        }
    }, []);
    //let i = 0;
    function getExchangeRate() {
        axios.get('https://ws.xrpl.to/api/v1/exchangerate')
        .then(res => {
            const rates = res.status===200?res.data:undefined;
            if (rates) {
                //i++;
                //setUSD(i);
                //console.log(i);
                setUSD(rates.USD);
                console.log(rates.USD);
            }
        }).catch(err => {
            console.log("error on getting exchange rates!!!", err);
        }).then(function () {
            // always executed
            console.log("Heartbeat!");
        });
    }
    function loadTokens(offset) {
        console.log("Loading tokens!!!");
        axios.get(`https://ws.xrpl.to/api/v1/token/all/${offset}`)
        .then(res => {
            try {
                if (res.status === 200 && res.data) {
                    let tokenList = [];
                    if (res.data.USD > 0) {
                        setUSD(res.data.USD);
                    }
                    for (var i in res.data.tokens) {
                        let token = res.data.tokens[i];
                        token.id = i;
                        token.price_xrp = token.exch;
                        token.price_usd = token.exch;
                        token.amount = token.amt;
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
            setLoading(false);
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
        setLoading(true);
        loadTokens(offset);
    };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - tokens.length) : 0;

  const filteredTokens = applySortFilter(tokens, getComparator(order, orderBy), filterName);

  const isTokenNotFound = filteredTokens.length === 0;

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
        <Card>
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
                  {//{"acct":"rDN4Ux1WFJJsPCdqdfZgrDZ2icxdAmg2w","code":"SEC","amt":7999301.997671802,"trline":29063,"exch":0.05973118285905216}
                   filteredTokens
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      const {
                      	 id,
                      	acct,
                        name,
                      	amt,
                      	trline,
                        price_xrp} = row;
                      const imgUrl = `/static/tokens/${name}.jpg`;
                      const isItemSelected = selected.indexOf(id) !== -1;

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
                              <Typography variant="subtitle2" noWrap>
                  				{name}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="left">{price_xrp}</TableCell>
                          <TableCell align="left">{price_xrp / exch_usd}</TableCell>
                          <TableCell align="left">{amt}</TableCell>
                          <TableCell align="left">{trline}</TableCell>
                          <TableCell align="left">
                            <a href={`https://bithomp.com/explorer/${acct}`} target="_blank" rel="noreferrer noopener"> 
                                {acct}
                            </a>
                          </TableCell>
                          {/*<TableCell align="left">{price}</TableCell>
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
        </Card>
    </Page>
  );
}
