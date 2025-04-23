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

// Replace LazyLoadImage with styled component using Next.js Image
const AdminImageWrapper = styled(Box)(({ theme }) => ({
  borderRadius: '8px',
  overflow: 'hidden',
  width: '32px',
  height: '32px',
  position: 'relative',
  '&:hover': {
    cursor: 'pointer',
    '& > img': {
      opacity: 0.6
    }
  }
}));

const TokenImageWrapper = styled(Box)(({ theme }) => ({
  borderRadius: '8px',
  overflow: 'hidden',
  width: '32px',
  height: '32px',
  position: 'relative'
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
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInMonths = Math.floor(diffInDays / 30);

  if (diffInMinutes < 1) {
    return 'Just now';
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  }
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }
  return `${Math.floor(diffInMonths / 12)}y ago`;
};

// Update XPMarketIcon to use forwardRef and ensure proper width handling
const XPMarketIcon = React.forwardRef((props, ref) => {
  // Remove any width="auto" that might be in props
  const { width, ...otherProps } = props;

  return (
    <SvgIcon {...otherProps} ref={ref} viewBox="0 0 32 32">
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

const getOriginIcon = (origin) => {
  switch (origin) {
    case 'FirstLedger':
      return <OpenInNewIcon sx={{ fontSize: 'inherit', color: '#013CFE' }} />;
    case 'XPMarket':
      return <XPMarketIcon sx={{ fontSize: 'inherit', color: '#6D1FEE' }} />;
    case 'Magnetic X':
      return (
        <Box
          component="img"
          src="/magneticx-logo.webp"
          alt="Magnetic X"
          sx={{
            width: '12px',
            height: '12px',
            objectFit: 'contain'
          }}
        />
      );
    case 'xrp.fun':
      return (
        <Icon
          icon={chartLineUp}
          style={{
            fontSize: 'inherit',
            color: '#B72136',
            backgroundColor: '#fff',
            borderRadius: '2px'
          }}
        />
      );
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
        '&:not(:first-of-type)': {
          paddingLeft: '4px'
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
        background: darkMode ? '#000000' : '#FFFFFF',
        width: '20px',
        minWidth: '20px',
        padding: '1px'
      },
      second: {
        position: 'sticky',
        zIndex: 1001,
        left: '20px',
        background: darkMode ? '#000000' : '#FFFFFF',
        width: '25px',
        minWidth: '25px',
        padding: '1px 2px'
      },
      third: {
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
      supplyRate: amount && supply ? Decimal.div(supply || 0, amount || 1).toNumber() * 100 : 0
    }),
    [marketcap, vol24hxrp, tvl, amount, supply, exchRate]
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
  const supplyRate = amount && supply ? Decimal.div(supply, amount).toNumber() * 100 : 0;
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
              width: 32,
              height: 32,
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
                  width={32}
                  height={32}
                  priority
                  style={{ objectFit: 'cover' }}
                  onError={handleImgError}
                />
              </AdminImageWrapper>
            ) : (
              <TokenImageWrapper>
                <Image
                  src={imgSrc}
                  alt={`${user} ${name} Logo`}
                  width={32}
                  height={32}
                  priority
                  style={{ objectFit: 'cover' }}
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
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  lineHeight: 1,
                  width: isMobile ? '80px' : '104px',
                  minWidth: isMobile ? '80px' : '104px'
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
              <Stack
                direction={isMobile ? 'column' : 'row'}
                spacing={0.5}
                alignItems={isMobile ? 'flex-start' : 'center'}
              >
                <Typography
                  variant="p2"
                  sx={{
                    fontWeight: '600',
                    fontSize: isMobile ? '0.6rem' : '0.75rem',
                    lineHeight: 1.1,
                    color: darkMode ? '#848E9C' : '#616E85',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
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
                      {origin === 'xrp.fun' ? (
                        <Tooltip title="Liquidity Pool Not Burned">
                          <ElectricBoltIcon
                            sx={{ fontSize: isMobile ? '12px' : '14px', color: '#B72136' }}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Burned Liquidity Pool">
                          <LocalFireDepartmentIcon
                            sx={{ fontSize: isMobile ? '12px' : '14px', color: '#2065D1' }}
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
          padding: isMobile ? '1px 2px' : '2px 3px'
        }}
      >
        <Typography variant="caption" sx={dateTypographyStyle}>
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
              ? supply >= 999500000
                ? `${(supply / 1000000000).toFixed(2)}B`
                : `${(supply / 1000000).toFixed(2)}M`
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
          <Box sx={{ width: 160, height: 48, minWidth: 160, minHeight: 48 }}>
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
          <Tooltip title="Set Trustline">
            <AddCircleOutlineIcon
              onClick={handleSetTrustline}
              sx={{
                cursor: 'pointer',
                fontSize: '20px',
                '&:hover': {
                  color: theme.palette.primary.main
                }
              }}
            />
          </Tooltip>
          {isAdmin && (
            <Tooltip title="Edit Token">
              <EditIcon
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditToken();
                }}
                sx={{
                  cursor: 'pointer',
                  fontSize: '20px',
                  '&:hover': {
                    color: theme.palette.warning.main
                  }
                }}
              />
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export const TokenRow = memo(FTokenRow);
