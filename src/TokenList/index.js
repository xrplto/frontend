import axios from 'axios';
import { useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket from 'react-use-websocket';
import {
  Box,
  Table,
  TableBody,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { useDispatch, useSelector } from 'react-redux';
import {
  update_metrics,
  update_filteredCount,
  selectMetrics
} from 'src/redux/statusSlice';
import TokenListHead from './TokenListHead';
import TokenListToolbar from './TokenListToolbar';
import SearchToolbar from './SearchToolbar';
import { TokenRow } from './TokenRow';
import EditTokenDialog from 'src/components/EditTokenDialog';
import TrustSetDialog from 'src/components/TrustSetDialog';

const useStyles = makeStyles({
  tableContainer: {
    display: 'flex',
    gap: 1,
    py: 1,
    overflow: 'auto',
    width: '100%',
    '& > *': {
      scrollSnapAlign: 'center'
    },
    '::-webkit-scrollbar': { display: 'none' }
  },
  tableCell: {
    borderBottom: 'none',
    padding: (props) => (props.isMobile ? '4px' : '16px')
  }
});

export default function TokenList({
  showWatchList,
  tag,
  tagName,
  tags,
  tokens,
  setTokens,
  tMap
}) {
  const { accountProfile, openSnackbar, setLoading, darkMode, activeFiatCurrency } = useContext(AppContext);
  const theme = useTheme();
  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency];
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const classes = useStyles({ isMobile });

  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
  const BASE_URL = process.env.API_URL;

  const [filterName, setFilterName] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('vol24hxrp');
  const [sync, setSync] = useState(showWatchList ? 1 : 0);
  const [editToken, setEditToken] = useState(null);
  const [trustToken, setTrustToken] = useState(null);
  const [rows, setRows] = useState(100);
  const [showNew, setShowNew] = useState(false);
  const [showSlug, setShowSlug] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [viewType, setViewType] = useState("row");

  const tableContainerRef = useRef(null);
  const tableRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTopLength, setScrollTopLength] = useState(0);

  useEffect(() => {
    const handleScrollX = () => {
      setScrollLeft(tableContainerRef.current?.scrollLeft > 0);
    };

    const handleScrollY = () => {
      const tableOffsetTop = tableRef.current?.offsetTop;
      const tableHeight = tableRef.current?.clientHeight;
      const scrollTop = window.scrollY;
      const anchorTop = tableOffsetTop;
      const anchorBottom = tableOffsetTop + tableHeight;

      if (scrollTop > anchorTop && scrollTop < anchorBottom) {
        setScrollTopLength(scrollTop - anchorTop);
      } else {
        setScrollTopLength(0);
      }
    };

    tableContainerRef.current?.addEventListener('scroll', handleScrollX);
    window.addEventListener('scroll', handleScrollY);

    return () => {
      tableContainerRef.current?.removeEventListener('scroll', handleScrollX);
      window.removeEventListener('scroll', handleScrollY);
    };
  }, []);

  const [watchList, setWatchList] = useState([]);

  const { sendJsonMessage } = useWebSocket(WSS_FEED_URL, {
    shouldReconnect: () => true,
    onMessage: (event) => processMessages(event)
  });

  const applyTokenChanges = useCallback((newTokens) => {
    newTokens.forEach(t => {
      const token = tMap.get(t.md5);
      if (token) {
        token.time = Date.now();
        token.bearbull = token.exch > t.exch ? -1 : 1;
        Object.assign(token, t);
      }
    });
  }, [tMap]);

  const processMessages = useCallback((event) => {
    try {
      const json = JSON.parse(event.data);
      dispatch(update_metrics(json));
      if (json.tokens && json.tokens.length > 0) {
        applyTokenChanges(json.tokens);
      }
    } catch (err) {
      console.error(err);
    }
  }, [applyTokenChanges, dispatch]);

  const loadTokens = useCallback(() => {
    const start = page * rows + 1;
    const ntag = tag || '';
    const watchAccount = showWatchList ? accountProfile?.account || '' : '';

    axios
      .get(`${BASE_URL}/tokens?tag=${ntag}&watchlist=${watchAccount}&start=${start}&limit=${rows}&sortBy=${orderBy}&sortType=${order}&filter=${filterName}&showNew=${showNew}&showSlug=${showSlug}&showDate=${showDate}`)
      .then((res) => {
        if (res.status === 200 && res.data) {
          const ret = res.data;
          dispatch(update_metrics(ret));
          dispatch(update_filteredCount(ret));
          setTokens(ret.tokens);
        }
      })
      .catch((err) => console.log('err->>', err))
      .finally(() => setSearch(filterName));
  }, [accountProfile, filterName, order, orderBy, page, rows, showDate, showNew, showSlug, showWatchList, tag, dispatch, setTokens]);

  useEffect(() => {
    if (sync > 0) loadTokens();
  }, [loadTokens, sync]);

  useEffect(() => {
    const getWatchList = () => {
      const account = accountProfile?.account;
      if (!account) {
        setWatchList([]);
        return;
      }

      axios
        .get(`${BASE_URL}/watchlist/get_list?account=${account}`)
        .then((res) => {
          if (res.status === 200) {
            setWatchList(res.data.watchlist);
          }
        })
        .catch((err) => console.log('Error on getting watchlist!', err));
    };
    getWatchList();
  }, [accountProfile, sync]);

  const onChangeWatchList = async (md5) => {
    const account = accountProfile?.account;
    const accountToken = accountProfile?.token;

    if (!account || !accountToken) {
      openSnackbar('Please login!', 'error');
      return;
    }

    setLoading(true);
    try {
      const action = watchList.includes(md5) ? 'remove' : 'add';
      const body = { md5, account, action };

      const res = await axios.post(`${BASE_URL}/watchlist/update_watchlist`, body, {
        headers: { 'x-access-token': accountToken }
      });

      if (res.status === 200) {
        const ret = res.data;
        if (ret.status) {
          setWatchList(ret.watchlist);
          openSnackbar('Successful!', 'success');
          if (showWatchList) {
            setSync(sync + 1);
          }
        } else {
          openSnackbar(ret.err, 'error');
        }
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const handleRequestSort = (event, id) => {
    const isDesc = orderBy === id && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
    setOrderBy(id);
    setPage(0);
    setSync(sync + 1);
  };

  const updatePage = (newPage) => {
    if (newPage !== page) {
      setPage(newPage);
      setSync(sync + 1);
    }
  };

  const updateRows = (newRows) => {
    if (newRows !== rows) {
      setRows(newRows);
      if (tokens.length < newRows) setSync(sync + 1);
    }
  };

  const updateShowNew = (val) => {
    setShowNew(val);
    setPage(0);
    setSync(sync + 1);
  };

  const updateShowSlug = (val) => {
    setShowSlug(val);
    setPage(0);
    setSync(sync + 1);
  };

  const updateShowDate = (val) => {
    setShowDate(val);
    setPage(0);
    setSync(sync + 1);
  };

  const handleFilterByName = (event) => {
    setFilterName(event.target.value);
    setPage(0);
    setSync(sync + 1);
  };

  return (
    <>
      {editToken && (
        <EditTokenDialog token={editToken} setToken={setEditToken} />
      )}

      {trustToken && (
        <TrustSetDialog token={trustToken} setToken={setTrustToken} />
      )}

      <SearchToolbar
        tags={tags}
        tagName={tagName}
        filterName={filterName}
        onFilterName={handleFilterByName}
        rows={rows}
        setRows={updateRows}
        showNew={showNew}
        setShowNew={updateShowNew}
        showSlug={showSlug}
        setShowSlug={updateShowSlug}
        showDate={showDate}
        setShowDate={updateShowDate}
        viewType={viewType}
        setViewType={setViewType}
      />
      
      <Box className={classes.tableContainer} ref={tableContainerRef}>
        <Table ref={tableRef}>
          <TokenListHead
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            scrollLeft={scrollLeft}
            tokens={tokens}
            scrollTopLength={scrollTopLength}
          />
          <TableBody>
            {tokens.slice(0, rows).map((row, idx) => (
              <TokenRow
                key={idx}
                time={row.time}
                idx={idx + page * rows}
                token={row}
                setEditToken={setEditToken}
                setTrustToken={setTrustToken}
                watchList={watchList}
                onChangeWatchList={onChangeWatchList}
                scrollLeft={scrollLeft}
                activeFiatCurrency={activeFiatCurrency}
                exchRate={exchRate}
              />
            ))}
          </TableBody>
        </Table>
      </Box>
      <TokenListToolbar
        rows={rows}
        setRows={updateRows}
        page={page}
        setPage={updatePage}
      />
    </>
  );
}
