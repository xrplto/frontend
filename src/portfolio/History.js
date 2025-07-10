import {
  useTheme,
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  alpha,
  Fade,
  Chip,
  Divider
} from '@mui/material';
import DeFiHistory from './history/DeFi';
import NFTHistory from './history/NFT';
import { useState } from 'react';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CollectionsIcon from '@mui/icons-material/Collections';

const History = ({ account }) => {
  const theme = useTheme();
  const [filter, setFilter] = useState('token');

  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  const getFilterIcon = (filterType) => {
    return filterType === 'token' ? (
      <TrendingUpIcon sx={{ fontSize: '1rem' }} />
    ) : (
      <CollectionsIcon sx={{ fontSize: '1rem' }} />
    );
  };

  const getFilterStats = (filterType) => {
    // These could be dynamic based on actual data
    return filterType === 'token' ? '125' : '8';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.15)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.warning.main})`,
          opacity: 0.8
        }
      }}
    >
      <Stack spacing={0}>
        {/* Header Section */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
              <Box
                sx={{
                  p: { xs: 0.75, sm: 1 },
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.3)} 0%, transparent 100%)`,
                    pointerEvents: 'none'
                  }
                }}
              >
                <HistoryIcon
                  sx={{
                    color: 'white',
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                  }}
                />
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    mb: 0.5
                  }}
                  variant="h6"
                >
                  Trading History
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: alpha(theme.palette.text.secondary, 0.8),
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                >
                  Complete trading history and portfolio activity
                </Typography>
              </Box>
            </Stack>

            <Chip
              label={`${getFilterStats(filter)} ${filter === 'token' ? 'Trades' : 'NFTs'}`}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 600,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '& .MuiChip-label': {
                  px: 1.5,
                  py: 0.5
                }
              }}
            />
          </Stack>

          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={handleFilterChange}
            size="medium"
            sx={{
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              padding: '6px',
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
              position: 'relative',
              overflow: 'hidden',
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '16px !important',
                color: alpha(theme.palette.text.secondary, 0.8),
                fontSize: '0.9rem',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1.5,
                minWidth: '120px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                '&.Mui-selected': {
                  bgcolor: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                  fontWeight: 700,
                  boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                  transform: 'translateY(-2px)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: `linear-gradient(90deg, ${alpha(theme.palette.common.white, 0.8)}, ${alpha(theme.palette.common.white, 0.4)})`,
                    borderRadius: '16px 16px 0 0'
                  }
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`
                }
              }
            }}
          >
            <ToggleButton value="token">
              <Stack direction="row" alignItems="center" spacing={1}>
                {getFilterIcon('token')}
                <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                  Tokens
                </Typography>
              </Stack>
            </ToggleButton>
            <ToggleButton value="nft">
              <Stack direction="row" alignItems="center" spacing={1}>
                {getFilterIcon('nft')}
                <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                  NFTs
                </Typography>
              </Stack>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Content Section */}
        <Box
          sx={{
            position: 'relative',
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.4)} 0%, ${alpha(theme.palette.background.paper, 0.2)} 100%)`,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Divider
            sx={{
              background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.divider, 0.3)}, transparent)`,
              height: '1px',
              border: 'none'
            }}
          />

          <Box
            sx={{
              overflow: 'auto',
              maxHeight: '500px',
              position: 'relative',
              '&::-webkit-scrollbar': {
                width: '8px'
              },
              '&::-webkit-scrollbar-track': {
                background: alpha(theme.palette.divider, 0.05),
                borderRadius: '12px',
                margin: '8px'
              },
              '&::-webkit-scrollbar-thumb': {
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                borderRadius: '12px',
                border: `2px solid ${alpha(theme.palette.background.paper, 0.2)}`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                }
              },
              msOverflowStyle: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: `${theme.palette.primary.main} ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Box
              sx={{
                p: 3,
                transition: 'all 0.3s ease',
                minHeight: '300px',
                position: 'relative'
              }}
            >
              <Fade in={true} timeout={500}>
                <Box>
                  {filter === 'token' ? (
                    <DeFiHistory account={account} />
                  ) : (
                    <NFTHistory account={account} />
                  )}
                </Box>
              </Fade>
            </Box>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

export default History;
