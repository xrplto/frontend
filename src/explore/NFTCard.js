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
  borderRadius: 16,
  backdropFilter: 'blur(20px)',
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  boxShadow: '0 4px 20px 0 rgba(31, 38, 135, 0.15)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: 0,
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: `0 4px 20px 0 ${alpha(theme.palette.primary.main, 0.15)}`,
    '& .card-media': {
      transform: 'scale(1.05)'
    }
  },
  height: 300
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

  const showBuyNowButton =
    (cost && cost.issuer === 'XRPL' && cost.currency === 'XRP' && cost.amount) || amount;

  return (
    <Link href={`/nft/${NFTokenID}`} underline="none" sx={{ position: 'relative' }}>
      <CardWrapper sx={{ margin: 'auto', maxWidth: 240, height: 300 }}>
        {isAdmin && (
          <CloseIcon
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1500,
              color: theme.palette.grey[300],
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              borderRadius: '50%',
              padding: '4px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                color: theme.palette.error.main,
                transform: 'rotate(90deg)'
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
              top: 16,
              right: 16,
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
        <Box sx={{ position: 'relative', height: '65%', overflow: 'hidden' }}>
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
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  borderRadius: '12px',
                  padding: '6px 12px',
                  marginBottom: '8px',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: '#fff',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                    letterSpacing: '0.5px'
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
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  borderRadius: '8px',
                  padding: '4px 8px',
                  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    letterSpacing: '0.3px'
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
            padding: 1.5,
            background: alpha(theme.palette.background.default, 0.95),
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                fontSize: '0.9rem',
                mb: 0.5,
                letterSpacing: '0.2px'
              }}
            >
              {name}
            </Typography>
            {(cost || amount) && (
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{
                  fontSize: '0.8rem',
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
            justifyContent="space-between"
            width="100%"
            mt={1.5}
            spacing={1}
          >
            {showBuyNowButton && (
              <Button
                variant="contained"
                color="primary"
                sx={{
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.2)'
                  },
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  minHeight: '24px',
                  maxWidth: '70px',
                  minWidth: 'unset',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  letterSpacing: '0.3px'
                }}
              >
                Buy Now
              </Button>
            )}
            <Stack direction="row" spacing={0.8} alignItems="center">
              {MasterSequence > 0 && (
                <Tooltip title="On-Chain Rank">
                  <Chip
                    variant="filled"
                    color="info"
                    icon={<NumbersIcon sx={{ width: '14px' }} />}
                    label={
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                        {fIntNumber(MasterSequence)}
                      </Typography>
                    }
                    size="small"
                    sx={{
                      height: '24px',
                      '& .MuiChip-label': { px: 0.8 },
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                      boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)'
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
                    icon={<LeaderboardOutlinedIcon sx={{ width: '14px' }} />}
                    label={
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                        {fIntNumber(rarity_rank)}
                      </Typography>
                    }
                    size="small"
                    sx={{
                      height: '24px',
                      '& .MuiChip-label': { px: 0.8 },
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                      boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)'
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
