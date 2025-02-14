import { useTheme, Box, Typography, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import DeFiHistory from './history/DeFi';
import NFTHistory from './history/NFT';
import { useState } from 'react';

const History = ({ account }) => {
  const theme = useTheme();
  const [filter, setFilter] = useState('token');

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  return (
    <Box sx={{ bgcolor: theme.palette.background.paper, py: 3, borderRadius: 2 }}>
      <Typography sx={{ color: theme.palette.text.primary, mb: 3 }} variant="h5">
        Historical Trades
      </Typography>
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(e, newFilter) => newFilter && setFilter(newFilter)}
        sx={{ mb: 2 }}
        size="small"
      >
        <ToggleButton value="token" sx={{ px: 1.5, py: 0.5 }}>
          Tokens
        </ToggleButton>
        <ToggleButton value="nft" sx={{ px: 1.5, py: 0.5 }}>
          NFTs
        </ToggleButton>
      </ToggleButtonGroup>
      <Paper
        sx={{
          width: '100%',
          overflow: 'auto',
          maxHeight: '475px',
          color: theme.palette.text.primary,
          bgcolor: theme.palette.background.default,
          boxShadow: 3,
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none'
        }}
      >
        {filter === 'token' ? <DeFiHistory account={account} /> : <NFTHistory account={account} />}
      </Paper>
    </Box>
  );
};

export default History;
