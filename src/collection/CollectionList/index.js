import axios from 'axios';
import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Table,
  TableBody,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { CollectionListType } from 'src/utils/constants';
import { AppContext } from 'src/AppContext';
import SearchToolbar from './SearchToolbar';
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
  const [rows, setRows] = useState(100);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('totalVol24h'); // Keep default sort by 24h volume

  const [total, setTotal] = useState(0);
  const [collections, setCollections] = useState([]);

  const [choice, setChoice] = useState('all');

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
        // Additional handling for ALL type if necessary
      } else if (type === CollectionListType.MINE) {
        body.account = account;
      } else if (type === CollectionListType.CATEGORY) {
        body.category = category;
      } else if (type === CollectionListType.LANDING) {
        // Additional handling for LANDING type if necessary
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
        });
    };
    loadCollections();
  }, [sync, order, orderBy, page, rows, account]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setSync(sync + 1);
    }, 500);
    return () => {
      clearTimeout(timer);
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
      <SearchToolbar filter={filter} setFilter={setFilter} rows={rows} setRows={setRows} />

      {type !== CollectionListType.LANDING && (
        <ToggleButtonGroup color="primary" value={choice} exclusive onChange={handleChangeChoice}>
          {/* Your existing ToggleButtons for choices */}
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
          <ListHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
          <TableBody>
            {collections.map((row, idx) => (
              <Row key={idx} id={page * rows + idx + 1} item={row} isMine={isMine} />
            ))}
          </TableBody>
        </Table>
      </Box>
      <ListToolbar rows={rows} setRows={setRows} page={page} setPage={setPage} total={total} />
    </>
  );
}
