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
  useMediaQuery,
  Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import { formatMonthYearDate } from 'src/utils/formatTime';
import { fNumber, fIntNumber, fVolume } from 'src/utils/formatNumber';
import { Icon } from '@iconify/react';
import React, { useContext, useMemo } from 'react';
import { AppContext } from 'src/AppContext';

const CollectionImageWrapper = styled(Box)(({ theme }) => ({
  borderRadius: '12px',
  overflow: 'hidden',
  width: '40px',
  height: '40px',
  position: 'relative',
  border: '2px solid rgba(145, 158, 171, 0.08)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    cursor: 'pointer',
    transform: 'scale(1.05)',
    borderColor: 'rgba(99, 115, 129, 0.24)',
    '& > img': {
      opacity: 0.8
    }
  }
}));

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

function Row({ id, item, isMine }) {
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

  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const floorPrice = floor?.amount || 0;
  const volume24h = fVolume(totalVol24h || 0);
  const totalVolumeDisplay = fVolume(totalVolume || 0);

  const strDateTime = formatMonthYearDate(created);
  const logoImageUrl = `https://s1.xrpnft.com/collection/${logoImage}`;

  const tableRowStyle = useMemo(
    () => ({
      borderBottom: '1px solid rgba(145, 158, 171, 0.08)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        '& .MuiTableCell-root': {
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(145, 158, 171, 0.04)',
          backdropFilter: 'blur(6px)'
        },
        cursor: 'pointer',
        transform: 'translateY(-1px)',
        boxShadow: darkMode
          ? '0 4px 16px rgba(0, 0, 0, 0.24)'
          : '0 4px 16px rgba(145, 158, 171, 0.16)'
      },
      '& .MuiTypography-root': {
        fontSize: isMobile ? '12px' : '14px',
        fontWeight: '500'
      },
      '& .MuiTableCell-root': {
        padding: isMobile ? '12px 8px' : '16px 12px',
        whiteSpace: 'nowrap',
        borderBottom: 'none',
        '&:not(:first-of-type)': {
          paddingLeft: '8px'
        }
      }
    }),
    [darkMode, isMobile]
  );

  const handleRowClick = () => {
    document.location = `/collection/${slug}`;
  };

  const handleEditCollection = (e) => {
    e.stopPropagation();
    document.location = `/collection/${slug}/edit`;
  };

  return (
    <TableRow key={uuid} sx={tableRowStyle} onClick={handleRowClick}>
      <TableCell align="left" sx={{ padding: isMobile ? '12px 8px' : '16px 12px' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant={isMobile ? 'caption' : 'body2'}
            sx={{
              minWidth: '24px',
              color: darkMode ? '#919EAB' : '#637381',
              fontWeight: '500'
            }}
          >
            {id}
          </Typography>

          <Box
            sx={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CollectionImageWrapper>
              <IconImage src={logoImageUrl} alt={`${name} Logo`} />
              {isMine && (
                <Tooltip title="Edit Collection">
                  <IconButton
                    onClick={handleEditCollection}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '&:hover': {
                        opacity: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)'
                      }
                    }}
                  >
                    <EditIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                </Tooltip>
              )}
            </CollectionImageWrapper>
          </Box>

          <Link
            underline="none"
            color="inherit"
            href={`/collection/${slug}`}
            rel="noreferrer noopener nofollow"
          >
            <Stack direction="column" spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography
                  variant={isMobile ? 'subtitle2' : 'h6'}
                  sx={{
                    fontWeight: '700',
                    fontSize: isMobile ? '14px' : '16px',
                    lineHeight: 1.2,
                    width: isMobile ? '120px' : '180px',
                    minWidth: isMobile ? '120px' : '180px',
                    letterSpacing: '-0.02em',
                    color: darkMode ? '#fff' : '#212B36'
                  }}
                  noWrap
                >
                  {name}
                </Typography>
                {verified && (
                  <VerifiedIcon
                    sx={{
                      fontSize: isMobile ? 14 : 18,
                      color: theme.palette.primary.main
                    }}
                  />
                )}
              </Stack>
              <Typography
                variant={isMobile ? 'caption' : 'body2'}
                sx={{
                  fontWeight: '500',
                  fontSize: isMobile ? '12px' : '13px',
                  lineHeight: 1.2,
                  color: darkMode ? '#919EAB' : '#637381'
                }}
              >
                {strDateTime}
              </Typography>
            </Stack>
          </Link>
        </Stack>
      </TableCell>

      <TableCell align="right" sx={{ padding: isMobile ? '12px 8px' : '16px 12px' }}>
        <Typography
          variant={isMobile ? 'subtitle2' : 'h6'}
          noWrap
          sx={{
            fontWeight: '600',
            fontSize: isMobile ? '14px' : '16px',
            color: darkMode ? '#fff' : '#212B36'
          }}
        >
          ✕ {fNumber(floorPrice)}
        </Typography>
      </TableCell>

      <TableCell align="right" sx={{ padding: isMobile ? '12px 8px' : '16px 12px' }}>
        <Typography
          variant={isMobile ? 'subtitle2' : 'h6'}
          noWrap
          sx={{
            color: '#00AB55',
            fontWeight: '600',
            fontSize: isMobile ? '14px' : '16px'
          }}
        >
          ✕ {volume24h}
        </Typography>
      </TableCell>

      <TableCell align="right" sx={{ padding: isMobile ? '12px 8px' : '16px 12px' }}>
        <Typography
          variant={isMobile ? 'subtitle2' : 'h6'}
          noWrap
          sx={{
            color: '#00AB55',
            fontWeight: '600',
            fontSize: isMobile ? '14px' : '16px'
          }}
        >
          ✕ {totalVolumeDisplay}
        </Typography>
      </TableCell>

      <TableCell
        align="right"
        sx={{
          padding: isMobile ? '12px 8px' : '16px 12px',
          display: { xs: 'none', sm: 'table-cell' }
        }}
      >
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontWeight: '600',
            fontSize: isMobile ? '14px' : '16px',
            color: darkMode ? '#fff' : '#212B36'
          }}
        >
          {fIntNumber(owners || 0)}
        </Typography>
      </TableCell>

      <TableCell
        align="right"
        sx={{
          padding: isMobile ? '12px 8px' : '16px 12px',
          display: { xs: 'none', sm: 'table-cell' }
        }}
      >
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontWeight: '600',
            fontSize: isMobile ? '14px' : '16px',
            color: darkMode ? '#fff' : '#212B36'
          }}
        >
          {fIntNumber(items)}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

export default React.memo(Row);
