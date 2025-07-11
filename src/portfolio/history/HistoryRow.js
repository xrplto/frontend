import { Chip, Stack, Typography, IconButton, Box, SvgIcon, Tooltip, Avatar } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTheme, TableCell, TableRow } from '@mui/material';
import EastIcon from '@mui/icons-material/East';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Icon } from '@iconify/react';
import chartLineUp from '@iconify/icons-ph/chart-line-up';
import numeral from 'numeral';
import { alpha } from '@mui/material/styles';
import { getTokenImageUrl } from 'src/utils/constants';

// XPMarket icon component
const XPMarketIcon = (props) => {
  // Filter out non-DOM props that might cause warnings
  const { darkMode, ...otherProps } = props;

  return (
    <SvgIcon {...otherProps} viewBox="0 0 32 32">
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
};

// Source tag mapping configuration
const SOURCE_TAGS = {
  74920348: {
    label: 'FirstLedger',
    color: '#0C53B7', // Blue
    icon: <OpenInNewIcon sx={{ fontSize: '0.875rem' }} />
  },
  10011010: {
    label: 'Magnetic X',
    color: '#8b5cf6', // Purple
    icon: (
      <Box
        component="img"
        src="/magneticx-logo.webp"
        alt="Magnetic X"
        sx={{
          width: '18px',
          height: '18px',
          objectFit: 'contain',
          filter:
            'brightness(0) saturate(100%) invert(46%) sepia(85%) saturate(1926%) hue-rotate(240deg) brightness(99%) contrast(96%)'
        }}
      />
    )
  },
  20221212: {
    label: 'XPMarket',
    color: '#6D1FEE', // Purple
    icon: <XPMarketIcon sx={{ fontSize: '0.875rem' }} />
  },
  110100111: {
    label: 'Sologenic',
    color: '#B72136', // Red
    icon: (
      <Icon
        icon={chartLineUp}
        style={{
          fontSize: '0.875rem',
          background: 'transparent'
        }}
      />
    )
  }
};

const HistoryRow = (props) => {
  const {
    TransactionType,
    Amount,
    Amount2,
    Asset,
    Asset2,
    TransactionResult,
    DeliveredAmount,
    SendMax,
    hash,
    date,
    source,
    offerType,
    LimitAmount
  } = props;

  const theme = useTheme();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  const rippleEpochTimeStamp = +date + 946684800;
  const rippleEpoch = new Date(rippleEpochTimeStamp * 1000);

  const month = monthNames[rippleEpoch.getMonth()];
  const day = rippleEpoch.getDate();
  const hours = ('0' + rippleEpoch.getHours()).slice(-2); // Add leading zero and take last two characters
  const minutes = ('0' + rippleEpoch.getMinutes()).slice(-2); // Add leading zero and take last two characters
  const seconds = ('0' + rippleEpoch.getSeconds()).slice(-2); // Add leading zero and take last two characters;

  const formattedDate = month + ' ' + day + ', ' + hours + ':' + minutes + ':' + seconds;

  const handleViewClick = () => {
    window.open(`/tx/${hash}`, '_blank');
  };

  const hexToText = (hex) => {
    let text = '';
    for (let i = 0; i < hex.length; i += 2) {
      text += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return text;
  };
  const convertDemurrageToUTF8 = (demurrageCode) => {
    const bytes = Buffer.from(demurrageCode, 'hex');
    const code =
      String.fromCharCode(bytes[1]) + String.fromCharCode(bytes[2]) + String.fromCharCode(bytes[3]);
    const interest_start = (bytes[4] << 24) + (bytes[5] << 16) + (bytes[6] << 8) + bytes[7];
    const interest_period = bytes.readDoubleBE(8);
    const year_seconds = 31536000; // By convention, the XRP Ledger's interest/demurrage rules use a fixed number of seconds per year (31536000), which is not adjusted for leap days or leap seconds
    const interest_after_year =
      Math.E ** ((interest_start + year_seconds - interest_start) / interest_period);
    const interest = interest_after_year * 100 - 100;

    return `${code} (${interest}% pa)`;
  };
  const normalizeCurrencyCode = (currencyCode) => {
    if (currencyCode === 'XRP') return 'XRP';

    if (currencyCode?.length === 3 && currencyCode.trim().toLowerCase() !== 'xrp') {
      // "Standard" currency code
      return currencyCode.trim();
    }

    if (currencyCode.match(/^[a-fA-F0-9]{40}$/) && !isNaN(parseInt(currencyCode, 16))) {
      // Hexadecimal currency code
      const hex = currencyCode.toString().replace(/(00)+$/g, '');
      if (hex.startsWith('01')) {
        // Old demurrage code. https://xrpl.org/demurrage.html
        return convertDemurrageToUTF8(currencyCode);
      }
      if (hex.startsWith('02')) {
        // XLS-16d NFT Metadata using XLS-15d Concise Transaction Identifier
        // https://github.com/XRPLF/XRPL-Standards/discussions/37
        const xlf15dBuffer = Buffer.from(hex, 'hex').subarray(8);
        const decoder = new TextDecoder('utf-8');
        const xlf15d = decoder.decode(xlf15dBuffer).trim();
        if (xlf15d.match(/[a-zA-Z0-9]{3,}/) && xlf15d.toLowerCase() !== 'xrp') {
          return xlf15d;
        }
      }
      return hexToText(hex);
    }
    return '';
  };

  const getFormat = (value) => {
    const valueString = value.toString();
    const valueParts = valueString.split('.');
    const valueBeforeDot = numeral(valueParts[0]).format('0,0');
    const valueAfterDot = valueParts[1]?.substring(0, 6) || '';
    return {
      valueBeforeDot,
      valueAfterDot
    };
  };

  const [assetName, setAssetName] = useState('');
  const [assetValue, setAssetValue] = useState({
    valueBeforeDot: '',
    valueAfterDot: ''
  });
  const [assetColor1, setAssetColor1] = useState('');
  const [assetName2, setAssetName2] = useState('');
  const [assetValue2, setAssetValue2] = useState({
    valueBeforeDot: '',
    valueAfterDot: ''
  });
  const [assetColor2, setAssetColor2] = useState('');
  const [tokenImageUrl, setTokenImageUrl] = useState('');
  const [tokenImageUrl2, setTokenImageUrl2] = useState('');

  useEffect(() => {
    if (TransactionType === 'AMMDeposit') {
      if (Amount?.currency && Amount?.value) {
        setAssetName(normalizeCurrencyCode(Amount.currency));
        setAssetValue(getFormat(Number(Amount.value)));
        // Generate token image URL
        if (Amount.issuer) {
          setTokenImageUrl(getTokenImageUrl(Amount.issuer, Amount.currency));
        }
      } else {
        setAssetName('XRP');
        setAssetValue(getFormat(Number(Amount) / 1000000));
        setTokenImageUrl(getTokenImageUrl('', 'XRP'));
      }

      if (Amount2?.currency && Amount2?.value) {
        setAssetName2(normalizeCurrencyCode(Amount2.currency));
        setAssetValue2(getFormat(Number(Amount2.value)));
        // Generate token image URL
        if (Amount2.issuer) {
          setTokenImageUrl2(getTokenImageUrl(Amount2.issuer, Amount2.currency));
        }
      } else {
        setAssetName2('XRP');
        setAssetValue2(getFormat(Number(Amount2) / 1000000));
        setTokenImageUrl2(getTokenImageUrl('', 'XRP'));
      }
    }

    if (TransactionType === 'AMMWithdraw') {
      if (Asset.currency) {
        setAssetName(normalizeCurrencyCode(Asset.currency));
        // Generate token image URL
        if (Asset.issuer) {
          setTokenImageUrl(getTokenImageUrl(Asset.issuer, Asset.currency));
        } else if (Asset.currency === 'XRP') {
          setTokenImageUrl(getTokenImageUrl('', 'XRP'));
        }
      }
      if (Asset2.currency) {
        setAssetName2(normalizeCurrencyCode(Asset2.currency));
        // Generate token image URL
        if (Asset2.issuer) {
          setTokenImageUrl2(getTokenImageUrl(Asset2.issuer, Asset2.currency));
        } else if (Asset2.currency === 'XRP') {
          setTokenImageUrl2(getTokenImageUrl('', 'XRP'));
        }
      }

      if (Amount?.value) {
        setAssetValue(getFormat(Number(Amount.value)));
      } else {
        setAssetValue(getFormat(Number(Amount) / 1000000));
      }
      if (Amount2?.value) {
        setAssetValue2(getFormat(Number(Amount2.value)));
      } else {
        setAssetValue2(getFormat(Number(Amount2) / 1000000));
      }
    }

    if (TransactionType === 'Payment') {
      if (SendMax.currency && SendMax.value) {
        setAssetName(normalizeCurrencyCode(SendMax.currency));
        setAssetValue(getFormat(Number(SendMax.value)));
        if (SendMax.currency === 'MAG') setAssetColor1('#3b82f6');
        else if (typeof Amount === 'string') setAssetColor1('#de0f3e');
        else setAssetColor1('#009b0a');
        // Generate token image URL
        if (SendMax.issuer) {
          setTokenImageUrl(getTokenImageUrl(SendMax.issuer, SendMax.currency));
        }
      } else {
        setAssetName('XRP');
        setAssetColor1('#3b82f6');
        setAssetValue(getFormat(Number(SendMax) / 1000000));
        setTokenImageUrl(getTokenImageUrl('', 'XRP'));
      }

      if (DeliveredAmount.currency && DeliveredAmount.value) {
        setAssetName2(normalizeCurrencyCode(DeliveredAmount.currency));
        setAssetValue2(getFormat(Number(DeliveredAmount.value)));
        if (DeliveredAmount.currency === 'XRP' || DeliveredAmount.currency === 'MAG')
          setAssetColor2('#3b82f6');
        else if (typeof Amount === 'string') setAssetColor2('#de0f3e');
        else setAssetColor2('#009b0a');
        // Generate token image URL
        if (DeliveredAmount.issuer) {
          setTokenImageUrl2(getTokenImageUrl(DeliveredAmount.issuer, DeliveredAmount.currency));
        }
      } else {
        setAssetName2('XRP');
        setAssetColor2('#3b82f6');
        setAssetValue2(getFormat(Number(DeliveredAmount) / 1000000));
        setTokenImageUrl2(getTokenImageUrl('', 'XRP'));
      }
    }

    if (TransactionType === 'TrustSet') {
      // Extract currency from LimitAmount
      if (LimitAmount?.currency && LimitAmount?.issuer) {
        const decodedCurrency = normalizeCurrencyCode(LimitAmount.currency);
        setAssetName(decodedCurrency);
        setAssetColor1('#0C53B7');

        // Generate token image URL using issuer and currency
        const imageUrl = getTokenImageUrl(LimitAmount.issuer, LimitAmount.currency);
        setTokenImageUrl(imageUrl);

        // Set limit value if available
        if (LimitAmount.value) {
          setAssetValue(getFormat(Number(LimitAmount.value)));
        } else {
          setAssetValue({
            valueBeforeDot: '∞',
            valueAfterDot: ''
          });
        }
      } else {
        setAssetName('Unknown');
        setAssetColor1('#0C53B7');
        setTokenImageUrl('');
        setAssetValue({
          valueBeforeDot: '∞',
          valueAfterDot: ''
        });
      }
    }

    if (TransactionType === 'OfferCreate') {
      if (SendMax?.currency && SendMax?.value) {
        setAssetName(normalizeCurrencyCode(SendMax.currency));
        setAssetValue(getFormat(Number(SendMax.value)));
        // Generate token image URL
        if (SendMax.issuer) {
          setTokenImageUrl(getTokenImageUrl(SendMax.issuer, SendMax.currency));
        }
      } else if (SendMax) {
        setAssetName('XRP');
        setAssetValue(getFormat(Number(SendMax) / 1000000));
        setTokenImageUrl(getTokenImageUrl('', 'XRP'));
      }

      if (Amount?.currency && Amount?.value) {
        setAssetName2(normalizeCurrencyCode(Amount.currency));
        setAssetValue2(getFormat(Number(Amount.value)));
        // Generate token image URL
        if (Amount.issuer) {
          setTokenImageUrl2(getTokenImageUrl(Amount.issuer, Amount.currency));
        }
      } else if (Amount) {
        setAssetName2('XRP');
        setAssetValue2(getFormat(Number(Amount) / 1000000));
        setTokenImageUrl2(getTokenImageUrl('', 'XRP'));
      }
    }
  }, [TransactionType, LimitAmount]);

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const timeDiff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return `${seconds}s ago`;
    }
  };

  return (
    <TableRow
      sx={{
        '& .MuiTableCell-root': {
          py: 1,
          px: 1.5,
          height: '48px',
          whiteSpace: 'nowrap',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
        },
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
          '& .action-button': {
            opacity: 1
          }
        },
        transition: 'background-color 0.2s ease'
      }}
    >
      <TableCell sx={{ color: theme.palette.text.primary, minWidth: '140px' }}>
        <Stack direction="row" spacing={0.25} alignItems="center">
          {TransactionType === 'Payment' &&
            (typeof Amount !== 'string' ? (
              <Chip
                color="success"
                label="Buy"
                size="small"
                sx={{
                  height: '24px',
                  backgroundColor: alpha('#00AB55', 0.12),
                  color: '#00AB55',
                  fontWeight: 600,
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    letterSpacing: '0.02em'
                  }
                }}
              />
            ) : (
              <Chip
                color="error"
                label="Sell"
                size="small"
                sx={{
                  height: '24px',
                  backgroundColor: alpha('#B72136', 0.12),
                  color: '#B72136',
                  fontWeight: 600,
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    letterSpacing: '0.02em'
                  }
                }}
              />
            ))}
          {TransactionType === 'AMMDeposit' && (
            <Chip
              color="secondaryOrigin"
              label="Add"
              size="small"
              sx={{
                height: '24px',
                backgroundColor: alpha('#6D1FEE', 0.12),
                color: '#6D1FEE',
                fontWeight: 600,
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: '0.75rem',
                  lineHeight: 1.2,
                  letterSpacing: '0.02em'
                }
              }}
            />
          )}
          {TransactionType === 'AMMWithdraw' && (
            <Chip
              color="warning"
              label="Remove"
              size="small"
              sx={{
                height: '24px',
                backgroundColor: alpha('#FFA000', 0.12),
                color: '#FFA000',
                fontWeight: 600,
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: '0.75rem',
                  lineHeight: 1.2,
                  letterSpacing: '0.02em'
                }
              }}
            />
          )}
          {TransactionType === 'TrustSet' && (
            <Chip
              color="info"
              label="Trust"
              size="small"
              sx={{
                height: '24px',
                backgroundColor: alpha('#0C53B7', 0.12),
                color: '#0C53B7',
                fontWeight: 600,
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: '0.75rem',
                  lineHeight: 1.2,
                  letterSpacing: '0.02em'
                }
              }}
            />
          )}
          {TransactionType === 'OfferCreate' && (
            <>
              {offerType === 'buy' && (
                <Chip
                  color="success"
                  label="Buy"
                  size="small"
                  sx={{
                    height: '24px',
                    backgroundColor: alpha('#00AB55', 0.12),
                    color: '#00AB55',
                    fontWeight: 600,
                    '& .MuiChip-label': {
                      px: 1,
                      fontSize: '0.75rem',
                      lineHeight: 1.2,
                      letterSpacing: '0.02em'
                    }
                  }}
                />
              )}
              {offerType === 'sell' && (
                <Chip
                  color="error"
                  label="Sell"
                  size="small"
                  sx={{
                    height: '24px',
                    backgroundColor: alpha('#B72136', 0.12),
                    color: '#B72136',
                    fontWeight: 600,
                    '& .MuiChip-label': {
                      px: 1,
                      fontSize: '0.75rem',
                      lineHeight: 1.2,
                      letterSpacing: '0.02em'
                    }
                  }}
                />
              )}
              {offerType === 'trade' && (
                <Chip
                  color="info"
                  label="Trade"
                  size="small"
                  sx={{
                    height: '24px',
                    backgroundColor: alpha('#8B5CF6', 0.12),
                    color: '#8B5CF6',
                    fontWeight: 600,
                    '& .MuiChip-label': {
                      px: 1,
                      fontSize: '0.75rem',
                      lineHeight: 1.2,
                      letterSpacing: '0.02em'
                    }
                  }}
                />
              )}
              {!offerType && (
                <Chip
                  color="info"
                  label="Offer"
                  size="small"
                  sx={{
                    height: '24px',
                    backgroundColor: alpha('#8B5CF6', 0.12),
                    color: '#8B5CF6',
                    fontWeight: 600,
                    '& .MuiChip-label': {
                      px: 1,
                      fontSize: '0.75rem',
                      lineHeight: 1.2,
                      letterSpacing: '0.02em'
                    }
                  }}
                />
              )}
            </>
          )}
          {TransactionType === 'OfferCancel' && (
            <Chip
              color="error"
              label="Cancel"
              size="small"
              sx={{
                height: '24px',
                backgroundColor: alpha('#B72136', 0.12),
                color: '#B72136',
                fontWeight: 600,
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: '0.75rem',
                  lineHeight: 1.2,
                  letterSpacing: '0.02em'
                }
              }}
            />
          )}
        </Stack>
      </TableCell>
      <TableCell sx={{ color: theme.palette.text.primary, width: '90px' }}>
        <Typography sx={{ fontSize: '0.813rem', color: alpha(theme.palette.text.primary, 0.6), fontWeight: 500 }}>
          {getRelativeTime(rippleEpoch)}
        </Typography>
      </TableCell>
      <TableCell sx={{ color: theme.palette.text.primary }}>
        {TransactionType === 'AMMDeposit' && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ typography: 'body2' }}>
            <Stack direction="row" alignItems="baseline" spacing={0}>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{assetValue.valueBeforeDot}</Typography>
              {assetValue.valueAfterDot !== '' && (
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: alpha(theme.palette.text.primary, 0.7) }}>.{assetValue.valueAfterDot}</Typography>
              )}
            </Stack>
            {tokenImageUrl && (
              <Avatar src={tokenImageUrl} sx={{ width: 20, height: 20, mr: 0.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }} alt={assetName} />
            )}
            <Typography sx={{ color: theme.palette.primary.main, fontSize: '0.813rem', fontWeight: 500 }}>
              {assetName}
            </Typography>
            <Typography sx={{ color: alpha(theme.palette.text.primary, 0.4), fontSize: '0.813rem', mx: 0.5 }}>
              /
            </Typography>
            <Stack direction="row" alignItems="baseline" spacing={0}>
              <Typography sx={{ fontSize: '0.75rem' }}>{assetValue2.valueBeforeDot}</Typography>
              {assetValue2.valueAfterDot !== '' && (
                <Typography sx={{ fontSize: '0.75rem' }}>.{assetValue2.valueAfterDot}</Typography>
              )}
            </Stack>
            {tokenImageUrl2 && (
              <Avatar
                src={tokenImageUrl2}
                sx={{ width: 20, height: 20, mr: 0.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}
                alt={assetName2}
              />
            )}
            <Typography sx={{ color: theme.palette.primary.main, fontSize: '0.813rem', fontWeight: 500 }}>
              {assetName2}
            </Typography>
          </Stack>
        )}
        {TransactionType === 'AMMWithdraw' && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ typography: 'body2' }}>
            {assetValue.valueAfterDot === '' && assetValue2.valueAfterDot === '' ? (
              <Stack direction="row" spacing={0.25}>
                {tokenImageUrl && (
                  <Avatar
                    src={tokenImageUrl}
                    sx={{ width: 20, height: 20, mr: 0.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}
                    alt={assetName}
                  />
                )}
                <Typography sx={{ color: theme.palette.primary.main, fontSize: '0.75rem' }}>
                  {assetName}
                </Typography>
                <Typography
                  sx={{ color: alpha(theme.palette.text.primary, 0.5), fontSize: '0.75rem' }}
                >
                  /
                </Typography>
                {tokenImageUrl2 && (
                  <Avatar
                    src={tokenImageUrl2}
                    sx={{ width: 20, height: 20, mr: 0.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}
                    alt={assetName2}
                  />
                )}
                <Typography sx={{ color: theme.palette.primary.main, fontSize: '0.75rem' }}>
                  {assetName2}
                </Typography>
              </Stack>
            ) : (
              <Stack direction="row" spacing={0.25}>
                <Stack direction="row" alignItems="baseline" spacing={0}>
                  <Typography sx={{ fontSize: '0.75rem' }}>{assetValue.valueBeforeDot}</Typography>
                  {assetValue.valueAfterDot !== '' && (
                    <Typography sx={{ fontSize: '0.75rem' }}>
                      .{assetValue.valueAfterDot}
                    </Typography>
                  )}
                </Stack>
                {tokenImageUrl && (
                  <Avatar
                    src={tokenImageUrl}
                    sx={{ width: 20, height: 20, mr: 0.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}
                    alt={assetName}
                  />
                )}
                <Typography sx={{ color: theme.palette.primary.main, fontSize: '0.75rem' }}>
                  {assetName}
                </Typography>
                <Typography
                  sx={{ color: alpha(theme.palette.text.primary, 0.5), fontSize: '0.75rem' }}
                >
                  /
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={0}>
                  <Typography sx={{ fontSize: '0.75rem' }}>{assetValue2.valueBeforeDot}</Typography>
                  {assetValue2.valueAfterDot !== '' && (
                    <Typography sx={{ fontSize: '0.75rem' }}>
                      .{assetValue2.valueAfterDot}
                    </Typography>
                  )}
                </Stack>
                {tokenImageUrl2 && (
                  <Avatar
                    src={tokenImageUrl2}
                    sx={{ width: 20, height: 20, mr: 0.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}
                    alt={assetName2}
                  />
                )}
                <Typography sx={{ color: theme.palette.primary.main, fontSize: '0.75rem' }}>
                  {assetName2}
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
        {TransactionType === 'Payment' && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ typography: 'body2' }}>
            <Stack direction="row" alignItems="baseline" spacing={0}>
              <Typography sx={{ fontSize: '0.75rem' }}>{assetValue.valueBeforeDot}</Typography>
              {assetValue.valueAfterDot && (
                <Typography sx={{ fontSize: '0.75rem' }}>.{assetValue.valueAfterDot}</Typography>
              )}
            </Stack>
            {tokenImageUrl && (
              <Avatar src={tokenImageUrl} sx={{ width: 20, height: 20, mr: 0.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }} alt={assetName} />
            )}
            <Typography sx={{ color: theme.palette.primary.main, fontSize: '0.813rem', fontWeight: 500 }}>
              {assetName}
            </Typography>
            <EastIcon sx={{ color: alpha(theme.palette.text.primary, 0.4), fontSize: '1.125rem', mx: 0.75 }} />
            <Stack direction="row" alignItems="baseline" spacing={0}>
              <Typography sx={{ fontSize: '0.75rem' }}>{assetValue2.valueBeforeDot}</Typography>
              {assetValue2.valueAfterDot && (
                <Typography sx={{ fontSize: '0.75rem' }}>.{assetValue2.valueAfterDot}</Typography>
              )}
            </Stack>
            {tokenImageUrl2 && (
              <Avatar
                src={tokenImageUrl2}
                sx={{ width: 20, height: 20, mr: 0.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}
                alt={assetName2}
              />
            )}
            <Typography sx={{ color: theme.palette.primary.main, fontSize: '0.813rem', fontWeight: 500 }}>
              {assetName2}
            </Typography>
          </Stack>
        )}
        {TransactionType === 'TrustSet' && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ typography: 'body2' }}>
            <Typography sx={{ fontSize: '0.813rem', color: '#0C53B7', fontWeight: 500 }}>Trustline for</Typography>
            <Stack direction="row" alignItems="baseline" spacing={0}>
              <Typography sx={{ fontSize: '0.75rem' }}>{assetValue.valueBeforeDot}</Typography>
              {assetValue.valueAfterDot && (
                <Typography sx={{ fontSize: '0.75rem' }}>.{assetValue.valueAfterDot}</Typography>
              )}
            </Stack>
            {tokenImageUrl && (
              <Avatar src={tokenImageUrl} sx={{ width: 20, height: 20, mr: 0.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }} alt={assetName} />
            )}
            <Typography sx={{ color: theme.palette.primary.main, fontSize: '0.813rem', fontWeight: 500 }}>
              {assetName}
            </Typography>
          </Stack>
        )}
        {TransactionType === 'OfferCreate' && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ typography: 'body2' }}>
            <Stack direction="row" alignItems="baseline" spacing={0}>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{assetValue.valueBeforeDot}</Typography>
              {assetValue.valueAfterDot !== '' && (
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: alpha(theme.palette.text.primary, 0.7) }}>.{assetValue.valueAfterDot}</Typography>
              )}
            </Stack>
            {tokenImageUrl && (
              <Avatar src={tokenImageUrl} sx={{ width: 20, height: 20, mr: 0.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }} alt={assetName} />
            )}
            <Typography sx={{ color: theme.palette.primary.main, fontSize: '0.813rem', fontWeight: 500 }}>
              {assetName}
            </Typography>
            <EastIcon sx={{ color: alpha(theme.palette.text.primary, 0.4), fontSize: '1.125rem', mx: 0.75 }} />
            <Stack direction="row" alignItems="baseline" spacing={0}>
              <Typography sx={{ fontSize: '0.75rem' }}>{assetValue2.valueBeforeDot}</Typography>
              {assetValue2.valueAfterDot !== '' && (
                <Typography sx={{ fontSize: '0.75rem' }}>.{assetValue2.valueAfterDot}</Typography>
              )}
            </Stack>
            {tokenImageUrl2 && (
              <Avatar
                src={tokenImageUrl2}
                sx={{ width: 20, height: 20, mr: 0.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}
                alt={assetName2}
              />
            )}
            <Typography sx={{ color: theme.palette.primary.main, fontSize: '0.813rem', fontWeight: 500 }}>
              {assetName2}
            </Typography>
          </Stack>
        )}
        {TransactionType === 'OfferCancel' && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ typography: 'body2' }}>
            <Typography sx={{ fontSize: '0.813rem', color: '#B72136', fontWeight: 500 }}>Offer Cancelled</Typography>
          </Stack>
        )}
      </TableCell>
      <TableCell sx={{ color: theme.palette.text.primary }}>
        {source && (
          <Tooltip
            title={props.sourceTooltip}
            arrow
            placement="top"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: theme.palette.mode === 'dark' ? 'black' : 'white',
                  color: theme.palette.mode === 'dark' ? 'white' : 'black',
                  border: `1px solid ${
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(0, 0, 0, 0.2)'
                  }`,
                  '& .MuiTooltip-arrow': {
                    color: theme.palette.mode === 'dark' ? 'black' : 'white',
                    '&:before': {
                      border: `1px solid ${
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'rgba(0, 0, 0, 0.2)'
                      }`
                    }
                  },
                  boxShadow: theme.shadows[1],
                  fontSize: '0.75rem',
                  padding: '8px 12px',
                  maxWidth: 300
                }
              }
            }}
          >
            <Chip
              size="small"
              icon={
                SOURCE_TAGS[
                  Object.keys(SOURCE_TAGS).find((key) => SOURCE_TAGS[key].label === source)
                ]?.icon
              }
              label={source}
              sx={{
                height: '24px',
                backgroundColor: alpha(
                  SOURCE_TAGS[
                    Object.keys(SOURCE_TAGS).find((key) => SOURCE_TAGS[key].label === source)
                  ]?.color || theme.palette.primary.main,
                  0.12
                ),
                color:
                  SOURCE_TAGS[
                    Object.keys(SOURCE_TAGS).find((key) => SOURCE_TAGS[key].label === source)
                  ]?.color || theme.palette.primary.main,
                borderRadius: '6px',
                fontWeight: 600,
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: '0.75rem',
                  lineHeight: 1.2,
                  letterSpacing: '0.02em'
                },
                '& .MuiChip-icon': {
                  color: 'inherit',
                  marginLeft: '6px',
                  marginRight: '-2px',
                  fontSize: '0.875rem'
                }
              }}
            />
          </Tooltip>
        )}
      </TableCell>
      <TableCell sx={{ width: '40px', p: 0.5 }}>
        <IconButton
          size="small"
          onClick={handleViewClick}
          className="action-button"
          sx={{
            p: 0.5,
            width: '28px',
            height: '28px',
            color: theme.palette.primary.main,
            opacity: 0.7,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              opacity: 1,
              transform: 'scale(1.1)'
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1rem'
            }
          }}
        >
          <OpenInNewIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default HistoryRow;
