import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
import { useContext, useState } from 'react';

// Material
import {
  styled,
  useTheme,
  Box,
  CardMedia,
  Chip,
  Stack,
  Tooltip,
  Typography,
  Skeleton,
  Card,
  CardContent
} from '@mui/material';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CollectionsIcon from '@mui/icons-material/Collections';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

// Utils
import { getMinterName } from 'src/utils/constants';
import { fNumber, fIntNumber } from 'src/utils/formatNumber';

// Components
import Label from './Label';
import { AppContext } from 'src/AppContext';
import { useRouter } from 'next/router';

import { alpha } from '@mui/material/styles';

const CardWrapper = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  backdropFilter: 'blur(10px)',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
    theme.palette.background.paper,
    0.8
  )} 100%)`,
  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: 0,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  overflow: 'hidden',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 30px ${alpha(theme.palette.common.black, 0.12)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    '& .card-media': {
      transform: 'scale(1.05)'
    }
  }
}));

export default function CollectionCard({ collectionData, type, account, handleRemove }) {
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

  const onImageLoaded = () => {
    setLoadingImg(false);
  };

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
    <Stack onClick={redirectToDetail} sx={{ mt: 1 }}>
      <CardWrapper
        sx={{
          marginLeft: 'auto',
          marginRight: 'auto',
          width: '100%',
          maxWidth: 240,
          aspectRatio: '3 / 4'
        }}
      >
        {isAdmin && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1500,
              p: 0.3,
              borderRadius: '6px',
              background: alpha(theme.palette.error.main, 0.9),
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.1)'
              }
            }}
            onClick={(e) => handleRemoveNft(e)}
          >
            <CloseIcon
              sx={{
                color: theme.palette.common.white,
                fontSize: '0.8rem'
              }}
            />
          </Box>
        )}

        {/* Simple Sale Badge */}
        {forSale > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 1500,
              px: 0.8,
              py: 0.3,
              borderRadius: '6px',
              background: alpha(theme.palette.success.main, 0.9),
              boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.3)}`
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.common.white,
                fontWeight: 600,
                fontSize: '0.6rem'
              }}
            >
              {Math.round((forSale / totalItems) * 100)}% FOR SALE
            </Typography>
          </Box>
        )}

        {/* Minimalist Image Container */}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px 16px 0 0'
          }}
        >
          <CardMedia
            component={
              loadingImg
                ? () => (
                    <Skeleton
                      variant="rectangular"
                      sx={{
                        width: '100%',
                        height: '180px',
                        borderRadius: '16px 16px 0 0'
                      }}
                    />
                  )
                : 'img'
            }
            image={imgUrl}
            loading={loadingImg.toString()}
            alt={'Collection' + uuid}
            className="card-media"
            sx={{
              width: '100%',
              height: '180px',
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
          />
          <img src={imgUrl} style={{ display: 'none' }} onLoad={onImageLoaded} />

          {/* Simple Collection Badge */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              px: 0.8,
              py: 0.3,
              borderRadius: '6px',
              background: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(10px)'
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: '0.6rem',
                textTransform: 'uppercase'
              }}
            >
              Collection
            </Typography>
          </Box>
        </Box>

        {/* Compact Content Section */}
        <CardContent
          sx={{
            padding: 1.5,
            background: theme.palette.background.paper,
            height: 'auto'
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              fontSize: '0.85rem',
              lineHeight: 1.2,
              color: theme.palette.text.primary,
              mb: 1
            }}
          >
            {name}
          </Typography>

          {/* Compact Stats Row */}
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={0.8}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.3,
                  px: 0.6,
                  py: 0.2,
                  borderRadius: '4px',
                  background: alpha(theme.palette.info.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <CollectionsIcon
                  sx={{
                    fontSize: '0.7rem',
                    color: theme.palette.info.main
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: theme.palette.info.main
                  }}
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
                    px: 0.6,
                    py: 0.2,
                    borderRadius: '4px',
                    background: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                  }}
                >
                  <LocalOfferIcon
                    sx={{
                      fontSize: '0.7rem',
                      color: theme.palette.success.main
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: theme.palette.success.main
                    }}
                  >
                    {forSale}
                  </Typography>
                </Box>
              )}
            </Stack>

            {/* Action/Rank Section */}
            {destination && getMinterName(account) ? (
              <Tooltip title="Sold & Transfer" placement="top">
                <Box
                  sx={{
                    p: 0.4,
                    borderRadius: '6px',
                    background: alpha(theme.palette.primary.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                >
                  <SportsScoreIcon
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: '0.8rem'
                    }}
                  />
                </Box>
              </Tooltip>
            ) : rarity_rank > 0 ? (
              <Chip
                variant="filled"
                color="secondary"
                icon={
                  <LeaderboardOutlinedIcon
                    sx={{
                      width: '10px',
                      height: '10px'
                    }}
                  />
                }
                label={
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.6rem',
                      fontWeight: 600
                    }}
                  >
                    #{fIntNumber(rarity_rank)}
                  </Typography>
                }
                size="small"
                sx={{
                  height: '20px',
                  '& .MuiChip-label': {
                    px: 0.5
                  }
                }}
              />
            ) : null}
          </Stack>
        </CardContent>
      </CardWrapper>
    </Stack>
  );
}
