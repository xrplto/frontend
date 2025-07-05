import {
  useTheme,
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  alpha
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
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 12px 48px ${alpha(theme.palette.common.black, 0.12)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.info.main}, ${theme.palette.success.main})`,
          opacity: 0.8
        }
      }}
    >
      <Stack spacing={0}>
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
            <Box
              sx={{
                p: 1.2,
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 6px 20px ${alpha(theme.palette.warning.main, 0.3)}`,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.2)} 0%, transparent 100%)`,
                  pointerEvents: 'none'
                }
              }}
            >
              <HistoryIcon
                sx={{
                  color: 'white',
                  fontSize: '1.4rem',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }}
              />
            </Box>
            <Box>
              <Typography
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  mb: 0.5
                }}
                variant="h6"
              >
                Historical Trades
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: alpha(theme.palette.text.secondary, 0.8),
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                Complete trading history and activity
              </Typography>
            </Box>
          </Stack>

          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(e, newFilter) => newFilter && setFilter(newFilter)}
            size="medium"
            sx={{
              bgcolor: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '4px',
              border: `2px solid ${alpha(theme.palette.warning.main, 0.15)}`,
              boxShadow: `0 4px 20px ${alpha(theme.palette.warning.main, 0.08)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.info.main})`,
                opacity: 0.6
              },
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '12px !important',
                color: alpha(theme.palette.text.secondary, 0.8),
                fontSize: '0.9rem',
                fontWeight: 600,
                textTransform: 'none',
                px: 2.5,
                py: 1,
                minWidth: '100px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                '&.Mui-selected': {
                  bgcolor: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
                  color: 'white',
                  fontWeight: 700,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.3)}, 0 2px 4px ${alpha(theme.palette.common.black, 0.1)}`,
                  transform: 'translateY(-1px)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: `linear-gradient(90deg, ${alpha(theme.palette.common.white, 0.8)}, ${alpha(theme.palette.common.white, 0.4)})`,
                    borderRadius: '12px 12px 0 0'
                  }
                },
                '&:hover': {
                  bgcolor: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)} 0%, ${alpha(theme.palette.warning.main, 0.08)} 100%)`,
                  color: theme.palette.warning.main,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.15)}`
                }
              }
            }}
          >
            <ToggleButton value="token">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: theme.palette.warning.main,
                    opacity: filter === 'token' ? 1 : 0.4,
                    transition: 'all 0.2s ease'
                  }}
                />
                Tokens
              </Box>
            </ToggleButton>
            <ToggleButton value="nft">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: theme.palette.info.main,
                    opacity: filter === 'nft' ? 1 : 0.4,
                    transition: 'all 0.2s ease'
                  }}
                />
                NFTs
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box
          sx={{
            overflow: 'auto',
            maxHeight: '475px',
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
            backdropFilter: 'blur(10px)',
            position: 'relative',
            '&::-webkit-scrollbar': {
              width: '6px'
            },
            '&::-webkit-scrollbar-track': {
              background: alpha(theme.palette.divider, 0.1),
              borderRadius: '10px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              borderRadius: '10px',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
              }
            },
            msOverflowStyle: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: `${theme.palette.primary.main} ${alpha(theme.palette.divider, 0.1)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.divider, 0.3)}, transparent)`
            }
          }}
        >
          <Box
            sx={{
              p: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.1)} 0%, transparent 100%)`
              }
            }}
          >
            {filter === 'token' ? (
              <DeFiHistory account={account} />
            ) : (
              <NFTHistory account={account} />
            )}
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

export default History;
