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
  borderRadius: '50%',
  overflow: 'hidden',
  '&:hover': {
    cursor: 'pointer',
    opacity: 0.6
  }
}));

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden'
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
    date,
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
    exch,
    usd,
    ext,
    marketcap,
    isOMCF
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
          fontSize: isMobile ? '12px' : '14px'
        },
        '& .MuiTableCell-root': {
          padding: isMobile ? '2px 4px' : '4px 8px',
          whiteSpace: 'nowrap'
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
          width: '32px',
          minWidth: '32px',
          padding: '4px'
        }}
      >
        {watchList.includes(md5) ? (
          <Tooltip title="Remove from Watchlist">
            <StarRateIcon
              onClick={handleWatchlistClick}
              fontSize="small"
              sx={{ cursor: 'pointer', color: '#F6B87E' }}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Add to Watchlist and follow token">
            <StarOutlineIcon
              onClick={handleWatchlistClick}
              fontSize="small"
              sx={{ cursor: 'pointer', '&:hover': { color: '#F6B87E' } }}
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
            left: '32px',
            background: darkMode ? '#000000' : '#FFFFFF',
            width: '40px',
            minWidth: '40px',
            padding: '4px 8px'
          }}
        >
          {idx + 1}
        </TableCell>
      )}
      <TableCell
        align="left"
        sx={{
          p: isMobile ? '2px 4px' : '4px 8px',
          position: 'sticky',
          zIndex: 1001,
          left: isMobile ? '32px' : '72px',
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
        <Stack direction="row" alignItems="center" spacing={isMobile ? 0.25 : 0.5}>
          <Box>
            {isAdmin ? (
              <AdminImage
                src={imgUrl}
                width={isMobile ? 14 : 24}
                height={isMobile ? 14 : 24}
                onClick={handleEditToken}
                onError={(event) => (event.target.src = '/static/alt.webp')}
                alt={`${user} ${name} Logo`}
              />
            ) : (
              <TokenImage
                src={imgUrl}
                width={isMobile ? 14 : 24}
                height={isMobile ? 14 : 24}
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
            <Stack spacing={isMobile ? 0 : 0.5}>
              <Typography
                variant="token"
                sx={{
                  fontWeight: '700',
                  fontSize: isMobile ? '0.7rem' : '0.85rem',
                  lineHeight: 1.1
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
              <Typography
                variant="p2"
                sx={{
                  fontWeight: '600',
                  fontSize: isMobile ? '0.6rem' : '0.75rem',
                  lineHeight: 1.1
                }}
                color={isOMCF !== 'yes' ? (darkMode ? '#fff' : '#222531') : ''}
                noWrap={!isMobile}
              >
                {isMobile && (
                  <span style={{ ...badge24hStyle, fontSize: '10px', padding: '0 2px' }}>{id}</span>
                )}
                {truncate(user, isMobile ? 12 : 15)}
              </Typography>
            </Stack>
          </Link>
        </Stack>
      </TableCell>
      <TableCell align="right" sx={{ color: priceColor }}>
        <TransitionTypo variant="h4" noWrap={!isMobile}>
          <NumberTooltip
            prepend={currencySymbols[activeFiatCurrency]}
            number={fNumberWithCurreny(exch, exchRate)}
          />
        </TransitionTypo>
      </TableCell>
      <TableCell align="right">
        <BearBullLabel value={pro24h} variant="h4" />
      </TableCell>
      <TableCell align="right">
        <BearBullLabel value={pro7d} variant="h4" />
      </TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
          <Typography>{currencySymbols[activeFiatCurrency]}</Typography>
          <Typography variant="h4" noWrap={!isMobile}>
            {fNumber(convertedVolume)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
          <Typography variant="h6" color="primary.dark">
            <NumberTooltip number={fNumber(vol24hx)} /> {name}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="right">
        <Typography variant="h4">{fNumber(vol24htx)}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="h4">
          {currencySymbols[activeFiatCurrency]}
          {fNumber(convertedMarketCap)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="h4">{fIntNumber(trustlines)}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="h4" noWrap={!isMobile}>
          {fNumber(supply)} {name}
        </Typography>
        <Box display="flex" alignItems="center" pt={1}>
          <Box width="80%" sx={{ color: 'darkgrey', margin: '0 auto' }}>
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
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{ fontWeight: 'bold', color: '#fff' }}
                        >
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
                      <TableCell colSpan={2} sx={{ py: 0.25 }}>
                        <Box sx={{ color: 'darkgrey', width: '100px', margin: '0 auto' }}>
                          <LinearProgress
                            variant="determinate"
                            value={supplyRate}
                            color="inherit"
                            sx={{
                              height: 2,
                              borderRadius: 1,
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 1,
                                backgroundColor: 'rgba(255, 255, 255, 0.7)'
                              }
                            }}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right" sx={{ pt: 0, pb: 0 }}>
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{ fontWeight: 'bold', color: '#fff' }}
                        >
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
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{ fontWeight: 'bold', color: '#fff' }}
                        >
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
              <LinearProgress variant="determinate" value={supplyRate} color="inherit" />
            </Tooltip>
          </Box>
        </Box>
      </TableCell>
      <TableCell
        align="right"
        sx={{
          px: '0 !important'
        }}
      >
        <LoadChart url={`${BASE_URL}/sparkline/${md5}?pro7d=${pro7d}`} />
      </TableCell>
      <TableCell align="right">
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
