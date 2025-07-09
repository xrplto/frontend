import axios from 'axios';
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import Image from 'next/image';
import debounce from 'lodash.debounce';
import { alpha } from '@mui/material/styles';
import { Typography } from '@mui/material';

// Material
import {
  useTheme,
  useMediaQuery,
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Paper,
  Fade
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

// Loader
import { ClipLoader } from 'react-spinners';

// Components
import NFTCard from './NFTCard';
import FilterDetail from './FilterDetail';
import { AppContext } from 'src/AppContext';

const MemoizedNFTCard = React.memo(NFTCard);

export default function NFTs({ collection }) {
  const BASE_URL = 'https://api.xrpnft.com/api';

  const theme = useTheme();
  const { setDeletingNfts } = useContext(AppContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [nfts, setNfts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [flag, setFlag] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState(0);
  const [subFilter, setSubFilter] = useState(0);
  const [filterAttrs, setFilterAttrs] = useState([]);
  const [sync, setSync] = useState(0);
  const [attrSync, setAttrSync] = useState(0);

  const fetchNfts = useCallback(() => {
    setLoading(true);
    const limit = 32;
    const body = {
      page,
      limit,
      flag,
      cid: collection?.uuid,
      search,
      filter,
      subFilter,
      filterAttrs
    };

    axios
      .post(`${BASE_URL}/nfts`, body)
      .then((res) => {
        const newNfts = res.data.nfts;
        const length = newNfts.length;
        setHasMore(length === limit);
        setNfts((prevNfts) => [...prevNfts, ...newNfts]);
        setDeletingNfts((prevNfts) => [...prevNfts, ...newNfts]);
      })
      .catch((err) => {
        console.log('Error on getting nfts!', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, flag, search, filter, subFilter, filterAttrs, collection?.uuid, setDeletingNfts]);

  useEffect(() => {
    setNfts([]);
    setDeletingNfts([]);
    setPage(0);
    setHasMore(true);
  }, [flag, search, filter, subFilter, attrSync, filterAttrs, setDeletingNfts]);

  useEffect(() => {
    fetchNfts();
  }, [fetchNfts]);

  const debouncedSearch = useMemo(() => debounce((value) => setSearch(value), 300), []);

  const handleChangeSearch = useCallback(
    (e) => {
      debouncedSearch(e.target.value);
    },
    [debouncedSearch]
  );

  const handleShowFilter = useCallback(() => {
    setShowFilter((prevShow) => !prevShow);
  }, []);

  const handleRemove = useCallback(
    (NFTokenID) => {
      setLoading(true);
      axios
        .delete(`${BASE_URL}/nfts`, {
          data: {
            issuer: collection?.account,
            taxon: collection?.taxon,
            cid: collection?.uuid,
            idsToDelete: NFTokenID
          }
        })
        .then(() => {
          location.reload();
        })
        .catch((err) => {
          console.log('Error on removing nfts!', err);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [collection]
  );

  const loadMore = useCallback(() => {
    setPage((prevPage) => prevPage + 1);
    setSync((prevSync) => prevSync + 1);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearch('');
    debouncedSearch('');
  }, [debouncedSearch]);

  return (
    <Box sx={{ 
      p: { xs: 0, sm: 2, md: 3 }, 
      backgroundColor: alpha(theme.palette.background.paper, 0.9), 
      borderRadius: { xs: 0, sm: 3 },
      minHeight: '100vh'
    }}>
      <Box 
        display="flex" 
        alignItems="center" 
        mb={{ xs: 2, sm: 3 }} 
        gap={{ xs: 1, sm: 2 }}
        flexDirection={{ xs: 'row', sm: 'row' }}
        px={{ xs: 2, sm: 0 }}
      >
        <IconButton
          aria-label="filter"
          onClick={handleShowFilter}
          sx={{
            backgroundColor: showFilter
              ? theme.palette.primary.main
              : alpha(theme.palette.primary.main, 0.1),
            color: showFilter ? theme.palette.primary.contrastText : theme.palette.primary.main,
            border: `2px solid ${
              showFilter ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.3)
            }`,
            borderRadius: { xs: '10px', sm: '12px' },
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            minWidth: { xs: 40, sm: 48 },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              transform: isMobile ? 'none' : 'translateY(-2px) scale(1.05)',
              boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`
            },
            '&:active': {
              transform: 'scale(0.95)'
            }
          }}
        >
          <FilterListIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
        </IconButton>

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '12px',
            border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.3),
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.15)}`
            },
            '&:focus-within': {
              borderColor: theme.palette.primary.main,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`
            }
          }}
        >
          <TextField
            id="textFilter"
            fullWidth
            variant="outlined"
            placeholder={isMobile ? "Search NFTs..." : "Search by name or attribute..."}
            onChange={handleChangeSearch}
            autoComplete="off"
            value={search}
            onFocus={(event) => event.target.select()}
            onKeyDown={(e) => e.stopPropagation()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ ml: { xs: 0, sm: 0.5 }, mr: 0.5 }}>
                  <SearchIcon
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: { xs: 18, sm: 20 },
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: isMobile ? 'none' : 'scale(1.1)'
                      }
                    }}
                  />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 0.5 }}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {search && (
                      <Fade in={!!search}>
                        <IconButton
                          size="small"
                          onClick={handleClearSearch}
                          sx={{
                            color: alpha(theme.palette.text.primary, 0.6),
                            width: 24,
                            height: 24,
                            '&:hover': {
                              color: theme.palette.text.primary,
                              backgroundColor: alpha(theme.palette.primary.main, 0.1)
                            }
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Fade>
                    )}
                    <Fade in={loading}>
                      <Box display="flex" alignItems="center">
                        <ClipLoader color={theme.palette.primary.main} size={16} />
                      </Box>
                    </Fade>
                  </Box>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                border: 'none',
                borderRadius: '12px',
                '& fieldset': {
                  border: 'none'
                },
                '&.Mui-focused fieldset': {
                  border: 'none'
                }
              },
              '& .MuiOutlinedInput-input': {
                padding: { xs: '10px 12px', sm: '14px 16px' },
                fontSize: { xs: 14, sm: 15 },
                fontWeight: 500,
                letterSpacing: '0.3px'
              }
            }}
          />
        </Paper>
      </Box>

      {showFilter && (
        <Fade in={showFilter} timeout={300}>
          <Box sx={{ mb: { xs: 2, sm: 3 }, px: { xs: 2, sm: 0 } }}>
            <FilterDetail
              collection={collection}
              filter={filter}
              setFilter={setFilter}
              subFilter={subFilter}
              setSubFilter={setSubFilter}
              filterAttrs={filterAttrs}
              setFilterAttrs={setFilterAttrs}
              sync={sync}
              setSync={setSync}
              attrSync={attrSync}
              setAttrSync={setAttrSync}
            />
          </Box>
        </Fade>
      )}

      <InfiniteScroll
        dataLength={nfts.length}
        next={loadMore}
        hasMore={hasMore}
        loader={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100px',
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.6 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.6 }
              }
            }}
          >
            <ClipLoader color={theme.palette.primary.main} size={30} />
          </Box>
        }
        endMessage={
          <Fade in timeout={500}>
            <Box sx={{ 
              p: { xs: 4, sm: 6 }, 
              textAlign: 'center',
              animation: 'fadeInUp 0.5s ease-out',
              '@keyframes fadeInUp': {
                from: { opacity: 0, transform: 'translateY(20px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              }
            }}>
              <Box sx={{ 
                width: { xs: 100, sm: 140 }, 
                height: { xs: 100, sm: 140 },
                margin: '0 auto',
                mb: { xs: 2, sm: 3 }
              }}>
                <Image
                  src="/static/empty-folder.png"
                  alt="No more NFTs"
                  width={isMobile ? 100 : 140}
                  height={isMobile ? 100 : 140}
                  style={{ 
                    opacity: 0.8,
                    filter: 'grayscale(20%)'
                  }}
                />
              </Box>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                color="textSecondary"
                sx={{ 
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  mb: 1,
                  fontSize: { xs: '1.1rem', sm: '1.5rem' }
                }}
              >
                That's all for now!
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{ 
                  opacity: 0.7,
                  fontSize: { xs: '0.875rem', sm: '0.875rem' }
                }}
              >
                You've reached the end of the collection
              </Typography>
            </Box>
          </Fade>
        }
      >
        <Box
          sx={{
            display: 'grid',
            gap: { xs: '8px', sm: 1 },
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(6, 1fr)',
              xl: 'repeat(8, 1fr)'
            },
            px: { xs: 1, sm: 0 },
            mx: { xs: -1, sm: 0 },
            animation: 'fadeIn 0.3s ease-in-out',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(10px)' },
              to: { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          {nfts.map((nft, index) => (
            <Box
              key={nft.NFTokenID}
              sx={{
                animation: `slideIn 0.4s ease-out ${index * 0.02}s`,
                '@keyframes slideIn': {
                  from: { opacity: 0, transform: 'scale(0.9)' },
                  to: { opacity: 1, transform: 'scale(1)' }
                }
              }}
            >
              <MemoizedNFTCard
                nft={nft}
                collection={collection}
                onRemove={handleRemove}
              />
            </Box>
          ))}
        </Box>
      </InfiniteScroll>
    </Box>
  );
}
