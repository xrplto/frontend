import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  alpha,
  Typography,
  styled,
  Fade
} from '@mui/material';
// Constants
const currencyConfig = {
  availableFiatCurrencies: ['XRP', 'USD', 'EUR', 'JPY', 'CNH'],
  activeFiatCurrency: 'XRP'
};
const currencyIcons = {
  USD: '💵',
  EUR: '💶',
  JPY: '💴',
  CNH: '🈷️',
  XRP: '✕'
};
import { AppContext } from 'src/AppContext';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const StyledButton = styled('button')(({ theme, open }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: '6px 8px',
  background: theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.04)'
    : 'rgba(0, 0, 0, 0.02)',
  border: `1px solid ${theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.08)'}`,
  borderRadius: '6px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '12px',
  fontWeight: 400,
  color: theme.palette.text.primary,
  minWidth: '60px',
  height: '32px',
  position: 'relative',
  '&:hover': {
    background: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.06)'
      : 'rgba(0, 0, 0, 0.04)',
    borderColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.12)',
  },
  '&:focus': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
  '& .expand-icon': {
    fontSize: '14px',
    opacity: 0.7,
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
  }
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    marginTop: '4px',
    borderRadius: '8px',
    minWidth: '120px',
    maxWidth: '140px',
    border: `1px solid ${theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.12)'}`,
    background: theme.palette.mode === 'dark'
      ? 'rgba(0, 0, 0, 0.95)'
      : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    boxShadow: 'none',
    '& .MuiList-root': {
      padding: '4px'
    }
  }
}));

const StyledMenuItem = styled(MenuItem)(({ theme, selected }) => ({
  borderRadius: '6px',
  padding: '8px 10px',
  minHeight: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  margin: '1px 0',
  fontSize: '12px',
  background: selected
    ? theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.05)'
    : 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.06)'
      : 'rgba(0, 0, 0, 0.04)',
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.05)',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.06)',
    }
  }
}));

const CurrencyIcon = styled('span')({
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  lineHeight: 1
});

export default function CurrencySwithcer() {
  const { activeFiatCurrency, toggleFiatCurrency } = useContext(AppContext);
  const [activeCurrency, setActiveCurrency] = useState(activeFiatCurrency);
  const { availableFiatCurrencies } = currencyConfig;
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const defaultIndex = availableFiatCurrencies?.indexOf(activeFiatCurrency);
    defaultIndex > -1
      ? setActiveCurrency(availableFiatCurrencies[defaultIndex])
      : setActiveCurrency('XRP');
  }, [activeFiatCurrency]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChange = (newValue) => {
    toggleFiatCurrency(newValue);
    setActiveCurrency(newValue);
    handleClose();
  };

  return (
    <Box>
      <StyledButton
        open={open}
        onClick={handleClick}
        aria-controls={open ? 'currency-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label="Select currency"
      >
        <CurrencyIcon>{currencyIcons[activeCurrency]}</CurrencyIcon>
        <span style={{ fontWeight: 500, letterSpacing: '0.02em' }}>
          {activeCurrency}
        </span>
        <ExpandMoreIcon className="expand-icon" />
      </StyledButton>
      <StyledMenu
        id="currency-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        {availableFiatCurrencies.map((option) => (
          <StyledMenuItem
            key={option}
            onClick={() => handleChange(option)}
            selected={option === activeCurrency}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CurrencyIcon>{currencyIcons[option]}</CurrencyIcon>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: option === activeCurrency ? 600 : 400,
                  fontSize: '12px',
                  color: 'text.primary'
                }}
              >
                {option}
              </Typography>
            </Box>
            {option === activeCurrency && (
              <CheckIcon
                sx={{
                  fontSize: 14,
                  color: 'text.secondary',
                  opacity: 0.7
                }}
              />
            )}
          </StyledMenuItem>
        ))}
      </StyledMenu>
    </Box>
  );
}
