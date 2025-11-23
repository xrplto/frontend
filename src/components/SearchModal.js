import {
  Box,
  IconButton,
  InputBase,
  Modal,
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
import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

const API_URL = 'https://api.xrpl.to/api';

// Currency symbols
const currencySymbols = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNH: '¥',
  XRP: ''
};

// Price formatter
const formatPrice = (price) => {
  if (price === 0) return '0.00';
  if (price < 0.00000001) return parseFloat(price).toFixed(12);
  if (price < 0.0000001) return parseFloat(price).toFixed(10);
  if (price < 0.000001) return parseFloat(price).toFixed(8);
  if (price < 0.0001) return parseFloat(price).toFixed(6);
  if (price < 1) return parseFloat(price).toFixed(4);
  return parseFloat(price).toFixed(2);
};

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function SearchModal({ open, onClose }) {
  const theme = useTheme();
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

  const convertPrice = useCallback((xrpPrice) => {
    if (activeFiatCurrency === 'XRP') return xrpPrice;
    return xrpPrice / exchRate;
  }, [activeFiatCurrency, exchRate]);

  const currencySymbol = currencySymbols[activeFiatCurrency] || '$';

  // Load recent searches
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

  // Focus input
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Load trending data
  useEffect(() => {
    if (!open) return;

    const loadTrending = async () => {
      setLoadingTrending(true);
      try {
        const [tokensRes, collectionsRes] = await Promise.all([
          axios.post(`${API_URL}/search`, { search: '' }),
          axios.post(`${API_URL}/nft/search`, { search: '' })
        ]);

        setTrendingTokens(tokensRes.data?.tokens?.slice(0, 3) || []);
        setTrendingCollections(collectionsRes.data?.collections?.slice(0, 4) || []);
      } catch (error) {
        console.error('Error loading trending data:', error);
      } finally {
        setLoadingTrending(false);
      }
    };

    loadTrending();
  }, [open]);

  // Search tokens
  useEffect(() => {
    if (!debouncedSearchQuery || !open) {
      setSearchResults({ tokens: [], collections: [] });
      return;
    }

    const controller = new AbortController();

    const performSearch = async () => {
      setLoading(true);
      try {
        const [tokensRes, collectionsRes] = await Promise.all([
          axios.post(
            `${API_URL}/search`,
            { search: debouncedSearchQuery },
            { signal: controller.signal }
          ),
          axios.post(
            `${API_URL}/nft/search`,
            { search: debouncedSearchQuery },
            { signal: controller.signal }
          )
        ]);

        setSearchResults({
          tokens: tokensRes.data?.tokens?.slice(0, 4) || [],
          collections: collectionsRes.data?.collections?.slice(0, 4) || []
        });
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Search error:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    performSearch();
    return () => controller.abort();
  }, [debouncedSearchQuery, open]);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    setSearchResults({ tokens: [], collections: [] });
    onClose();
  }, [onClose]);

  const handleResultClick = useCallback(
    (item, type) => {
      const newRecent = {
        ...item,
        type,
        timestamp: Date.now(),
        slug: item.slug,
        md5: item.md5,
        user: item.user,
        name: item.name,
        logoImage: item.logoImage
      };

      const updated = [
        newRecent,
        ...recentSearches.filter((r) => r.slug !== item.slug || r.type !== type)
      ].slice(0, 5);

      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));

      handleClose();

      setTimeout(() => {
        if (type === 'token') {
          window.location.href = `/token/${item.slug}`;
        } else if (type === 'collection') {
          window.location.href = `/collection/${item.slug}`;
        }
      }, 0);
    },
    [recentSearches, handleClose]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    },
    [handleClose]
  );

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: { xs: 0, sm: '12vh' }
      }}
    >
      <Box
        onKeyDown={handleKeyDown}
        sx={{
          width: '100%',
          maxWidth: '650px',
          height: 'auto',
          maxHeight: '65vh',
          overflow: 'hidden',
          borderRadius: '12px',
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(145deg, ${alpha('#000000', 0.9)} 0%, ${alpha('#111111', 0.6)} 50%, ${alpha('#000000', 0.95)} 100%)`
            : '#ffffff',
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          backdropFilter: 'blur(40px) saturate(200%)',
          boxShadow: theme.palette.mode === 'dark'
            ? `0 8px 32px ${alpha('#000000', 0.4)}, inset 0 1px 0 ${alpha('#ffffff', 0.1)}`
            : '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Search Header */}
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <SearchIcon sx={{ color: 'text.secondary', fontSize: 20, opacity: 0.5 }} />
            <InputBase
              ref={inputRef}
              placeholder="Search tokens and collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              autoComplete="off"
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                '& input::placeholder': {
                  opacity: 0.5
                }
              }}
            />
            {loading && <CircularProgress size={18} thickness={3} />}
            <IconButton onClick={handleClose} size="small">
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Stack>
        </Box>

        {/* Content */}
        <Box
          sx={{
            maxHeight: { xs: 'calc(100vh - 80px)', sm: 'calc(65vh - 80px)' },
            overflowY: 'auto'
          }}
        >
          {!searchQuery && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      px: 2,
                      pt: 1.5,
                      pb: 0.5,
                      fontSize: '11px',
                      fontWeight: 400,
                      opacity: 0.6,
                      color: 'text.secondary'
                    }}
                  >
                    Recent
                  </Typography>
                  <List disablePadding dense>
                    {recentSearches.slice(0, 3).map((item, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemButton
                          onClick={() => {
                            handleClose();
                            setTimeout(() => {
                              if (item.type === 'token') {
                                window.location.href = `/token/${item.slug}`;
                              } else if (item.type === 'collection') {
                                window.location.href = `/collection/${item.slug}`;
                              }
                            }, 0);
                          }}
                          sx={{
                            py: 0.75,
                            px: 2,
                            borderRadius: '12px',
                            mx: 0.5,
                            mb: 0.25,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.04)
                            }
                          }}
                        >
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <Avatar
                              src={
                                item.type === 'collection'
                                  ? `https://s1.xrpl.to/nft-collection/${item.logoImage}`
                                  : `https://s1.xrpl.to/token/${item.md5}`
                              }
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'transparent'
                              }}
                            >
                              {item.user?.[0] || item.name?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={item.user || item.name}
                            secondary={item.name}
                            primaryTypographyProps={{ fontSize: '13px', fontWeight: 400 }}
                            secondaryTypographyProps={{
                              fontSize: '12px',
                              sx: { color: alpha(theme.palette.text.secondary, 0.6) }
                            }}
                          />
                          <Chip
                            label={item.type}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: '10px',
                              fontWeight: 400
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
                  <Stack direction="row" alignItems="center" sx={{ px: 2, pt: 1.5, pb: 0.75 }} spacing={1}>
                    <TrendingUpIcon sx={{ fontSize: 16, color: alpha(theme.palette.primary.main, 0.6) }} />
                    <Typography variant="subtitle2" sx={{ fontSize: '11px', fontWeight: 400, opacity: 0.6 }}>
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
                            borderRadius: '12px',
                            mx: 0.5,
                            mb: 0.5,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.04)
                            }
                          }}
                        >
                          <ListItemAvatar sx={{ minWidth: 44 }}>
                            <Avatar
                              src={`https://s1.xrpl.to/token/${token.md5}`}
                              sx={{
                                width: 36,
                                height: 36,
                                bgcolor: 'transparent'
                              }}
                            >
                              {token.user?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={token.user}
                            secondary={token.name}
                            primaryTypographyProps={{ fontSize: '14px', fontWeight: 400, noWrap: true }}
                            secondaryTypographyProps={{
                              fontSize: '13px',
                              noWrap: true,
                              sx: { color: alpha(theme.palette.text.secondary, 0.6) }
                            }}
                            sx={{ pr: 1 }}
                          />
                          <Stack alignItems="flex-end" spacing={0.25}>
                            {token.exch !== undefined && token.exch !== null && (
                              <Typography variant="body2" fontSize="14px" fontWeight={400}>
                                {activeFiatCurrency === 'XRP'
                                  ? `${formatPrice(convertPrice(token.exch))} XRP`
                                  : `${currencySymbol}${formatPrice(convertPrice(token.exch))}`}
                              </Typography>
                            )}
                            {token.pro24h !== undefined && token.pro24h !== null && (
                              <Typography
                                variant="caption"
                                fontSize="12px"
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

              {/* Trending Collections */}
              {!loadingTrending && trendingCollections.length > 0 && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <Stack direction="row" alignItems="center" sx={{ px: 2, pt: 1.5, pb: 0.5 }} spacing={1}>
                    <CollectionsIcon sx={{ fontSize: 16, color: alpha('#4caf50', 0.6) }} />
                    <Typography variant="subtitle2" sx={{ fontSize: '11px', fontWeight: 400, opacity: 0.6 }}>
                      Trending Collections
                    </Typography>
                  </Stack>
                  <List disablePadding dense>
                    {trendingCollections.map((collection, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemButton
                          onClick={() => handleResultClick(collection, 'collection')}
                          sx={{
                            py: 0.75,
                            px: 2,
                            borderRadius: '12px',
                            mx: 0.5,
                            mb: 0.5,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.04)
                            }
                          }}
                        >
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <Avatar
                              src={`https://s1.xrpl.to/nft-collection/${collection.logoImage}`}
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'transparent'
                              }}
                            >
                              {collection.name?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={0.75}>
                                <Typography fontSize="13px" fontWeight={400} noWrap>
                                  {collection.name}
                                </Typography>
                                {collection.verified === 'yes' && (
                                  <Chip
                                    label="Verified"
                                    size="small"
                                    color="primary"
                                    sx={{ height: 18, fontSize: '10px', fontWeight: 400 }}
                                  />
                                )}
                              </Stack>
                            }
                            secondary={collection.items ? `${collection.items.toLocaleString()} items` : 'Collection'}
                            primaryTypographyProps={{ component: 'div' }}
                            secondaryTypographyProps={{
                              fontSize: '12px',
                              noWrap: true,
                              sx: { color: alpha(theme.palette.text.secondary, 0.6) }
                            }}
                            sx={{ pr: 1 }}
                          />
                          <Stack alignItems="flex-end" spacing={0.25}>
                            {collection.floor?.amount && (
                              <Typography variant="body2" fontSize="13px" fontWeight={400}>
                                {Number(collection.floor.amount) >= 1
                                  ? Math.round(collection.floor.amount)
                                  : collection.floor.amount}{' '}
                                XRP
                              </Typography>
                            )}
                            {collection.sales24h > 0 && (
                              <Typography
                                variant="caption"
                                fontSize="11px"
                                sx={{ color: alpha(theme.palette.text.secondary, 0.6) }}
                              >
                                {collection.sales24h} sale{collection.sales24h !== 1 ? 's' : ''} today
                              </Typography>
                            )}
                          </Stack>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {loadingTrending && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </>
          )}

          {/* Search Results */}
          {(searchResults.tokens.length > 0 || searchResults.collections.length > 0) && (
            <>
              {searchResults.tokens.length > 0 && (
                <>
                  <Stack direction="row" alignItems="center" sx={{ px: 2, pt: 2, pb: 0.5 }} spacing={1}>
                    <TrendingUpIcon sx={{ fontSize: 14, color: alpha(theme.palette.primary.main, 0.5) }} />
                    <Typography variant="subtitle2" fontSize="12px" fontWeight={400} sx={{ opacity: 0.6 }} color="text.secondary">
                      Tokens
                    </Typography>
                  </Stack>
                  <List disablePadding dense>
                    {searchResults.tokens.map((token, index) => {
                  const shouldHighlight = index === 0 && searchResults.tokens.length > 1;

                  return (
                    <ListItem key={index} disablePadding>
                      <ListItemButton
                        onClick={() => handleResultClick(token, 'token')}
                        sx={{
                          py: 1,
                          px: 2,
                          borderRadius: '12px',
                          mx: 0.5,
                          mb: 0.5,
                          bgcolor: shouldHighlight ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08)
                          }
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 44 }}>
                          <Avatar
                            src={`https://s1.xrpl.to/token/${token.md5}`}
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: 'transparent'
                            }}
                          >
                            {token.user?.[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              <Typography
                                fontSize="15px"
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
                                  sx={{ height: 18, fontSize: '13px', fontWeight: 400 }}
                                />
                              )}
                            </Stack>
                          }
                          secondary={token.name}
                          secondaryTypographyProps={{
                            fontSize: '13px',
                            noWrap: true,
                            sx: { color: alpha(theme.palette.text.secondary, 0.6) }
                          }}
                          sx={{ pr: 1 }}
                        />
                        <Stack alignItems="flex-end" spacing={0.25}>
                          {token.exch !== undefined && token.exch !== null && (
                            <Typography variant="body2" fontSize="14px" fontWeight={400}>
                              {activeFiatCurrency === 'XRP'
                                ? `${formatPrice(convertPrice(token.exch))} XRP`
                                : `${currencySymbol}${formatPrice(convertPrice(token.exch))}`}
                            </Typography>
                          )}
                          {token.pro24h !== undefined && token.pro24h !== null && (
                            <Typography
                              variant="caption"
                              fontSize="12px"
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

              {searchResults.collections.length > 0 && (
                <>
                  {searchResults.tokens.length > 0 && <Divider sx={{ my: 0.5 }} />}
                  <Stack direction="row" alignItems="center" sx={{ px: 2, pt: searchResults.tokens.length > 0 ? 1.5 : 2, pb: 0.5 }} spacing={1}>
                    <CollectionsIcon sx={{ fontSize: 14, color: alpha(theme.palette.text.secondary, 0.5) }} />
                    <Typography variant="subtitle2" fontSize="12px" fontWeight={400} sx={{ opacity: 0.6 }} color="text.secondary">
                      Collections
                    </Typography>
                  </Stack>
                  <List disablePadding dense>
                    {searchResults.collections.map((collection, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemButton
                          onClick={() => handleResultClick(collection, 'collection')}
                          sx={{
                            py: 0.75,
                            px: 2,
                            borderRadius: '12px',
                            mx: 0.5,
                            mb: 0.5,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.04)
                            }
                          }}
                        >
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <Avatar
                              src={`https://s1.xrpl.to/nft-collection/${collection.logoImage}`}
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'transparent'
                              }}
                            >
                              {collection.name?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={0.75}>
                                <Typography fontSize="13px" fontWeight={400} noWrap>
                                  {collection.name}
                                </Typography>
                                {collection.verified === 'yes' && (
                                  <Chip
                                    label="Verified"
                                    size="small"
                                    color="primary"
                                    sx={{ height: 18, fontSize: '10px', fontWeight: 400 }}
                                  />
                                )}
                              </Stack>
                            }
                            secondary={collection.items ? `${collection.items.toLocaleString()} items` : 'Collection'}
                            primaryTypographyProps={{ component: 'div' }}
                            secondaryTypographyProps={{
                              fontSize: '12px',
                              noWrap: true,
                              sx: { color: alpha(theme.palette.text.secondary, 0.6) }
                            }}
                            sx={{ pr: 1 }}
                          />
                          <Stack alignItems="flex-end" spacing={0.25}>
                            {collection.floor?.amount && (
                              <Typography variant="body2" fontSize="13px" fontWeight={400}>
                                {Number(collection.floor.amount) >= 1
                                  ? Math.round(collection.floor.amount)
                                  : collection.floor.amount}{' '}
                                XRP
                              </Typography>
                            )}
                            {collection.sales24h > 0 && (
                              <Typography
                                variant="caption"
                                fontSize="11px"
                                sx={{ color: alpha(theme.palette.text.secondary, 0.6) }}
                              >
                                {collection.sales24h} sale{collection.sales24h !== 1 ? 's' : ''} today
                              </Typography>
                            )}
                          </Stack>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </>
          )}

          {/* No Results */}
          {searchQuery && !loading && searchResults.tokens.length === 0 && searchResults.collections.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography fontSize="14px" sx={{ color: alpha(theme.palette.text.secondary, 0.6) }}>
                No results found for "{searchQuery}"
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
}

export default SearchModal;
