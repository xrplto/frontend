import { filter } from 'lodash';
//import { Icon } from '@iconify/react';
//import { sentenceCase } from 'change-case';
import { useState, useEffect } from 'react';
//import plusFill from '@iconify/icons-eva/plus-fill';
//import { Link as RouterLink } from 'react-router-dom';
// material
import {
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
// components
import Page from '../components/Page';
//import Label from '../components/Label';
import Scrollbar from '../components/Scrollbar';
import SearchNotFound from '../components/SearchNotFound';
import { TokenListHead, TokenListToolbar, TokenMoreMenu } from '../components/token';
import axios from 'axios'
//
import TOKENLIST from '../_mocks_/tokens';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'price', label: 'Price', alignRight: false },
  { id: 'dailypercent', label: '24H %', alignRight: false },
  { id: 'marketcap', label: 'Market Cap', alignRight: false },
  { id: 'holders', label: 'Holders', alignRight: false },
  { id: 'trustlines', label: 'Trust Lines', alignRight: false },
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
  return stabilizedThis.map((el) => el[0]);
}

export default function Token() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [labelRowsPerPage/*, setLabelRowsPerPage*/] = useState('Rows');
  const [ offset, setOffset ] = useState(0);
  const [tokens, setTokens] = useState([]);
  
  useEffect(() => {
    loadTokens(offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const loadTokens = (offset) => {
    axios.get(`http://localhost/api/v1/token/all?order_direction=desc&offset=${offset}&limit=20`)
    .then(res => {
		try {
			if (res.status === 200 && res.data) {
				let tokenList = [];
				for(var i in res.data.tokens)
					tokenList.push(res.data.tokens[i]);
				setTokens(tokenList);
			}
		} catch (error) {
			console.log(error);
		}

      //dispatch(concatinate(res.data.assets));
      //if(res.data.assets.length < 20) setHasMore(false);
      //setOffset(offset + 1);
    })
    .catch(err => {
      console.log("err->>", err);
    })
  }

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = tokens.map((n) => n.name);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
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

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - tokens.length) : 0;

  const filteredTokens = applySortFilter(tokens, getComparator(order, orderBy), filterName);

  const isTokenNotFound = filteredTokens.length === 0;

  // style={{border: '1px solid red'}}
  
  return (
    <Page title="Tokens">
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
                  {filteredTokens
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      const {
                      	account,
                      	currencyCode,
                      	currencyCodeUTF8,
                      	amount,
                      	username,
                      	kyc,
                      	created } = row;
                      const imgUrl = "/static/tokens/token_1.jpg";
                      const isItemSelected = selected.indexOf(name) !== -1;

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
                              onChange={(event) => handleClick(event, name)}
                            />
                          </TableCell>
                          <TableCell component="th" scope="row" padding="none">
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar alt={currencyCodeUTF8} src={imgUrl} />
                              <Typography variant="subtitle2" noWrap>
                                {currencyCodeUTF8}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="left">{price}</TableCell>
                          <TableCell align="left">{dailypercent}</TableCell>
                          <TableCell align="left">{marketcap}</TableCell>
                          <TableCell align="left">{holders}</TableCell>
                          <TableCell align="left">{role}</TableCell>
                          {/* <TableCell align="left">{isVerified ? 'Yes' : 'No'}</TableCell> */}
                          {/* <TableCell align="left">
                            <Label
                              variant="ghost"
                              color={(status === 'banned' && 'error') || 'success'}
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
