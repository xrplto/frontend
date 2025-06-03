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
  Grid,
  CardContent,
  Button
} from '@mui/material';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { Icon } from '@iconify/react';
import NumbersIcon from '@mui/icons-material/Numbers';

import { getMinterName } from 'src/utils/constants';
import { fNumber, fIntNumber } from 'src/utils/formatNumber';
import { getNftCoverUrl } from 'src/utils/parse/utils';
import Label from './Label';
import { AppContext } from 'src/AppContext';
import { alpha } from '@mui/material/styles';

const CardWrapper = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
    theme.palette.background.paper,
    0.8
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
    theme.palette.primary.main,
    0.04
  )}`,
  padding: 0,
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-4px)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 16px ${alpha(
      theme.palette.primary.main,
      0.1
    )}`,
    '& .card-media': {
      transform: 'scale(1.05)'
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
    opacity: 0.8,
    zIndex: 1
  },
  height: 220
}));

export default function NFTCard({ nft, handleRemove }) {
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
      <CardWrapper
        sx={{
          maxWidth: 160,
          width: 160,
          height: 220,
          '&:hover': {
            transform: 'translateY(-4px)',
            '& .card-media': {
              transform: 'scale(1.05)'
            }
          },
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        {isAdmin && (
          <CloseIcon
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1500,
              color: theme.palette.text.secondary,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.9
              )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: '50%',
              padding: '4px',
              boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                color: theme.palette.error.main,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.error.main,
                  0.1
                )} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                transform: 'rotate(90deg) scale(1.1)',
                boxShadow: `0 6px 16px ${alpha(theme.palette.error.main, 0.2)}`
              }
            }}
            onClick={(e) => handleRemoveNft(e)}
          />
        )}
        {isSold && (
          <Label
            variant="filled"
            color="error"
            sx={{
              zIndex: 9,
              top: 12,
              right: 12,
              position: 'absolute',
              textTransform: 'uppercase',
              borderRadius: '8px',
              fontWeight: 'bold',
              backdropFilter: 'blur(4px)'
            }}
          >
            SOLD
          </Label>
        )}
        <Box
          sx={{
            position: 'relative',
            height: '65%',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '30%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%)',
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
              height: '100%',
              objectFit: 'cover',
              borderRadius: '16px 16px 0 0',
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
          <img src={imgUrl} style={{ display: 'none' }} onLoad={onImageLoaded} />

          <Stack
            direction="column"
            alignItems="flex-end"
            justifyContent="flex-start"
            spacing={0.5}
            sx={{ position: 'absolute', top: 8, right: 8, left: 8, zIndex: 1500 }}
          >
            {costb && costb.amount && (
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.15
                  )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  borderRadius: '12px',
                  padding: '4px 8px',
                  marginBottom: '4px',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: `linear-gradient(90deg, transparent 0%, ${theme.palette.primary.main} 50%, transparent 100%)`,
                    opacity: 0.6
                  }
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    letterSpacing: '0.5px',
                    fontSize: '0.7rem',
                    textShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.1)}`
                  }}
                  noWrap
                >
                  Offer ✕ {fNumber(costb.amount)}
                </Typography>
              </Box>
            )}
            {updateEvent && (
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.9
                  )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  borderRadius: '10px',
                  padding: '3px 6px',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    letterSpacing: '0.3px',
                    fontSize: '0.7rem'
                  }}
                  noWrap
                >
                  {updateEvent}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        <CardContent
          sx={{
            padding: '8px 8px 6px',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.9
            )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
            height: '35%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backdropFilter: 'blur(10px)',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
            position: 'relative',
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
          <Box sx={{ minHeight: '32px', display: 'flex', flexDirection: 'column' }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                fontSize: '0.75rem',
                mb: 0.3,
                letterSpacing: '0.2px',
                color: theme.palette.text.primary,
                lineHeight: 1.2
              }}
            >
              {name}
            </Typography>
            <Box sx={{ minHeight: '14px' }}>
              {(cost || amount) && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  {cost
                    ? cost.currency === 'XRP'
                      ? `✕ ${fNumber(cost.amount)}`
                      : `${fNumber(cost.amount)} ${normalizeCurrencyCodeXummImpl(cost.currency)}`
                    : `✕ ${fNumber(amount)}`}
                </Typography>
              )}
            </Box>
            {destination && getMinterName(account) && (
              <Tooltip title={`Sold & Transfer`}>
                <SportsScoreIcon
                  color="primary"
                  sx={{
                    fontSize: '1.1rem',
                    mt: 0.5,
                    filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))'
                  }}
                />
              </Tooltip>
            )}
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            width="100%"
            spacing={1}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              {MasterSequence > 0 && (
                <Tooltip title="On-Chain Rank">
                  <Chip
                    variant="filled"
                    color="info"
                    icon={<NumbersIcon sx={{ width: '12px' }} />}
                    label={
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                        {fIntNumber(MasterSequence)}
                      </Typography>
                    }
                    size="small"
                    sx={{
                      height: '20px',
                      '& .MuiChip-label': { px: 0.5 },
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.info.main,
                        0.15
                      )} 0%, ${alpha(theme.palette.info.main, 0.08)} 100%)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      color: theme.palette.info.main,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 20px ${alpha(theme.palette.info.main, 0.25)}`
                      }
                    }}
                  />
                </Tooltip>
              )}
              {rarity_rank > 0 && (
                <Tooltip title="Rarity Rank">
                  <Chip
                    variant="filled"
                    color="secondary"
                    icon={<LeaderboardOutlinedIcon sx={{ width: '12px' }} />}
                    label={
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                        {fIntNumber(rarity_rank)}
                      </Typography>
                    }
                    size="small"
                    sx={{
                      height: '20px',
                      '& .MuiChip-label': { px: 0.5 },
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.secondary.main,
                        0.15
                      )} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                      color: theme.palette.secondary.main,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.15)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.main, 0.25)}`
                      }
                    }}
                  />
                </Tooltip>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </CardWrapper>
    </Link>
  );
}
