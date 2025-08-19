import {
  useTheme,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Box,
  alpha,
  TablePagination,
  useMediaQuery,
  IconButton,
  Select,
  MenuItem,
  Chip,
  SvgIcon,
  Tooltip,
  Avatar
} from '@mui/material';
import { Client } from 'xrpl';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from 'src/AppContext';
import { PulseLoader } from 'react-spinners';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import EastIcon from '@mui/icons-material/East';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Icon } from '@iconify/react';
import chartLineUp from '@iconify/icons-ph/chart-line-up';
import numeral from 'numeral';
import { getTokenImageUrl } from 'src/utils/constants';

const rippleServerUrl = process.env.NEXT_PUBLIC_RIPPLED_LIVE_DATA_ONLY_URL;
const client = new Client(rippleServerUrl);

const DeFiHistory = ({ account }) => {
  const theme = useTheme();
  const { darkMode } = useContext(AppContext);
  const [activityHistory, setActivityHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    accountHistory();
  }, [account]);

  const accountHistory = async () => {
    if (account === undefined) return;
    setLoading(true);
    try {
      await client.connect();
      const transaction = {
        command: 'account_tx',
        account: account,
        ledger_index_min: -1,
        ledger_index_max: -1,
        binary: false,
        // limit: 5,
        forward: false
      };
      const response = await client.request(transaction);
      console.log('Full API Response:', JSON.stringify(response, null, 2));
      console.log('All Transactions:', JSON.stringify(response.result.transactions, null, 2));
      const totalTransactions = response.result.transactions;
      const filteredTransactions = totalTransactions.filter((item) => {
        const transactionType = item.tx.TransactionType;
        const account = item.tx.Account;
        const destination = item.tx.Destination;
        const deliveredAmount = item.meta.delivered_amount;
        return (
          (transactionType === 'Payment' &&
            account === destination &&
            deliveredAmount !== undefined) ||
          transactionType === 'AMMDeposit' ||
          transactionType === 'AMMWithdraw' ||
          transactionType === 'TrustSet' ||
          transactionType === 'OfferCreate' ||
          transactionType === 'OfferCancel'
        );
      });
      const updatedArray = filteredTransactions.map((item) => {
        // Check SourceTag in tx object
        const sourceTag = item.tx.SourceTag;
        console.log('Processing transaction:', {
          type: item.tx.TransactionType,
          hash: item.tx.hash,
          sourceTag: sourceTag,
          fullTx: item.tx
        });

        // Determine source label based on SourceTag
        let sourceLabel;
        if (sourceTag === 74920348) {
          sourceLabel = 'FirstLedger';
        } else if (sourceTag === 10011010) {
          sourceLabel = 'Magnetic X';
        } else if (sourceTag === 20221212) {
          sourceLabel = 'XPMarket';
        } else if (sourceTag === 110100111) {
          sourceLabel = 'Sologenic';
        } else {
          sourceLabel = 'XRP Ledger';
        }

        // Add tooltip information
        const tooltipInfo =
          sourceLabel === 'XRP Ledger'
            ? 'Direct interaction with the XRPL through API calls or SDK integration. These transactions are typically executed programmatically rather than through a third-party interface.'
            : '';

        // For OfferCreate, include TakerGets and TakerPays
        const amount =
          item.tx.TransactionType === 'OfferCreate' ? item.tx.TakerPays : item.tx.Amount;
        const sendMax =
          item.tx.TransactionType === 'OfferCreate' ? item.tx.TakerGets : item.tx.SendMax;

        // Determine if OfferCreate is buy or sell
        let offerType = null;
        if (item.tx.TransactionType === 'OfferCreate') {
          const takerGets = item.tx.TakerGets; // What the offer creator gives
          const takerPays = item.tx.TakerPays; // What the offer creator wants to receive

          // Check if TakerGets is XRP (string) or token (object)
          const givingXRP = typeof takerGets === 'string';
          // Check if TakerPays is XRP (string) or token (object)
          const receivingXRP = typeof takerPays === 'string';

          if (givingXRP && !receivingXRP) {
            // Giving XRP, receiving token = Buy offer
            offerType = 'buy';
          } else if (!givingXRP && receivingXRP) {
            // Giving token, receiving XRP = Sell offer
            offerType = 'sell';
          } else {
            // Token to token or XRP to XRP (edge cases)
            offerType = 'trade';
          }
        }

        return {
          Account: item.tx.Account,
          Destination: item.tx.Destination,
          TransactionType: item.tx.TransactionType,
          Amount: amount,
          Amount2: item.tx.Amount2,
          Asset: item.tx.Asset,
          Asset2: item.tx.Asset2,
          TransactionResult: item.meta.TransactionResult,
          DeliveredAmount: item.meta.delivered_amount,
          SendMax: sendMax,
          hash: item.tx.hash,
          date: item.tx.date,
          source: sourceLabel,
          sourceTooltip: tooltipInfo,
          LimitAmount: item.tx.LimitAmount,
          OfferSequence: item.tx.OfferSequence, // For OfferCancel
          offerType: offerType // Add offer type for OfferCreate transactions
        };
      });

      for (let i = 0; i < updatedArray.length; i++) {
        const eachTransaction = updatedArray[i];
        console.log('Processed Transaction:', eachTransaction);
        if (typeof eachTransaction.Destination === 'undefined') {
          eachTransaction.Destination = 'XRPL';
        }
      }
      const filteredData = updatedArray.filter((item) => {
        return item.Account === account || item.Destination === account;
      });
      setActivityHistory(filteredData);
    } catch (error) {
      console.log('The error is occurred in my transaction history', error);
    }
    setLoading(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedHistory = activityHistory.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box
      sx={{
        background: darkMode 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.02) 100%)',
        borderRadius: '4px',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        overflow: 'hidden'
      }}
    >
      {loading ? (
        <Stack alignItems="center" sx={{ py: isSmallScreen ? 6 : 10 }}>
          <Box sx={{ mb: 2 }}>
            <PulseLoader color={theme.palette.text.secondary} size={isSmallScreen ? 8 : 10} margin={3} />
          </Box>
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.4) }}>
            Loading transaction history...
          </Typography>
        </Stack>
      ) : (
        activityHistory &&
        activityHistory.length === 0 && (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{
              py: isSmallScreen ? 6 : 10,
              px: isSmallScreen ? 3 : 4
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: isSmallScreen ? 32 : 40, color: alpha(theme.palette.text.primary, 0.2) }} />
            <Typography variant={isSmallScreen ? 'body2' : 'body1'} sx={{ color: alpha(theme.palette.text.primary, 0.6) }}>
              No Transaction History
            </Typography>
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.3) }}>
              Your DeFi transactions will appear here
            </Typography>
          </Stack>
        )
      )}
      {activityHistory.length > 0 && (
        <>
          <Table
            size="small"
            sx={{
              backgroundColor: 'transparent',
              '& .MuiTableCell-root': {
                py: 1.5,
                px: isSmallScreen ? 1 : 2,
                fontSize: isSmallScreen ? '0.75rem' : '0.813rem',
                borderBottom: darkMode ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.03)',
                backgroundColor: 'transparent'
              }
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: 'transparent' }}>
                <TableCell sx={{ color: alpha(theme.palette.text.primary, 0.4), fontWeight: 400, backgroundColor: 'transparent' }}>
                  Type
                </TableCell>
                <TableCell sx={{ color: alpha(theme.palette.text.primary, 0.4), fontWeight: 400, backgroundColor: 'transparent' }}>
                  {isSmallScreen ? 'Time' : 'Date'}
                </TableCell>
                <TableCell sx={{ color: alpha(theme.palette.text.primary, 0.4), fontWeight: 400, backgroundColor: 'transparent' }}>
                  Amount
                </TableCell>
                <TableCell sx={{ color: alpha(theme.palette.text.primary, 0.4), fontWeight: 400, backgroundColor: 'transparent' }}>
                  Source
                </TableCell>
                <TableCell sx={{ color: alpha(theme.palette.text.primary, 0.4), fontWeight: 400, textAlign: 'center', backgroundColor: 'transparent' }}>
                  <OpenInNewIcon sx={{ fontSize: '14px' }} />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ backgroundColor: 'transparent' }}>
              {paginatedHistory.map((item, index) => (
                <HistoryRow key={index} {...item} isSmallScreen={isSmallScreen} darkMode={darkMode} />
              ))}
            </TableBody>
          </Table>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1.5,
              background: darkMode 
                ? 'rgba(255,255,255,0.01)'
                : 'rgba(0,0,0,0.01)',
              borderTop: darkMode ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.03)'
            }}
          >
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.3) }}>
              {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, activityHistory.length)} of {activityHistory.length}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
                size="small"
                sx={{
                  height: '28px',
                  fontSize: '0.75rem',
                  color: alpha(theme.palette.text.primary, 0.6),
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'transparent'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.text.primary, 0.1)
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.text.primary, 0.2),
                    borderWidth: '1px'
                  }
                }}
              >
                {[10, 25, 50].map((option) => (
                  <MenuItem key={option} value={option} sx={{ fontSize: '0.75rem' }}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              <IconButton
                onClick={() => handleChangePage(null, page - 1)}
                disabled={page === 0}
                size="small"
                sx={{
                  color: alpha(theme.palette.text.primary, 0.4),
                  p: 0.5,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.text.primary, 0.05)
                  },
                  '&.Mui-disabled': {
                    color: alpha(theme.palette.text.primary, 0.1)
                  }
                }}
              >
                <KeyboardArrowLeft fontSize="small" />
              </IconButton>
              <IconButton
                onClick={() => handleChangePage(null, page + 1)}
                disabled={page >= Math.ceil(activityHistory.length / rowsPerPage) - 1}
                size="small"
                sx={{
                  color: alpha(theme.palette.text.primary, 0.4),
                  p: 0.5,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.text.primary, 0.05)
                  },
                  '&.Mui-disabled': {
                    color: alpha(theme.palette.text.primary, 0.1)
                  }
                }}
              >
                <KeyboardArrowRight fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        </>
      )}
    </Box>
  );
};

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
    icon: <OpenInNewIcon sx={{ fontSize: '16px' }} />
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
          width: '16px',
          height: '16px',
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
    icon: <XPMarketIcon sx={{ fontSize: '16px' }} />
  },
  110100111: {
    label: 'Sologenic',
    color: '#B72136', // Red
    icon: (
      <Icon
        icon={chartLineUp}
        style={{
          fontSize: '16px',
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
    LimitAmount,
    darkMode
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

  const getTypeColor = (type, offerType) => {
    if (type === 'Payment') return typeof Amount === 'string' ? '#ef4444' : '#10b981';
    if (type === 'AMMDeposit') return '#8b5cf6';
    if (type === 'AMMWithdraw') return '#f59e0b';
    if (type === 'TrustSet') return '#3b82f6';
    if (type === 'OfferCreate') {
      if (offerType === 'buy') return '#10b981';
      if (offerType === 'sell') return '#ef4444';
      return '#8b5cf6';
    }
    if (type === 'OfferCancel') return '#ef4444';
    return '#6b7280';
  };

  const getTypeLabel = (type, offerType) => {
    if (type === 'Payment') return typeof Amount === 'string' ? 'Sell' : 'Buy';
    if (type === 'AMMDeposit') return 'Add';
    if (type === 'AMMWithdraw') return 'Remove';
    if (type === 'TrustSet') return 'Trust';
    if (type === 'OfferCreate') {
      if (offerType === 'buy') return 'Buy';
      if (offerType === 'sell') return 'Sell';
      if (offerType === 'trade') return 'Trade';
      return 'Offer';
    }
    if (type === 'OfferCancel') return 'Cancel';
    return type;
  };

  return (
    <TableRow
      sx={{
        '&:hover': {
          backgroundColor: darkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'
        }
      }}
    >
      <TableCell>
        <Typography 
          variant="caption" 
          sx={{ 
            color: getTypeColor(TransactionType, offerType),
            fontWeight: 500,
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            letterSpacing: '0.5px'
          }}
        >
          {getTypeLabel(TransactionType, offerType)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.5) }}>
          {props.isSmallScreen ? getRelativeTime(rippleEpoch).replace(' ago', '') : getRelativeTime(rippleEpoch)}
        </Typography>
      </TableCell>
      <TableCell>
        {TransactionType === 'AMMDeposit' && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>{assetValue.valueBeforeDot}</Typography>
            {assetValue.valueAfterDot && (
              <Typography variant="caption" sx={{ opacity: 0.6 }}>.{assetValue.valueAfterDot}</Typography>
            )}
            {tokenImageUrl && (
              <Avatar src={tokenImageUrl} sx={{ width: 16, height: 16 }} />
            )}
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
              {assetName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.3 }}>/</Typography>
            <Typography variant="caption">{assetValue2.valueBeforeDot}</Typography>
            {assetValue2.valueAfterDot && (
              <Typography variant="caption" sx={{ opacity: 0.6 }}>.{assetValue2.valueAfterDot}</Typography>
            )}
            {tokenImageUrl2 && (
              <Avatar src={tokenImageUrl2} sx={{ width: 16, height: 16 }} />
            )}
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
              {assetName2}
            </Typography>
          </Stack>
        )}
        {TransactionType === 'AMMWithdraw' && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {assetValue.valueAfterDot === '' && assetValue2.valueAfterDot === '' ? (
              <>
                {tokenImageUrl && <Avatar src={tokenImageUrl} sx={{ width: 16, height: 16 }} />}
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
                  {assetName}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.3 }}>/</Typography>
                {tokenImageUrl2 && <Avatar src={tokenImageUrl2} sx={{ width: 16, height: 16 }} />}
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
                  {assetName2}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>{assetValue.valueBeforeDot}</Typography>
                {assetValue.valueAfterDot && (
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>.{assetValue.valueAfterDot}</Typography>
                )}
                {tokenImageUrl && <Avatar src={tokenImageUrl} sx={{ width: 16, height: 16 }} />}
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
                  {assetName}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.3 }}>/</Typography>
                <Typography variant="caption">{assetValue2.valueBeforeDot}</Typography>
                {assetValue2.valueAfterDot && (
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>.{assetValue2.valueAfterDot}</Typography>
                )}
                {tokenImageUrl2 && <Avatar src={tokenImageUrl2} sx={{ width: 16, height: 16 }} />}
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
                  {assetName2}
                </Typography>
              </>
            )}
          </Stack>
        )}
        {TransactionType === 'Payment' && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>{assetValue.valueBeforeDot}</Typography>
            {assetValue.valueAfterDot && (
              <Typography variant="caption" sx={{ opacity: 0.6 }}>.{assetValue.valueAfterDot}</Typography>
            )}
            {tokenImageUrl && <Avatar src={tokenImageUrl} sx={{ width: 16, height: 16 }} />}
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
              {assetName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.3 }}>→</Typography>
            <Typography variant="caption">{assetValue2.valueBeforeDot}</Typography>
            {assetValue2.valueAfterDot && (
              <Typography variant="caption" sx={{ opacity: 0.6 }}>.{assetValue2.valueAfterDot}</Typography>
            )}
            {tokenImageUrl2 && <Avatar src={tokenImageUrl2} sx={{ width: 16, height: 16 }} />}
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
              {assetName2}
            </Typography>
          </Stack>
        )}
        {TransactionType === 'TrustSet' && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>{assetValue.valueBeforeDot}</Typography>
            {assetValue.valueAfterDot && (
              <Typography variant="caption" sx={{ opacity: 0.6 }}>.{assetValue.valueAfterDot}</Typography>
            )}
            {tokenImageUrl && <Avatar src={tokenImageUrl} sx={{ width: 16, height: 16 }} />}
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
              {assetName}
            </Typography>
          </Stack>
        )}
        {TransactionType === 'OfferCreate' && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>{assetValue.valueBeforeDot}</Typography>
            {assetValue.valueAfterDot && (
              <Typography variant="caption" sx={{ opacity: 0.6 }}>.{assetValue.valueAfterDot}</Typography>
            )}
            {tokenImageUrl && <Avatar src={tokenImageUrl} sx={{ width: 16, height: 16 }} />}
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
              {assetName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.3 }}>→</Typography>
            <Typography variant="caption">{assetValue2.valueBeforeDot}</Typography>
            {assetValue2.valueAfterDot && (
              <Typography variant="caption" sx={{ opacity: 0.6 }}>.{assetValue2.valueAfterDot}</Typography>
            )}
            {tokenImageUrl2 && <Avatar src={tokenImageUrl2} sx={{ width: 16, height: 16 }} />}
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
              {assetName2}
            </Typography>
          </Stack>
        )}
        {TransactionType === 'OfferCancel' && (
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.5) }}>
            Offer Cancelled
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Typography 
          variant="caption" 
          sx={{ 
            color: alpha(theme.palette.text.primary, 0.4),
            fontSize: '0.7rem'
          }}
        >
          {source}
        </Typography>
      </TableCell>
      <TableCell sx={{ width: '40px', textAlign: 'center' }}>
        <IconButton
          size="small"
          onClick={handleViewClick}
          sx={{
            p: 0.25,
            color: alpha(theme.palette.text.primary, 0.3),
            '&:hover': {
              color: alpha(theme.palette.text.primary, 0.6),
              backgroundColor: 'transparent'
            }
          }}
        >
          <OpenInNewIcon sx={{ fontSize: '14px' }} />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default DeFiHistory;