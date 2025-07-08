import React, { useState, useContext, useEffect, useMemo, useCallback, memo } from 'react';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { AppContext } from 'src/AppContext';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Stack,
  Typography,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
  styled,
  Slider,
  Avatar,
  Rating,
  IconButton,
  Button
} from '@mui/material';
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';
import chartLineUp from '@iconify/icons-ph/chart-line-up';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import VerifiedIcon from '@mui/icons-material/Verified';
import StarIcon from '@mui/icons-material/Star';
import ShareIcon from '@mui/icons-material/Share';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { SvgIcon } from '@mui/material';
import NumberTooltip from 'src/components/NumberTooltip';
import { fNumber, fNumberWithCurreny } from 'src/utils/formatNumber';
import { currencySymbols, CURRENCY_ISSUERS } from 'src/utils/constants';
import { checkExpiration, getHashIcon } from 'src/utils/extra';
import Decimal from 'decimal.js';
import Image from 'next/image';
import Share from './Share';
import Watch from './Watch';
import SocialLinksMenu from './SocialLinksMenu';
import TrustSetDialog from 'src/components/TrustSetDialog';

const LowhighBarSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-track': {
    border: 'none',
    height: 2,
    background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main}, ${theme.palette.info.main})`,
    borderRadius: '1px',
    boxShadow: `0 1px 2px ${alpha(theme.palette.primary.main, 0.1)}`
  },
  '& .MuiSlider-rail': {
    height: 2,
    borderRadius: '1px',
    background: alpha(theme.palette.background.paper, 0.3),
    opacity: 1
  },
  '& .MuiSlider-thumb': {
    height: 6,
    width: 6,
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.primary.main}`,
    '&:before': { display: 'none' }
  },
  '& .MuiSlider-valueLabel': { display: 'none' }
}));

const TokenSummary = memo(({ token }) => {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency, accountProfile, sync } = useContext(AppContext);
  const [prevPrice, setPrevPrice] = useState(null);
  const [priceAnimation, setPriceAnimation] = useState('');
  const [trustToken, setTrustToken] = useState(null);
  const [isRemove, setIsRemove] = useState(false);
  const [balance, setBalance] = useState(0);
  const [limit, setLimit] = useState(0);

  const {
    id,
    name,
    exch,
    pro7d,
    pro24h,
    pro5m,
    pro1h,
    maxMin24h,
    usd,
    amount,
    vol24hxrp,
    marketcap,
    vol24hx,
    expiration,
    user,
    md5,
    currency,
    issuer,
    tags,
    rating,
    verified,
    holders,
    trustlines,
    tvl,
    origin,
    info
  } = token;

  // Watch for price changes and trigger animation
  useEffect(() => {
    if (prevPrice !== null && exch !== prevPrice) {
      const isIncrease = exch > prevPrice;
      setPriceAnimation(isIncrease ? 'increase' : 'decrease');
      
      // Remove animation class after animation completes
      const timer = setTimeout(() => {
        setPriceAnimation('');
      }, 600);
      
      return () => clearTimeout(timer);
    }
    setPrevPrice(exch);
  }, [exch, prevPrice]);

  // Price changes
  const priceChanges = useMemo(() => [
    {
      value: pro5m,
      label: '5m',
      color: pro5m >= 0 ? theme.palette.success.main : theme.palette.error.main
    },
    {
      value: pro1h,
      label: '1h',
      color: pro1h >= 0 ? theme.palette.success.main : theme.palette.error.main
    },
    {
      value: pro24h,
      label: '24h',
      color: pro24h >= 0 ? theme.palette.success.main : theme.palette.error.main
    },
    {
      value: pro7d,
      label: '7d',
      color: pro7d >= 0 ? theme.palette.success.main : theme.palette.error.main
    }
  ], [pro5m, pro1h, pro24h, pro7d, theme.palette.success.main, theme.palette.error.main]);

  // 24h Range
  const range24h = useMemo(() => {
    if (!maxMin24h) return null;
    const min = maxMin24h[1];
    const max = maxMin24h[0];
    const delta = max - min;
    let percent = 0;
    if (delta > 0) percent = ((usd - min) / delta) * 100;
    return { min, max, percent };
  }, [maxMin24h, usd]);

  // Format values
  const formatValue = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return fNumber(value);
  };

  const formatPercentage = useCallback((value) => {
    if (value === null || value === undefined) return 'N/A';
    const absValue = Math.abs(value);
    return `${value >= 0 ? '+' : '-'}${fNumber(absValue)}%`;
  }, []);

  // Metrics data
  const convertedMarketCap = marketcap && metrics[activeFiatCurrency]
    ? Decimal.div(marketcap, metrics[activeFiatCurrency]).toNumber()
    : 0;
  const convertedVolume = vol24hxrp && metrics[activeFiatCurrency]
    ? Decimal.div(vol24hxrp, metrics[activeFiatCurrency]).toNumber()
    : 0;

  const metricsData = [
    {
      title: 'Price',
      value: (
        <Box
          sx={{
            display: 'inline-block',
            animation: priceAnimation === 'increase' 
              ? 'priceIncrease 0.6s ease-out'
              : priceAnimation === 'decrease' 
              ? 'priceDecrease 0.6s ease-out'
              : 'none',
            '@keyframes priceIncrease': {
              '0%': {
                transform: 'scale(1)',
                color: theme.palette.primary.main
              },
              '50%': {
                transform: 'scale(1.1)',
                color: theme.palette.success.main,
                textShadow: `0 0 10px ${alpha(theme.palette.success.main, 0.5)}`
              },
              '100%': {
                transform: 'scale(1)',
                color: theme.palette.primary.main
              }
            },
            '@keyframes priceDecrease': {
              '0%': {
                transform: 'scale(1)',
                color: theme.palette.primary.main
              },
              '50%': {
                transform: 'scale(1.1)',
                color: theme.palette.error.main,
                textShadow: `0 0 10px ${alpha(theme.palette.error.main, 0.5)}`
              },
              '100%': {
                transform: 'scale(1)',
                color: theme.palette.primary.main
              }
            }
          }}
        >
          <NumberTooltip
            prepend={currencySymbols[activeFiatCurrency]}
            number={fNumberWithCurreny(exch, metrics[activeFiatCurrency])}
          />
        </Box>
      ),
      color: theme.palette.primary.main
    },
    {
      title: 'Market Cap',
      value: `${currencySymbols[activeFiatCurrency]}${formatValue(convertedMarketCap)}`,
      color: theme.palette.success.main
    },
    {
      title: 'Volume (24h)',
      value: `${currencySymbols[activeFiatCurrency]}${formatValue(convertedVolume)}`,
      color: theme.palette.error.main
    },
    {
      title: 'TVL',
      value: `${currencySymbols[activeFiatCurrency]}${formatValue(tvl || 0)}`,
      color: theme.palette.info.main
    }
  ];

  // Token image URL
  const tokenImageUrl = `https://s1.xrpl.to/token/${md5}`;
  const fallbackImageUrl = issuer ? getHashIcon(issuer) : '/static/account_logo.webp';

  // Google Lens search
  const handleGoogleLensSearch = () => {
    const googleLensUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(tokenImageUrl)}`;
    window.open(googleLensUrl, '_blank');
  };

  // Check if token is expired
  const isExpired = checkExpiration(expiration);

  // Trustline functionality
  useEffect(() => {
    if (!accountProfile) return;
    axios
      .get(`${BASE_URL}/account/lines/${accountProfile?.account}`)
      .then((res) => {
        let ret = res.status === 200 ? res.data : undefined;
        if (ret) {
          const trustlines = ret.lines;
          const trustlineToRemove = trustlines.find((trustline) => {
            return (
              (trustline.LowLimit.issuer === issuer || trustline.HighLimit.issuer === issuer) &&
              trustline.LowLimit.currency === currency
            );
          });

          if (trustlineToRemove) {
            setBalance(Decimal.abs(trustlineToRemove.Balance.value).toString());
            setLimit(trustlineToRemove.HighLimit.value);
          }
          setIsRemove(trustlineToRemove);
        }
      })
      .catch((err) => {
        console.log('Error on getting account lines!!!', err);
      });
  }, [trustToken, accountProfile, sync, issuer, currency, BASE_URL]);

  const handleSetTrust = () => {
    setTrustToken(token);
  };

  // Origin icon components
  const XPMarketIcon = React.forwardRef((props, ref) => {
    const { ...otherProps } = props;
    return (
      <SvgIcon {...otherProps} ref={ref} viewBox="0 0 36 36">
        <defs>
          <linearGradient id="xpmarket-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#9333EA', stopOpacity: 1 }} />
            <stop offset="30%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
            <stop offset="70%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#6D28D9', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <g transform="translate(2, 2) scale(1.1)">
          <path
            d="M17.7872 2.625H4.41504L7.67032 7.88327H14.5L17.9149 13.4089H24.4574L17.7872 2.625Z"
            fill="url(#xpmarket-icon-gradient)"
          />
          <path
            d="M1 18.6667L7.67014 29.4506L10.9573 24.1627L7.54248 18.6667L10.9573 13.1708L7.67014 7.88281L1 18.6667Z"
            fill="url(#xpmarket-icon-gradient)"
          />
          <path
            d="M24.3292 24.1931L30.9994 13.4092H24.4569L21.042 18.9051H14.2123L10.957 24.1931H24.3292Z"
            fill="url(#xpmarket-icon-gradient)"
          />
        </g>
      </SvgIcon>
    );
  });

  const LedgerMemeIcon = React.forwardRef((props, ref) => {
    const { ...otherProps } = props;
    return (
      <SvgIcon {...otherProps} ref={ref} viewBox="0 0 26 26">
        <g transform="scale(0.75)">
          <rect fill="#cfff04" width="36" height="36" rx="8" ry="8" x="0" y="0"></rect>
          <g>
            <g>
              <path
                fill="#262626"
                d="M25.74,9.68c0.64,0,1.24-0.26,1.69-0.72l2.69-2.76h-1.64l-1.87,1.92c-0.23,0.24-0.55,0.37-0.88-0.37s-0.64-0.13-0.88-0.37l-1.87-1.92h-1.64l2.69,2.76c0.45,0.46,1.05,0.72,1.69,0.72Z"
              ></path>
              <path
                fill="#262626"
                d="M27.43,10.62c-0.45-0.46-1.05-0.72-1.69-0.72s-1.24,0.26-1.69,0.72l-2.71,2.78h1.64l1.89-1.93c0.23-0.24,0.55-0.37,0.88-0.37s0.64,0.13,0.88,0.37l1.89,1.93h1.64l-2.71-2.78c-0.45-0.46-1.05-0.72-1.69-0.72Z"
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

  const HorizonIcon = React.forwardRef((props, ref) => {
    const { ...otherProps } = props;
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

  const getOriginIcon = (origin) => {
    switch (origin) {
      case 'FirstLedger':
        return <OpenInNewIcon sx={{ fontSize: '10px', color: '#013CFE' }} />;
      case 'XPMarket':
        return <XPMarketIcon sx={{ fontSize: '10px', color: '#6D1FEE' }} />;
      case 'LedgerMeme':
        return <LedgerMemeIcon sx={{ fontSize: '10px', color: '#cfff04' }} />;
      case 'Horizon':
        return <HorizonIcon sx={{ fontSize: '10px', color: '#f97316' }} />;
      case 'aigent.run':
        return (
          <Box
            component="img"
            src="/static/aigentrun.gif"
            alt="Aigent.Run"
            sx={{ width: '10px', height: '10px', objectFit: 'contain' }}
          />
        );
      case 'Magnetic X':
        return (
          <Box
            component="img"
            src="/magneticx-logo.webp"
            alt="Magnetic X"
            sx={{ width: '10px', height: '10px', objectFit: 'contain' }}
          />
        );
      case 'xrp.fun':
        return (
          <Icon
            icon={chartLineUp}
            style={{ fontSize: '10px', color: '#B72136' }}
          />
        );
      default:
        return <AutoAwesomeIcon sx={{ fontSize: '8px', color: '#637381' }} />;
    }
  };


  return (
    <Box
      sx={{
        p: 1,
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.04)} 100%)`,
        backdropFilter: 'blur(16px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.06)}`,
        mb: 2
      }}
    >
      <Stack spacing={1}>
        {/* Header with Token Info */}
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Token Image */}
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                position: 'relative',
                cursor: 'pointer',
                '&:hover .google-lens-overlay': {
                  opacity: 1
                }
              }}
              onClick={handleGoogleLensSearch}
            >
              <Image
                src={tokenImageUrl}
                alt={`${name} token`}
                width={60}
                height={60}
                style={{
                  borderRadius: '12px',
                  objectFit: 'cover',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}
                onError={(e) => {
                  e.currentTarget.src = fallbackImageUrl;
                }}
              />
              
              {/* Google Lens Overlay */}
              <Box
                className="google-lens-overlay"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: alpha(theme.palette.common.black, 0.7),
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  '&:hover': {
                    opacity: 1
                  }
                }}
              >
                <SearchIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
            </Box>
            
            {verified && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: theme.palette.success.main,
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2
                }}
              >
                <VerifiedIcon sx={{ fontSize: 12, color: 'white' }} />
              </Box>
            )}
            
            {/* Google Lens Search - positioned top-left of the token image */}
            <Tooltip title="Search with Google Lens" placement="top">
              <IconButton
                onClick={handleGoogleLensSearch}
                size="small"
                sx={{
                  position: 'absolute',
                  top: -6,
                  left: -6,
                  background: `linear-gradient(135deg, 
                    #4285f4 0%, 
                    #34a853 25%, 
                    #fbbc04 50%, 
                    #ea4335 75%, 
                    #9c27b0 100%
                  )`,
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  minWidth: 24,
                  minHeight: 24,
                  border: `2px solid ${theme.palette.background.paper}`,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.25)}, 
                             0 0 0 2px ${alpha('#4285f4', 0.2)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 3,
                  animation: 'lensGlow 2s ease-in-out infinite alternate',
                  '@keyframes lensGlow': {
                    '0%': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.25)}, 
                                 0 0 0 2px ${alpha('#4285f4', 0.2)}`,
                    },
                    '100%': {
                      boxShadow: `0 6px 20px ${alpha(theme.palette.common.black, 0.35)}, 
                                 0 0 0 3px ${alpha('#4285f4', 0.4)}`,
                    }
                  },
                  '&:hover': {
                    transform: 'scale(1.15) rotate(5deg)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.4)}, 
                               0 0 0 4px ${alpha('#4285f4', 0.3)},
                               0 0 20px ${alpha('#4285f4', 0.2)}`,
                    animation: 'none'
                  },
                  '&:active': {
                    transform: 'scale(1.05) rotate(2deg)',
                    transition: 'transform 0.1s ease'
                  }
                }}
              >
                <SearchIcon sx={{ 
                  fontSize: 14, 
                  color: 'white',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Token Details */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {name}
              </Typography>
              {rating && (
                <Rating
                  value={rating}
                  readOnly
                  size="small"
                  sx={{
                    fontSize: '0.8rem',
                    '& .MuiRating-iconFilled': {
                      color: theme.palette.warning.main
                    }
                  }}
                />
              )}
            </Stack>
            
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {user || name}
              </Typography>
            </Stack>

            {/* Tags and Status */}
            <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
              {id && (
                <Tooltip title={`Rank by 24h Volume: #${id - 1}`}>
                  <Chip
                    label={`#${id - 1}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{
                      borderRadius: '6px',
                      height: '18px',
                      fontSize: '0.6rem',
                      background: `linear-gradient(135deg,
                        ${alpha(theme.palette.primary.main, 0.12)} 0%,
                        ${alpha(theme.palette.primary.main, 0.06)} 100%
                      )`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      fontWeight: 600,
                      px: 0.75,
                      minWidth: 'auto',
                      flexShrink: 0
                    }}
                  />
                </Tooltip>
              )}
              {isExpired && (
                <Chip
                  label="Expired"
                  size="small"
                  color="error"
                  sx={{ fontSize: '0.6rem', height: '16px' }}
                />
              )}
              {/* Always show origin badge - either specific origin or default */}
              <Chip
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    {getOriginIcon(origin)}
                    {origin || 'Default'}
                  </Box>
                }
                size="small"
                color="secondary"
                sx={{ fontSize: '0.6rem', height: '16px' }}
              />
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={0.5}>
            <Tooltip title={`${isRemove ? 'Remove' : 'Set'} Trustline`}>
              <IconButton 
                size="small" 
                disabled={CURRENCY_ISSUERS?.XRP_MD5 === md5}
                sx={{ 
                  position: 'relative',
                  borderRadius: '8px',
                  border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
                  padding: isMobile ? '4px' : '6px',
                  minWidth: isMobile ? '32px' : '36px',
                  minHeight: isMobile ? '32px' : '36px',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(135deg, ${alpha(isRemove ? theme.palette.error.main : theme.palette.success.main, 0.08)} 0%, ${alpha(isRemove ? theme.palette.error.main : theme.palette.success.main, 0.05)} 100%)`,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    zIndex: -1
                  },
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.02)',
                    border: `2px solid ${alpha(isRemove ? theme.palette.error.main : theme.palette.success.main, 0.3)}`,
                    boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 16px ${alpha(isRemove ? theme.palette.error.main : theme.palette.success.main, 0.1)}`,
                    '&::before': {
                      opacity: 1
                    },
                    '& .MuiSvgIcon-root': {
                      color: isRemove ? theme.palette.error.main : theme.palette.success.main
                    }
                  },
                  '&:active': {
                    transform: 'translateY(-2px) scale(0.98)'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: isMobile ? '16px' : '18px',
                    color: alpha(theme.palette.text.primary, 0.8),
                    transition: 'color 0.3s ease'
                  },
                  '&.Mui-disabled': {
                    opacity: 0.4
                  }
                }}
                onClick={handleSetTrust}
              >
                <AccountBalanceWalletIcon />
              </IconButton>
            </Tooltip>
            <Share token={token} />
            <Watch token={token} />
          </Stack>
        </Stack>

        {/* Price Changes */}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
          {(isMobile ? priceChanges.slice(0, 3) : priceChanges).map((item) => (
            <Box
              key={item.label}
              sx={{
                px: 0.5,
                py: 0.25,
                borderRadius: '4px',
                background: `linear-gradient(135deg, ${alpha(item.color, 0.1)} 0%, ${alpha(item.color, 0.05)} 100%)`,
                border: `1px solid ${alpha(item.color, 0.15)}`,
                minWidth: '45px',
                textAlign: 'center'
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: alpha(theme.palette.text.secondary, 0.8) }}>
                {item.label}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: item.color,
                  display: 'block'
                }}
              >
                {formatPercentage(item.value)}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* 24h Range */}
        {range24h && (
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: alpha(theme.palette.text.secondary, 0.8), mb: 0.5, display: 'block' }}>
              24h Range
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.success.main, minWidth: '40px' }}>
                <NumberTooltip
                  prepend={currencySymbols[activeFiatCurrency]}
                  number={fNumber(
                    Decimal.mul(
                      Decimal.mul(range24h.min, metrics.USD),
                      1 / metrics[activeFiatCurrency]
                    )
                  )}
                />
              </Typography>
              <Box sx={{ flex: 1, px: 0.5 }}>
                <LowhighBarSlider
                  value={range24h.percent}
                  disabled
                  sx={{ height: 2 }}
                />
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.info.main, minWidth: '40px' }}>
                <NumberTooltip
                  prepend={currencySymbols[activeFiatCurrency]}
                  number={fNumber(
                    Decimal.mul(
                      Decimal.mul(range24h.max, metrics.USD),
                      1 / metrics[activeFiatCurrency]
                    )
                  )}
                />
              </Typography>
            </Stack>
          </Box>
        )}


        {/* Metrics Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 0.5
          }}
        >
          {metricsData.map((metric, index) => (
            <Box
              key={index}
              sx={{
                p: 0.5,
                borderRadius: '6px',
                background: `linear-gradient(135deg, ${alpha(metric.color, 0.06)} 0%, ${alpha(metric.color, 0.03)} 100%)`,
                border: `1px solid ${alpha(metric.color, 0.08)}`,
                textAlign: 'center',
                transition: 'all 0.15s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: `0 2px 8px ${alpha(metric.color, 0.1)}`
                }
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.6rem',
                  color: alpha(theme.palette.text.secondary, 0.8),
                  display: 'block',
                  mb: 0.25
                }}
              >
                {metric.title}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: metric.color,
                  lineHeight: 1
                }}
              >
                {metric.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Stack>
      
      {/* TrustSet Dialog */}
      {trustToken && (
        <TrustSetDialog
          balance={balance}
          limit={limit}
          token={trustToken}
          setToken={setTrustToken}
        />
      )}
    </Box>
  );
});

TokenSummary.displayName = 'TokenSummary';

export default TokenSummary;