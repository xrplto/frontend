import {
  Box,
  IconButton,
  InputBase,
  Modal,
  Paper,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CollectionsIcon from '@mui/icons-material/Collections';
import { useState, useEffect, useRef, useCallback, useContext, useMemo, memo, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import useDebounce from 'src/hooks';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { fNumberWithCurreny } from 'src/utils/formatNumber';

const API_URL = process.env.API_URL || '';
const NFT_API_URL = 'https://api.xrpnft.com/api';

// Cache for preloaded data
let cachedTrendingData = {
  tokens: [],
  collections: [],
  lastFetch: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Preload trending data
const preloadTrendingData = async () => {
  const now = Date.now();
  if (now - cachedTrendingData.lastFetch < CACHE_DURATION) {
    return cachedTrendingData;
  }

  try {
    const [tokensRes, collectionsRes] = await Promise.all([
      axios.post(`${API_URL}/search`, { search: '' }),
      axios.post(`${NFT_API_URL}/search`, { 
        search: '', 
        type: 'SEARCH_ITEM_COLLECTION_ACCOUNT' 
      })
    ]);

    cachedTrendingData = {
      tokens: tokensRes.data?.tokens?.slice(0, 4) || [],
      collections: collectionsRes.data?.collections?.slice(0, 3) || [],
      lastFetch: now
    };
  } catch (error) {
    console.error('Error preloading trending data:', error);
  }

  return cachedTrendingData;
};

// Start preloading immediately
preloadTrendingData();

// Set up interval to refresh cache (only in browser)
if (typeof window !== 'undefined') {
  setInterval(preloadTrendingData, CACHE_DURATION);
}

// Memoized price formatter
const formatPrice = (price) => {
  if (price === 0) return '0.00';
  if (price < 0.00000001) return parseFloat(price).toFixed(12);
  if (price < 0.0000001) return parseFloat(price).toFixed(10);
  if (price < 0.000001) return parseFloat(price).toFixed(8);
  if (price < 0.0001) return parseFloat(price).toFixed(6);
  if (price < 1) return parseFloat(price).toFixed(4);
  return parseFloat(price).toFixed(2);
};

function SearchModal({ open, onClose }) {
  const theme = useTheme();
  const router = useRouter();
  const inputRef = useRef(null);
  const { activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency] || 1;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ tokens: [], collections: [] });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingTokens, setTrendingTokens] = useState([]);
  const [trendingCollections, setTrendingCollections] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    if (!open) return;
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, [open]);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Use requestAnimationFrame for smoother focus
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Use preloaded trending data when modal opens
  useEffect(() => {
    if (!open) return;
    
    const loadTrending = async () => {
      setLoadingTrending(true);
      
      // Use cached data if available
      const cached = await preloadTrendingData();
      
      setTrendingTokens(cached.tokens);
      setTrendingCollections(cached.collections);
      setLoadingTrending(false);
    };

    loadTrending();
  }, [open]);

  // Perform search
  useEffect(() => {
    if (!debouncedSearchQuery || !open) {
      setSearchResults({ tokens: [], collections: [] });
      return;
    }

    const controller = new AbortController();

    const searchTokens = async () => {
      setLoading(true);
      try {
        const response = await axios.post(`${API_URL}/search`, {
          search: debouncedSearchQuery
        }, { signal: controller.signal });
        
        if (response.data?.tokens) {
          setSearchResults(prev => ({
            ...prev,
            tokens: response.data.tokens.slice(0, 5)
          }));
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Search error:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    searchTokens();
    
    return () => controller.abort();
  }, [debouncedSearchQuery, open]);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    setSearchResults({ tokens: [], collections: [] });
    onClose();
  }, [onClose]);

  const handleResultClick = useCallback((item, type) => {
    // Add to recent searches with all necessary data
    const newRecent = {
      ...item,
      type,
      timestamp: Date.now(),
      // Ensure we have all required properties for display
      slug: item.slug,
      md5: item.md5,
      user: item.user,
      name: item.name,
      logoImage: item.logoImage // for collections
    };
    
    const updated = [newRecent, ...recentSearches.filter(r => 
      r.slug !== item.slug || r.type !== type
    )].slice(0, 5);
    setRecentSearches(updated);
    
    // Defer localStorage write
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      });
    } else {
      // Fallback for environments without requestIdleCallback
      setTimeout(() => {
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      }, 0);
    }
    
    // Close modal first for better perceived performance
    handleClose();
    
    // Navigate to result using full page reload
    requestAnimationFrame(() => {
      if (type === 'token') {
        window.location.href = `/token/${item.slug}`;
      } else if (type === 'collection') {
        window.location.href = `/collection/${item.slug}`;
      }
    });
  }, [recentSearches, handleClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  // Memoize styles to prevent recalculation
  const modalStyles = useMemo(() => ({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    pt: '10vh',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    backgroundColor: alpha(theme.palette.background.default, 0.85)
  }), [theme]);

  const paperStyles = useMemo(() => ({
    width: '90%',
    maxWidth: 600,
    maxHeight: '70vh',
    overflow: 'hidden',
    borderRadius: { xs: '10px', sm: '16px' },
    background: theme.palette.background.paper,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
    boxShadow: theme.shadows[24]
  }), [theme]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={modalStyles}
      keepMounted={false}
      disablePortal={false}
    >
      <Paper
        sx={paperStyles}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.default
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <SearchIcon color="action" />
            <InputBase
              ref={inputRef}
              placeholder="Search tokens and collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              sx={{
                fontSize: '1.1rem',
                '& input': {
                  padding: 0
                }
              }}
            />
            {loading && <CircularProgress size={20} />}
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Search Results */}
        <Box
          sx={{
            maxHeight: 'calc(70vh - 80px)',
            overflowY: 'auto',
            backgroundColor: theme.palette.background.default
          }}
        >
          {/* Show trending when no search query */}
          {!searchQuery && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ px: 2, pt: 1.5, pb: 0.5 }} color="text.secondary">
                    Recent Searches
                  </Typography>
                  <List disablePadding dense>
                    {recentSearches.slice(0, 3).map((item, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemButton 
                          onClick={() => {
                            // Close modal first for better perceived performance
                            handleClose();
                            
                            // Navigate directly for recent searches using full page reload
                            requestAnimationFrame(() => {
                              if (item.type === 'token') {
                                window.location.href = `/token/${item.slug}`;
                              } else if (item.type === 'collection') {
                                window.location.href = `/collection/${item.slug}`;
                              }
                            });
                          }} 
                          sx={{ py: 0.5 }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              src={item.type === 'collection' 
                                ? `https://s1.xrpnft.com/collection/${item.logoImage}` 
                                : `https://s1.xrpl.to/token/${item.md5}`}
                              sx={{ width: 28, height: 28 }}
                              imgProps={{ loading: 'lazy', decoding: 'async' }}
                            >
                              {item.user?.[0] || item.name?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={item.user || item.name}
                            secondary={item.name}
                            primaryTypographyProps={{ fontSize: '0.85rem' }}
                            secondaryTypographyProps={{ fontSize: '0.75rem' }}
                          />
                          <Chip
                            label={item.type}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 0.5 }} />
                </>
              )}

              {/* Trending Tokens */}
              {!loadingTrending && trendingTokens.length > 0 && (
                <>
                  <Stack direction="row" alignItems="center" sx={{ px: 2, pt: 1, pb: 0.5 }} spacing={1}>
                    <TrendingUpIcon color="primary" sx={{ fontSize: 18 }} />
                    <Typography variant="subtitle2" fontWeight={600} fontSize="0.85rem">
                      Trending Tokens
                    </Typography>
                  </Stack>
                  <List disablePadding dense>
                    {trendingTokens.map((token, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemButton onClick={() => handleResultClick(token, 'token')} sx={{ py: 0.5, px: 2 }}>
                          <ListItemAvatar sx={{ minWidth: 36 }}>
                            <Avatar
                              src={`https://s1.xrpl.to/token/${token.md5}`}
                              sx={{ width: 28, height: 28 }}
                              imgProps={{ loading: 'lazy', decoding: 'async' }}
                            />
                          </ListItemAvatar>
                          <ListItemText
                            primary={token.user}
                            secondary={token.name}
                            primaryTypographyProps={{ fontSize: '0.85rem', noWrap: true }}
                            secondaryTypographyProps={{ fontSize: '0.75rem', noWrap: true }}
                            sx={{ pr: 1 }}
                          />
                          <Stack alignItems="flex-end" spacing={0}>
                            {token.exch !== undefined && token.exch !== null && (
                              <Typography variant="body2" fontSize="0.8rem" fontWeight={500}>
                                ${formatPrice(token.exch)}
                              </Typography>
                            )}
                            {token.pro24h !== undefined && token.pro24h !== null && (
                              <Typography 
                                variant="caption" 
                                fontSize="0.7rem"
                                color={parseFloat(token.pro24h) >= 0 ? 'success.main' : 'error.main'}
                                fontWeight={600}
                              >
                                {parseFloat(token.pro24h) >= 0 ? '+' : ''}{parseFloat(token.pro24h).toFixed(2)}%
                              </Typography>
                            )}
                          </Stack>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* Trending NFT Collections */}
              {!loadingTrending && trendingCollections.length > 0 && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <Stack direction="row" alignItems="center" sx={{ px: 2, pt: 0.5, pb: 0.5 }} spacing={1}>
                    <CollectionsIcon color="success" sx={{ fontSize: 18 }} />
                    <Typography variant="subtitle2" fontWeight={600} fontSize="0.85rem">
                      Trending NFT Collections
                    </Typography>
                  </Stack>
                  <List disablePadding dense>
                    {trendingCollections.map((collection, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemButton onClick={() => handleResultClick(collection, 'collection')} sx={{ py: 0.5, px: 2 }}>
                          <ListItemAvatar sx={{ minWidth: 36 }}>
                            <Avatar
                              src={`https://s1.xrpnft.com/collection/${collection.logoImage}`}
                              sx={{ width: 28, height: 28 }}
                              imgProps={{ loading: 'lazy', decoding: 'async' }}
                            />
                          </ListItemAvatar>
                          <ListItemText
                            primary={collection.name}
                            secondary={collection.type ? `${collection.type} collection` : 'Collection'}
                            primaryTypographyProps={{ fontSize: '0.85rem', noWrap: true }}
                            secondaryTypographyProps={{ fontSize: '0.75rem', noWrap: true }}
                            sx={{ pr: 1 }}
                          />
                          <Stack alignItems="flex-end" spacing={0}>
                            {collection.floor && collection.floor.amount && (
                              <Typography variant="body2" fontSize="0.8rem" fontWeight={500}>
                                Floor: {collection.floor.amount} {collection.floor.currency || 'XRP'}
                              </Typography>
                            )}
                            {collection.totalVolume !== undefined && collection.totalVolume > 0 && (
                              <Typography variant="caption" fontSize="0.7rem" color="text.secondary">
                                Vol: {collection.totalVolume.toLocaleString()} XRP
                              </Typography>
                            )}
                          </Stack>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* Loading state for trending */}
              {loadingTrending && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </>
          )}

          {/* Token Results */}
          {searchResults.tokens.length > 0 && (
            <>
              <Stack direction="row" alignItems="center" sx={{ px: 2, pt: 1.5, pb: 0.5 }} spacing={1}>
                <SearchIcon color="primary" sx={{ fontSize: 18 }} />
                <Typography variant="subtitle2" fontSize="0.85rem" fontWeight={600}>
                  Search Results
                </Typography>
              </Stack>
              <List disablePadding dense>
                {searchResults.tokens.map((token, index) => {
                  // Always highlight the first token if there are multiple results
                  // The API returns the most relevant/authentic one first
                  const shouldHighlight = index === 0 && searchResults.tokens.length > 1;
                  
                  return (
                    <ListItem key={index} disablePadding>
                      <ListItemButton 
                        onClick={() => handleResultClick(token, 'token')} 
                        sx={{ 
                          py: 0.5, 
                          px: 2,
                          backgroundColor: shouldHighlight ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                          '&:hover': {
                            backgroundColor: shouldHighlight ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.action.hover, 0.08)
                          }
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 36 }}>
                          <Avatar
                            src={`https://s1.xrpl.to/token/${token.md5}`}
                            sx={{ width: 28, height: 28 }}
                            imgProps={{ loading: 'lazy', decoding: 'async' }}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography
                                fontSize="0.85rem"
                                noWrap
                                sx={{
                                  position: 'relative',
                                  ...(shouldHighlight && {
                                    background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    fontWeight: 600,
                                    '&:after': {
                                      content: '"✓"',
                                      position: 'absolute',
                                      right: -12,
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      fontSize: '0.7rem',
                                      color: theme.palette.warning.main,
                                      fontWeight: 700,
                                      animation: 'verified-pulse 2s ease-in-out infinite'
                                    },
                                    '@keyframes verified-pulse': {
                                      '0%, 100%': {
                                        opacity: 0.8,
                                        transform: 'translateY(-50%) scale(1)'
                                      },
                                      '50%': {
                                        opacity: 1,
                                        transform: 'translateY(-50%) scale(1.1)'
                                      }
                                    }
                                  })
                                }}
                              >
                                {token.user}
                              </Typography>
                              {token.verified && (
                                <Chip label="Verified" size="small" color="primary" sx={{ height: 16, fontSize: '0.6rem' }} />
                              )}
                            </Stack>
                          }
                          secondary={token.name}
                          secondaryTypographyProps={{ fontSize: '0.75rem', noWrap: true }}
                          sx={{ pr: 1 }}
                        />
                        <Stack alignItems="flex-end" spacing={0}>
                          {token.exch !== undefined && token.exch !== null && (
                            <Typography variant="body2" fontSize="0.8rem" fontWeight={500}>
                              ${token.exch === 0 
                                ? '0.00'
                                : token.exch < 0.00000001
                                ? parseFloat(token.exch).toFixed(12)
                                : token.exch < 0.0000001
                                ? parseFloat(token.exch).toFixed(10)
                                : token.exch < 0.000001
                                ? parseFloat(token.exch).toFixed(8)
                                : token.exch < 0.0001
                                ? parseFloat(token.exch).toFixed(6)
                                : token.exch < 1
                                ? parseFloat(token.exch).toFixed(4)
                                : parseFloat(token.exch).toFixed(2)}
                            </Typography>
                          )}
                          {token.pro24h !== undefined && token.pro24h !== null && (
                            <Typography 
                              variant="caption" 
                              fontSize="0.7rem"
                              color={parseFloat(token.pro24h) >= 0 ? 'success.main' : 'error.main'}
                              fontWeight={600}
                            >
                              {parseFloat(token.pro24h) >= 0 ? '+' : ''}{parseFloat(token.pro24h).toFixed(2)}%
                            </Typography>
                          )}
                        </Stack>
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}

          {/* No results */}
          {searchQuery && !loading && searchResults.tokens.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No results found for "{searchQuery}"
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Modal>
  );
}

export default memo(SearchModal);