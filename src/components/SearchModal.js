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
import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import useDebounce from 'src/hooks/useDebounce';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { fNumberWithCurreny } from 'src/utils/formatNumber';

const API_URL = process.env.API_URL;
const NFT_API_URL = 'https://api.xrpnft.com/api';

export default function SearchModal({ open, onClose }) {
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
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Fetch trending tokens and collections when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchTrending = async () => {
      setLoadingTrending(true);
      try {
        // Fetch trending tokens
        const [tokensRes, collectionsRes] = await Promise.all([
          axios.post(`${API_URL}/search`, { search: '' }),
          axios.post(`${NFT_API_URL}/search`, { 
            search: '', 
            type: 'SEARCH_ITEM_COLLECTION_ACCOUNT' 
          })
        ]);

        if (tokensRes.data?.tokens) {
          setTrendingTokens(tokensRes.data.tokens.slice(0, 4));
        }

        if (collectionsRes.data?.collections) {
          setTrendingCollections(collectionsRes.data.collections.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching trending:', error);
      } finally {
        setLoadingTrending(false);
      }
    };

    fetchTrending();
  }, [open]);

  // Perform search
  useEffect(() => {
    if (!debouncedSearchQuery || !open) {
      setSearchResults({ tokens: [], collections: [] });
      return;
    }

    const searchTokens = async () => {
      setLoading(true);
      try {
        const response = await axios.post(`${API_URL}/search`, {
          search: debouncedSearchQuery
        });
        
        if (response.data?.tokens) {
          setSearchResults(prev => ({
            ...prev,
            tokens: response.data.tokens.slice(0, 5)
          }));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    searchTokens();
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
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    
    // Navigate to result
    if (type === 'token') {
      window.location.href = `/token/${item.slug}`;
    } else if (type === 'collection') {
      window.location.href = `/collection/${item.slug}`;
    }
  }, [recentSearches, router, handleClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: '10vh',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        backgroundColor: alpha(theme.palette.common.black, 0.5)
      }}
    >
      <Paper
        sx={{
          width: '90%',
          maxWidth: 600,
          maxHeight: '70vh',
          overflow: 'hidden',
          borderRadius: { xs: '10px', sm: '16px' },
          background: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: `
            0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
            0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
            inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`
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
            overflowY: 'auto'
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
                            // Navigate directly for recent searches since we already have the data
                            if (item.type === 'token') {
                              window.location.href = `/token/${item.slug}`;
                            } else if (item.type === 'collection') {
                              window.location.href = `/collection/${item.slug}`;
                            }
                          }} 
                          sx={{ py: 0.5 }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              src={item.type === 'collection' 
                                ? `https://s1.xrpnft.com/collection/${item.logoImage}` 
                                : `https://s1.xrpl.to/token/${item.md5}`}
                              sx={{ width: 28, height: 28 }}
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
                        <ListItemButton onClick={() => window.location.href = `/token/${token.slug}`} sx={{ py: 0.5, px: 2 }}>
                          <ListItemAvatar sx={{ minWidth: 36 }}>
                            <Avatar
                              src={`https://s1.xrpl.to/token/${token.md5}`}
                              sx={{ width: 28, height: 28 }}
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
                        <ListItemButton onClick={() => window.location.href = `/collection/${collection.slug}`} sx={{ py: 0.5, px: 2 }}>
                          <ListItemAvatar sx={{ minWidth: 36 }}>
                            <Avatar
                              src={`https://s1.xrpnft.com/collection/${collection.logoImage}`}
                              sx={{ width: 28, height: 28 }}
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
                {searchResults.tokens.map((token, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemButton onClick={() => window.location.href = `/token/${token.slug}`} sx={{ py: 0.5, px: 2 }}>
                      <ListItemAvatar sx={{ minWidth: 36 }}>
                        <Avatar
                          src={`https://s1.xrpl.to/token/${token.md5}`}
                          sx={{ width: 28, height: 28 }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={token.user}
                        secondary={token.name}
                        primaryTypographyProps={{ fontSize: '0.85rem', noWrap: true }}
                        secondaryTypographyProps={{ fontSize: '0.75rem', noWrap: true }}
                      />
                      {token.verified && (
                        <Chip label="Verified" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
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