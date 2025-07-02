import {
  Box,
  Button,
  Grid,
  IconButton,
  Stack,
  Typography,
  useTheme,
  CardMedia,
  Chip,
  Link,
  Tooltip,
  Skeleton,
  Card,
  CardContent,
  styled
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/KeyboardBackspace';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CollectionsIcon from '@mui/icons-material/Collections';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import axios from 'axios';
import { useContext, useEffect, useRef, useState } from 'react';
import { PulseLoader } from 'react-spinners';
import { AppContext } from 'src/AppContext';
import { useRouter } from 'next/router';
import { alpha } from '@mui/material/styles';
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
import { getMinterName } from 'src/utils/constants';
import { fNumber, fIntNumber } from 'src/utils/formatNumber';
import { getNftCoverUrl } from 'src/utils/parse/utils';
import Label from './Label';

// NFT Card Wrapper
const NFTCardWrapper = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  background: theme.palette.background.paper,
  boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  overflow: 'hidden',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`,
    '& .card-media': {
      transform: 'scale(1.02)'
    }
  }
}));

// Collection Card Wrapper
const CollectionCardWrapper = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  background: theme.palette.background.paper,
  boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  overflow: 'hidden',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  marginTop: '8px',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`,
    '& .card-media': {
      transform: 'scale(1.02)'
    }
  }
}));

// NFT Card Component
function NFTCard({ nft, handleRemove, smallSize = false }) {
  const theme = useTheme();
  const { accountProfile } = useContext(AppContext);
  const isAdmin = accountProfile?.admin;
  const [loadingImg, setLoadingImg] = useState(true);

  const { uuid, account, cost, costb, meta, NFTokenID, destination, rarity_rank } = nft;
  const imgUrl = getNftCoverUrl(nft, 'small');
  const name = nft.meta?.name || meta?.Name || 'No Name';

  const onImageLoaded = () => setLoadingImg(false);

  const handleRemoveNft = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    handleRemove(NFTokenID);
  };

  return (
    <Link
      href={`/nft/${NFTokenID}`}
      underline="none"
      sx={{ display: 'block', width: '100%', height: '100%' }}
    >
      <NFTCardWrapper sx={{ height: smallSize ? '140px' : '170px' }}>
        {isAdmin && (
          <IconButton
            size="small"
            onClick={handleRemoveNft}
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              zIndex: 10,
              bgcolor: alpha(theme.palette.error.main, 0.9),
              color: 'white',
              width: 20,
              height: 20,
              '&:hover': { bgcolor: theme.palette.error.main }
            }}
          >
            <CloseIcon sx={{ fontSize: '12px' }} />
          </IconButton>
        )}

        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            height: smallSize ? '90px' : '115px',
            minHeight: smallSize ? '90px' : '115px',
            maxHeight: smallSize ? '90px' : '115px',
            bgcolor: alpha(theme.palette.grey[500], 0.1)
          }}
        >
          {loadingImg && (
            <Skeleton
              variant="rectangular"
              sx={{
                width: '100%',
                height: smallSize ? '90px' : '115px',
                position: 'absolute'
              }}
            />
          )}
          <CardMedia
            component="img"
            image={imgUrl}
            alt={name}
            className="card-media"
            onLoad={onImageLoaded}
            sx={{
              width: '100%',
              height: smallSize ? '90px' : '115px',
              minHeight: smallSize ? '90px' : '115px',
              maxHeight: smallSize ? '90px' : '115px',
              objectFit: 'cover',
              transition: 'transform 0.2s ease',
              opacity: loadingImg ? 0 : 1,
              display: 'block'
            }}
          />
        </Box>

        <CardContent
          sx={{
            p: 1,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              fontSize: smallSize ? '0.7rem' : '0.8rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mb: 0.5,
              lineHeight: 1.2
            }}
          >
            {name}
          </Typography>

          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={0.5}>
            {cost ? (
              <Chip
                label={
                  cost.currency === 'XRP'
                    ? `✕ ${fNumber(cost.amount)}`
                    : `${fNumber(cost.amount)} ${normalizeCurrencyCodeXummImpl(cost.currency)}`
                }
                size="small"
                sx={{
                  bgcolor: theme.palette.success.main,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: smallSize ? '0.6rem' : '0.65rem',
                  height: '20px'
                }}
              />
            ) : costb ? (
              <Typography
                variant="caption"
                sx={{ fontSize: smallSize ? '0.6rem' : '0.65rem', color: 'text.secondary' }}
              >
                Offer ✕ {fNumber(costb.amount)}
              </Typography>
            ) : (
              <Typography
                variant="caption"
                sx={{ fontSize: smallSize ? '0.6rem' : '0.65rem', color: 'text.secondary' }}
              >
                No Offer
              </Typography>
            )}

            {rarity_rank > 0 && (
              <Chip
                icon={<LeaderboardOutlinedIcon sx={{ fontSize: '10px' }} />}
                label={`#${fIntNumber(rarity_rank)}`}
                size="small"
                variant="outlined"
                sx={{
                  height: '18px',
                  fontSize: smallSize ? '0.6rem' : '0.65rem',
                  '& .MuiChip-icon': { ml: 0.5 }
                }}
              />
            )}
          </Stack>
        </CardContent>
      </NFTCardWrapper>
    </Link>
  );
}

// Collection Card Component
function CollectionCard({ collectionData, type, account, handleRemove, smallSize = false }) {
  const theme = useTheme();
  const router = useRouter();
  const { accountProfile } = useContext(AppContext);
  const isAdmin = accountProfile?.admin;
  const [loadingImg, setLoadingImg] = useState(true);

  const collection = collectionData.collection;
  if (!collection) return null;

  const { id: uuid, NFTokenID, destination, rarity_rank } = collection;
  const imgUrl = `https://s1.xrpnft.com/collection/${collection.logoImage}`;
  const name = collection.name || 'No Name';
  const totalItems = collectionData.nftCount || 0;
  const forSale = collectionData.nftsForSale || 0;

  const onImageLoaded = () => setLoadingImg(false);

  const handleRemoveNft = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    handleRemove(NFTokenID);
  };

  const collectionType = type.charAt(0).toUpperCase() + type.slice(1);
  const redirectToDetail = () => {
    router.push(`/profile/${account}/collection${collectionType}/${collectionData.collection.id}`);
  };

  return (
    <Box onClick={redirectToDetail} sx={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
      <CollectionCardWrapper sx={{ width: '100%', height: '100%' }}>
        {isAdmin && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              zIndex: 1500,
              p: 0.3,
              borderRadius: '6px',
              background: alpha(theme.palette.error.main, 0.9),
              cursor: 'pointer'
            }}
            onClick={handleRemoveNft}
          >
            <CloseIcon sx={{ color: 'white', fontSize: '0.8rem' }} />
          </Box>
        )}

        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            height: smallSize ? '90px' : '115px',
            minHeight: smallSize ? '90px' : '115px',
            maxHeight: smallSize ? '90px' : '115px',
            bgcolor: alpha(theme.palette.grey[500], 0.1)
          }}
        >
          <CardMedia
            component={
              loadingImg
                ? () => (
                    <Skeleton
                      variant="rectangular"
                      sx={{ width: '100%', height: smallSize ? '70px' : '90px' }}
                    />
                  )
                : 'img'
            }
            image={imgUrl}
            alt={'Collection' + uuid}
            className="card-media"
            sx={{
              width: '100%',
              height: smallSize ? '70px' : '90px',
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
          />
          <img src={imgUrl} style={{ display: 'none' }} onLoad={onImageLoaded} alt="" />

          <Box
            sx={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              px: 0.8,
              py: 0.3,
              borderRadius: '6px',
              background: alpha(theme.palette.info.main, 0.9)
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: 'white', fontWeight: 700, fontSize: '0.55rem' }}
            >
              COLLECTION
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ padding: smallSize ? 1 : 1.5 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: smallSize ? '0.7rem' : '0.8rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mb: 1,
              color: theme.palette.text.primary
            }}
          >
            {name}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={0.5}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.3,
                  px: 0.5,
                  py: 0.2,
                  borderRadius: '4px',
                  background: alpha(theme.palette.info.main, 0.1)
                }}
              >
                <CollectionsIcon sx={{ fontSize: '0.7rem', color: theme.palette.info.main }} />
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.6rem', fontWeight: 600, color: theme.palette.info.main }}
                >
                  {totalItems}
                </Typography>
              </Box>

              {forSale > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.3,
                    px: 0.5,
                    py: 0.2,
                    borderRadius: '4px',
                    background: alpha(theme.palette.success.main, 0.1)
                  }}
                >
                  <LocalOfferIcon sx={{ fontSize: '0.7rem', color: theme.palette.success.main }} />
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.6rem', fontWeight: 600, color: theme.palette.success.main }}
                  >
                    {forSale}
                  </Typography>
                </Box>
              )}
            </Stack>

            {destination && getMinterName(account) ? (
              <Box
                sx={{
                  p: 0.4,
                  borderRadius: '6px',
                  background: alpha(theme.palette.primary.main, 0.1)
                }}
              >
                <SportsScoreIcon sx={{ color: theme.palette.primary.main, fontSize: '0.8rem' }} />
              </Box>
            ) : rarity_rank > 0 ? (
              <Chip
                icon={<LeaderboardOutlinedIcon sx={{ width: '10px', height: '10px' }} />}
                label={`#${fIntNumber(rarity_rank)}`}
                size="small"
                sx={{ height: '18px', fontSize: '0.6rem' }}
              />
            ) : null}
          </Stack>
        </CardContent>
      </CollectionCardWrapper>
    </Box>
  );
}

// Main NFT Portfolio Component
const NFTPortfolio = ({
  account,
  collection,
  type = 'collected',
  limit,
  onSelect,
  smallSize = false
}) => {
  const BASE_URL = 'https://api.xrpnft.com/api';
  const router = useRouter();
  const scrollRef = useRef(null);
  const theme = useTheme();
  const { darkMode } = useContext(AppContext);

  const [nfts, setNFTs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      getNFTs();
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [account, collection, type]);

  const getNFTs = async () => {
    const body = {
      account,
      filter: 0,
      limit,
      page: 0,
      search: '',
      subFilter: 'pricexrpasc',
      type,
      collection
    };
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/account/collectedCreated`, body);
      setNFTs(res.data.nfts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/profile/${account}`);
  };

  return (
    <Box
      sx={{
        padding: smallSize ? '8px' : '16px',
        pt: 0,
        height: smallSize ? '320px' : '580px',
        overflow: 'auto',
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.background.paper, 0.05)} 0%, 
          ${alpha(theme.palette.background.default, 0.02)} 50%,
          ${alpha(theme.palette.primary.main, 0.01)} 100%)`,
        borderRadius: smallSize ? '12px' : '20px',
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        backdropFilter: 'blur(20px)'
      }}
    >
      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
          <PulseLoader color={theme.palette.primary.main} size={12} />
        </Stack>
      ) : (
        nfts &&
        nfts.length === 0 && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{ py: 6, height: '100%' }}
          >
            <ErrorOutlineIcon sx={{ fontSize: '2rem', color: theme.palette.info.main }} />
            <Box>
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600, mb: 0.5 }}>
                No NFTs Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This collection appears to be empty
              </Typography>
            </Box>
          </Stack>
        )
      )}

      {collection && (
        <Box display="flex" justifyContent="start" mb={2} ref={scrollRef}>
          <Button
            size="medium"
            onClick={handleBack}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            <ArrowBackIcon sx={{ fontSize: '1.2rem', mr: 1 }} />
            Go back
          </Button>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: smallSize ? '8px' : '12px',
          width: '100%'
        }}
      >
        {nfts.map((nft, index) => (
          <Box
            key={index}
            sx={{
              width: smallSize ? '120px' : '150px',
              flexShrink: 0
            }}
          >
            {collection ? (
              <NFTCard nft={nft} smallSize={smallSize} onSelect={onSelect} />
            ) : (
              <CollectionCard
                collectionData={nft}
                type={type}
                account={account}
                smallSize={smallSize}
                onSelect={onSelect}
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default NFTPortfolio;
