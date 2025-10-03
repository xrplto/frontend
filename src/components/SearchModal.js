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
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
  useMemo,
  memo,
  lazy,
  Suspense
} from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { fNumberWithCurreny } from 'src/utils/formatters';

const API_URL = process.env.API_URL || '';
const NFT_API_URL = 'https://api.xrpnft.com/api';

// Debounce hook with proper cleanup
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Only set timer if delay is positive
    if (delay <= 0) {
      setDebouncedValue(value);
      return;
    }

    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

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

  const debouncedSearchQuery = useDebounce(searchQuery, 200);

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
        const response = await axios.post(
          `${API_URL}/search`,
          {
            search: debouncedSearchQuery
          },
          { signal: controller.signal }
        );

        if (response.data?.tokens) {
          setSearchResults((prev) => ({
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

  const handleResultClick = useCallback(
    (item, type) => {
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

      const updated = [
        newRecent,
        ...recentSearches.filter((r) => r.slug !== item.slug || r.type !== type)
      ].slice(0, 5);
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
    },
    [recentSearches, handleClose]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
      // Prevent modal from opening when typing in other inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        e.stopPropagation();
      }
    },
    [handleClose]
  );

  // Memoize styles to prevent recalculation
  const modalStyles = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      pt: '12vh',
      backgroundColor: alpha(theme.palette.background.default, 0.75)
    }),
    [theme]
  );

  const paperStyles = useMemo(
    () => ({
      width: '90%',
      maxWidth: 650,
      maxHeight: '65vh',
      overflow: 'hidden',
      borderRadius: '12px',
      background: theme.palette.background.paper,
      border: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
      boxShadow: 'none'
    }),
    [theme]
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={modalStyles}
      keepMounted={false}
      disablePortal={false}
    >
      <Paper sx={paperStyles} onKeyDown={handleKeyDown}>
        {/* Search Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.1)}`,
            backgroundColor: 'transparent'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <SearchIcon sx={{ color: alpha(theme.palette.text.primary, 0.5), fontSize: 20 }} />
            <InputBase
              ref={inputRef}
              placeholder="Search tokens and collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              autoComplete="off"
              sx={{
                fontSize: '0.95rem',
                fontWeight: 400,
                '& input': {
                  padding: 0,
                  '&::placeholder': {
                    opacity: 0.45,
                    fontSize: '0.95rem'
                  }
                }
              }}
            />
            {loading && <CircularProgress size={18} thickness={3} />}
            <IconButton onClick={handleClose} size="small" sx={{ p: 0.5 }}>
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Stack>
        </Box>

        {/* Search Results */}
        <Box
          sx={{
            maxHeight: 'calc(65vh - 80px)',
            overflowY: 'auto',
            backgroundColor: 'transparent'
          }}
        >
          {/* Show trending when no search query */}
          {!searchQuery && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{ px: 2, pt: 2, pb: 0.75, fontSize: '0.75rem', fontWeight: 500, opacity: 0.6 }}
                    color="text.secondary"
                  >
                    Recent
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
                          sx={{
                          py: 1,
                          px: 2,
                          borderRadius: '8px',
                          mx: 0.5,
                          mb: 0.5,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              src={
                                item.type === 'collection'
                                  ? `https://s1.xrpnft.com/collection/${item.logoImage}`
                                  : `https://s1.xrpl.to/token/${item.md5}`
                              }
                              sx={{
                                width: 36,
                                height: 36,
                                border: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
                                backgroundColor: 'transparent'
                              }}
                              imgProps={{ loading: 'lazy', decoding: 'async' }}
                            >
                              {item.user?.[0] || item.name?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={item.user || item.name}
                            secondary={item.name}
                            primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 400 }}
                            secondaryTypographyProps={{
                              fontSize: '0.8rem',
                              sx: { color: alpha(theme.palette.text.secondary, 0.6) }
                            }}
                          />
                          <Chip
                            label={item.type}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 400,
                              borderColor: alpha(theme.palette.divider, 0.2)
                            }}
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
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ px: 2, pt: 1.5, pb: 0.75 }}
                    spacing={1}
                  >
                    <TrendingUpIcon sx={{ fontSize: 16, color: alpha(theme.palette.primary.main, 0.7) }} />
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.6 }}>
                      Trending
                    </Typography>
                  </Stack>
                  <List disablePadding dense>
                    {trendingTokens.map((token, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemButton
                          onClick={() => handleResultClick(token, 'token')}
                          sx={{
                            py: 1,
                            px: 2,
                            borderRadius: '8px',
                            mx: 0.5,
                            mb: 0.5,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.04)
                            }
                          }}
                        >
                          <ListItemAvatar sx={{ minWidth: 44 }}>
                            <Avatar
                              src={`https://s1.xrpl.to/token/${token.md5}`}
                              sx={{
                                width: 36,
                                height: 36,
                                border: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
                                backgroundColor: 'transparent'
                              }}
                              imgProps={{ loading: 'lazy', decoding: 'async' }}
                            >
                              {token.user?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={token.user}
                            secondary={token.name}
                            primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 400, noWrap: true }}
                            secondaryTypographyProps={{
                              fontSize: '0.8rem',
                              noWrap: true,
                              sx: { color: alpha(theme.palette.text.secondary, 0.6) }
                            }}
                            sx={{ pr: 1 }}
                          />
                          <Stack alignItems="flex-end" spacing={0.25}>
                            {token.exch !== undefined && token.exch !== null && (
                              <Typography variant="body2" fontSize="0.9rem" fontWeight={400}>
                                ${formatPrice(token.exch)}
                              </Typography>
                            )}
                            {token.pro24h !== undefined && token.pro24h !== null && (
                              <Typography
                                variant="caption"
                                fontSize="0.75rem"
                                color={parseFloat(token.pro24h) >= 0 ? '#4caf50' : '#f44336'}
                                fontWeight={400}
                              >
                                {parseFloat(token.pro24h) >= 0 ? '+' : ''}
                                {parseFloat(token.pro24h).toFixed(2)}%
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
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ px: 2, pt: 1.5, pb: 0.75 }}
                    spacing={1}
                  >
                    <CollectionsIcon sx={{ fontSize: 16, color: alpha('#4caf50', 0.7) }} />
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.6 }}>
                      Trending Collections
                    </Typography>
                  </Stack>
                  <List disablePadding dense>
                    {trendingCollections.map((collection, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemButton
                          onClick={() => handleResultClick(collection, 'collection')}
                          sx={{
                            py: 1,
                            px: 2,
                            borderRadius: '8px',
                            mx: 0.5,
                            mb: 0.5,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.04)
                            }
                          }}
                        >
                          <ListItemAvatar sx={{ minWidth: 44 }}>
                            <Avatar
                              src={`https://s1.xrpnft.com/collection/${collection.logoImage}`}
                              sx={{
                                width: 36,
                                height: 36,
                                border: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
                                backgroundColor: 'transparent'
                              }}
                              imgProps={{ loading: 'lazy', decoding: 'async' }}
                            >
                              {collection.name?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={collection.name}
                            secondary={
                              collection.type ? `${collection.type} collection` : 'Collection'
                            }
                            primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 400, noWrap: true }}
                            secondaryTypographyProps={{
                              fontSize: '0.8rem',
                              noWrap: true,
                              sx: { color: alpha(theme.palette.text.secondary, 0.6) }
                            }}
                            sx={{ pr: 1 }}
                          />
                          <Stack alignItems="flex-end" spacing={0.25}>
                            {collection.floor && collection.floor.amount && (
                              <Typography variant="body2" fontSize="0.85rem" fontWeight={400}>
                                Floor: {collection.floor.amount}{' '}
                                {collection.floor.currency || 'XRP'}
                              </Typography>
                            )}
                            {collection.totalVolume !== undefined && collection.totalVolume > 0 && (
                              <Typography
                                variant="caption"
                                fontSize="0.75rem"
                                sx={{ color: alpha(theme.palette.text.secondary, 0.6) }}
                              >
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
              <Stack
                direction="row"
                alignItems="center"
                sx={{ px: 2, pt: 2, pb: 0.75 }}
                spacing={1}
              >
                <Typography variant="subtitle2" fontSize="0.75rem" fontWeight={500} sx={{ opacity: 0.6 }} color="text.secondary">
                  Results
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
                          py: 1,
                          px: 2,
                          borderRadius: '8px',
                          mx: 0.5,
                          mb: 0.5,
                          backgroundColor: shouldHighlight
                            ? alpha(theme.palette.primary.main, 0.04)
                            : 'transparent',
                          border: shouldHighlight
                            ? `1.5px solid ${alpha(theme.palette.primary.main, 0.2)}`
                            : '1.5px solid transparent',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.06),
                            borderColor: alpha(theme.palette.primary.main, 0.25)
                          }
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 44 }}>
                          <Avatar
                            src={`https://s1.xrpl.to/token/${token.md5}`}
                            sx={{
                              width: 36,
                              height: 36,
                              border: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
                              backgroundColor: 'transparent'
                            }}
                            imgProps={{ loading: 'lazy', decoding: 'async' }}
                          >
                            {token.user?.[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              <Typography
                                fontSize="0.95rem"
                                fontWeight={400}
                                noWrap
                                sx={{
                                  ...(shouldHighlight && {
                                    color: theme.palette.primary.main
                                  })
                                }}
                              >
                                {token.user}
                              </Typography>
                              {token.verified && (
                                <Chip
                                  label="Verified"
                                  size="small"
                                  color="primary"
                                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 400 }}
                                />
                              )}
                            </Stack>
                          }
                          secondary={token.name}
                          secondaryTypographyProps={{
                            fontSize: '0.8rem',
                            noWrap: true,
                            sx: { color: alpha(theme.palette.text.secondary, 0.6) }
                          }}
                          sx={{ pr: 1 }}
                        />
                        <Stack alignItems="flex-end" spacing={0.25}>
                          {token.exch !== undefined && token.exch !== null && (
                            <Typography variant="body2" fontSize="0.9rem" fontWeight={400}>
                              ${formatPrice(token.exch)}
                            </Typography>
                          )}
                          {token.pro24h !== undefined && token.pro24h !== null && (
                            <Typography
                              variant="caption"
                              fontSize="0.75rem"
                              color={parseFloat(token.pro24h) >= 0 ? '#4caf50' : '#f44336'}
                              fontWeight={400}
                            >
                              {parseFloat(token.pro24h) >= 0 ? '+' : ''}
                              {parseFloat(token.pro24h).toFixed(2)}%
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
              <Typography fontSize="0.9rem" sx={{ color: alpha(theme.palette.text.secondary, 0.6) }}>
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
