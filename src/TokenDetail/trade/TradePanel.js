import { useState, useEffect } from 'react';
import Decimal from 'decimal.js-light';

// Material
import {
  styled,
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Chip,
  Divider,
  useMediaQuery
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import {
  Token as TokenIcon,
  PriceChange as PriceChangeIcon,
  SwapVerticalCircle as SwapVerticalCircleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';

// Components
import AccountBalance from './AccountBalance';
import PlaceOrder from './PlaceOrder';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
// Convert scientific notation to full decimal string using Decimal.js
const scientificToDecimal = (value) => new Decimal(value).toString();
import { fNumberWithSuffix } from 'src/utils/formatNumber';

// Utils

// ----------------------------------------------------------------------
const CompactContainer = styled(Box)(({ theme }) => ({
  background: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  borderRadius: '12px',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  boxShadow: `
    0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
    0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
  padding: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    borderRadius: '8px'
  }
}));

const ModernToggleGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  backgroundColor: 'transparent',
  borderRadius: '8px',
  padding: '2px',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  '& .MuiToggleButton-root': {
    border: 'none',
    borderRadius: '6px !important',
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none',
    padding: theme.spacing(0.5, 2),
    margin: '2px',
    minHeight: '32px',
    transition: 'all 0.2s ease',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem',
      padding: theme.spacing(0.5, 1.5),
      minHeight: '28px'
    },
    '&.Mui-selected': {
      backgroundColor: theme.palette.background.paper,
      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`,
      '&[value="BUY"]': {
        color: theme.palette.success.main,
        backgroundColor: alpha(theme.palette.success.main, 0.1)
      },
      '&[value="SELL"]': {
        color: theme.palette.error.main,
        backgroundColor: alpha(theme.palette.error.main, 0.1)
      }
    },
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, 0.8)
    }
  }
}));

const CompactTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInput-root': {
    fontSize: '0.875rem',
    '&:before': {
      borderBottomColor: alpha(theme.palette.divider, 0.3)
    },
    '&:hover:not(.Mui-disabled):before': {
      borderBottomColor: alpha(theme.palette.primary.main, 0.5)
    },
    '&:after': {
      borderBottomColor: theme.palette.primary.main
    }
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
    color: alpha(theme.palette.text.secondary, 0.7)
  },
  '& .MuiInput-input': {
    padding: theme.spacing(0.5, 0)
  }
}));

const InfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 1.5),
  borderRadius: '8px',
  background: alpha(theme.palette.background.paper, 0.3),
  border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  marginTop: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.75, 1),
    borderRadius: '6px'
  }
}));

const CurrencyChip = styled(Chip)(({ theme }) => ({
  height: '20px',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: '10px',
  '& .MuiChip-label': {
    padding: theme.spacing(0, 0.5)
  }
}));

const expo = (x, f) => {
  return Number.parseFloat(x).toExponential(f);
};

const fmNumber = (value, len) => {
  const amount = new Decimal(value).toNumber();
  if ((amount.toString().length > 8 && amount < 0.001) || amount > 1000000000)
    return expo(amount, 2);
  else return new Decimal(amount).toFixed(len, Decimal.ROUND_DOWN);
};

export default function TradePanel({ pair, bids, asks, bidId, askId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [buySell, setBuySell] = useState('BUY');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [value, setValue] = useState('');
  const [marketLimit, setMarketLimit] = useState('market');
  const [accountPairBalance, setAccountPairBalance] = useState(null);
  const { darkMode } = useContext(AppContext);

  useEffect(() => {
    if (bidId < 0) return;
    const idx = bidId;
    setBuySell('SELL');
    setMarketLimit('limit');
    const bid = bids[idx];

    const sumAmount = fmNumber(bid.sumAmount, 2);
    const sumValue = fmNumber(bid.sumValue, 5);
    const price = fmNumber(bid.price, 5);

    setAmount(scientificToDecimal(sumAmount));
    setPrice(scientificToDecimal(price));
    setValue(scientificToDecimal(sumValue));
  }, [bidId]);

  useEffect(() => {
    if (askId < 0) return;
    const idx = askId;
    setBuySell('BUY');
    setMarketLimit('limit');
    const ask = asks[idx];

    const sumAmount = fmNumber(ask.sumAmount, 2);
    const sumValue = fmNumber(ask.sumValue, 5);
    const price = fmNumber(ask.price, 5);

    setAmount(scientificToDecimal(sumAmount));
    setPrice(scientificToDecimal(price));
    setValue(scientificToDecimal(sumValue));
  }, [askId]);

  useEffect(() => {
    if (marketLimit !== 'market') return;
    const amt = new Decimal(amount || 0).toNumber();
    if (amt === 0) {
      setValue(0);
      return;
    }

    const val = calcValue(amount, buySell);
    setValue(val);
  }, [asks, bids, marketLimit, buySell, amount]);

  const handleChangeBuySell = (event, newValue) => {
    if (newValue) setBuySell(newValue);
  };

  const calcValue = (amount, buyorsell) => {
    let val = 0;
    let amt;

    try {
      amt = new Decimal(amount).toNumber();
      if (amt === 0) return 0;
      if (buyorsell === 'BUY') {
        for (var ask of asks) {
          if (ask.sumAmount >= amt) {
            val = new Decimal(ask.sumValue).mul(amt).div(ask.sumAmount).toNumber();
            break;
          }
        }
      } else {
        for (var bid of bids) {
          if (bid.sumAmount >= amt) {
            val = new Decimal(bid.sumValue).mul(amt).div(bid.sumAmount).toNumber();
            break;
          }
        }
      }
      return new Decimal(val).toFixed(6, Decimal.ROUND_DOWN);
    } catch (e) {}

    return 0;
  };

  const handleChangeAmount = (e) => {
    const amt = e.target.value;

    if (amt === '.') {
      setAmount('0.');
      return;
    }

    if (isNaN(Number(amt))) return;

    setAmount(amt);
    if (marketLimit !== 'market') {
      const val = (Number(amt) * Number(price)).toFixed(6);
      setValue(val);
    }
  };

  const handleChangePrice = (e) => {
    const newPrice = e.target.value;

    if (isNaN(Number(newPrice))) return;

    setPrice(newPrice);
    const val = (amount * newPrice).toFixed(6);
    setValue(val);
  };

  const handleChangeMarketLimit = (e) => {
    setMarketLimit(e.target.value);
  };

  const curr1 = pair.curr1;
  const curr2 = pair.curr2;

  return (
    <CompactContainer>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: { xs: 1.5, sm: 2 } }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: theme.palette.warning.main,
            fontWeight: 600,
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            mb: 0.5
          }}
        >
          Quick Trade
        </Typography>
      </Box>

      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        {/* Account Balance */}
        <AccountBalance
          pair={pair}
          accountPairBalance={accountPairBalance}
          setAccountPairBalance={setAccountPairBalance}
        />

        {/* Buy/Sell Toggle */}
        <ModernToggleGroup value={buySell} fullWidth exclusive onChange={handleChangeBuySell}>
          <ToggleButton value="BUY">
            <TrendingUpIcon sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mr: 0.5 }} />
            BUY
          </ToggleButton>
          <ToggleButton value="SELL">
            <TrendingDownIcon sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mr: 0.5 }} />
            SELL
          </ToggleButton>
        </ModernToggleGroup>

        {/* Trade Description - Hidden on mobile */}
        {!isMobile && (
          <Box sx={{ textAlign: 'center', py: 1 }}>
            {buySell === 'BUY' ? (
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                Get <CurrencyChip label={curr1.name} size="small" color="error" variant="outlined" />{' '}
                by selling{' '}
                <CurrencyChip label={curr2.name} size="small" color="primary" variant="outlined" />
              </Typography>
            ) : (
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                Sell <CurrencyChip label={curr1.name} size="small" color="error" variant="outlined" />{' '}
                to get{' '}
                <CurrencyChip label={curr2.name} size="small" color="primary" variant="outlined" />
              </Typography>
            )}
          </Box>
        )}

        {/* Market/Limit Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <RadioGroup
            row
            value={marketLimit}
            onChange={handleChangeMarketLimit}
            sx={{
              '& .MuiFormControlLabel-root': {
                margin: theme.spacing(0, 1),
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.75rem',
                  fontWeight: 500
                }
              },
              '& .MuiRadio-root': {
                padding: theme.spacing(0.5),
                '&.Mui-checked': {
                  color: theme.palette.primary.main
                }
              }
            }}
          >
            <FormControlLabel value="market" control={<Radio size="small" />} label="MARKET" />
            <FormControlLabel value="limit" control={<Radio size="small" />} label="LIMIT" />
          </RadioGroup>
        </Box>

        {!isMobile && <Divider sx={{ opacity: 0.3 }} />}

        {/* Amount Input */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 0.5, sm: 1 } }}>
          <TokenIcon
            sx={{
              color: theme.palette.text.secondary,
              fontSize: { xs: '1rem', sm: '1.2rem' },
              mb: 0.5,
              display: { xs: 'none', sm: 'block' }
            }}
          />
          <CompactTextField
            fullWidth
            label="Amount"
            value={amount}
            onChange={handleChangeAmount}
            variant="standard"
            size="small"
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              autoComplete: 'off',
              name: `amount-${pair.curr1.name}-${pair.curr2.name}`
            }}
            autoComplete="off"
          />
          <CurrencyChip
            label={curr1.name}
            size="small"
            color="error"
            variant="filled"
            sx={{ mb: 0.5 }}
          />
        </Box>

        {/* Price Input (only for limit orders) */}
        {marketLimit === 'limit' && (
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 0.5, sm: 1 } }}>
            <PriceChangeIcon
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '1rem', sm: '1.2rem' },
                mb: 0.5,
                display: { xs: 'none', sm: 'block' }
              }}
            />
            <CompactTextField
              fullWidth
              label="Price"
              value={price}
              onChange={handleChangePrice}
              variant="standard"
              size="small"
            />
            <CurrencyChip
              label={curr2.name}
              size="small"
              color="primary"
              variant="filled"
              sx={{ mb: 0.5 }}
            />
          </Box>
        )}

        {/* Total Value */}
        <InfoRow>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            <SwapVerticalCircleIcon
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              Total
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: { xs: 'none', sm: 'block' } }}>
              ≈
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {value < 1 ? value : fNumberWithSuffix(value)}
            </Typography>
            <CurrencyChip label={curr2.name} size="small" color="primary" variant="outlined" />
          </Box>
        </InfoRow>

        {/* Place Order Button */}
        <PlaceOrder
          marketLimit={marketLimit}
          buySell={buySell}
          pair={pair}
          amount={amount}
          value={value}
          accountPairBalance={accountPairBalance}
        />
      </Stack>
    </CompactContainer>
  );
}
