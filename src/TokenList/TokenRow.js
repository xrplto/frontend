import Decimal from 'decimal.js';
import { useState, useEffect, useContext, memo, useMemo, useCallback } from 'react';
import React from 'react';
import Image from 'next/image';
import {
  styled,
  useMediaQuery,
  useTheme,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  Box,
  Table,
  TableBody,
  SvgIcon,
  alpha
} from '@mui/material';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import StarRateIcon from '@mui/icons-material/StarRate';
import { Icon } from '@iconify/react';
import chartLineUp from '@iconify/icons-ph/chart-line-up';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LockIcon from '@mui/icons-material/Lock';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { AppContext } from 'src/AppContext';
import { fNumber, fIntNumber, fNumberWithCurreny } from 'src/utils/formatNumber';
import NumberTooltip from 'src/components/NumberTooltip';
import { currencySymbols } from 'src/utils/constants';
import LoadChart from 'src/components/LoadChart';
import { useRouter } from 'next/router';

const TransitionTypo = styled(Typography)(
  () => `
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        contain: layout style paint;
    `
);

const truncate = (str, n) => {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
};

const formatTimeAgo = (dateValue, fallbackValue) => {
  if (!dateValue) return 'N/A';

  // Handle both timestamp (number) and date string
  const date = typeof dateValue === 'number' ? new Date(dateValue) : new Date(dateValue);
  const now = new Date();
  let seconds = Math.floor((now - date) / 1000);

  // If the main date is in the future, try using fallback
  if (seconds < 0 && fallbackValue) {
    const fallbackDate =
      typeof fallbackValue === 'number' ? new Date(fallbackValue) : new Date(fallbackValue);
    seconds = Math.floor((now - fallbackDate) / 1000);

    // If fallback is also in the future, return a fallback
    if (seconds < 0) return 'Just now';
  }

  // If still negative (future date), return fallback
  if (seconds < 0) return 'Just now';

  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

const getPriceColor = (bearbull, theme) => {
  if (bearbull === -1) return theme.palette.mode === 'dark' ? '#FF5252' : '#D32F2F';
  if (bearbull === 1) return theme.palette.mode === 'dark' ? '#66BB6A' : '#388E3C';
  return '';
};

const renderPercentageWithIcon = (value, variant, theme, isMobile) => {
  if (value === undefined || value === null || isNaN(value)) {
    return (
      <Typography
        variant={variant}
        noWrap
        align="right"
        sx={{ color: theme.palette.text.secondary, fontSize: isMobile ? '11px' : '13px' }}
      >
        -
      </Typography>
    );
  }

  const formattedValue = parseFloat(value).toFixed(isMobile ? 1 : 2);
  const isNegative = formattedValue < 0;
  const displayValue = `${isNegative ? -formattedValue : formattedValue}%`;
  const color = isNegative 
    ? (theme.palette.mode === 'dark' ? '#FF5252' : '#D32F2F')
    : (theme.palette.mode === 'dark' ? '#66BB6A' : '#388E3C');

  return (
    <Typography 
      variant={variant} 
      noWrap 
      align="right" 
      sx={{ 
        color,
        fontWeight: '600',
        fontSize: isMobile ? '11px' : '13px',
        textShadow: isMobile ? 'none' : (isNegative 
          ? '0 0 8px rgba(255, 82, 82, 0.3)' 
          : '0 0 8px rgba(102, 187, 106, 0.3)')
      }}
    >
      {displayValue}
    </Typography>
  );
};

// Update XPMarketIcon to use forwardRef and ensure proper width handling
const XPMarketIcon = React.forwardRef((props, ref) => {
  // Remove any non-DOM props that might cause warnings
  const { width, darkMode, ...otherProps } = props;

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

const LedgerMemeIcon = React.forwardRef((props, ref) => {
  // Filter out any non-DOM props that might cause warnings
  const { width, darkMode, ...otherProps } = props;

  return (
    <SvgIcon {...otherProps} ref={ref} viewBox="0 0 26 26">
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
  );
});

LedgerMemeIcon.displayName = 'LedgerMemeIcon';

const HorizonIcon = React.forwardRef((props, ref) => {
  const { width, darkMode, ...otherProps } = props;
  return (
    <SvgIcon
      {...otherProps}
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#f97316"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </SvgIcon>
  );
});

HorizonIcon.displayName = 'HorizonIcon';

const getOriginIcon = (origin, isMobile) => {
  switch (origin) {
    case 'FirstLedger':
      return <OpenInNewIcon sx={{ fontSize: isMobile ? '8px' : '12px', color: '#013CFE' }} />;
    case 'XPMarket':
      return <XPMarketIcon sx={{ fontSize: isMobile ? '8px' : '12px', color: '#6D1FEE', marginRight: isMobile ? '1px' : '2px' }} />;
    case 'LedgerMeme':
      return (
        <LedgerMemeIcon
          sx={{ fontSize: isMobile ? '8px' : '12px', color: '#cfff04', marginRight: isMobile ? '1px' : '2px', marginTop: isMobile ? '1px' : '2px' }}
        />
      );
    case 'Horizon':
      return (
        <HorizonIcon
          sx={{ fontSize: isMobile ? '8px' : '12px', color: '#f97316', marginRight: isMobile ? '1px' : '2px', marginTop: isMobile ? '1px' : '2px' }}
        />
      );
    case 'aigent.run':
      return (
        <Image
          src="/static/aigentrun.gif"
          alt="Aigent.Run"
          width={isMobile ? 10 : 14}
          height={isMobile ? 10 : 14}
          sizes={isMobile ? '10px' : '14px'}
          quality={85}
          style={{
            objectFit: 'contain',
            marginRight: isMobile ? '1px' : '2px'
          }}
        />
      );
    case 'Magnetic X':
      return (
        <Box
          sx={{
            width: isMobile ? '10px' : '14px',
            height: isMobile ? '10px' : '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
            marginRight: isMobile ? '1px' : '2px'
          }}
        >
          <Image
            src="/magneticx-logo.webp"
            alt="Magnetic X"
            width={isMobile ? 7 : 10}
            height={isMobile ? 7 : 10}
            sizes={isMobile ? '7px' : '10px'}
            quality={85}
            style={{
              objectFit: 'contain'
            }}
          />
        </Box>
      );
    case 'xrp.fun':
      return (
        <Box
          sx={{
            width: isMobile ? '10px' : '14px',
            height: isMobile ? '10px' : '14px',
            backgroundColor: 'rgba(183, 33, 54, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(183, 33, 54, 0.2)',
            marginRight: isMobile ? '1px' : '2px'
          }}
        >
          <Icon
            icon={chartLineUp}
            style={{
              fontSize: isMobile ? '7px' : '9px',
              color: '#B72136'
            }}
          />
        </Box>
      );
    default:
      return (
        <svg width={isMobile ? '7' : '9'} height={isMobile ? '7' : '9'} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.5 8L2 12.5L6.5 17" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17.5 8L22 12.5L17.5 17" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.5 4L9.5 20" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
  }
};

// Replace LazyLoadImage with styled component using Next.js Image
const AdminImageWrapper = styled(Box)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden',
  width: '28px',
  height: '28px',
  position: 'relative',
  border: '1px solid transparent',
  background: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}) padding-box,
              linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.primary.dark}20) border-box`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    cursor: 'pointer',
    transform: 'scale(1.08)',
    background: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}) padding-box,
                linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark}) border-box`,
    boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`
  },
  [theme.breakpoints.down('md')]: {
    width: '20px',
    height: '20px',
    borderWidth: '1px'
  }
}));

const TokenImageWrapper = styled(Box)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden',
  width: '28px',
  height: '28px',
  position: 'relative',
  backgroundColor: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.grey[800], 0.5)
    : alpha(theme.palette.grey[100], 0.8),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: `0 8px 16px ${alpha(theme.palette.common.black, 0.1)}`
  },
  [theme.breakpoints.down('md')]: {
    width: '20px',
    height: '20px'
  }
}));

function FTokenRow({
  time,
  token,
  setEditToken,
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
      minWidth: isMobile ? '30px' : '80px',
      padding: isMobile ? '1px 2px' : '12px 8px',
      '& .MuiTypography-root': {
        textAlign: 'right',
        width: '100%',
        fontSize: isMobile ? '11px' : '13px'
      }
    }),
    [isMobile]
  );

  const tableRowStyle = useMemo(
    () => ({
      borderBottom: 'none',
      position: 'relative',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: 'transparent',
      width: '100%',
      height: isMobile ? '32px' : 'auto',
      '&:after': isMobile ? {} : {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: alpha(theme.palette.divider, 0.08)
      },
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.04),
        transform: isMobile ? 'none' : 'translateY(-1px)',
        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.05)}`,
        cursor: 'pointer',
        '&:after': {
          opacity: 0
        }
      },
      '& .MuiTypography-root': {
        fontSize: isMobile ? '10px' : '13px',
        fontWeight: '500',
        letterSpacing: '-0.01em'
      },
      '& .MuiTableCell-root': {
        padding: isMobile ? '4px' : '12px',
        whiteSpace: 'nowrap',
        borderBottom: 'none',
        backgroundColor: 'transparent',
        height: isMobile ? '32px' : 'auto'
      }
    }),
    [isMobile, theme]
  );

  const stickyCellStyles = useMemo(
    () => ({
      first: {
        position: 'sticky',
        zIndex: 1001,
        left: 0,
        background: theme.palette.background.default,
        width: isMobile ? '10px' : '40px',
        minWidth: isMobile ? '10px' : '40px',
        padding: isMobile ? '0px' : '12px 4px'
      },
      second: {
        position: 'sticky',
        zIndex: 1001,
        left: isMobile ? '10px' : '40px',
        background: theme.palette.background.default,
        width: isMobile ? '14px' : '50px',
        minWidth: isMobile ? '14px' : '50px',
        padding: isMobile ? '1px 1px' : '12px 8px'
      },
      third: {
        position: 'sticky',
        zIndex: 1001,
        left: isMobile ? '24px' : '90px',
        background: theme.palette.background.default,
        minWidth: isMobile ? '80px' : '250px',
        maxWidth: isMobile ? '100px' : 'none',
        padding: isMobile ? '1px 4px' : '12px 8px',
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
    [theme, isMobile, scrollLeft]
  );

  const dateTypographyStyle = useMemo(
    () => ({
      fontSize: isMobile ? '0.45rem' : '0.65rem',
      color: darkMode ? '#666' : '#888',
      lineHeight: 1,
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '3px' : '4px',
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
    holders,
    lastUpdated,
    dateon
  } = memoizedToken;

  const handleWatchlistClick = useCallback(
    (e) => {
      e.stopPropagation();
      onChangeWatchList(md5);
    },
    [md5, onChangeWatchList]
  );

  const handleRowClick = useCallback(() => {
    window.location.href = `/token/${slug}`;
  }, [slug]);

  const handleEditToken = useCallback(() => {
    setEditToken(memoizedToken);
  }, [setEditToken, memoizedToken]);


  const convertedValues = useMemo(
    () => ({
      marketCap: marketcap && exchRate ? Decimal.div(marketcap || 0, exchRate).toNumber() : 0,
      volume: vol24hxrp && exchRate ? Decimal.div(vol24hxrp || 0, exchRate).toNumber() : 0,
      tvl: tvl && exchRate ? Decimal.div(tvl || 0, exchRate).toNumber() : 0,
      supplyRate: amount ? 100 : 0
    }),
    [marketcap, vol24hxrp, tvl, amount, exchRate]
  );

  const isOlderThanOneDay = useMemo(() => {
    const tokenDate = dateon || date;
    if (!tokenDate) return false;
    const tokenCreationTimestamp = new Date(tokenDate).getTime();
    if (isNaN(tokenCreationTimestamp)) return false;
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return new Date().getTime() - tokenCreationTimestamp > oneDayInMs;
  }, [dateon, date]);

  const sparklineUrl = useMemo(() => {
    let url = `${BASE_URL}/sparkline/${md5}?period=24h`;
    if (isOlderThanOneDay) {
      url += '&lightweight=true&maxPoints=30';
    }
    return url;
  }, [BASE_URL, md5, isOlderThanOneDay]);

  useEffect(() => {
    setPriceColor(getPriceColor(memoizedToken.bearbull, theme));
    const timer = setTimeout(() => {
      setPriceColor('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [time, memoizedToken.bearbull, theme]);

  const imgUrl = useMemo(() => `https://s1.xrpl.to/token/${md5}`, [md5]);
  const fallbackImgUrl = '/static/alt.webp';
  const [imgError, setImgError] = useState(false);

  const handleImgError = useCallback(() => {
    setImgError(true);
  }, []);

  const formattedTimeAgo = useMemo(() => formatTimeAgo(dateon, date), [dateon, date]);
  
  const chartOpts = useMemo(() => ({
    renderer: 'svg',
    width: 272,
    height: 60
  }), []);

  useEffect(() => {
    setImgError(false);
  }, [md5]);

  return (
    <TableRow key={id} sx={tableRowStyle} onClick={handleRowClick}>
      <TableCell align="left" sx={stickyCellStyles.first}>
        {watchList.includes(md5) ? (
          <Tooltip title="Remove from Watchlist">
            <StarRateIcon
              onClick={handleWatchlistClick}
              sx={{ 
                cursor: 'pointer', 
                color: '#FFB800', 
                fontSize: isMobile ? '12px' : '18px',
                filter: 'drop-shadow(0 2px 4px rgba(255, 184, 0, 0.3))'
              }}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Add to Watchlist">
            <StarOutlineIcon
              onClick={handleWatchlistClick}
              sx={{ 
                cursor: 'pointer', 
                color: alpha(theme.palette.text.primary, 0.3),
                fontSize: isMobile ? '12px' : '18px',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  color: '#FFB800',
                  transform: 'scale(1.1)'
                }
              }}
            />
          </Tooltip>
        )}
      </TableCell>
      {!isMobile && (
        <TableCell align="center" sx={stickyCellStyles.second}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: '600',
              fontSize: '13px',
              color: alpha(theme.palette.text.secondary, 0.7),
              textAlign: 'center',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {idx + 1}
          </Typography>
        </TableCell>
      )}
      <TableCell align="left" sx={stickyCellStyles.third}>
        <Stack direction="row" alignItems="center" spacing={isMobile ? 0.5 : 1}>
          {isMobile && (
            <Typography
              variant="h4"
              sx={{
                fontWeight: '600',
                fontSize: '9px',
                color: alpha(theme.palette.text.secondary, 0.7),
                minWidth: '15px',
                textAlign: 'center',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {idx + 1}
            </Typography>
          )}
          <Box
            sx={{
              width: isMobile ? 20 : 32,
              height: isMobile ? 20 : 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {isAdmin ? (
              <AdminImageWrapper onClick={handleEditToken}>
                <Image
                  src={imgError ? fallbackImgUrl : imgUrl}
                  alt={`${user} ${name} Logo`}
                  width={isMobile ? 20 : 32}
                  height={isMobile ? 20 : 32}
                  sizes="(max-width: 768px) 20px, 32px"
                  quality={90}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  onError={handleImgError}
                />
              </AdminImageWrapper>
            ) : (
              <TokenImageWrapper>
                <Image
                  src={imgError ? fallbackImgUrl : imgUrl}
                  alt={`${user} ${name} Logo`}
                  width={isMobile ? 20 : 32}
                  height={isMobile ? 20 : 32}
                  sizes="(max-width: 768px) 20px, 32px"
                  quality={90}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  onError={handleImgError}
                />
              </TokenImageWrapper>
            )}
          </Box>
          <Stack direction="column" spacing={0} sx={{ overflow: 'hidden', flexGrow: 1 }}>
            <Typography
              variant="p2"
              sx={{
                fontWeight: '400',
                fontSize: isMobile ? '9px' : '12px',
                lineHeight: 1.3,
                color: theme.palette.text.secondary,
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'Inter, sans-serif'
              }}
              noWrap
            >
              {truncate(user, isMobile ? 10 : 18)}
            </Typography>
            <Stack direction="row" spacing={isMobile ? 0.2 : 0.5} alignItems="center" sx={{ marginTop: '2px' }}>
              <Typography
                variant="token"
                sx={{
                  fontWeight: '600',
                  fontSize: isMobile ? '11px' : '14px',
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  color: theme.palette.text.primary,
                  position: 'relative',
                  '&:after': isOMCF === 'yes' ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    bottom: -2,
                    width: '100%',
                    height: '2px',
                    background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                    borderRadius: '2px'
                  } : {}
                }}
                noWrap
              >
                {truncate(name, isMobile ? 12 : 20)}
              </Typography>
              <Tooltip title={origin || 'Standard Launch'}>{getOriginIcon(origin, isMobile)}</Tooltip>
              {origin && !isMobile && (
                <>
                  <Tooltip title="Blackholed Issuer">
                    <LockIcon sx={{ fontSize: '12px', color: '#00AB55' }} />
                  </Tooltip>
                  {origin === 'xrp.fun' ? (
                    <Tooltip title="Liquidity Pool Not Burned">
                      <ElectricBoltIcon
                        sx={{ fontSize: '12px', color: '#FF5630' }}
                      />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Burned Liquidity Pool">
                      <LocalFireDepartmentIcon
                        sx={{ fontSize: '12px', color: '#1890FF' }}
                      />
                    </Tooltip>
                  )}
                </>
              )}
            </Stack>
          </Stack>
        </Stack>
      </TableCell>
      <TableCell
        align="right"
        sx={{
          color: priceColor,
          minWidth: isMobile ? '32px' : '100px',
          padding: isMobile ? '1px 2px' : '12px 8px'
        }}
      >
        <TransitionTypo
          variant="h4"
          noWrap
          sx={{
            fontWeight: '600',
            fontSize: isMobile ? '12px' : '16px',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-0.01em'
          }}
        >
          <NumberTooltip
            prepend={currencySymbols[activeFiatCurrency]}
            number={fNumberWithCurreny(exch, exchRate)}
          />
        </TransitionTypo>
      </TableCell>
      {!isMobile && (
        <TableCell align="right" sx={percentageCellStyle}>
          {renderPercentageWithIcon(pro5m || 0, "h4", theme, isMobile)}
        </TableCell>
      )}
      {!isMobile && (
        <TableCell align="right" sx={percentageCellStyle}>
          {renderPercentageWithIcon(pro1h || 0, "h4", theme, isMobile)}
        </TableCell>
      )}
      <TableCell align="right" sx={percentageCellStyle}>
        {renderPercentageWithIcon(pro24h || 0, "h4", theme, isMobile)}
      </TableCell>
      {isMobile && (
        <TableCell align="right" sx={{ minWidth: '40px', padding: '1px 1px' }}>
          <Typography variant="h4" sx={{ fontSize: '9px', fontWeight: '600' }}>
            {currencySymbols[activeFiatCurrency]}
            {convertedValues.marketCap >= 1000000
              ? `${(convertedValues.marketCap / 1000000).toFixed(1)}M`
              : convertedValues.marketCap >= 1000
                ? `${(convertedValues.marketCap / 1000).toFixed(1)}K`
                : fNumber(convertedValues.marketCap)}
          </Typography>
        </TableCell>
      )}
      {!isMobile && (
        <TableCell align="right" sx={percentageCellStyle}>
          {renderPercentageWithIcon(pro7d || 0, "h4", theme, isMobile)}
        </TableCell>
      )}
      {!isMobile && (
        <TableCell align="right">
          <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
            <Typography>{currencySymbols[activeFiatCurrency]}</Typography>
            <Typography variant="h4" noWrap>
              {convertedValues.volume >= 1000000
                ? `${(convertedValues.volume / 1000000).toFixed(1)}M`
                : convertedValues.volume >= 1000
                  ? `${(convertedValues.volume / 1000).toFixed(1)}K`
                  : fNumber(convertedValues.volume)}
            </Typography>
          </Stack>
        </TableCell>
      )}
      {!isMobile && (
        <TableCell align="right" sx={{ padding: isMobile ? '4px 2px' : '12px 8px' }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: isMobile ? '8px' : '11px',
              fontWeight: '400',
              color: alpha(theme.palette.text.secondary, 0.6),
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {formattedTimeAgo}
          </Typography>
        </TableCell>
      )}
      {!isMobile && (
        <>
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
              <Typography variant="h4" noWrap>
                {convertedValues.tvl >= 1000000
                  ? `${(convertedValues.tvl / 1000000).toFixed(1)}M`
                  : convertedValues.tvl >= 1000
                    ? `${(convertedValues.tvl / 1000).toFixed(1)}K`
                    : fNumber(convertedValues.tvl)}
              </Typography>
            </Stack>
          </TableCell>
        </>
      )}
      {!isMobile && (
        <TableCell align="right" sx={{ padding: isMobile ? '4px 2px' : '12px 8px' }}>
          <Stack spacing={0.3} alignItems="flex-end">
            <Typography variant="h4" sx={{ fontSize: isMobile ? '10px' : '12px', fontWeight: '600' }}>
              {currencySymbols[activeFiatCurrency]}
              {convertedValues.marketCap >= 1000000
                ? `${(convertedValues.marketCap / 1000000).toFixed(1)}M`
                : convertedValues.marketCap >= 1000
                  ? `${(convertedValues.marketCap / 1000).toFixed(1)}K`
                  : fNumber(convertedValues.marketCap)}
            </Typography>
            {isMobile && (
              <Typography variant="caption" sx={{ fontSize: '8px', color: 'text.secondary', lineHeight: 1 }}>
                V: {convertedValues.volume >= 1000 ? `${(convertedValues.volume / 1000).toFixed(0)}K` : fNumber(convertedValues.volume)}
              </Typography>
            )}
          </Stack>
        </TableCell>
      )}
      {!isMobile && (
        <TableCell align="right">
          <Typography variant="h4">
            {holders >= 1000000
              ? `${(holders / 1000000).toFixed(1)}M`
              : holders >= 1000
                ? `${(holders / 1000).toFixed(1)}K`
                : fIntNumber(holders)}
          </Typography>
        </TableCell>
      )}
      {!isMobile && (
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
                        {fNumber(convertedValues.supplyRate)}%
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
            <Typography variant="h4" noWrap>
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
      )}
      {!isMobile && (
        <TableCell
          align="right"
          sx={{
            minWidth: '200px',
            overflow: 'visible'
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: 60,
              position: 'relative',
              zIndex: 1
            }}
          >
            <LoadChart
              url={sparklineUrl}
              style={{ width: '100%', height: '100%' }}
              animation={false}
              showGradient={false}
              lineWidth={2}
              opts={chartOpts}
            />
          </Box>
        </TableCell>
      )}
    </TableRow>
  );
}

export const TokenRow = memo(FTokenRow);
