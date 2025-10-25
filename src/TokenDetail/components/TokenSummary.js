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
  Rating,
  IconButton
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedIcon from '@mui/icons-material/Verified';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { SvgIcon } from '@mui/material';
import { fNumber } from 'src/utils/formatters';
import { Box as MuiBox } from '@mui/material';
// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};

// Simple price formatter
const formatPrice = (price) => {
  // Convert to number if it's a string
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Check for invalid values (null, undefined, NaN, Infinity)
  if (numPrice == null || isNaN(numPrice) || !isFinite(numPrice)) return '0';

  // Handle zero explicitly
  if (numPrice === 0) return '0';

  if (numPrice < 0.0001) {
    const str = numPrice.toFixed(15);
    const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
    if (zeros >= 4) {
      const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
      return `0.0(${zeros})${significant.slice(0, 4)}`;
    }
    return numPrice.toFixed(8);
  }
  if (numPrice < 1) return numPrice.toFixed(4);
  if (numPrice < 100) return numPrice.toFixed(4).replace(/\.?0+$/, '').replace(/(\.\d)$/, '$10');
  if (numPrice < 1000) return numPrice.toFixed(2);
  if (numPrice < 1000000) return numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return numPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
const CURRENCY_ISSUERS = {
  XRP_MD5: 'XRP'
};
import { checkExpiration, getHashIcon } from 'src/utils/formatters';
import Decimal from 'decimal.js-light';
import Image from 'next/image';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import Share from './Share';
import Watch from './Watch';
// TrustSetDialog removed - Xaman no longer used
const TrustSetDialog = () => null;
import TimelineIcon from '@mui/icons-material/Timeline';
import EditIcon from '@mui/icons-material/Edit';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EditTokenDialog from 'src/components/EditTokenDialog';

const LowhighBarSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-track': {
    border: 'none',
    height: 3,
    background: theme.palette.primary.main,
    borderRadius: '2px',
    boxShadow: 'none'
  },
  '& .MuiSlider-rail': {
    height: 3,
    borderRadius: '2px',
    background: alpha(theme.palette.divider, 0.2),
    opacity: 1
  },
  '& .MuiSlider-thumb': {
    height: 8,
    width: 8,
    background: theme.palette.background.paper,
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: 'none',
    '&:before': { display: 'none' }
  },
  '& .MuiSlider-valueLabel': { display: 'none' }
}));

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

const MoonvalveIcon = React.forwardRef((props, ref) => {
  const { ...otherProps } = props;
  return (
    <SvgIcon {...otherProps} ref={ref} viewBox="0 0 1080 1080">
      <g transform="matrix(0.22 0 0 -0.22 405.9 545.69)">
        <path fill="#ff6b35" d="M 4690 8839 C 4166 8779 3630 8512 3267 8130 C 2862 7705 2643 7206 2599 6608 C 2561 6084 2717 5513 3023 5055 C 3214 4769 3472 4512 3749 4333 C 4414 3901 5232 3796 5955 4050 C 6070 4091 6193 4147 6188 4157 C 6115 4302 6106 4421 6160 4563 C 6171 4591 6178 4615 6177 4617 C 6175 4618 6150 4613 6120 4604 C 5919 4550 5578 4525 5349 4549 C 4904 4595 4475 4772 4138 5047 C 4035 5132 3858 5318 3774 5430 C 3359 5983 3235 6685 3436 7347 C 3620 7955 4061 8447 4652 8706 C 4758 8752 4989 8830 5021 8830 C 5031 8830 5042 8835 5045 8840 C 5053 8852 4800 8851 4690 8839 z" transform="translate(-4390.76, -6381.14)" />
      </g>
      <g transform="matrix(0.22 0 0 -0.22 592.36 356.11)">
        <path fill="#ff6b35" d="M 4344 7780 C 4332 7775 4310 7755 4294 7735 C 4238 7661 4257 7531 4333 7476 C 4360 7456 4376 7455 4726 7452 L 5090 7449 L 5090 7245 L 5090 7040 L 4962 7040 C 4876 7040 4830 7036 4822 7028 C 4805 7011 4805 6789 4822 6772 C 4831 6763 4941 6760 5256 6760 C 5627 6760 5680 6762 5694 6776 C 5707 6788 5710 6815 5710 6899 C 5710 7042 5712 7040 5552 7040 L 5430 7040 L 5430 7245 L 5430 7449 L 5803 7452 L 6175 7455 L 6209 7479 C 6301 7545 6300 7713 6208 7770 C 6176 7790 6160 7790 5270 7789 C 4772 7789 4355 7785 4344 7780 z" transform="translate(-5269.57, -7274.67)" />
      </g>
      <g transform="matrix(0.22 0 0 -0.22 577.88 638.18)">
        <path fill="#ff6b35" d="M 4775 6606 C 4731 6586 4709 6557 4703 6508 C 4700 6484 4693 6459 4687 6453 C 4680 6443 4553 6440 4113 6440 C 3639 6440 3549 6438 3544 6426 C 3535 6402 3571 6230 3611 6105 C 3632 6039 3676 5933 3707 5870 L 3765 5755 L 4201 5750 L 4637 5745 L 4671 5717 C 4815 5600 4922 5539 5045 5505 C 5136 5480 5309 5474 5406 5493 C 5554 5521 5666 5576 5804 5689 L 5873 5745 L 5989 5748 C 6095 5751 6109 5749 6149 5728 C 6180 5711 6201 5690 6217 5660 C 6238 5620 6240 5605 6240 5454 C 6240 5303 6241 5290 6259 5280 C 6285 5266 6815 5266 6841 5280 C 6859 5290 6860 5304 6860 5534 C 6860 5797 6850 5868 6796 5985 C 6719 6155 6543 6322 6374 6389 C 6277 6426 6180 6440 6006 6440 C 5822 6440 5810 6444 5810 6504 C 5810 6545 5778 6588 5734 6606 C 5686 6626 4820 6626 4775 6606 z" transform="translate(-5201.3, -5945.25)" />
      </g>
      <g transform="matrix(0.22 0 0 -0.22 992.56 807.22)">
        <path fill="#ff6b35" d="M 7461 5547 C 7323 5341 7117 5124 6923 4978 C 6868 4936 6814 4898 6805 4893 C 6789 4884 6790 4880 6813 4844 C 6826 4822 6852 4776 6869 4742 C 6886 4708 6904 4680 6909 4680 C 6925 4680 7115 4886 7186 4980 C 7264 5083 7349 5218 7400 5319 C 7440 5400 7523 5610 7517 5617 C 7514 5619 7489 5588 7461 5547 z" transform="translate(-7155.74, -5148.55)" />
      </g>
      <g transform="matrix(0.22 0 0 -0.22 863.97 931.46)">
        <path fill="#ff6b35" d="M 6512 5023 C 6368 4810 6239 4568 6219 4470 C 6183 4296 6260 4139 6416 4068 C 6454 4051 6483 4046 6550 4046 C 6617 4046 6646 4051 6684 4068 C 6759 4102 6813 4152 6850 4221 C 6877 4273 6884 4299 6888 4360 C 6894 4470 6877 4535 6801 4683 C 6743 4797 6568 5080 6555 5080 C 6553 5080 6533 5054 6512 5023 z" transform="translate(-6549.68, -4563)" />
      </g>
    </SvgIcon>
  );
});

const TokenSummary = memo(
  ({
    token,
    onCreatorTxToggle,
    creatorTxOpen,
    latestCreatorTx: propLatestCreatorTx,
    setLatestCreatorTx
  }) => {
    const BASE_URL = process.env.API_URL;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const metrics = useSelector(selectMetrics);
    const { activeFiatCurrency, accountProfile, sync } = useContext(AppContext);

    // Debug logging for admin status
    useEffect(() => {
      if (accountProfile) {
      } else {
      }
    }, [accountProfile]);
    const [prevPrice, setPrevPrice] = useState(null);
    const [priceColor, setPriceColor] = useState(null);
    const [trustToken, setTrustToken] = useState(null);
    const [isRemove, setIsRemove] = useState(false);
    const [balance, setBalance] = useState(0);
    const [limit, setLimit] = useState(0);
    const [editToken, setEditToken] = useState(null);

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
      info,
      creator
    } = token;

    // Watch for price changes and trigger animation
    useEffect(() => {
      if (prevPrice !== null && exch !== null && exch !== prevPrice) {
        const currentPrice = parseFloat(exch);
        const previousPrice = parseFloat(prevPrice);

        if (!isNaN(currentPrice) && !isNaN(previousPrice)) {
          if (currentPrice > previousPrice) {
            setPriceColor(theme.palette.mode === 'dark' ? '#66BB6A' : '#388E3C');
          } else if (currentPrice < previousPrice) {
            setPriceColor(theme.palette.mode === 'dark' ? '#FF5252' : '#D32F2F');
          } else {
            setPriceColor(theme.palette.info.main);
          }

          // Remove color after 2 seconds
          const timer = setTimeout(() => {
            setPriceColor(null);
          }, 2000);

          return () => clearTimeout(timer);
        }
      }
      setPrevPrice(exch);
    }, [exch, prevPrice, theme.palette.success.main, theme.palette.error.main]);

    // Price changes
    const priceChanges = useMemo(
      () => [
        {
          value: pro5m,
          label: '5m',
          color:
            pro5m >= 0
              ? theme.palette.mode === 'dark'
                ? '#66BB6A'
                : '#388E3C'
              : theme.palette.mode === 'dark'
                ? '#FF5252'
                : '#D32F2F'
        },
        {
          value: pro1h,
          label: '1h',
          color:
            pro1h >= 0
              ? theme.palette.mode === 'dark'
                ? '#66BB6A'
                : '#388E3C'
              : theme.palette.mode === 'dark'
                ? '#FF5252'
                : '#D32F2F'
        },
        {
          value: pro24h,
          label: '24h',
          color:
            pro24h >= 0
              ? theme.palette.mode === 'dark'
                ? '#66BB6A'
                : '#388E3C'
              : theme.palette.mode === 'dark'
                ? '#FF5252'
                : '#D32F2F'
        },
        {
          value: pro7d,
          label: '7d',
          color:
            pro7d >= 0
              ? theme.palette.mode === 'dark'
                ? '#66BB6A'
                : '#388E3C'
              : theme.palette.mode === 'dark'
                ? '#FF5252'
                : '#D32F2F'
        }
      ],
      [pro5m, pro1h, pro24h, pro7d, theme.palette.mode]
    );

    // 24h Range
    const range24h = useMemo(() => {
      // Always return a mock range for testing
      if (pro24h !== null && pro24h !== undefined) {
        const currentPrice = exch || 1;
        const variation = Math.abs(pro24h) / 100;
        const min = currentPrice * (1 - variation);
        const max = currentPrice * (1 + variation);
        const delta = max - min;
        let percent = 50;
        if (delta > 0) {
          percent = Math.max(0, Math.min(100, ((currentPrice - min) / delta) * 100));
        }
        return { min, max, percent };
      }

      if (!maxMin24h || !Array.isArray(maxMin24h) || maxMin24h.length < 2) return null;
      const min = Math.min(maxMin24h[0], maxMin24h[1]);
      const max = Math.max(maxMin24h[0], maxMin24h[1]);
      const delta = max - min;
      let percent = 50;
      const currentPrice = exch || usd;
      if (delta > 0 && currentPrice) {
        percent = Math.max(0, Math.min(100, ((currentPrice - min) / delta) * 100));
      }
      return { min, max, percent };
    }, [maxMin24h, exch, usd, pro24h]);

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
      const formattedValue = absValue.toFixed(2);
      return `${value >= 0 ? '+' : '-'}${formattedValue}%`;
    }, []);

    // Metrics data
    const convertedMarketCap =
      marketcap && (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null))
        ? new Decimal(marketcap).div(metrics[activeFiatCurrency] || metrics.CNY || 1).toNumber()
        : marketcap || 0;
    const convertedVolume =
      vol24hxrp && (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null))
        ? new Decimal(vol24hxrp).div(metrics[activeFiatCurrency] || metrics.CNY || 1).toNumber()
        : vol24hxrp || 0;

    const metricsData = [
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
        value: `${currencySymbols[activeFiatCurrency]}${formatValue(tvl && (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null)) ? new Decimal(tvl).div(metrics[activeFiatCurrency] || metrics.CNY || 1).toNumber() : tvl || 0)}`,
        color: theme.palette.info.main
      },
      {
        title: 'Holders',
        value: formatValue(holders || 0),
        color: theme.palette.warning.main,
        desktopOnly: false,
        mobileOnly: true
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
        });
    }, [trustToken, accountProfile, sync, issuer, currency, BASE_URL]);

    const handleSetTrust = () => {
      setTrustToken(token);
    };

    // Get latest transaction from creator dialog
    const latestCreatorTx = propLatestCreatorTx;

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
        case 'Moonvalve':
        case 'MoonValve':
          return <MoonvalveIcon sx={{ fontSize: '10px', color: '#ff6b35' }} />;
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
              src="/static/magneticx-logo.webp"
              alt="Magnetic X"
              sx={{ width: '10px', height: '10px', objectFit: 'contain' }}
            />
          );
        case 'xrp.fun':
          return <TrendingUpIcon sx={{ fontSize: '10px', color: '#B72136' }} />;
        case 'XRPL':
          return (
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.5 8L2 12.5L6.5 17"
                stroke="#1976d2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.5 8L22 12.5L17.5 17"
                stroke="#1976d2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.5 4L9.5 20"
                stroke="#1976d2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          );
        default:
          return <AutoAwesomeIcon sx={{ fontSize: '8px', color: '#637381' }} />;
      }
    };

    return (
      <Box
        sx={{
          p: { xs: 0.3, sm: 0.4 },
          borderRadius: '12px',
          background: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: 'none',
          mb: { xs: 0.25, sm: 0.5 },
          mt: { xs: 0, md: -1 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            display: 'none'
          },
          '&:hover': {
            boxShadow: 'none',
            borderColor: alpha(theme.palette.divider, 0.3),
            background: alpha(theme.palette.background.paper, 0.04)
          }
        }}
      >
        <Stack spacing={{ xs: 0.15, sm: 0.25 }}>
          {/* Header with Token Info */}
          <Stack
            direction="row"
            spacing={{ xs: 0.3, sm: 0.5 }}
            alignItems="flex-start"
            sx={{ position: 'relative' }}
          >
            {/* Mobile Action Buttons - Top right corner */}
            <Stack
              direction="row"
              spacing={0.3}
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                display: { xs: 'flex', md: 'none' },
                zIndex: 2
              }}
            >
              <Tooltip title={`${isRemove ? 'Remove' : 'Set'} Trustline`}>
                <IconButton
                  size="small"
                  aria-label={isRemove ? 'Remove trustline' : 'Set trustline'}
                  disabled={CURRENCY_ISSUERS?.XRP_MD5 === md5}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '6px',
                    border: `1px solid ${isRemove ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.success.main, 0.2)}`,
                    background: isRemove
                      ? alpha(theme.palette.error.main, 0.08)
                      : alpha(theme.palette.success.main, 0.08),
                    padding: '4px',
                    '&:hover': {
                      background: isRemove
                        ? alpha(theme.palette.error.main, 0.15)
                        : alpha(theme.palette.success.main, 0.15),
                      boxShadow: 'none'
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '14px',
                      color: isRemove ? theme.palette.error.main : theme.palette.success.main
                    }
                  }}
                  onClick={handleSetTrust}
                >
                  {isRemove ? <LinkOffIcon /> : <LinkIcon />}
                </IconButton>
              </Tooltip>
              <Box
                sx={{
                  '& .MuiIconButton-root': {
                    width: '24px !important',
                    height: '24px !important',
                    minWidth: '24px !important',
                    minHeight: '24px !important',
                    padding: '4px !important',
                    borderRadius: '6px !important',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)} !important`,
                    '& .MuiSvgIcon-root': {
                      fontSize: '14px !important'
                    },
                    '&:hover': {
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)} !important`
                    }
                  }
                }}
              >
                <Share token={token} />
              </Box>
              <Box
                sx={{
                  '& .MuiIconButton-root': {
                    width: '24px !important',
                    height: '24px !important',
                    minWidth: '24px !important',
                    minHeight: '24px !important',
                    padding: '4px !important',
                    borderRadius: '6px !important',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)} !important`,
                    '& .MuiSvgIcon-root': {
                      fontSize: '14px !important'
                    },
                    '&:hover': {
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.3)} !important`
                    }
                  }
                }}
              >
                <Watch token={token} />
              </Box>
              {accountProfile?.admin && (
                <Tooltip title="Admin Edit Token">
                  <IconButton
                    size="small"
                    aria-label="Edit token (admin)"
                    onClick={() => setEditToken(token)}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '6px',
                      border: `1.5px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                      background: 'transparent',
                      padding: '4px',
                      '&:hover': {
                        background: alpha(theme.palette.warning.main, 0.08),
                        boxShadow: 'none',
                        borderColor: theme.palette.warning.main
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: '14px',
                        color: theme.palette.warning.main
                      }
                    }}
                  >
                    <AdminPanelSettingsIcon />
                  </IconButton>
                </Tooltip>
              )}
              {creator && (
                <Tooltip title="View Creator Activity">
                  <IconButton
                    size="small"
                    aria-label="View creator activity"
                    onClick={onCreatorTxToggle}
                    sx={{
                      width: 'auto',
                      minWidth: 24,
                      height: 24,
                      borderRadius: '6px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      background: (() => {
                        if (!latestCreatorTx) return alpha(theme.palette.background.paper, 0.5);
                        const tx = latestCreatorTx.tx;
                        const deliveredAmount =
                          latestCreatorTx.meta?.delivered_amount ||
                          latestCreatorTx.meta?.DeliveredAmount;
                        const sentAmount = tx.SendMax || tx.Amount;

                        const isTokenToXrp =
                          tx.TransactionType === 'Payment' &&
                          tx.Account === tx.Destination &&
                          (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                          (() => {
                            if (!deliveredAmount || !sentAmount) return false;
                            const isReceivedXRP = typeof deliveredAmount === 'string';
                            const isSentToken =
                              typeof sentAmount === 'object' &&
                              sentAmount.currency &&
                              sentAmount.currency !== 'XRP';
                            return isReceivedXRP && isSentToken;
                          })();

                        const isXrpToToken =
                          tx.TransactionType === 'Payment' &&
                          tx.Account === tx.Destination &&
                          (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                          (() => {
                            if (!deliveredAmount || !sentAmount) return false;
                            const isSentXRP = typeof sentAmount === 'string';
                            const isReceivedToken =
                              typeof deliveredAmount === 'object' &&
                              deliveredAmount.currency &&
                              deliveredAmount.currency !== 'XRP';
                            return isSentXRP && isReceivedToken;
                          })();

                        if (isTokenToXrp) return alpha('#ff6347', 0.08);
                        if (isXrpToToken) return alpha('#4169e1', 0.08);
                        return alpha(theme.palette.background.paper, 0.5);
                      })(),
                      padding: '4px',
                      paddingRight: latestCreatorTx ? '8px' : '4px',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        background: (() => {
                          if (!latestCreatorTx) return alpha(theme.palette.primary.main, 0.08);
                          const tx = latestCreatorTx.tx;
                          const deliveredAmount =
                            latestCreatorTx.meta?.delivered_amount ||
                            latestCreatorTx.meta?.DeliveredAmount;
                          const sentAmount = tx.SendMax || tx.Amount;

                          const isTokenToXrp =
                            tx.TransactionType === 'Payment' &&
                            tx.Account === tx.Destination &&
                            (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                            (() => {
                              if (!deliveredAmount || !sentAmount) return false;
                              const isReceivedXRP = typeof deliveredAmount === 'string';
                              const isSentToken =
                                typeof sentAmount === 'object' &&
                                sentAmount.currency &&
                                sentAmount.currency !== 'XRP';
                              return isReceivedXRP && isSentToken;
                            })();

                          const isXrpToToken =
                            tx.TransactionType === 'Payment' &&
                            tx.Account === tx.Destination &&
                            (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                            (() => {
                              if (!deliveredAmount || !sentAmount) return false;
                              const isSentXRP = typeof sentAmount === 'string';
                              const isReceivedToken =
                                typeof deliveredAmount === 'object' &&
                                deliveredAmount.currency &&
                                deliveredAmount.currency !== 'XRP';
                              return isSentXRP && isReceivedToken;
                            })();

                          if (isTokenToXrp) return alpha('#ff6347', 0.12);
                          if (isXrpToToken) return alpha('#4169e1', 0.12);
                          return alpha(theme.palette.primary.main, 0.08);
                        })(),
                        boxShadow: 'none'
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: '14px',
                        color: alpha(theme.palette.text.primary, 0.7)
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {!latestCreatorTx && <TimelineIcon />}
                      {latestCreatorTx && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '11px',
                            color: (() => {
                              const tx = latestCreatorTx.tx;
                              const deliveredAmount =
                                latestCreatorTx.meta?.delivered_amount ||
                                latestCreatorTx.meta?.DeliveredAmount;
                              const sentAmount = tx.SendMax || tx.Amount;

                              const isTokenToXrp =
                                tx.TransactionType === 'Payment' &&
                                tx.Account === tx.Destination &&
                                (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                (() => {
                                  if (!deliveredAmount || !sentAmount) return false;
                                  const isReceivedXRP = typeof deliveredAmount === 'string';
                                  const isSentToken =
                                    typeof sentAmount === 'object' &&
                                    sentAmount.currency &&
                                    sentAmount.currency !== 'XRP';
                                  return isReceivedXRP && isSentToken;
                                })();

                              const isXrpToToken =
                                tx.TransactionType === 'Payment' &&
                                tx.Account === tx.Destination &&
                                (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                (() => {
                                  if (!deliveredAmount || !sentAmount) return false;
                                  const isSentXRP = typeof sentAmount === 'string';
                                  const isReceivedToken =
                                    typeof deliveredAmount === 'object' &&
                                    deliveredAmount.currency &&
                                    deliveredAmount.currency !== 'XRP';
                                  return isSentXRP && isReceivedToken;
                                })();

                              if (isTokenToXrp) return '#ff6347';
                              if (isXrpToToken) return '#4169e1';
                              return theme.palette.text.primary;
                            })(),
                            fontWeight: 600,
                            display: { xs: 'none', sm: 'block' },
                            textShadow: (() => {
                              const tx = latestCreatorTx.tx;
                              const deliveredAmount =
                                latestCreatorTx.meta?.delivered_amount ||
                                latestCreatorTx.meta?.DeliveredAmount;
                              const sentAmount = tx.SendMax || tx.Amount;

                              const isTokenToXrp =
                                tx.TransactionType === 'Payment' &&
                                tx.Account === tx.Destination &&
                                (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                (() => {
                                  if (!deliveredAmount || !sentAmount) return false;
                                  const isReceivedXRP = typeof deliveredAmount === 'string';
                                  const isSentToken =
                                    typeof sentAmount === 'object' &&
                                    sentAmount.currency &&
                                    sentAmount.currency !== 'XRP';
                                  return isReceivedXRP && isSentToken;
                                })();

                              const isXrpToToken =
                                tx.TransactionType === 'Payment' &&
                                tx.Account === tx.Destination &&
                                (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                (() => {
                                  if (!deliveredAmount || !sentAmount) return false;
                                  const isSentXRP = typeof sentAmount === 'string';
                                  const isReceivedToken =
                                    typeof deliveredAmount === 'object' &&
                                    deliveredAmount.currency &&
                                    deliveredAmount.currency !== 'XRP';
                                  return isSentXRP && isReceivedToken;
                                })();

                              if (isTokenToXrp) return '0 0 3px rgba(255, 99, 71, 0.5)';
                              if (isXrpToToken) return '0 0 3px rgba(65, 105, 225, 0.5)';
                              return 'none';
                            })()
                          }}
                        >
                          {(() => {
                            const tx = latestCreatorTx.tx;
                            const deliveredAmount =
                              latestCreatorTx.meta?.delivered_amount ||
                              latestCreatorTx.meta?.DeliveredAmount;
                            const sentAmount = tx.SendMax || tx.Amount;

                            const isTokenToXrp =
                              tx.TransactionType === 'Payment' &&
                              tx.Account === tx.Destination &&
                              (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                              (() => {
                                if (!deliveredAmount || !sentAmount) return false;
                                const isReceivedXRP = typeof deliveredAmount === 'string';
                                const isSentToken =
                                  typeof sentAmount === 'object' &&
                                  sentAmount.currency &&
                                  sentAmount.currency !== 'XRP';
                                return isReceivedXRP && isSentToken;
                              })();

                            if (isTokenToXrp) {
                              const xrpAmount = parseInt(deliveredAmount) / 1000000;
                              return `${fNumber(xrpAmount)} XRP`;
                            }

                            const isXrpToToken =
                              tx.TransactionType === 'Payment' &&
                              tx.Account === tx.Destination &&
                              (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                              (() => {
                                if (!deliveredAmount || !sentAmount) return false;
                                const isSentXRP = typeof sentAmount === 'string';
                                const isReceivedToken =
                                  typeof deliveredAmount === 'object' &&
                                  deliveredAmount.currency &&
                                  deliveredAmount.currency !== 'XRP';
                                return isSentXRP && isReceivedToken;
                              })();

                            if (isXrpToToken) {
                              const xrpAmount = parseInt(sentAmount) / 1000000;
                              return `${fNumber(xrpAmount)} XRP`;
                            }

                            // Regular payment
                            if (tx.TransactionType === 'Payment') {
                              const isIncoming = tx.Destination === creator;
                              const deliveredAmount =
                                latestCreatorTx.meta?.delivered_amount ||
                                latestCreatorTx.meta?.DeliveredAmount;
                              const amountToShow = deliveredAmount || tx.Amount;

                              if (typeof amountToShow === 'string') {
                                const xrpAmount = parseInt(amountToShow) / 1000000;
                                return `${isIncoming ? '💰' : '📤'} ${fNumber(xrpAmount)} XRP`;
                              } else if (amountToShow && typeof amountToShow === 'object') {
                                // Token payment
                                const { parseAmount } = require('src/utils/parseUtils');
                                const { normalizeCurrencyCode } = require('src/utils/parseUtils');
                                const amount = parseAmount(amountToShow);
                                if (amount && typeof amount === 'object') {
                                  const currency =
                                    amount.currency === 'XRP'
                                      ? 'XRP'
                                      : normalizeCurrencyCode(amount.currency);
                                  return `${isIncoming ? '💰' : '📤'} ${fNumber(amount.value)} ${currency}`;
                                }
                              }
                            }

                            // Other transaction types
                            if (tx.TransactionType === 'OfferCreate') return '📊 Offer';
                            if (tx.TransactionType === 'TrustSet') return '🔗 Trust';
                            if (tx.TransactionType === 'NFTokenMint') return '🎨 NFT';

                            return '📊 Activity';
                          })()}
                        </Typography>
                      )}
                    </Stack>
                    {latestCreatorTx && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: (() => {
                            if (!latestCreatorTx.tx.date) return theme.palette.success.main;
                            const date = new Date((latestCreatorTx.tx.date + 946684800) * 1000);
                            const minutesAgo = (Date.now() - date) / 1000 / 60;
                            if (minutesAgo < 5) return theme.palette.success.main;
                            if (minutesAgo < 30) return theme.palette.warning.main;
                            return theme.palette.grey[500];
                          })(),
                          border: `1.5px solid ${theme.palette.background.paper}`,
                        }}
                      />
                    )}
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            {/* Token Image and Mobile Actions */}
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                flexShrink: 0
              }}
            >
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
                  width={isMobile ? 42 : 64}
                  height={isMobile ? 42 : 64}
                  priority={true}
                  unoptimized={true}
                  style={{
                    borderRadius: isMobile ? '10px' : '16px',
                    objectFit: 'cover',
                    border: `${isMobile ? '1px' : '2px'} solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    boxShadow: 'none',
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
                    borderRadius: '17px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    '&:hover': {
                      opacity: 1
                    }
                  }}
                >
                  <SearchIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
              </Box>

              {/* Google Lens Search - positioned top-left of the token image */}
              <Tooltip title="Search with Google Lens" placement="top">
                <IconButton
                  onClick={handleGoogleLensSearch}
                  size="small"
                  aria-label="Search with Google Lens"
                  sx={{
                    position: 'absolute',
                    top: -3,
                    left: -3,
                    background: '#4285f4',
                    borderRadius: '50%',
                    width: { xs: 18, sm: 20 },
                    height: { xs: 18, sm: 20 },
                    minWidth: { xs: 18, sm: 20 },
                    minHeight: { xs: 18, sm: 20 },
                    border: `1.5px solid ${theme.palette.background.paper}`,
                    boxShadow: 'none',
                    zIndex: 3,
                    '&:hover': {
                      boxShadow: 'none',
                      borderColor: '#4285f4'
                    },
                    '&:active': {
                    }
                  }}
                >
                  <SearchIcon
                    sx={{
                      fontSize: 14,
                      color: 'white',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Token Details */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              {/* Mobile: Stack everything vertically, Desktop: Row layout */}
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                justifyContent={{ xs: 'flex-start', md: 'space-between' }}
                sx={{ mb: { xs: 0.1, md: 0.25 }, gap: { xs: 0.1, md: 0.25 }, flex: 1 }}
              >
                {/* Left side: Name, price (mobile), user, origin */}
                <Stack
                  spacing={{ xs: 0.1, sm: 0.15 }}
                  justifyContent="center"
                  sx={{ minWidth: 0, flex: { xs: 'none', md: 1 } }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.3}
                    sx={{ flexWrap: 'wrap' }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        fontSize: { xs: '0.8rem', sm: '0.95rem', md: '1.15rem' },
                        fontWeight: 800,
                        color: theme.palette.text.primary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        letterSpacing: '-0.02em',
                        maxWidth: { xs: '140px', sm: '200px', md: 'none' },
                        lineHeight: 1
                      }}
                    >
                      {name}
                    </Typography>
                    {verified && (
                      <Tooltip title="Verified Token" placement="top">
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: { xs: 20, sm: 22 },
                            height: { xs: 20, sm: 22 },
                            borderRadius: '50%',
                            background: '#FFC107',
                            ml: 0.5,
                            flexShrink: 0
                          }}
                        >
                          <Typography sx={{ fontSize: { xs: 13, sm: 14 }, color: '#000', fontWeight: 600, lineHeight: 1, mt: '-1px' }}>
                            ✓
                          </Typography>
                        </Box>
                      </Tooltip>
                    )}
                    {id && (
                      <Tooltip title={`Rank #${id}`} placement="top">
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: { xs: 20, sm: 22 },
                            height: { xs: 20, sm: 22 },
                            px: { xs: 0.5, sm: 0.65 },
                            borderRadius: '10px',
                            background: alpha(theme.palette.primary.main, 0.08),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                            ml: 0.5,
                            flexShrink: 0
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: theme.palette.primary.main,
                              fontSize: { xs: '0.6rem', sm: '0.7rem' },
                              lineHeight: 1
                            }}
                          >
                            #{id}
                          </Typography>
                        </Box>
                      </Tooltip>
                    )}
                    {rating && (
                      <Rating
                        value={rating}
                        readOnly
                        size="small"
                        sx={{
                          fontSize: '13px',
                          '& .MuiRating-iconFilled': {
                            color: theme.palette.warning.main
                          }
                        }}
                      />
                    )}
                    {/* Mobile Price - Inline with name */}
                    <Typography
                      variant="body1"
                      sx={{
                        display: { xs: 'inline', md: 'none' },
                        fontSize: '14px',
                        fontWeight: 600,
                        color: priceColor || theme.palette.text.primary,
                        lineHeight: 1,
                        letterSpacing: '-0.01em',
                        ml: 1,
                        background: alpha(theme.palette.primary.main, 0.04),
                        px: 0.75,
                        py: 0.25,
                        borderRadius: '8px',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                      }}
                    >
                      {(() => {
                        const symbol = currencySymbols[activeFiatCurrency];
                        const rawPrice =
                          activeFiatCurrency === 'XRP' ? exch : (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) ? exch / (metrics[activeFiatCurrency] || metrics.CNY) : exch);

                        if (rawPrice && rawPrice < 0.001) {
                          const str = rawPrice.toFixed(15);
                          const zeros = str.match(/0\\.0*/)?.[0]?.length - 2 || 0;
                          if (zeros >= 4) {
                            const significant = str.replace(/^0\\.0+/, '').replace(/0+$/, '');
                            return (
                              <span>
                                {symbol}0.0<sub style={{ fontSize: '0.6em' }}>{zeros}</sub>
                                {significant.slice(0, 4)}
                              </span>
                            );
                          }
                        }
                        const exchRate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;
                        const price = activeFiatCurrency === 'XRP' ? exch : exch / exchRate;
                        return (
                          <span>
                            {symbol}{formatPrice(price)}
                          </span>
                        );
                      })()}
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={0.3}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.85rem' },
                        color: theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[700],
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                        lineHeight: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: { xs: '120px', sm: '160px', md: 'none' }
                      }}
                    >
                      {user || name}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {/* Origin */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: { xs: 0.6, sm: 0.8 },
                          px: { xs: 0.6, sm: 0.8 },
                          py: { xs: 0.02, sm: 0.2 },
                          borderRadius: { xs: '6px', sm: '10px' },
                          background: origin
                            ? alpha(theme.palette.background.paper, 0.9)
                            : alpha('#1976d2', 0.08),
                          border: `1px solid ${origin ? alpha(theme.palette.divider, 0.2) : alpha('#1976d2', 0.3)}`,
                        }}
                      >
                        <Box>
                          {getOriginIcon(origin || 'XRPL')}
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: origin ? theme.palette.text.primary : '#1976d2',
                            fontSize: { xs: '0.45rem', sm: '0.6rem' }
                          }}
                        >
                          {origin || 'XRPL'}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Action Buttons - Hide on mobile, show on desktop */}
                    <Stack
                      direction="row"
                      spacing={0.3}
                      sx={{ ml: 0.5, display: { xs: 'none', md: 'flex' } }}
                    >
                      <Tooltip title={`${isRemove ? 'Remove' : 'Set'} Trustline`}>
                        <IconButton
                          size="small"
                          aria-label={isRemove ? 'Remove trustline' : 'Set trustline'}
                          disabled={CURRENCY_ISSUERS?.XRP_MD5 === md5}
                          sx={{
                            width: 26,
                            height: 26,
                            borderRadius: '6px',
                            border: `1px solid ${isRemove ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.success.main, 0.2)}`,
                            background: isRemove
                              ? alpha(theme.palette.error.main, 0.08)
                              : alpha(theme.palette.success.main, 0.08),
                                  padding: '6px',
                            '&:hover': {
                                    background: isRemove
                                ? alpha(theme.palette.error.main, 0.15)
                                : alpha(theme.palette.success.main, 0.15),
                              boxShadow: 'none'
                            },
                            '& .MuiSvgIcon-root': {
                              fontSize: '16px',
                              color: isRemove
                                ? theme.palette.error.main
                                : theme.palette.success.main
                            }
                          }}
                          onClick={handleSetTrust}
                        >
                          {isRemove ? <LinkOffIcon /> : <LinkIcon />}
                        </IconButton>
                      </Tooltip>
                      <Box
                        sx={{
                          '& .MuiIconButton-root': {
                            width: '26px !important',
                            height: '26px !important',
                            minWidth: '26px !important',
                            minHeight: '26px !important',
                            padding: '6px !important',
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)} !important`,
                            '& .MuiSvgIcon-root': {
                              fontSize: '16px !important'
                            },
                            '&:hover': {
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)} !important`
                            }
                          }
                        }}
                      >
                        <Share token={token} />
                      </Box>
                      <Box
                        sx={{
                          '& .MuiIconButton-root': {
                            width: '26px !important',
                            height: '26px !important',
                            minWidth: '26px !important',
                            minHeight: '26px !important',
                            padding: '6px !important',
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)} !important`,
                            '& .MuiSvgIcon-root': {
                              fontSize: '16px !important'
                            },
                            '&:hover': {
                              border: `1px solid ${alpha(theme.palette.warning.main, 0.3)} !important`
                            }
                          }
                        }}
                      >
                        <Watch token={token} />
                      </Box>
                      {accountProfile?.admin && (
                        <Tooltip title="Admin Edit Token">
                          <IconButton
                            size="small"
                            aria-label="Edit token (admin)"
                            onClick={() => setEditToken(token)}
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '8px',
                              border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                              background: 'transparent',
                                      padding: '6px',
                              '&:hover': {
                                        background: alpha(theme.palette.warning.main, 0.08),
                                boxShadow: 'none'
                              },
                              '& .MuiSvgIcon-root': {
                                fontSize: '16px',
                                color: theme.palette.warning.main
                              }
                            }}
                          >
                            <AdminPanelSettingsIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {creator && (
                        <Tooltip title="View Creator Activity">
                          <IconButton
                            size="small"
                            aria-label="View creator activity"
                            onClick={onCreatorTxToggle}
                            sx={{
                              width: 'auto',
                              minWidth: 26,
                              height: 26,
                              borderRadius: '6px',
                              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                              background: (() => {
                                if (!latestCreatorTx)
                                  return alpha(theme.palette.background.paper, 0.5);
                                const tx = latestCreatorTx.tx;
                                const deliveredAmount =
                                  latestCreatorTx.meta?.delivered_amount ||
                                  latestCreatorTx.meta?.DeliveredAmount;
                                const sentAmount = tx.SendMax || tx.Amount;

                                const isTokenToXrp =
                                  tx.TransactionType === 'Payment' &&
                                  tx.Account === tx.Destination &&
                                  (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                  (() => {
                                    if (!deliveredAmount || !sentAmount) return false;
                                    const isReceivedXRP = typeof deliveredAmount === 'string';
                                    const isSentToken =
                                      typeof sentAmount === 'object' &&
                                      sentAmount.currency &&
                                      sentAmount.currency !== 'XRP';
                                    return isReceivedXRP && isSentToken;
                                  })();

                                const isXrpToToken =
                                  tx.TransactionType === 'Payment' &&
                                  tx.Account === tx.Destination &&
                                  (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                  (() => {
                                    if (!deliveredAmount || !sentAmount) return false;
                                    const isSentXRP = typeof sentAmount === 'string';
                                    const isReceivedToken =
                                      typeof deliveredAmount === 'object' &&
                                      deliveredAmount.currency &&
                                      deliveredAmount.currency !== 'XRP';
                                    return isSentXRP && isReceivedToken;
                                  })();

                                if (isTokenToXrp) return alpha('#ff6347', 0.08);
                                if (isXrpToToken) return alpha('#4169e1', 0.08);
                                return alpha(theme.palette.background.paper, 0.5);
                              })(),
                                      padding: '6px',
                              paddingRight: latestCreatorTx ? '10px' : '6px',
                              position: 'relative',
                              overflow: 'hidden',
                              '&:hover': {
                                        background: (() => {
                                  if (!latestCreatorTx)
                                    return alpha(theme.palette.primary.main, 0.08);
                                  const tx = latestCreatorTx.tx;
                                  const deliveredAmount =
                                    latestCreatorTx.meta?.delivered_amount ||
                                    latestCreatorTx.meta?.DeliveredAmount;
                                  const sentAmount = tx.SendMax || tx.Amount;

                                  const isTokenToXrp =
                                    tx.TransactionType === 'Payment' &&
                                    tx.Account === tx.Destination &&
                                    (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                    (() => {
                                      if (!deliveredAmount || !sentAmount) return false;
                                      const isReceivedXRP = typeof deliveredAmount === 'string';
                                      const isSentToken =
                                        typeof sentAmount === 'object' &&
                                        sentAmount.currency &&
                                        sentAmount.currency !== 'XRP';
                                      return isReceivedXRP && isSentToken;
                                    })();

                                  const isXrpToToken =
                                    tx.TransactionType === 'Payment' &&
                                    tx.Account === tx.Destination &&
                                    (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                    (() => {
                                      if (!deliveredAmount || !sentAmount) return false;
                                      const isSentXRP = typeof sentAmount === 'string';
                                      const isReceivedToken =
                                        typeof deliveredAmount === 'object' &&
                                        deliveredAmount.currency &&
                                        deliveredAmount.currency !== 'XRP';
                                      return isSentXRP && isReceivedToken;
                                    })();

                                  if (isTokenToXrp) return alpha('#ff6347', 0.12);
                                  if (isXrpToToken) return alpha('#4169e1', 0.12);
                                  return alpha(theme.palette.primary.main, 0.08);
                                })(),
                                boxShadow: 'none'
                              },
                              '& .MuiSvgIcon-root': {
                                fontSize: '16px',
                                color: alpha(theme.palette.text.primary, 0.7)
                              }
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              {!latestCreatorTx && <TimelineIcon />}
                              {latestCreatorTx && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: '12px',
                                    color: (() => {
                                      const tx = latestCreatorTx.tx;
                                      const deliveredAmount =
                                        latestCreatorTx.meta?.delivered_amount ||
                                        latestCreatorTx.meta?.DeliveredAmount;
                                      const sentAmount = tx.SendMax || tx.Amount;

                                      const isTokenToXrp =
                                        tx.TransactionType === 'Payment' &&
                                        tx.Account === tx.Destination &&
                                        (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                        (() => {
                                          if (!deliveredAmount || !sentAmount) return false;
                                          const isReceivedXRP = typeof deliveredAmount === 'string';
                                          const isSentToken =
                                            typeof sentAmount === 'object' &&
                                            sentAmount.currency &&
                                            sentAmount.currency !== 'XRP';
                                          return isReceivedXRP && isSentToken;
                                        })();

                                      const isXrpToToken =
                                        tx.TransactionType === 'Payment' &&
                                        tx.Account === tx.Destination &&
                                        (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                        (() => {
                                          if (!deliveredAmount || !sentAmount) return false;
                                          const isSentXRP = typeof sentAmount === 'string';
                                          const isReceivedToken =
                                            typeof deliveredAmount === 'object' &&
                                            deliveredAmount.currency &&
                                            deliveredAmount.currency !== 'XRP';
                                          return isSentXRP && isReceivedToken;
                                        })();

                                      if (isTokenToXrp) return '#ff6347';
                                      if (isXrpToToken) return '#4169e1';
                                      return theme.palette.text.primary;
                                    })(),
                                    fontWeight: 600,
                                    textShadow: (() => {
                                      const tx = latestCreatorTx.tx;
                                      const deliveredAmount =
                                        latestCreatorTx.meta?.delivered_amount ||
                                        latestCreatorTx.meta?.DeliveredAmount;
                                      const sentAmount = tx.SendMax || tx.Amount;

                                      const isTokenToXrp =
                                        tx.TransactionType === 'Payment' &&
                                        tx.Account === tx.Destination &&
                                        (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                        (() => {
                                          if (!deliveredAmount || !sentAmount) return false;
                                          const isReceivedXRP = typeof deliveredAmount === 'string';
                                          const isSentToken =
                                            typeof sentAmount === 'object' &&
                                            sentAmount.currency &&
                                            sentAmount.currency !== 'XRP';
                                          return isReceivedXRP && isSentToken;
                                        })();

                                      const isXrpToToken =
                                        tx.TransactionType === 'Payment' &&
                                        tx.Account === tx.Destination &&
                                        (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                        (() => {
                                          if (!deliveredAmount || !sentAmount) return false;
                                          const isSentXRP = typeof sentAmount === 'string';
                                          const isReceivedToken =
                                            typeof deliveredAmount === 'object' &&
                                            deliveredAmount.currency &&
                                            deliveredAmount.currency !== 'XRP';
                                          return isSentXRP && isReceivedToken;
                                        })();

                                      if (isTokenToXrp) return '0 0 3px rgba(255, 99, 71, 0.5)';
                                      if (isXrpToToken) return '0 0 3px rgba(65, 105, 225, 0.5)';
                                      return 'none';
                                    })()
                                  }}
                                >
                                  {(() => {
                                    const tx = latestCreatorTx.tx;
                                    const deliveredAmount =
                                      latestCreatorTx.meta?.delivered_amount ||
                                      latestCreatorTx.meta?.DeliveredAmount;
                                    const sentAmount = tx.SendMax || tx.Amount;

                                    const isTokenToXrp =
                                      tx.TransactionType === 'Payment' &&
                                      tx.Account === tx.Destination &&
                                      (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                      (() => {
                                        if (!deliveredAmount || !sentAmount) return false;
                                        const isReceivedXRP = typeof deliveredAmount === 'string';
                                        const isSentToken =
                                          typeof sentAmount === 'object' &&
                                          sentAmount.currency &&
                                          sentAmount.currency !== 'XRP';
                                        return isReceivedXRP && isSentToken;
                                      })();

                                    if (isTokenToXrp) {
                                      const xrpAmount = parseInt(deliveredAmount) / 1000000;
                                      return `🔥 ${fNumber(xrpAmount)} XRP`;
                                    }

                                    const isXrpToToken =
                                      tx.TransactionType === 'Payment' &&
                                      tx.Account === tx.Destination &&
                                      (tx.SendMax || (tx.Paths && tx.Paths.length > 0)) &&
                                      (() => {
                                        if (!deliveredAmount || !sentAmount) return false;
                                        const isSentXRP = typeof sentAmount === 'string';
                                        const isReceivedToken =
                                          typeof deliveredAmount === 'object' &&
                                          deliveredAmount.currency &&
                                          deliveredAmount.currency !== 'XRP';
                                        return isSentXRP && isReceivedToken;
                                      })();

                                    if (isXrpToToken) {
                                      const xrpAmount = parseInt(sentAmount) / 1000000;
                                      return `${fNumber(xrpAmount)} XRP`;
                                    }

                                    // Regular payment
                                    if (tx.TransactionType === 'Payment') {
                                      const isIncoming = tx.Destination === creator;
                                      const deliveredAmount =
                                        latestCreatorTx.meta?.delivered_amount ||
                                        latestCreatorTx.meta?.DeliveredAmount;
                                      const amountToShow = deliveredAmount || tx.Amount;

                                      if (typeof amountToShow === 'string') {
                                        const xrpAmount = parseInt(amountToShow) / 1000000;
                                        return `${isIncoming ? 'Received' : 'Sent'} ${fNumber(xrpAmount)} XRP`;
                                      } else if (amountToShow && typeof amountToShow === 'object') {
                                        // Token payment
                                        const { parseAmount } = require('src/utils/parseUtils');
                                        const {
                                          normalizeCurrencyCode
                                        } = require('src/utils/parseUtils');
                                        const Decimal = require('decimal.js-light');
                                        const amount = parseAmount(amountToShow);
                                        if (amount && typeof amount === 'object' && amount.value) {
                                          // Handle scientific notation
                                          let value = amount.value;
                                          if (typeof value === 'string' && value.includes('e')) {
                                            value = new Decimal(value).toString();
                                          }
                                          const currency =
                                            amount.currency === 'XRP'
                                              ? 'XRP'
                                              : normalizeCurrencyCode(amount.currency);
                                          return `${isIncoming ? 'Received' : 'Sent'} ${fNumber(value)} ${currency}`;
                                        }
                                      }
                                      // Fallback if parsing fails
                                      return isIncoming ? 'Received' : 'Sent';
                                    }

                                    // Other transaction types
                                    if (tx.TransactionType === 'OfferCreate') return 'Offer';
                                    if (tx.TransactionType === 'TrustSet') return 'Trust';
                                    if (tx.TransactionType === 'NFTokenMint') return 'NFT Mint';
                                    if (tx.TransactionType === 'AMMDeposit') return 'AMM +';
                                    if (tx.TransactionType === 'AMMWithdraw') return 'AMM -';

                                    return tx.TransactionType;
                                  })()}
                                </Typography>
                              )}
                            </Stack>
                            {latestCreatorTx && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: -2,
                                  right: -2,
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: (() => {
                                    if (!latestCreatorTx.tx.date) return theme.palette.success.main;
                                    const date = new Date(
                                      (latestCreatorTx.tx.date + 946684800) * 1000
                                    );
                                    const minutesAgo = (Date.now() - date) / 1000 / 60;
                                    if (minutesAgo < 5) return theme.palette.success.main;
                                    if (minutesAgo < 30) return theme.palette.warning.main;
                                    return theme.palette.grey[500];
                                  })(),
                                  border: `1.5px solid ${theme.palette.background.paper}`,
                                }}
                              />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Stack>
                </Stack>

                {/* Desktop Price and Percentages - Unified Display */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    flex: 1,
                    justifyContent: 'flex-start',
                    ml: 0
                  }}
                >
                  {/* Unified Price Display and 24h Range */}
                  <Stack direction="row" alignItems="center" spacing={2}>
                    {/* Price only - removed duplicate XRP exchange */}
                    <Box
                      sx={{
                        background: alpha(theme.palette.primary.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        borderRadius: '10px',
                        px: 2.5,
                        py: 1,
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: 'none'
                        }
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: '21px',
                          fontWeight: 800,
                          color: priceColor || theme.palette.primary.main,
                          lineHeight: 1,
                          letterSpacing: '-0.02em',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {(() => {
                          const symbol = currencySymbols[activeFiatCurrency];
                          const rawPrice =
                            activeFiatCurrency === 'XRP'
                              ? exch
                              : (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) ? exch / (metrics[activeFiatCurrency] || metrics.CNY) : exch);

                          // Check if price has many leading zeros
                          if (rawPrice && rawPrice < 0.001) {
                            const str = rawPrice.toFixed(15);
                            const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
                            if (zeros >= 4) {
                              // Use compact notation for 4+ zeros
                              const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
                              return (
                                <span>
                                  {symbol}0.0
                                  <sub
                                    style={{
                                      fontSize: '0.55em',
                                      verticalAlign: 'baseline',
                                      position: 'relative',
                                      top: '0.1em'
                                    }}
                                  >
                                    {zeros}
                                  </sub>
                                  {significant.slice(0, 4)}
                                </span>
                              );
                            }
                          }
                          const exchRate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;
                          const price = activeFiatCurrency === 'XRP' ? exch : exch / exchRate;
                          return (
                            <span>
                              {symbol}{formatPrice(price)}
                            </span>
                          );
                        })()}
                      </Typography>
                    </Box>

                    {/* 24h Range Bar - Desktop only */}
                    {range24h && (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                          display: { xs: 'none', md: 'flex' },
                          background: alpha(theme.palette.background.paper, 0.05),
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          borderRadius: '10px',
                          px: 2,
                          py: 1,
                          boxShadow: 'none',
                          height: '40px'
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '11px',
                              color: theme.palette.text.secondary,
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}
                          >
                            Low
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '11px',
                              color: theme.palette.success.main,
                              fontWeight: 600
                            }}
                          >
                            {currencySymbols[activeFiatCurrency]}
                            {formatValue(
                              activeFiatCurrency === 'XRP' ? range24h.min : range24h.min * (metrics.USD && metrics[activeFiatCurrency] ? metrics.USD / metrics[activeFiatCurrency] : 1)
                            )}
                          </Typography>
                        </Stack>

                        <Box
                          sx={{
                            minWidth: 60,
                            maxWidth: 80,
                            position: 'relative',
                            height: 16,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Box
                            sx={{
                              width: '100%',
                              height: 3,
                              background: alpha(theme.palette.divider, 0.2),
                              borderRadius: 1.5,
                              position: 'relative'
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                left: `${range24h.percent}%`,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: theme.palette.background.paper,
                                border: `1.5px solid ${theme.palette.primary.main}`,
                                boxShadow: 'none'
                              }}
                            />
                          </Box>
                        </Box>

                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '11px',
                              color: theme.palette.error.main,
                              fontWeight: 600
                            }}
                          >
                            {currencySymbols[activeFiatCurrency]}
                            {formatValue(
                              activeFiatCurrency === 'XRP' ? range24h.max : range24h.max * (metrics.USD && metrics[activeFiatCurrency] ? metrics.USD / metrics[activeFiatCurrency] : 1)
                            )}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '11px',
                              color: theme.palette.text.secondary,
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}
                          >
                            High
                          </Typography>
                        </Stack>
                      </Stack>
                    )}
                  </Stack>

                  {/* Right: Percentage changes - Bigger */}
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 1 }}>
                    {priceChanges.map((item, index) => (
                      <Box
                        key={item.label}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 1.2,
                          py: 0.6,
                          borderRadius: '10px',
                          background: alpha(item.color, 0.1),
                          border: `1.5px solid ${alpha(item.color, 0.2)}`,
                              '&:hover': {
                            background: alpha(item.color, 0.15),
                            boxShadow: 'none'
                          }
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: alpha(theme.palette.text.secondary, 0.8)
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '16px',
                            fontWeight: 800,
                            color: item.color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.3
                          }}
                        >
                          {formatPercentage(item.value)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          {/* 24h Range for mobile - Improved */}
          {range24h && (
            <Box
              sx={{
                display: { xs: 'block', md: 'none' },
                mx: { xs: -0.3, sm: 0 },
                py: 1,
                mb: 0.5,
                background: alpha(theme.palette.background.paper, 0.4),
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Stack spacing={0.75} sx={{ px: { xs: 0.3, sm: 0 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '13px',
                      fontWeight: 400,
                      color: theme.palette.text.secondary
                    }}
                  >
                    24H Low
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '12px', fontWeight: 600, color: theme.palette.success.main }}
                  >
                    {currencySymbols[activeFiatCurrency]}
                    {formatValue(activeFiatCurrency === 'XRP' ? range24h.min : range24h.min * (metrics.USD && metrics[activeFiatCurrency] ? metrics.USD / metrics[activeFiatCurrency] : 1))}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ fontSize: '12px', fontWeight: 600, color: theme.palette.text.primary }}
                  >
                    {Math.round(range24h.percent)}%
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '13px',
                      fontWeight: 400,
                      color: theme.palette.text.secondary
                    }}
                  >
                    24H High
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '12px', fontWeight: 600, color: theme.palette.error.main }}
                  >
                    {currencySymbols[activeFiatCurrency]}
                    {formatValue(activeFiatCurrency === 'XRP' ? range24h.max : range24h.max * (metrics.USD && metrics[activeFiatCurrency] ? metrics.USD / metrics[activeFiatCurrency] : 1))}
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    width: '100%',
                    height: 4,
                    borderRadius: 2,
                    background: alpha(theme.palette.divider, 0.15),
                    position: 'relative'
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${range24h.percent}%`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.background.paper,
                      border: `2px solid ${theme.palette.primary.main}`,
                      boxShadow: 'none'
                    }}
                  />
                </Box>
              </Stack>
            </Box>
          )}

          {/* Percentage Changes - Full width on mobile */}
          <Box
            sx={{
              mx: { xs: -0.3, sm: 0 },
              display: { xs: 'block', md: 'none' }
            }}
          >
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                width: '100%',
                px: { xs: 0.3, sm: 0 }
              }}
            >
              {priceChanges.map((item, index) => (
                <Box
                  key={item.label}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 0.75,
                    borderRadius: '6px',
                    background: alpha(item.color, 0.1),
                    border: `1px solid ${alpha(item.color, 0.2)}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: alpha(theme.palette.text.secondary, 0.7),
                      lineHeight: 1
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                      mt: 0.25
                    }}
                  >
                    {formatPercentage(item.value)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>

        {/* Metrics section - Full width on mobile */}
        <Box
          sx={{
            mx: { xs: -0.3, sm: 0 }, // Negative margin to break out of parent padding on mobile
            mt: { xs: 0.3, sm: 0.4 }
          }}
        >
          <Stack
            direction="row"
            sx={{
              width: '100%',
              px: { xs: 0.3, sm: 0 }
            }}
          >
            {metricsData.map((metric, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  p: { xs: 0.25, sm: 0.4 },
                  borderRadius: '6px',
                  background: alpha(metric.color, 0.04),
                  border: `1px solid ${alpha(metric.color, 0.15)}`,
                  textAlign: 'center',
                  mr: {
                    xs: index === metricsData.length - 1 ? 0 : 0.3,
                    sm: index === metricsData.length - 1 ? 0 : 0.75
                  },
                  '&:hover': {
                    boxShadow: 'none'
                  }
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: { xs: '0.55rem', sm: '0.7rem' },
                    color: alpha(theme.palette.text.secondary, 0.8),
                    display: 'block',
                    mb: { xs: 0.1, sm: 0.25 },
                    fontWeight: 400,
                    lineHeight: 1
                  }}
                >
                  {metric.title}
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontSize: { xs: '0.65rem', sm: '0.85rem' },
                    fontWeight: 600,
                    color: metric.color,
                    lineHeight: 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {metric.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Tags and Status - Full width on mobile */}
        {isExpired && (
          <Box
            sx={{
              mx: { xs: -0.3, sm: 0 },
              mt: { xs: 0.2, sm: 0.3 },
              px: { xs: 0.3, sm: 0 }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
              <Chip
                label="Expired"
                size="small"
                color="error"
                sx={{
                  fontSize: { xs: '0.45rem', sm: '0.5rem' },
                  height: { xs: '12px', sm: '14px' }
                }}
              />
            </Stack>
          </Box>
        )}

        {/* TrustSet Dialog */}
        {trustToken && (
          <TrustSetDialog
            balance={balance}
            limit={limit}
            token={trustToken}
            setToken={setTrustToken}
          />
        )}

        {/* Edit Token Dialog */}
        {editToken && <EditTokenDialog token={editToken} setToken={setEditToken} />}
      </Box>
    );
  }
);

TokenSummary.displayName = 'TokenSummary';

export default TokenSummary;
