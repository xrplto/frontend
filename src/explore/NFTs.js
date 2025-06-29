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
                borderRadius: 2,
                '& fieldset': {
                  border: 'none'
                },
                '&.Mui-focused fieldset': {
                  border: 'none'
                }
              },
              '& .MuiOutlinedInput-input': {
                padding: '12px 14px',
                fontSize: 14,
                fontWeight: 500
              }
            }}
          />
        </Paper>
      </Box>

      {showFilter && (
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
              height: '100px' // Adjust height as needed
            }}
          >
            <ClipLoader color={theme.palette.primary.main} size={30} />
          </Box>
        }
        endMessage={
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Image
              src="/static/empty-folder.png"
              alt="No more NFTs"
              width={120}
              height={120}
              style={{ marginBottom: '16px' }}
            />
            <Typography variant="h6" color="textSecondary">
              No more NFTs to load
            </Typography>
          </Box>
        }
      >
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(5, 1fr)'
            }
          }}
        >
          {nfts.map((nft) => (
            <Grid key={nft.NFTokenID} item xs={1} sm={1} md={1}>
              <MemoizedNFTCard nft={nft} collection={collection} onRemove={handleRemove} />
            </Grid>
          ))}
        </Box>
      </InfiniteScroll>
    </Box>
  );
}
