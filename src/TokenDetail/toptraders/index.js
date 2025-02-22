import { useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Material
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Link,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip
} from '@mui/material';

// Icons
import LinkIcon from '@mui/icons-material/Link';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber, fPercent } from 'src/utils/formatNumber';

// Components
import { StatsModal } from 'src/components/trader/TraderStats';

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function TopTraders({ token }) {
  const BASE_URL = process.env.API_URL;
  const { darkMode } = useContext(AppContext);

  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [traderStats, setTraderStats] = useState({});

  useEffect(() => {
    const fetchTopTraders = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/analytics/top-traders/${token.md5}?limit=1000`
        );
        if (response.status === 200) {
          setTraders(response.data);
        }
      } catch (error) {
        console.error('Error fetching top traders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopTraders();
  }, [token.md5]);

  const handleOpenStats = (trader) => {
    setSelectedTrader(trader);
    setTraderStats((prev) => ({
      ...prev,
      [trader.address]: trader
    }));
  };

  const handleCloseStats = () => {
    setSelectedTrader(null);
  };

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ overflow: 'auto', width: '100%' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Volume (24h)</TableCell>
              <TableCell>Volume (7d)</TableCell>
              <TableCell>Total Volume</TableCell>
              <TableCell>ROI</TableCell>
              <TableCell>Win Rate</TableCell>
              <TableCell>Trades</TableCell>
              <TableCell>Avg Hold</TableCell>
              <TableCell>Best Trade</TableCell>
              <TableCell>Worst Trade</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {traders.map((trader, index) => (
              <TableRow key={trader.address}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center">
                    <Link
                      underline="none"
                      color="inherit"
                      target="_blank"
                      href={`https://bithomp.com/explorer/${trader.address}`}
                      rel="noreferrer noopener nofollow"
                    >
                      <Typography variant="subtitle1" color="primary">
                        {truncate(trader.address, 20)}
                      </Typography>
                    </Link>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1">{fNumber(trader.volume24h)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1">{fNumber(trader.volume7d)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1">{fNumber(trader.totalVolume)}</Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {trader.roi >= 0 ? (
                      <TrendingUpIcon sx={{ color: '#54D62C', fontSize: 16 }} />
                    ) : (
                      <TrendingDownIcon sx={{ color: '#FF6C40', fontSize: 16 }} />
                    )}
                    <Typography
                      variant="subtitle1"
                      sx={{ color: trader.roi >= 0 ? '#54D62C' : '#FF6C40' }}
                    >
                      {fPercent(trader.roi * 100)}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    label={fPercent(
                      (trader.profitableTrades / (trader.profitableTrades + trader.losingTrades)) *
                        100
                    )}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(84, 214, 44, 0.16)',
                      color: '#54D62C',
                      height: '24px'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="column" spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      24h: {fNumber(trader.trades24h)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total: {fNumber(trader.totalTrades)}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1">
                    {formatDuration(trader.avgHoldingTime)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1" sx={{ color: '#54D62C' }}>
                    {fNumber(trader.maxProfitTrade)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1" sx={{ color: '#FF6C40' }}>
                    {fNumber(Math.abs(trader.maxLossTrade))}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Link
                      underline="none"
                      color="inherit"
                      target="_blank"
                      href={`https://bithomp.com/explorer/${trader.address}`}
                      rel="noreferrer noopener nofollow"
                    >
                      <IconButton edge="end" aria-label="bithomp">
                        <LinkIcon />
                      </IconButton>
                    </Link>
                    <Tooltip title="View Trader Statistics">
                      <IconButton
                        edge="end"
                        aria-label="stats"
                        onClick={() => handleOpenStats(trader)}
                      >
                        <BarChartIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <StatsModal
        open={Boolean(selectedTrader)}
        onClose={handleCloseStats}
        account={selectedTrader?.address}
        traderStats={traderStats}
      />
    </>
  );
}
