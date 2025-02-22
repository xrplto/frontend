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
  CircularProgress
} from '@mui/material';

// Icons
import LinkIcon from '@mui/icons-material/Link';
import BarChartIcon from '@mui/icons-material/BarChart';

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
              <TableCell>Total Volume</TableCell>
              <TableCell>ROI</TableCell>
              <TableCell>Win Rate</TableCell>
              <TableCell>Total Trades</TableCell>
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
                  <Typography variant="subtitle1">{fNumber(trader.totalVolume)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="subtitle1"
                    sx={{ color: trader.roi >= 0 ? '#54D62C' : '#FF6C40' }}
                  >
                    {fPercent(trader.roi * 100)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1">
                    {fPercent(
                      (trader.profitableTrades / (trader.profitableTrades + trader.losingTrades)) *
                        100
                    )}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1">{fNumber(trader.totalTrades)}</Typography>
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
