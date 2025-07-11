import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import Image from 'next/image';
import debounce from 'lodash.debounce';
import { 
  Box, 
  IconButton, 
  InputAdornment, 
  TextField, 
  Paper, 
  Fade, 
  Typography,
  Skeleton,
  Chip,
  Tooltip,
  Stack,
  useTheme,
  useMediaQuery,
  Link
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import { ClipLoader } from 'react-spinners';

import { AppContext } from 'src/AppContext';
import FilterDetail from './FilterDetail';
import Label from './Label';
import { getMinterName } from 'src/utils/constants';
import { fNumber, fIntNumber } from 'src/utils/formatNumber';
import { getNftCoverUrl } from 'src/utils/parse/utils';
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';

// NFT Card Component
const NFTCard = React.memo(({ nft, collection, onRemove }) => {
  const theme = useTheme();
  const { accountProfile } = useContext(AppContext);
  const isAdmin = accountProfile?.admin;
  const [loadingImg, setLoadingImg] = useState(true);

  const {
    uuid,
    account,
    cost,
    costb,
    meta,
    NFTokenID,
    destination,
    rarity_rank,
    updateEvent,
    amount,
    MasterSequence
  } = nft;

  const isSold = true;
  const imgUrl = getNftCoverUrl(nft, 'small');
  const name = nft.meta?.name || meta?.Name || 'No Name';

  const handleImageLoad = () => setLoadingImg(false);

  const handleRemoveNft = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    onRemove(NFTokenID);
  };

  return (
    <Link 
      href={`/nft/${NFTokenID}`} 
      underline="none" 
      sx={{ 
        display: 'block',
        position: 'relative',
        '&:hover .nft-card': {
          transform: 'translateY(-4px)',
          borderColor: alpha(theme.palette.primary.main, 0.3),
          '& .card-media': {
            transform: 'scale(1.05)'
          }
        }
      }}
    >
      <Box
        className="nft-card"
        sx={{
          width: '100%',
          aspectRatio: '1 / 1.4',
          borderRadius: 2,
          background: 'transparent',
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer'
        }}
      >
        {/* Admin Close Button */}
        {isAdmin && (
          <IconButton
            size="small"
            onClick={handleRemoveNft}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              backgroundColor: 'transparent',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                borderColor: alpha(theme.palette.error.main, 0.3),
                color: theme.palette.error.main,
                transform: 'rotate(90deg)'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}

        {/* Sale Badge */}
        {isSold && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 9,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              border: `1px solid ${theme.palette.error.main}`,
              color: theme.palette.error.main,
              fontSize: '0.65rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              backgroundColor: alpha(theme.palette.background.default, 0.8)
            }}
          >
            SALE
          </Box>
        )}

        {/* Image Section */}
        <Box sx={{ position: 'relative', height: '65%', overflow: 'hidden' }}>
          {loadingImg ? (
            <Skeleton variant="rectangular" sx={{ width: '100%', height: '100%' }} />
          ) : (
            <Box
              component="img"
              src={imgUrl}
              alt={name}
              className="card-media"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          )}
          <img src={imgUrl} style={{ display: 'none' }} onLoad={handleImageLoad} alt="" />

          {/* Overlays */}
          <Stack
            direction="column"
            spacing={0.5}
            sx={{ position: 'absolute', top: 8, left: 8, right: 8 }}
          >
            {/* Offer Badge */}
            {costb?.amount && (
              <Box
                sx={{
                  alignSelf: 'flex-end',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.5)}`,
                  color: theme.palette.success.main,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: 'transparent'
                }}
              >
                Offer ✕ {fNumber(costb.amount)}
              </Box>
            )}

            {/* Transfer Badge */}
            {destination && getMinterName(account) && (
              <Box
                sx={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.primary.main}`,
                  color: theme.palette.primary.main,
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  backgroundColor: 'transparent'
                }}
              >
                <SendIcon sx={{ fontSize: '0.9rem' }} />
                Transfer
              </Box>
            )}

            {/* Update Event */}
            {updateEvent && (
              <Box
                sx={{
                  alignSelf: 'flex-end',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  color: theme.palette.text.primary,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: 'transparent'
                }}
              >
                {updateEvent}
              </Box>
            )}
          </Stack>
        </Box>

        {/* Content Section */}
        <Box
          sx={{
            p: 1.5,
            height: '35%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                mb: 0.5
              }}
            >
              {name}
            </Typography>
            {(cost || amount) && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600 }}
              >
                {cost
                  ? cost.currency === 'XRP'
                    ? `✕ ${fNumber(cost.amount)}`
                    : `${fNumber(cost.amount)} ${normalizeCurrencyCodeXummImpl(cost.currency)}`
                  : `✕ ${fNumber(amount)}`}
              </Typography>
            )}
          </Box>

          {/* Ranks */}
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            {MasterSequence > 0 && (
              <Tooltip title="On-Chain Rank">
                <Chip
                  label={`# ${fIntNumber(MasterSequence)}`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    backgroundColor: 'transparent',
                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                    color: theme.palette.info.main
                  }}
                />
              </Tooltip>
            )}
            {rarity_rank > 0 && (
              <Tooltip title="Rarity Rank">
                <Chip
                  icon={<LeaderboardOutlinedIcon sx={{ fontSize: 14 }} />}
                  label={fIntNumber(rarity_rank)}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    backgroundColor: 'transparent',
                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                    color: theme.palette.info.main
                  }}
                />
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Box>
    </Link>
  );
});

// Main NFT Explorer Component
export default function NFTExplorer({ collection }) {
  const BASE_URL = 'https://api.xrpnft.com/api';
  const theme = useTheme();
  const { setDeletingNfts } = useContext(AppContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [nfts, setNfts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState(0);
  const [subFilter, setSubFilter] = useState(0);
  const [filterAttrs, setFilterAttrs] = useState([]);

  // Fetch NFTs
  const fetchNfts = useCallback(() => {
    setLoading(true);
    const limit = 32;
    const body = {
      page,
      limit,
      flag: 0,
      cid: collection?.uuid,
      search,
      filter,
      subFilter,
      filterAttrs
    };

    axios
      .post(`${BASE_URL}/nfts`, body)
      .then((res) => {
        const newNfts = res.data.nfts || [];
        setHasMore(newNfts.length === limit);
        setNfts(prev => page === 0 ? newNfts : [...prev, ...newNfts]);
        setDeletingNfts(prev => page === 0 ? newNfts : [...prev, ...newNfts]);
      })
      .catch((err) => console.error('Error fetching NFTs:', err))
      .finally(() => setLoading(false));
  }, [page, search, filter, subFilter, filterAttrs, collection?.uuid, setDeletingNfts]);

  // Reset on filter change
  useEffect(() => {
    setNfts([]);
    setPage(0);
    setHasMore(true);
  }, [search, filter, subFilter, filterAttrs]);

  // Fetch on page change
  useEffect(() => {
    fetchNfts();
  }, [fetchNfts]);

  const debouncedSearch = useMemo(
    () => debounce((value) => setSearch(value), 300),
    []
  );

  const handleRemove = useCallback((NFTokenID) => {
    if (!collection) return;
    
    setLoading(true);
    axios
      .delete(`${BASE_URL}/nfts`, {
        data: {
          issuer: collection.account,
          taxon: collection.taxon,
          cid: collection.uuid,
          idsToDelete: NFTokenID
        }
      })
      .then(() => location.reload())
      .catch((err) => console.error('Error removing NFT:', err))
      .finally(() => setLoading(false));
  }, [collection]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, backgroundColor: 'transparent', minHeight: '100vh' }}>
      {/* Search Bar */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          alignItems: 'center'
        }}
      >
        <IconButton
          onClick={() => setShowFilter(!showFilter)}
          sx={{
            border: `1px solid ${showFilter ? theme.palette.primary.main : alpha(theme.palette.divider, 0.3)}`,
            color: showFilter ? theme.palette.primary.main : theme.palette.text.primary,
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              borderColor: theme.palette.primary.main
            }
          }}
        >
          <FilterListIcon />
        </IconButton>

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            backgroundColor: 'transparent',
            '&:focus-within': {
              borderColor: theme.palette.primary.main
            }
          }}
        >
          <SearchIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
          <TextField
            fullWidth
            variant="standard"
            placeholder={isMobile ? "Search NFTs..." : "Search by name or attribute..."}
            onChange={(e) => debouncedSearch(e.target.value)}
            InputProps={{
              disableUnderline: true,
              endAdornment: search && (
                <IconButton size="small" onClick={() => {
                  setSearch('');
                  debouncedSearch('');
                }}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              )
            }}
          />
          {loading && <ClipLoader color={theme.palette.primary.main} size={16} />}
        </Paper>
      </Box>

      {/* Filter Section */}
      {showFilter && (
        <Fade in={showFilter}>
          <Box sx={{ mb: 3 }}>
            <FilterDetail
              collection={collection}
              filter={filter}
              setFilter={setFilter}
              subFilter={subFilter}
              setSubFilter={setSubFilter}
              filterAttrs={filterAttrs}
              setFilterAttrs={setFilterAttrs}
            />
          </Box>
        </Fade>
      )}

      {/* NFT Grid */}
      <InfiniteScroll
        dataLength={nfts.length}
        next={() => setPage(prev => prev + 1)}
        hasMore={hasMore}
        loader={
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <ClipLoader color={theme.palette.primary.main} size={30} />
          </Box>
        }
        endMessage={
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Image
              src="/static/empty-folder.png"
              alt="No more NFTs"
              width={120}
              height={120}
              style={{ opacity: 0.5 }}
            />
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
              That's all for now!
            </Typography>
          </Box>
        }
      >
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(6, 1fr)',
              xl: 'repeat(8, 1fr)'
            }
          }}
        >
          {nfts.map((nft) => (
            <NFTCard
              key={nft.NFTokenID}
              nft={nft}
              collection={collection}
              onRemove={handleRemove}
            />
          ))}
        </Box>
      </InfiniteScroll>
    </Box>
  );
}