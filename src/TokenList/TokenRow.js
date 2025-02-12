import Decimal from 'decimal.js';
import { useState, useEffect, useContext, memo, useMemo, useCallback } from 'react';
import React from 'react';
import { LazyLoadImage, LazyLoadComponent } from 'react-lazy-load-image-component';
import {
  styled,
  useMediaQuery,
  useTheme,
  Link,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  Box,
  LinearProgress,
  Table,
  TableBody
} from '@mui/material';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import StarRateIcon from '@mui/icons-material/StarRate';
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LockIcon from '@mui/icons-material/Lock';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { AppContext } from 'src/AppContext';
import TokenMoreMenu from './TokenMoreMenu';
import BearBullLabel from 'src/components/BearBullLabel';
import { fNumber, fIntNumber, fNumberWithCurreny } from 'src/utils/formatNumber';
import NumberTooltip from 'src/components/NumberTooltip';
import { currencySymbols } from 'src/utils/constants';
import LoadChart from 'src/components/LoadChart';
import { useRouter } from 'next/router';

const TransitionTypo = styled(Typography)(
  () => `
        -webkit-transition: background-color 300ms linear, color 1s linear;
        -moz-transition: background-color 300ms linear, color 1s linear;
        -o-transition: background-color 300ms linear, color 1s linear;
        -ms-transition: background-color 300ms linear, color 1s linear;
        transition: background-color 300ms linear, color 1s linear;
    `
);

const AdminImage = styled(LazyLoadImage)(({ theme }) => ({
  borderRadius: '8px',
  overflow: 'hidden',
  width: '32px',
  height: '32px',
  objectFit: 'cover',
  '&:hover': {
    cursor: 'pointer',
    opacity: 0.6
  }
}));

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
  borderRadius: '8px',
  overflow: 'hidden',
  width: '32px',
  height: '32px',
  objectFit: 'cover'
}));

const badge24hStyle = {
  display: 'inline-block',
  marginRight: '4px',
  color: '#C4CDD5',
  fontSize: '11px',
  fontWeight: '500',
  lineHeight: '18px',
  backgroundColor: '#323546',
  borderRadius: '5px',
  padding: '0.5px 4px'
};

const truncate = (str, n) => {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
};

const getPriceColor = (bearbull) => {
  if (bearbull === -1) return '#FF6C40';
  if (bearbull === 1) return '#54D62C';
  return '';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const createdDate = new Date(parseInt(dateString));
  const now = new Date();
  const diffInMs = now - createdDate;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const days = Math.floor(diffInHours / 24);
  const hours = diffInHours % 24;

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (days === 0) {
    return `${hours}h`;
  }
  return `${days}d ${hours}h`;
};

const getOriginIcon = (origin) => {
  switch (origin) {
    case 'FirstLedger':
      return <OpenInNewIcon sx={{ fontSize: 'inherit', color: '#007B55' }} />;
    case 'XPMarket':
      return <StorefrontIcon sx={{ fontSize: 'inherit', color: '#B72136' }} />;
    case 'Magnetic X':
      return <ElectricBoltIcon sx={{ fontSize: 'inherit', color: '#7635DC' }} />;
    default:
      return <AutoAwesomeIcon sx={{ fontSize: 'inherit', color: '#637381' }} />;
  }
};

function FTokenRow({
  time,
  token,
  setEditToken,
  setTrustToken,
  watchList,
  onChangeWatchList,
  scrollLeft,
  exchRate,
  idx
}) {
  const theme = useTheme();
  const BASE_URL = process.env.API_URL;
  const { accountProfile, darkMode, activeFiatCurrency } = useContext(AppContext);
  const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

  const [priceColor, setPriceColor] = useState('');

  const memoizedToken = useMemo(() => token, [token]);

  const handleWatchlistClick = useCallback(
    (e) => {
      e.stopPropagation();
      onChangeWatchList(md5);
    },
    [md5, onChangeWatchList]
  );

  const handleRowClick = useCallback(() => {
    router.replace(`/token/${slug}`);
  }, [router, slug]);

  const handleEditToken = useCallback(() => {
    setEditToken(memoizedToken);
  }, [setEditToken, memoizedToken]);

  const {
    id,
    name,
    dateon,
    amount,
    supply,
    trustlines,
    vol24hxrp,
    vol24hx,
    vol24htx,
    kyc,
    md5,
    slug,
    user,
    pro7d,
    pro24h,
    pro1h,
    pro5m,
    exch,
    usd,
    ext,
    marketcap,
    isOMCF,
    tvl,
    origin,
    holders
  } = memoizedToken;

  useEffect(() => {
    setPriceColor(getPriceColor(memoizedToken.bearbull));
    const timer = setTimeout(() => {
      setPriceColor('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [time, memoizedToken.bearbull]);

  const imgUrl = `https://s1.xrpl.to/token/${md5}`;
  const convertedMarketCap =
    marketcap && exchRate ? Decimal.div(marketcap, exchRate).toNumber() : 0;
  const convertedVolume = vol24hxrp && exchRate ? Decimal.div(vol24hxrp, exchRate).toNumber() : 0;
  const convertedTVL = tvl && exchRate ? Decimal.div(tvl, exchRate).toNumber() : 0;
  const supplyRate = amount && supply ? Decimal.div(supply, amount).toNumber() * 100 : 0;

  return (
    <TableRow
      key={id}
      sx={{
        '&:hover': {
          '& .MuiTableCell-root': {
            backgroundColor: darkMode ? '#232326 !important' : '#D9DCE0 !important'
          },
          cursor: 'pointer'
        },
        '& .MuiTypography-root': {
          fontSize: isMobile ? '11px' : '12px'
        },
        '& .MuiTableCell-root': {
          padding: isMobile ? '1px 1px' : '1px 2px',
          whiteSpace: 'nowrap',
          '&:not(:first-child)': {
            paddingLeft: '4px'
          }
        }
      }}
      onClick={handleRowClick}
    >
      <TableCell
        align="left"
        style={{
          position: 'sticky',
          zIndex: 1001,
          left: 0,
          background: darkMode ? '#000000' : '#FFFFFF',
          width: '20px',
          minWidth: '20px',
          padding: '1px'
        }}
      >
        {watchList.includes(md5) ? (
          <Tooltip title="Remove from Watchlist">
            <StarRateIcon
              onClick={handleWatchlistClick}
              sx={{ cursor: 'pointer', color: '#F6B87E', fontSize: '16px' }}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Add to Watchlist">
            <StarOutlineIcon
              onClick={handleWatchlistClick}
              sx={{ cursor: 'pointer', '&:hover': { color: '#F6B87E' }, fontSize: '16px' }}
            />
          </Tooltip>
        )}
      </TableCell>
      {!isMobile && (
        <TableCell
          align="left"
          sx={{
            position: 'sticky',
            zIndex: 1001,
            left: '20px',
            background: darkMode ? '#000000' : '#FFFFFF',
            width: '25px',
            minWidth: '25px',
            padding: '1px 2px'
          }}
        >
          {idx + 1}
        </TableCell>
      )}
      <TableCell
        align="left"
        sx={{
          p: isMobile ? '1px' : '1px 2px',
          position: 'sticky',
          zIndex: 1001,
          left: isMobile ? '20px' : '45px',
          background: darkMode ? '#000000' : '#FFFFFF',
          '&:before': scrollLeft
            ? {
                content: "''",
                boxShadow: 'inset 10px 0 8px -8px #00000026',
                position: 'absolute',
                top: '0',
                right: '0',
                bottom: '-1px',
                width: '30px',
                transform: 'translate(100%)',
                transition: 'box-shadow .3s',
                pointerEvents: 'none'
              }
            : {}
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box>
            {isAdmin ? (
              <AdminImage
                src={imgUrl}
                onClick={handleEditToken}
                onError={(event) => (event.target.src = '/static/alt.webp')}
                alt={`${user} ${name} Logo`}
              />
            ) : (
              <TokenImage
                src={imgUrl}
                onError={(event) => (event.target.src = '/static/alt.webp')}
                alt={`${user} ${name} Logo`}
              />
            )}
          </Box>
          <Link
            underline="none"
            color="inherit"
            href={`/token/${slug}`}
            rel="noreferrer noopener nofollow"
          >
            <Stack direction="column" spacing={0.5}>
              <Typography
                variant="token"
                sx={{
                  fontWeight: '700',
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  lineHeight: 1
                }}
                color={
                  isOMCF !== 'yes'
                    ? darkMode
                      ? '#fff'
                      : '#222531'
                    : darkMode
                    ? '#007B55'
                    : slug === md5
                    ? '#B72136'
                    : ''
                }
                noWrap={!isMobile}
              >
                {truncate(name, isMobile ? 10 : 13)}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography
                  variant="p2"
                  sx={{
                    fontWeight: '600',
                    fontSize: isMobile ? '0.6rem' : '0.75rem',
                    lineHeight: 1.1,
                    color: darkMode ? '#848E9C' : '#616E85'
                  }}
                  color={isOMCF !== 'yes' ? (darkMode ? '#fff' : '#222531') : ''}
                  noWrap={!isMobile}
                >
                  {isMobile && (
                    <span style={{ ...badge24hStyle, fontSize: '10px', padding: '0 2px' }}>
                      {id}
                    </span>
                  )}
                  {truncate(user, isMobile ? 12 : 15)}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Tooltip title={origin || 'Standard Launch'}>{getOriginIcon(origin)}</Tooltip>
                  {origin && (
                    <>
                      <Tooltip title="Blackholed Issuer">
                        <LockIcon sx={{ fontSize: isMobile ? '12px' : '14px', color: '#007B55' }} />
                      </Tooltip>
                      <Tooltip title="Burned Liquidity Pool">
                        <LocalFireDepartmentIcon
                          sx={{ fontSize: isMobile ? '12px' : '14px', color: '#B72136' }}
                        />
                      </Tooltip>
                    </>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </Link>
        </Stack>
      </TableCell>
      <TableCell
        align="right"
        sx={{
          padding: isMobile ? '1px 2px' : '2px 3px'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: isMobile ? '0.5rem' : '0.65rem',
            color: darkMode ? '#666' : '#888',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            justifyContent: 'flex-end'
          }}
        >
          <CalendarTodayIcon sx={{ fontSize: isMobile ? '10px' : '12px' }} />
          {formatDate(dateon)}
        </Typography>
      </TableCell>
      <TableCell
        align="right"
        sx={{ color: priceColor, padding: isMobile ? '1px 2px' : '2px 3px' }}
      >
        <TransitionTypo variant="h4" noWrap={!isMobile}>
          <NumberTooltip
            prepend={currencySymbols[activeFiatCurrency]}
            number={fNumberWithCurreny(exch, exchRate)}
          />
        </TransitionTypo>
      </TableCell>
      <TableCell
        align="right"
        sx={{
          width: '70px',
          minWidth: '70px',
          padding: isMobile ? '1px 2px' : '2px 3px',
          '& .MuiTypography-root': {
            textAlign: 'right',
            width: '100%'
          }
        }}
      >
        <BearBullLabel value={pro5m} variant="h4" />
      </TableCell>
      <TableCell
        align="right"
        sx={{
          width: '70px',
          minWidth: '70px',
          padding: isMobile ? '1px 2px' : '2px 3px',
          '& .MuiTypography-root': {
            textAlign: 'right',
            width: '100%'
          }
        }}
      >
        <BearBullLabel value={pro1h} variant="h4" />
      </TableCell>
      <TableCell
        align="right"
        sx={{
          width: '70px',
          minWidth: '70px',
          padding: isMobile ? '1px 2px' : '2px 3px',
          '& .MuiTypography-root': {
            textAlign: 'right',
            width: '100%'
          }
        }}
      >
        <BearBullLabel value={pro24h} variant="h4" />
      </TableCell>
      <TableCell
        align="right"
        sx={{
          width: '70px',
          minWidth: '70px',
          padding: isMobile ? '1px 2px' : '2px 3px',
          '& .MuiTypography-root': {
            textAlign: 'right',
            width: '100%'
          }
        }}
      >
        <BearBullLabel value={pro7d} variant="h4" />
      </TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
          <Typography>{currencySymbols[activeFiatCurrency]}</Typography>
          <Typography variant="h4" noWrap={!isMobile}>
            {convertedVolume >= 1000000
              ? `${(convertedVolume / 1000000).toFixed(1)}M`
              : convertedVolume >= 1000
              ? `${(convertedVolume / 1000).toFixed(1)}K`
              : fNumber(convertedVolume)}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="right">
        <Typography variant="h4">
          {vol24htx >= 1000000
            ? `${(vol24htx / 1000000).toFixed(1)}M`
            : vol24htx >= 1000
            ? `${(vol24htx / 1000).toFixed(1)}K`
            : fNumber(vol24htx)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
          <Typography>{currencySymbols[activeFiatCurrency]}</Typography>
          <Typography variant="h4" noWrap={!isMobile}>
            {convertedTVL >= 1000000
              ? `${(convertedTVL / 1000000).toFixed(1)}M`
              : convertedTVL >= 1000
              ? `${(convertedTVL / 1000).toFixed(1)}K`
              : fNumber(convertedTVL)}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="right">
        <Typography variant="h4">
          {currencySymbols[activeFiatCurrency]}
          {convertedMarketCap >= 1000000
            ? `${(convertedMarketCap / 1000000).toFixed(1)}M`
            : convertedMarketCap >= 1000
            ? `${(convertedMarketCap / 1000).toFixed(1)}K`
            : fNumber(convertedMarketCap)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="h4">
          {holders >= 1000000
            ? `${(holders / 1000000).toFixed(1)}M`
            : holders >= 1000
            ? `${(holders / 1000).toFixed(1)}K`
            : fIntNumber(holders)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Tooltip
          title={
            <Table
              sx={{
                '& .MuiTableCell-root': {
                  borderBottom: 'none',
                  padding: '1px 6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  '&:first-of-type': {
                    pr: 2
                  }
                },
                '& .MuiTableRow-root:not(:first-child)': {
                  '& .MuiTableCell-root': {
                    paddingTop: '1px'
                  }
                }
              }}
            >
              <TableBody>
                <TableRow>
                  <TableCell align="right" sx={{ pt: 0, pb: 0 }}>
                    <Typography variant="caption" noWrap sx={{ fontWeight: 'bold', color: '#fff' }}>
                      Percentage:
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ pt: 0, pb: 0 }}>
                    <Typography variant="caption" sx={{ color: '#fff' }}>
                      {fNumber(supplyRate)}%
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell align="right" sx={{ pt: 0, pb: 0 }}>
                    <Typography variant="caption" noWrap sx={{ fontWeight: 'bold', color: '#fff' }}>
                      Circulating:
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ pt: 0, pb: 0 }}>
                    <Typography variant="caption" noWrap sx={{ color: '#fff' }}>
                      {fNumber(supply)} {name}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell align="right" sx={{ pt: 0, pb: 0 }}>
                    <Typography variant="caption" noWrap sx={{ fontWeight: 'bold', color: '#fff' }}>
                      Total:
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ pt: 0, pb: 0 }}>
                    <Typography variant="caption" noWrap sx={{ color: '#fff' }}>
                      {fNumber(amount)} {name}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          }
          placement="bottom-end"
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                maxWidth: '300px',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                p: 0.5,
                '& .MuiTooltip-arrow': {
                  color: 'rgba(0, 0, 0, 0.9)'
                }
              }
            }
          }}
        >
          <Typography variant="h4" noWrap={!isMobile}>
            {supply >= 1000000000000
              ? `${(supply / 1000000000000).toFixed(2)}T`
              : supply >= 1000000000
              ? `${(supply / 1000000000).toFixed(2)}B`
              : supply >= 1000000
              ? `${(supply / 1000000).toFixed(2)}M`
              : supply >= 1000
              ? `${(supply / 1000).toFixed(1)}K`
              : fNumber(supply)}{' '}
            {name}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell
        align="right"
        sx={{
          px: '0 !important',
          width: '28px',
          minWidth: '28px',
          pr: '4px !important'
        }}
      >
        <LoadChart url={`${BASE_URL}/sparkline/${md5}?period=24h&${pro24h}`} />
      </TableCell>
      <TableCell
        align="right"
        sx={{
          width: '28px',
          minWidth: '28px',
          padding: '1px !important'
        }}
      >
        <TokenMoreMenu
          token={memoizedToken}
          admin={isAdmin}
          setEditToken={setEditToken}
          setTrustToken={setTrustToken}
        />
      </TableCell>
    </TableRow>
  );
}

export const TokenRow = memo(FTokenRow);
