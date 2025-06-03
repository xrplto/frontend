import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
import { useContext, useState } from 'react';
import {
  styled,
  useTheme,
  Box,
  CardMedia,
  Chip,
  Link,
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

import { getMinterName } from 'src/utils/constants';
import { fNumber, fIntNumber } from 'src/utils/formatNumber';
import { getNftCoverUrl } from 'src/utils/parse/utils';
import Label from './Label';
import { AppContext } from 'src/AppContext';
import { alpha } from '@mui/material/styles';

const CardWrapper = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  backdropFilter: 'blur(20px)',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
    theme.palette.background.paper,
    0.7
  )} 100%)`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}, 0 2px 8px ${alpha(
    theme.palette.primary.main,
    0.04
  )}`,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  padding: 0,
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 16px ${alpha(
      theme.palette.primary.main,
      0.1
    )}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
    '&::before': {
      opacity: 0.8
    },
    '& .card-media': {
      transform: 'scale(1.05)'
    },
    '& .card-content': {
      background: `linear-gradient(135deg, ${alpha(
        theme.palette.background.paper,
        0.95
      )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
    }
  }
}));

export default function NFTCard({ nft, handleRemove }) {
  const theme = useTheme();
  const { accountProfile } = useContext(AppContext);
  const isAdmin = accountProfile?.admin;

  const [loadingImg, setLoadingImg] = useState(true);

  const { uuid, account, cost, costb, meta, NFTokenID, destination, rarity_rank, updateEvent } =
    nft;

  const isSold = false;
  const imgUrl = getNftCoverUrl(nft, 'small');
  const name = nft.meta?.name || meta?.Name || 'No Name';

  const onImageLoaded = () => {
    setLoadingImg(false);
  };

  const handleRemoveNft = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    handleRemove(NFTokenID);
  };

  return (
    <Link href={`/nft/${NFTokenID}`} underline="none" sx={{ position: 'relative' }}>
      <CardWrapper sx={{ margin: 'auto', maxWidth: 280, aspectRatio: '9 / 13' }}>
        {isAdmin && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 1500,
              p: 0.5,
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.error.main,
                0.9
              )} 0%, ${alpha(theme.palette.error.main, 0.7)} 100%)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`
              }
            }}
            onClick={(e) => handleRemoveNft(e)}
          >
            <CloseIcon
              sx={{
                color: theme.palette.common.white,
                fontSize: '1rem'
              }}
            />
          </Box>
        )}
        {isSold && (
          <Label
            variant="filled"
            color="error"
            sx={{
              zIndex: 9,
              top: 24,
              right: 24,
              position: 'absolute',
              textTransform: 'uppercase',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
              boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`
            }}
          >
            SOLD
          </Label>
        )}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '20px 20px 0 0',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: `linear-gradient(to top, ${alpha(
                theme.palette.common.black,
                0.3
              )} 0%, transparent 100%)`,
              pointerEvents: 'none'
            }
          }}
        >
          <CardMedia
            component={loadingImg ? Skeleton : 'img'}
            image={imgUrl}
            loading={loadingImg.toString()}
            alt={'NFT' + uuid}
            className="card-media"
            sx={{
              width: '100%',
              height: '75%',
              objectFit: 'cover',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: loadingImg ? 'none' : 'brightness(1.05) contrast(1.1)'
            }}
          />
          <img src={imgUrl} style={{ display: 'none' }} onLoad={onImageLoaded} />
        </Box>

        <CardContent
          className="card-content"
          sx={{
            padding: 2,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.9
            )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
            backdropFilter: 'blur(20px)',
            height: '25%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            transition: 'all 0.3s ease',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(90deg, transparent 0%, ${alpha(
                theme.palette.primary.main,
                0.3
              )} 50%, transparent 100%)`
            }
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                fontSize: '0.8rem',
                lineHeight: 1.3,
                color: theme.palette.text.primary,
                mb: 0.5,
                letterSpacing: '-0.01em'
              }}
            >
              {name}
            </Typography>
            {cost && (
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.success.main,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.1
                  )} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                  px: 1,
                  py: 0.3,
                  borderRadius: '6px',
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  display: 'inline-block'
                }}
                noWrap
              >
                {cost.currency === 'XRP'
                  ? `✕ ${fNumber(cost.amount)}`
                  : `${fNumber(cost.amount)} ${normalizeCurrencyCodeXummImpl(cost.currency)}`}
              </Typography>
            )}
          </Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
            {destination && getMinterName(account) ? (
              <Tooltip title={`Sold & Transfer`}>
                <Box
                  sx={{
                    p: 0.5,
                    borderRadius: '6px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.15
                    )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                >
                  <SportsScoreIcon
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: '1rem'
                    }}
                  />
                </Box>
              </Tooltip>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.6
                  )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                  px: 1,
                  py: 0.3,
                  borderRadius: '6px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                {costb ? `Offer ✕ ${fNumber(costb.amount)}` : 'No Offer'}
              </Typography>
            )}
            {rarity_rank > 0 && (
              <Chip
                variant="filled"
                color="secondary"
                icon={
                  <LeaderboardOutlinedIcon
                    sx={{
                      width: '14px',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                    }}
                  />
                }
                label={
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem'
                    }}
                  >
                    {fIntNumber(rarity_rank)}
                  </Typography>
                }
                size="small"
                sx={{
                  height: '24px',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.secondary.main,
                    0.9
                  )} 0%, ${alpha(theme.palette.secondary.main, 0.7)} 100%)`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                  boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.2)}`,
                  '& .MuiChip-label': {
                    px: 0.8,
                    color: theme.palette.common.white,
                    fontWeight: 600
                  }
                }}
              />
            )}
          </Stack>
        </CardContent>
      </CardWrapper>
    </Link>
  );
}
