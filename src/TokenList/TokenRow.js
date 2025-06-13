import Decimal from 'decimal.js';
import { useState, useEffect, useContext, memo, useMemo, useCallback } from 'react';
import React from 'react';
import { LazyLoadComponent } from 'react-lazy-load-image-component';
import Image from 'next/image';
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
  TableBody,
  SvgIcon
} from '@mui/material';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import StarRateIcon from '@mui/icons-material/StarRate';
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
import chartLineUp from '@iconify/icons-ph/chart-line-up';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LockIcon from '@mui/icons-material/Lock';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';

import { AppContext } from 'src/AppContext';
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

const badge24hStyle = {
  display: 'inline-block',
  marginRight: '4px',
  color: '#fff',
  fontSize: '10px',
  fontWeight: '600',
  lineHeight: '16px',
  backgroundColor: 'rgba(99, 115, 129, 0.12)',
  backdropFilter: 'blur(6px)',
  borderRadius: '6px',
  padding: '2px 6px',
  border: '1px solid rgba(145, 158, 171, 0.08)'
};

const truncate = (str, n) => {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const now = new Date();
  let seconds = Math.floor((now - date) / 1000);

  if (seconds < 0) return '...';

  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

const getPriceColor = (bearbull) => {
  if (bearbull === -1) return '#FF6C40';
  if (bearbull === 1) return '#54D62C';
  return '';
};

// Update XPMarketIcon to use forwardRef and ensure proper width handling
const XPMarketIcon = React.forwardRef((props, ref) => {
  // Remove any width="auto" that might be in props
  const { width, ...otherProps } = props;

  return (
    <SvgIcon {...otherProps} ref={ref} viewBox="0 0 32 32" sx={{ ...otherProps.sx }}>
      <path
        d="M17.7872 2.625H4.41504L7.67032 7.88327H14.5L17.9149 13.4089H24.4574L17.7872 2.625Z"
        fill="inherit"
      />
      <path
        d="M1 18.6667L7.67014 29.4506L10.9573 24.1627L7.54248 18.6667L10.9573 13.1708L7.67014 7.88281L1 18.6667Z"
        fill="inherit"
      />
      <path
        d="M24.3292 24.1931L30.9994 13.4092H24.4569L21.042 18.9051H14.2123L10.957 24.1931H24.3292Z"
        fill="inherit"
      />
    </SvgIcon>
  );
});

// Add display name for better debugging
XPMarketIcon.displayName = 'XPMarketIcon';

const LedgerMemeIcon = React.forwardRef((props, ref) => (
  <SvgIcon {...props} ref={ref} viewBox="0 0 26 26">
    <g transform="scale(0.55)">
      <rect fill="#cfff04" width="36" height="36" rx="8" ry="8" x="0" y="0"></rect>
      <g>
        <g>
          <path
            fill="#262626"
            d="M25.74,9.68c0.64,0,1.24-0.26,1.69-0.72l2.69-2.76h-1.64l-1.87,1.92c-0.23,0.24-0.55,0.37-0.88,0.37s-0.64-0.13-0.88-0.37l-1.87-1.92h-1.64l2.69,2.76c0.45,0.46,1.05,0.72,1.69,0.72Z"
          ></path>
          <path
            fill="#262626"
            d="M27.43,10.62c-0.45-0.46-1.05-0.72-1.69-0.72s-1.24,0.26-1.69,0.72l-2.71,2.78h1.64l1.89-1.93c0.23-0.24,0.55-0.37,0.88-0.37s0.64,0.13,0.88,0.37l1.89,1.93h1.64l-2.71-2.78Z"
          ></path>
          <path
            fill="#262626"
            d="M10.22,9.68c0.64,0,1.24-0.26,1.69-0.72l2.69-2.76h-1.64l-1.87,1.92c-0.23,0.24-0.55,0.37-0.88-0.37s-0.64-0.13-0.88-0.37l-1.87-1.92h-1.64l2.69,2.76c0.45,0.46,1.05,0.72,1.69,0.72Z"
          ></path>
          <path
            fill="#262626"
            d="M10.22,9.90c-0.64,0-1.24,0.26-1.69,0.72l-2.71,2.78h1.64l1.89-1.93c0.23-0.24,0.55-0.37,0.88-0.37s0.64,0.13,0.88,0.37l1.89,1.93h1.64l-2.71-2.78c-0.45-0.46-1.05-0.72-1.69-0.72Z"
          ></path>
        </g>
        <path
          fill="#262626"
          d="M5.81,17.4c0,6.73,5.45,12.18,12.18,12.18s12.18-5.45,12.18-12.18H5.81Z"
        ></path>
      </g>
    </g>
  </SvgIcon>
));

LedgerMemeIcon.displayName = 'LedgerMemeIcon';

const getOriginIcon = (origin) => {
  switch (origin) {
    case 'FirstLedger':
      return <OpenInNewIcon sx={{ fontSize: '16px', color: '#013CFE' }} />;
    case 'XPMarket':
      return <XPMarketIcon sx={{ fontSize: '18px', color: '#6D1FEE', marginRight: '2px' }} />;
    case 'LedgerMeme':
      return (
        <LedgerMemeIcon
          sx={{ fontSize: '18px', color: '#cfff04', marginRight: '2px', marginTop: '2px' }}
        />
      );
    case 'Magnetic X':
      return (
        <Box
          sx={{
            width: '18px',
            height: '18px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
            marginRight: '2px'
          }}
        >
          <Box
            component="img"
            src="/magneticx-logo.webp"
            alt="Magnetic X"
            sx={{
              width: '13px',
              height: '13px',
              objectFit: 'contain'
            }}
          />
        </Box>
      );
    case 'xrp.fun':
      return (
        <Box
          sx={{
            width: '18px',
            height: '18px',
            backgroundColor: 'rgba(183, 33, 54, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(183, 33, 54, 0.2)',
            marginRight: '2px'
          }}
        >
          <Icon
            icon={chartLineUp}
            style={{
              fontSize: '11px',
              color: '#B72136'
            }}
          />
        </Box>
      );
    default:
      return <AutoAwesomeIcon sx={{ fontSize: '11px', color: '#637381' }} />;
  }
};

// Replace LazyLoadImage with styled component using Next.js Image
const AdminImageWrapper = styled(Box)(({ theme }) => ({
  borderRadius: '12px',
  overflow: 'hidden',
  width: '48px',
  height: '48px',
  position: 'relative',
  border: '2px solid rgba(145, 158, 171, 0.08)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  padding: '3px',
  margin: '4px',
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  '&:hover': {
    cursor: 'pointer',
    transform: 'scale(1.05)',
    borderColor: 'rgba(99, 115, 129, 0.24)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    '& > img': {
      opacity: 0.8
    }
  }
}));

const TokenImageWrapper = styled(Box)(({ theme }) => ({
  borderRadius: '12px',
  overflow: 'hidden',
  width: '48px',
  height: '48px',
  position: 'relative',
  border: '2px solid rgba(145, 158, 171, 0.08)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  padding: '3px',
  margin: '4px',
  backgroundColor: 'rgba(255, 255, 255, 0.02)'
}));

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

  const percentageCellStyle = useMemo(
    () => ({
      width: '70px',
      minWidth: '70px',
      padding: isMobile ? '1px 2px' : '2px 3px',
      '& .MuiTypography-root': {
        textAlign: 'right',
        width: '100%'
      }
    }),
    [isMobile]
  );

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

  const stickyCellStyles = useMemo(
    () => ({
      first: {
        position: 'sticky',
        zIndex: 1001,
        left: 0,
        background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        width: '24px',
        minWidth: '24px',
        padding: '16px 8px'
      },
      second: {
        position: 'sticky',
        zIndex: 1001,
        left: '24px',
        background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        width: '32px',
        minWidth: '32px',
        padding: '16px 8px'
      },
      third: {
        p: isMobile ? '12px 8px' : '16px 12px',
        position: 'sticky',
        zIndex: 1001,
        left: isMobile ? '24px' : '56px',
        background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        '&:before': scrollLeft
          ? {
              content: "''",
              boxShadow: 'inset 10px 0 8px -8px rgba(145, 158, 171, 0.24)',
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
      }
    }),
    [darkMode, isMobile, scrollLeft]
  );

  const dateTypographyStyle = useMemo(
    () => ({
      fontSize: isMobile ? '0.5rem' : '0.65rem',
      color: darkMode ? '#666' : '#888',
      lineHeight: 1,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      justifyContent: 'flex-end'
    }),
    [darkMode, isMobile]
  );

  const {
    id,
    name,
    date,
    amount,
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

  const handleSetTrustline = useCallback(
    (e) => {
      e.stopPropagation();
      setTrustToken(memoizedToken);
    },
    [setTrustToken, memoizedToken]
  );

  const convertedValues = useMemo(
    () => ({
      marketCap: marketcap && exchRate ? Decimal.div(marketcap || 0, exchRate).toNumber() : 0,
      volume: vol24hxrp && exchRate ? Decimal.div(vol24hxrp || 0, exchRate).toNumber() : 0,
      tvl: tvl && exchRate ? Decimal.div(tvl || 0, exchRate).toNumber() : 0,
      supplyRate: amount ? 100 : 0
    }),
    [marketcap, vol24hxrp, tvl, amount, exchRate]
  );

  useEffect(() => {
    setPriceColor(getPriceColor(memoizedToken.bearbull));
    const timer = setTimeout(() => {
      setPriceColor('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [time, memoizedToken.bearbull]);

  const imgUrl = `https://s1.xrpl.to/token/${md5}`;
  const fallbackImgUrl = '/static/alt.webp';
  const supplyRate = amount ? 100 : 0;
  const [imgSrc, setImgSrc] = useState(imgUrl);

  const handleImgError = () => {
    setImgSrc(fallbackImgUrl);
  };

  return (
    <TableRow key={id} sx={tableRowStyle} onClick={handleRowClick}>
      <TableCell align="left" style={stickyCellStyles.first}>
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
        <TableCell align="left" sx={stickyCellStyles.second}>
          {idx + 1}
        </TableCell>
      )}
      <TableCell align="left" sx={stickyCellStyles.third}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box
            sx={{
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isAdmin ? (
              <AdminImageWrapper onClick={handleEditToken}>
                <Image
                  src={imgSrc}
                  alt={`${user} ${name} Logo`}
                  width={38}
                  height={38}
                  priority
                  style={{ objectFit: 'cover', borderRadius: '8px' }}
                  onError={handleImgError}
                />
              </AdminImageWrapper>
            ) : (
              <TokenImageWrapper>
                <Image
                  src={imgSrc}
                  alt={`${user} ${name} Logo`}
                  width={38}
                  height={38}
                  priority
                  style={{ objectFit: 'cover', borderRadius: '8px' }}
                  onError={handleImgError}
                />
              </TokenImageWrapper>
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
                  fontSize: isMobile ? '14px' : '16px',
                  lineHeight: 1.2,
                  width: isMobile ? '100px' : '140px',
                  minWidth: isMobile ? '100px' : '140px',
                  letterSpacing: '-0.02em'
                }}
                color={
                  isOMCF !== 'yes'
                    ? darkMode
                      ? '#fff'
                      : '#212B36'
                    : darkMode
                    ? '#00AB55'
                    : slug === md5
                    ? '#B72136'
                    : ''
                }
                noWrap={!isMobile}
              >
                {truncate(name, isMobile ? 12 : 16)}
              </Typography>
              <Stack
                direction={isMobile ? 'column' : 'row'}
                spacing={0.5}
                alignItems={isMobile ? 'flex-start' : 'center'}
              >
                <Typography
                  variant="p2"
                  sx={{
                    fontWeight: '500',
                    fontSize: isMobile ? '12px' : '13px',
                    lineHeight: 1.2,
                    color: darkMode ? '#919EAB' : '#637381',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  color={isOMCF !== 'yes' ? (darkMode ? '#fff' : '#212B36') : ''}
                  noWrap={!isMobile}
                >
                  {isMobile && (
                    <span style={{ ...badge24hStyle, fontSize: '10px', padding: '2px 6px' }}>
                      {id}
                    </span>
                  )}
                  {truncate(user, isMobile ? 14 : 18)}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Tooltip title={origin || 'Standard Launch'}>{getOriginIcon(origin)}</Tooltip>
                  {origin && (
                    <>
                      <Tooltip title="Blackholed Issuer">
                        <LockIcon sx={{ fontSize: isMobile ? '14px' : '16px', color: '#00AB55' }} />
                      </Tooltip>
                      {origin === 'xrp.fun' ? (
                        <Tooltip title="Liquidity Pool Not Burned">
                          <ElectricBoltIcon
                            sx={{ fontSize: isMobile ? '14px' : '16px', color: '#FF5630' }}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Burned Liquidity Pool">
                          <LocalFireDepartmentIcon
                            sx={{ fontSize: isMobile ? '14px' : '16px', color: '#1890FF' }}
                          />
                        </Tooltip>
                      )}
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
          color: priceColor,
          padding: isMobile ? '12px 8px' : '16px 12px'
        }}
      >
        <TransitionTypo
          variant="h4"
          noWrap={!isMobile}
          sx={{
            fontWeight: '600',
            fontSize: isMobile ? '14px' : '16px'
          }}
        >
          <NumberTooltip
            prepend={currencySymbols[activeFiatCurrency]}
            number={fNumberWithCurreny(exch, exchRate)}
          />
        </TransitionTypo>
      </TableCell>
      <TableCell align="right" sx={percentageCellStyle}>
        <BearBullLabel value={pro5m || 0} variant="h4" />
      </TableCell>
      <TableCell align="right" sx={percentageCellStyle}>
        <BearBullLabel value={pro1h || 0} variant="h4" />
      </TableCell>
      <TableCell align="right" sx={percentageCellStyle}>
        <BearBullLabel value={pro24h || 0} variant="h4" />
      </TableCell>
      <TableCell align="right" sx={percentageCellStyle}>
        <BearBullLabel value={pro7d || 0} variant="h4" />
      </TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
          <Typography>{currencySymbols[activeFiatCurrency]}</Typography>
          <Typography variant="h4" noWrap={!isMobile}>
            {convertedValues.volume >= 1000000
              ? `${(convertedValues.volume / 1000000).toFixed(1)}M`
              : convertedValues.volume >= 1000
              ? `${(convertedValues.volume / 1000).toFixed(1)}K`
              : fNumber(convertedValues.volume)}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell
        align="right"
        sx={{
          padding: isMobile ? '12px 8px' : '16px 12px'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: isMobile ? '11px' : '12px',
            fontWeight: '500'
          }}
        >
          {date ? formatTimeAgo(date) : 'N/A'}
        </Typography>
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
            {convertedValues.tvl >= 1000000
              ? `${(convertedValues.tvl / 1000000).toFixed(1)}M`
              : convertedValues.tvl >= 1000
              ? `${(convertedValues.tvl / 1000).toFixed(1)}K`
              : fNumber(convertedValues.tvl)}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="right">
        <Typography variant="h4">
          {currencySymbols[activeFiatCurrency]}
          {convertedValues.marketCap >= 1000000
            ? `${(convertedValues.marketCap / 1000000).toFixed(1)}M`
            : convertedValues.marketCap >= 1000
            ? `${(convertedValues.marketCap / 1000).toFixed(1)}K`
            : fNumber(convertedValues.marketCap)}
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
                '& .MuiTableRow-root:not(:first-of-type)': {
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
                      {fNumber(amount)} {name}
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
                zIndex: 9999,
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
            {amount >= 1000000000000
              ? `${(amount / 1000000000000).toFixed(2)}T`
              : amount >= 1000000000
              ? `${(amount / 1000000000).toFixed(2)}B`
              : amount >= 1000000
              ? amount >= 999500000
                ? `${(amount / 1000000000).toFixed(2)}B`
                : `${(amount / 1000000).toFixed(2)}M`
              : amount >= 1000
              ? `${(amount / 1000).toFixed(1)}K`
              : fNumber(amount)}{' '}
            {name}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell
        align="right"
        sx={{
          px: '0 !important',
          width: '160px',
          minWidth: '160px',
          pr: '24px !important',
          pl: '24px !important',
          py: '12px !important'
        }}
      >
        <LazyLoadComponent
          threshold={100}
          placeholder={<Box sx={{ width: 160, height: 48, minWidth: 160, minHeight: 48 }} />}
        >
          <Box
            sx={{
              width: 160,
              height: 48,
              minWidth: 160,
              minHeight: 48,
              position: 'relative',
              zIndex: 1
            }}
          >
            <LoadChart
              url={`${BASE_URL}/sparkline/${md5}?period=24h&${pro24h}`}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'svg', width: 160, height: 48 }}
            />
          </Box>
        </LazyLoadComponent>
      </TableCell>
      <TableCell
        align="right"
        sx={{
          width: '80px',
          minWidth: '80px',
          pl: '24px !important',
          pr: '16px !important',
          py: '12px !important'
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
          <Tooltip
            title="Set Trustline"
            componentsProps={{
              tooltip: {
                sx: {
                  zIndex: 9998
                }
              }
            }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: '8px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: darkMode
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(145, 158, 171, 0.08)',
                  transform: 'scale(1.1)'
                }
              }}
            >
              <AddCircleOutlineIcon
                onClick={handleSetTrustline}
                sx={{
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: darkMode ? '#919EAB' : '#637381',
                  '&:hover': {
                    color: theme.palette.primary.main
                  }
                }}
              />
            </Box>
          </Tooltip>
          {isAdmin && (
            <Tooltip
              title="Edit Token"
              componentsProps={{
                tooltip: {
                  sx: {
                    zIndex: 9998
                  }
                }
              }}
            >
              <Box
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: darkMode
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(145, 158, 171, 0.08)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <EditIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditToken();
                  }}
                  sx={{
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: darkMode ? '#919EAB' : '#637381',
                    '&:hover': {
                      color: theme.palette.warning.main
                    }
                  }}
                />
              </Box>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export const TokenRow = memo(FTokenRow);
