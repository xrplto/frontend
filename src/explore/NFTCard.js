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
import SendIcon from '@mui/icons-material/Send';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { Icon } from '@iconify/react';

import { getMinterName } from 'src/utils/constants';
import { fNumber, fIntNumber } from 'src/utils/formatNumber';
import { getNftCoverUrl } from 'src/utils/parse/utils';
import Label from './Label';
import { AppContext } from 'src/AppContext';
import { alpha } from '@mui/material/styles';

const CardWrapper = styled(Card)(({ theme }) => ({
  width: '100%',
  aspectRatio: '1 / 1.4',
  borderRadius: 16,
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
    boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 16px ${alpha(
      theme.palette.primary.main,
      0.1
    )}`,
    '& .card-media': {
      transform: 'scale(1.05)'
    }
  }
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

  const isSold = true;
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
      <CardWrapper>
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
              backdropFilter: 'blur(4px)',
              padding: '2px 6px',
              fontSize: '0.6rem',
              height: 'auto'
            }}
          >
            SALE
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
          {loadingImg ? (
            <Skeleton
              variant="rectangular"
              className="card-media"
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '16px 16px 0 0'
              }}
            />
          ) : (
            <CardMedia
              component="img"
              image={imgUrl}
              alt={'NFT' + uuid}
              className="card-media"
              loading="lazy"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '16px 16px 0 0',
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          )}
          <img src={imgUrl} style={{ display: 'none' }} onLoad={onImageLoaded} alt="" />

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
                  background: alpha(theme.palette.success.dark, 0.8),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  borderRadius: '12px',
                  padding: '2px 8px',
                  marginBottom: '4px',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.common.white,
                    letterSpacing: '0.5px',
                    fontSize: '0.65rem',
                    textShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.1)}`
                  }}
                  noWrap
                >
                  Offer ✕ {fNumber(costb.amount)}
                </Typography>
              </Box>
            )}
            {destination && getMinterName(account) && (
              <Label
                variant="filled"
                color="primary"
                sx={{
                  zIndex: 9,
                  top: 12,
                  left: 12,
                  position: 'absolute',
                  textTransform: 'uppercase'
                }}
              >
                <SendIcon sx={{ fontSize: '1.1rem', mr: 0.5 }} />
                Transfer
              </Label>
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
            padding: '12px 12px 8px',
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
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                fontSize: '0.85rem',
                mb: 0.5,
                letterSpacing: '0.1px',
                color: theme.palette.text.primary,
                lineHeight: 1.3
              }}
            >
              {name}
            </Typography>
            <Box>
              {(cost || amount) && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  sx={{
                    fontSize: '0.75rem',
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
                    label={
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700 }}>
                        # {fIntNumber(MasterSequence)}
                      </Typography>
                    }
                    size="small"
                    sx={{
                      height: '24px',
                      borderRadius: '12px',
                      p: '0 2px',
                      '& .MuiChip-label': { px: '6px' },
                      background: alpha(theme.palette.info.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                      color: theme.palette.info.main,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: alpha(theme.palette.info.main, 0.2),
                        transform: 'translateY(-1px)'
                      }
                    }}
                  />
                </Tooltip>
              )}
              {rarity_rank > 0 && (
                <Tooltip title="Rarity Rank">
                  <Chip
                    variant="filled"
                    color="info"
                    icon={
                      <LeaderboardOutlinedIcon sx={{ width: '14px', height: '14px', ml: '6px' }} />
                    }
                    label={
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700 }}>
                        {fIntNumber(rarity_rank)}
                      </Typography>
                    }
                    size="small"
                    sx={{
                      height: '24px',
                      borderRadius: '12px',
                      p: '0 2px',
                      '& .MuiChip-label': { px: '6px' },
                      background: alpha(theme.palette.info.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                      color: theme.palette.info.main,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: alpha(theme.palette.info.main, 0.2),
                        transform: 'translateY(-1px)'
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
