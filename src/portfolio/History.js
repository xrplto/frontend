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
          '::-webkit-scrollbar': { display: 'none' },
          mb: 2
        }}
      >
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(e, newFilter) => newFilter && setFilter(newFilter)}
          sx={{
            '& .MuiToggleButton-root': {
              border: 'none',
              color: theme.palette.text.primary,
              fontSize: '0.875rem',
              fontWeight: 'normal',
              textTransform: 'none',
              position: 'relative',
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -1,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  backgroundColor: theme.palette.primary.main
                }
              },
              '&:hover': {
                backgroundColor: 'transparent',
                color: theme.palette.primary.main
              }
            }
          }}
        >
          <ToggleButton value="token">Tokens</ToggleButton>
          <ToggleButton value="nft">NFTs</ToggleButton>
        </ToggleButtonGroup>
      </Box>
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
