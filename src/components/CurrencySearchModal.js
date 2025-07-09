import { useContext, useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { AppContext } from 'src/AppContext';
import { BASE_URL } from 'src/utils/constants';
import axios from 'axios';
import { Icon } from '@iconify/react';
import {
  Box,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Tooltip,
  Divider,
  Dialog,
  DialogContent,
  IconButton,
  Grid,
  Skeleton,
  Avatar,
  alpha
} from '@mui/material';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import searchFill from '@iconify/icons-eva/search-fill';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';

const MAX_RECENT_SEARCHES = 6;
const MAX_DISPLAY_TOKENS = 21; // 7 rows of 3 tokens

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '...' : str;
}

export default function CurrencySearchModal({
  onDismiss = () => null,
  token,
  onChangeToken,
  open
}) {
  const { darkMode } = useContext(AppContext);
  const [searchFilter, setSearchFilter] = useState('');
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(searches);
  }, [open]);

  const addToRecentSearches = (token) => {
    const updatedSearches = [token, ...recentSearches.filter((t) => t.md5 !== token.md5)].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const renderTokenItem = (row) => {
    const { md5, name, user, kyc, isOMCF } = row;
    const imgUrl = `https://s1.xrpl.to/token/${md5}`;

    return (
      <Grid item xs={12} sm={6} md={4} key={md5}>
        <Box
          onClick={() => handleChangetoken(row)}
          sx={{
            p: 1.5,
            borderRadius: 2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha('#ffffff', 0.02)} 0%, ${alpha('#ffffff', 0.01)} 100%)`
              : `linear-gradient(135deg, ${alpha('#000000', 0.02)} 0%, ${alpha('#000000', 0.01)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.success.main, 0.08)}, transparent)`,
              transition: 'left 0.4s ease'
            },
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`
                : `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.06)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
              transform: 'translateY(-1px)',
              boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.12)}`,
              '&::before': {
                left: '100%'
              }
            }
          }}
        >
          <Box position="relative">
            <Avatar
              src={imgUrl}
              alt={name}
              sx={{ width: 32, height: 32 }}
              imgProps={{
                onError: (e) => {
                  e.target.src = '/static/alt.webp';
                }
              }}
            />
            {kyc && (
              <Tooltip title="KYC Verified">
                <CheckCircleIcon 
                  sx={{ 
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    fontSize: 14,
                    color: '#00AB55',
                    bgcolor: 'background.paper',
                    borderRadius: '50%'
                  }} 
                />
              </Tooltip>
            )}
          </Box>
          <Box flex={1} minWidth={0}>
            <Typography
              variant="body2"
              fontWeight={600}
              color={isOMCF !== 'yes' ? 'text.primary' : '#1db954'}
              noWrap
              sx={{ lineHeight: 1.2 }}
            >
              {name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ lineHeight: 1.2, fontSize: '0.7rem' }}
            >
              {truncate(user, 20)}
            </Typography>
          </Box>
          <ArrowForwardIcon 
            sx={{ 
              color: 'text.secondary',
              fontSize: 16
            }} 
          />
        </Box>
      </Grid>
    );
  };

  useEffect(() => {
    const searchTokens = async () => {
      if (!searchFilter) {
        setFilteredTokens(tokens);
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/xrpnft/tokens?filter=${searchFilter}`);
        if (res.status === 200 && res.data) {
          setFilteredTokens(res.data.tokens || []);
        }
      } catch (err) {
        console.error('Search error:', err);
        setFilteredTokens([]);
      } finally {
        setLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(searchTokens, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchFilter, tokens]);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/xrpnft/tokens`);
      if (res.status === 200 && res.data) {
        const exist = (res.data.tokens || []).find((t) => t.md5 === token?.md5);
        if (exist) {
          setTokens(res.data.tokens);
        } else if (token) {
          setTokens([token, ...res.data.tokens]);
        } else {
          setTokens(res.data.tokens || []);
        }
      }
    } catch (err) {
      console.error('Load tokens error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadTokens();
  }, [open]);

  const handleChangeFilter = (e) => {
    setSearchFilter(e.target.value);
  };

  const handleChangetoken = (_token) => {
    addToRecentSearches(_token);
    onChangeToken(_token);
    onDismiss();
  };

  return (
    <Dialog
      open={open}
      onClose={onDismiss}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '90vw',
          maxWidth: 1200,
          m: 2,
          borderRadius: 3,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha('#000000', 0.95)} 0%, ${alpha('#0a0a0a', 0.9)} 100%)`
            : `linear-gradient(135deg, ${alpha('#ffffff', 0.98)} 0%, ${alpha('#f8f9fa', 0.95)} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.3)}`
        }
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, 
              ${theme.palette.primary.main} 0%, 
              ${theme.palette.success.main} 50%, 
              ${theme.palette.primary.main} 100%
            )`,
            opacity: 0.3
          }
        }}
      >
        <Typography 
          variant="h6" 
          fontWeight={600}
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`
              : theme.palette.text.primary,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: theme.palette.mode === 'dark' ? 'transparent' : 'inherit'
          }}
        >
          Select a Token
        </Typography>
        <IconButton 
          onClick={onDismiss}
          sx={{
            color: theme.palette.text.secondary,
            transition: 'all 0.2s',
            '&:hover': {
              color: theme.palette.error.main,
              transform: 'rotate(90deg)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 2, overflow: 'hidden' }}>
        <TextField
          fullWidth
          placeholder="Search token name or paste address"
          value={searchFilter}
          onChange={handleChangeFilter}
          size="small"
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              fontSize: '0.875rem',
              borderRadius: 2,
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha('#ffffff', 0.03)} 0%, ${alpha('#ffffff', 0.01)} 100%)`
                : `linear-gradient(135deg, ${alpha('#000000', 0.02)} 0%, ${alpha('#000000', 0.01)} 100%)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              transition: 'all 0.3s',
              '&:hover': {
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.05)}`
              },
              '&.Mui-focused': {
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`
              },
              '& fieldset': {
                border: 'none'
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon 
                  icon={searchFill} 
                  width={20}
                  style={{
                    color: theme.palette.primary.main,
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                  }}
                />
              </InputAdornment>
            )
          }}
        />

        {!searchFilter && recentSearches.length > 0 && (
          <Box mb={2}>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              mb={1.5}
              p={1}
              background={theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`
                : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`}
              borderRadius={2}
              border={`1px solid ${alpha(theme.palette.primary.main, 0.1)}`}
              backdropFilter="blur(10px)"
            >
              <HistoryIcon 
                sx={{ 
                  fontSize: 18,
                  color: theme.palette.primary.main,
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                }} 
              />
              <Typography 
                variant="body2" 
                fontWeight={600}
                sx={{
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Recent Searches
              </Typography>
            </Box>
            <Grid container spacing={1}>
              {recentSearches.map((row) => renderTokenItem(row))}
            </Grid>
            <Divider sx={{ mt: 2 }} />
          </Box>
        )}

        <Box>
          <Typography 
            variant="body2" 
            fontWeight={600} 
            mb={1.5}
            sx={{
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`
                : theme.palette.text.primary,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: theme.palette.mode === 'dark' ? 'transparent' : 'inherit'
            }}
          >
            All Tokens
          </Typography>
          <Grid container spacing={1}>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton variant="rounded" height={60} />
                </Grid>
              ))
            ) : filteredTokens.length > 0 ? (
              filteredTokens.slice(0, MAX_DISPLAY_TOKENS).map((row) => renderTokenItem(row))
            ) : (
              <Grid item xs={12}>
                <Typography
                  textAlign="center"
                  color="text.secondary"
                  py={3}
                  variant="body2"
                >
                  {searchFilter ? 'No tokens found' : 'No tokens available'}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
}