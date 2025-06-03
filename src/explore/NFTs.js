import axios from 'axios';
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import debounce from 'lodash.debounce';
import { alpha } from '@mui/material/styles';

// Material
import {
  useTheme,
  useMediaQuery,
  Box,
  Grid,
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
    <Box sx={{ p: 3, backgroundColor: alpha(theme.palette.background.paper, 0.8) }}>
      <Box display="flex" alignItems="center" mb={3} gap={2}>
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
            borderRadius: 2,
            width: 48,
            height: 48,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`
            }
          }}
        >
          <FilterListIcon />
        </IconButton>

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.3),
              transform: 'translateY(-1px)',
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
            },
            '&:focus-within': {
              borderColor: theme.palette.primary.main,
              transform: 'translateY(-1px)',
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
            }
          }}
        >
          <TextField
            id="textFilter"
            fullWidth
            variant="outlined"
            placeholder="Search by name or attribute..."
            onChange={handleChangeSearch}
            autoComplete="off"
            value={search}
            onFocus={(event) => event.target.select()}
            onKeyDown={(e) => e.stopPropagation()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ ml: 0.5, mr: 0.5 }}>
                  <SearchIcon
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: 20,
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.1)'
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
                borderRadius: 0,
                backgroundColor: 'transparent',
                fontSize: '0.95rem',
                fontWeight: 400,
                minHeight: 'auto',
                '& fieldset': {
                  border: 'none'
                },
                '&:hover fieldset': {
                  border: 'none'
                },
                '&.Mui-focused fieldset': {
                  border: 'none'
                }
              },
              '& .MuiOutlinedInput-input': {
                padding: '10px 0',
                '&::placeholder': {
                  color: alpha(theme.palette.text.primary, 0.6),
                  opacity: 1,
                  fontStyle: 'italic'
                }
              }
            }}
          />

          {/* Search highlight bar */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 1.5,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              transform: search ? 'scaleX(1)' : 'scaleX(0)',
              transformOrigin: 'left',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </Paper>
      </Box>
      <Grid container spacing={0} justifyContent="space-between">
        {showFilter && (
          <Grid item xs={12} md={3} xl={2}>
            <FilterDetail
              collection={collection}
              filter={filter}
              setFilter={setFilter}
              subFilter={subFilter}
              setSubFilter={setSubFilter}
              setFilterAttrs={setFilterAttrs}
              setPage={setPage}
            />
          </Grid>
        )}
        <Grid item xs={12} md={showFilter ? 9 : 12} xl={showFilter ? 10 : 12}>
          <InfiniteScroll
            dataLength={nfts.length}
            next={loadMore}
            hasMore={hasMore}
            scrollThreshold={0.9}
            loader={
              <Box display="flex" justifyContent="center" my={4}>
                <ClipLoader color={theme.palette.primary.main} size={30} />
              </Box>
            }
          >
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'flex-start'
              }}
            >
              {nfts.map((nft, index) => (
                <Box key={nft.id || index} sx={{ flex: '0 0 auto' }}>
                  <MemoizedNFTCard
                    nft={nft}
                    handleRemove={handleRemove}
                    imageComponent={
                      <LazyLoadImage
                        src={nft.imageUrl}
                        alt={nft.name}
                        effect="blur"
                        width="100%"
                        height="auto"
                      />
                    }
                  />
                </Box>
              ))}
            </Box>
          </InfiniteScroll>
        </Grid>
      </Grid>
    </Box>
  );
}
