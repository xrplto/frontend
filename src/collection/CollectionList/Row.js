import {
  styled,
  IconButton,
  Link,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import { formatMonthYearDate } from 'src/utils/formatTime';
import { fNumber, fIntNumber, fVolume } from 'src/utils/formatNumber';
import { Icon } from '@iconify/react';

const IconCover = styled('div')(
  ({ theme }) => `
        width: 42px;  // Increased for better visibility
        height: 42px; // Increased for better visibility
        border: 2px solid ${theme.colors.alpha.black[10]};
        border-radius: 12px;
        background: ${theme.colors.alpha.white[100]};
        position: relative;
        overflow: hidden;
        transition: all 0.2s ease-in-out;
        -webkit-tap-highlight-color: transparent;
        
        &:hover, &.Mui-focusVisible {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.12);
            border-color: ${theme.colors.primary.main}40;
            
            & .MuiImageBackdrop-root {
                opacity: 0.1;
            }
            & .MuiIconEditButton-root {
                opacity: 1;
            }
        }

        ${theme.breakpoints.down('sm')} {
            width: 32px;
            height: 32px;
        }
    `
);

const IconWrapper = styled('div')(
  ({ theme }) => `
        box-sizing: border-box;
        display: inline-block;
        position: relative;
        width: 38px;
        height: 38px;

        ${theme.breakpoints.down('sm')} {
            width: 28px;
            height: 28px;
        }
  `
);

const IconImage = styled('img')(
  ({ theme }) => `
    position: absolute;
    inset: 0px;
    box-sizing: border-box;
    padding: 0px;
    border: none;
    margin: auto;
    display: block;
    width: 0px; height: 0px;
    min-width: 100%;
    max-width: 100%;
    min-height: 100%;
    max-height: 100%;
    object-fit: cover;
    border-radius: 0px;
  `
);

const ImageBackdrop = styled('span')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundColor: theme.palette.common.black,
  opacity: 0,
  transition: theme.transitions.create('opacity')
}));

export default function Row({ id, item, isMine }) {
  const {
    uuid,
    account,
    accountName,
    name,
    slug,
    items,
    type,
    description,
    logoImage,
    featuredImage,
    bannerImage,
    costs,
    extra,
    minter,
    verified,
    created,
    volume,
    totalVolume,
    vol24h,
    totalVol24h,
    floor,
    owners
  } = item;

  const floorPrice = floor?.amount || 0;
  const volume24h = fVolume(totalVol24h || 0);
  const totalVolumeDisplay = fVolume(totalVolume || 0);

  const strDateTime = formatMonthYearDate(created);
  const logoImageUrl = `https://s1.xrpnft.com/collection/${logoImage}`;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleRowClick = () => {
    document.location = `/collection/${slug}`;
  };

  return (
    <TableRow
      hover
      key={uuid}
      onClick={handleRowClick}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          backgroundColor: (theme) => theme.colors.alpha.black[5]
        }
      }}
    >
      <TableCell align="left" sx={{ p: 0, border: 'none' }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ pt: 1.5, pb: 1.5 }}>
          <Typography
            variant={isMobile ? 'caption' : 'body2'}
            sx={{
              minWidth: '24px',
              color: (theme) => theme.colors.alpha.black[70]
            }}
          >
            {id}
          </Typography>

          <Link href={isMine ? `/collection/${slug}/edit` : `/collection/${slug}`} underline="none">
            <IconCover>
              <IconWrapper>
                <IconImage src={logoImageUrl} />
              </IconWrapper>

              {isMine ? (
                <IconButton
                  className="MuiIconEditButton-root"
                  aria-label="edit"
                  sx={{
                    position: 'absolute',
                    left: '0vw',
                    top: '0vh',
                    opacity: 0,
                    zIndex: 1,
                    width: { xs: '18px', sm: '28px' }, // reduced sizes
                    height: { xs: '18px', sm: '28px' } // reduced sizes
                  }}
                >
                  <EditIcon />
                </IconButton>
              ) : (
                <ImageBackdrop className="MuiImageBackdrop-root" />
              )}
            </IconCover>
          </Link>

          <Link underline="none" href={`/collection/${slug}`}>
            <Stack spacing={0.8}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography
                  variant={isMobile ? 'subtitle2' : 'h6'}
                  noWrap
                  color="primary"
                  sx={{
                    width: isMobile ? '120px' : 'auto',
                    textOverflow: 'ellipsis',
                    fontWeight: 600
                  }}
                >
                  {name}
                </Typography>
                {verified && (
                  <VerifiedIcon
                    sx={{
                      fontSize: isMobile ? 14 : 18,
                      color: (theme) => theme.colors.primary.main
                    }}
                  />
                )}
              </Stack>
              <Typography
                variant={isMobile ? 'caption' : 'body2'}
                sx={{
                  color: (theme) => theme.colors.alpha.black[50],
                  fontWeight: 500
                }}
              >
                {strDateTime}
              </Typography>
            </Stack>
          </Link>
        </Stack>
      </TableCell>

      <TableCell align="right" sx={{ pl: 0, pr: 2, border: 'none' }}>
        <Typography variant={isMobile ? 'subtitle2' : 'h6'} noWrap sx={{ fontWeight: 600 }}>
          ✕ {fNumber(floorPrice)}
        </Typography>
      </TableCell>

      <TableCell align="right" sx={{ pl: 0, pr: 2, border: 'none' }}>
        <Typography
          variant={isMobile ? 'subtitle2' : 'h6'}
          noWrap
          sx={{
            color: (theme) => theme.colors.success.main,
            fontWeight: 600
          }}
        >
          ✕ {volume24h}
        </Typography>
      </TableCell>

      <TableCell align="right" sx={{ pl: 0, pr: 2, border: 'none' }}>
        <Typography
          variant={isMobile ? 'subtitle2' : 'h6'}
          noWrap
          sx={{
            color: (theme) => theme.colors.success.main,
            fontWeight: 600
          }}
        >
          ✕ {totalVolumeDisplay}
        </Typography>
      </TableCell>

      <TableCell
        align="right"
        sx={{
          pl: 0,
          pr: 2,
          border: 'none',
          display: { xs: 'none', sm: 'table-cell' }
        }}
      >
        <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
          {fIntNumber(owners || 0)}
        </Typography>
      </TableCell>

      <TableCell
        align="right"
        sx={{
          pl: 0,
          pr: 3,
          border: 'none',
          display: { xs: 'none', sm: 'table-cell' }
        }}
      >
        <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
          {fIntNumber(items)}
        </Typography>
      </TableCell>
    </TableRow>
  );
}
