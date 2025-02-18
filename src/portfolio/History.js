import {
  useTheme,
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Stack
} from '@mui/material';
import DeFiHistory from './history/DeFi';
import NFTHistory from './history/NFT';
import { useState } from 'react';
import HistoryIcon from '@mui/icons-material/History';

const History = ({ account }) => {
  const theme = useTheme();
  const [filter, setFilter] = useState('token');

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Stack spacing={0}>
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <HistoryIcon sx={{ color: theme.palette.primary.main, fontSize: '1.3rem' }} />
            <Typography
              sx={{
                color: theme.palette.text.primary,
                fontSize: '1.1rem',
                fontWeight: 500,
                lineHeight: 1
              }}
              variant="h6"
            >
              Historical Trades
            </Typography>
          </Stack>

          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(e, newFilter) => newFilter && setFilter(newFilter)}
            size="small"
            sx={{
              bgcolor: theme.palette.action.hover,
              borderRadius: '8px',
              padding: '2px',
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '6px !important',
                color: theme.palette.text.secondary,
                fontSize: '0.875rem',
                fontWeight: 'normal',
                textTransform: 'none',
                px: 2,
                py: 0.5,
                minWidth: '80px',
                '&.Mui-selected': {
                  bgcolor: theme.palette.background.paper,
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  boxShadow: theme.shadows[1]
                },
                '&:hover': {
                  bgcolor: theme.palette.background.paper,
                  color: theme.palette.primary.main
                }
              }
            }}
          >
            <ToggleButton value="token">Tokens</ToggleButton>
            <ToggleButton value="nft">NFTs</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box
          sx={{
            overflow: 'auto',
            maxHeight: '475px',
            bgcolor: theme.palette.background.default,
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            '-ms-overflow-style': 'none',
            'scrollbar-width': 'none'
          }}
        >
          {filter === 'token' ? (
            <DeFiHistory account={account} />
          ) : (
            <NFTHistory account={account} />
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

export default History;
