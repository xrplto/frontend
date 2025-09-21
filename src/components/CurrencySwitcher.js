import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  alpha,
  Tooltip,
  Typography,
  styled,
  Fade
} from '@mui/material';
import { currencyConfig, currencyIcons } from 'src/utils/constants';
import { AppContext } from 'src/AppContext';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const StyledButton = styled(IconButton)(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
      ? alpha('#030310', 0.7)
      : alpha(theme.palette.primary.main, 0.08),
  borderRadius: theme.spacing(1),
  padding: '4px 6px',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  minWidth: 58,
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
        ? alpha(theme.palette.primary.main, 0.04)
        : alpha(theme.palette.primary.main, 0.12),
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
  },
  '&:active': {
    transform: 'translateY(0)'
  }
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    marginTop: theme.spacing(0.5),
    borderRadius: theme.spacing(1.5),
    minWidth: 140,
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    background:
      theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
        ? `linear-gradient(180deg, ${alpha('#030310', 0.98)} 0%, ${alpha('#030310', 0.95)} 100%)`
        : theme.palette.background.paper,
    backdropFilter: 'blur(20px)',
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
    '& .MuiList-root': {
      padding: theme.spacing(0.5)
    }
  }
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1, 1.5),
  minHeight: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1.5),
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
        ? alpha(theme.palette.primary.main, 0.04)
        : alpha(theme.palette.primary.main, 0.08),
    '& .currency-icon': {
      transform: 'scale(1.1)'
    }
  },
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.16)
    }
  }
}));

const CurrencyIcon = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  fontSize: '1.1rem',
  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
});

const ArrowIcon = styled(KeyboardArrowDownIcon)(({ theme, open }) => ({
  fontSize: '1rem',
  marginLeft: theme.spacing(0.25),
  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
  opacity: 0.7
}));

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
      <Tooltip title="Select currency" arrow placement="bottom">
        <StyledButton
          onClick={handleClick}
          size="small"
          aria-controls={open ? 'currency-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <CurrencyIcon className="currency-icon">{currencyIcons[activeCurrency]}</CurrencyIcon>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: (theme) => theme.palette.text.primary,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.01em'
              }}
            >
              {activeCurrency}
            </Typography>
            <ArrowIcon open={open} />
          </Box>
        </StyledButton>
      </Tooltip>
      <StyledMenu
        id="currency-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        {availableFiatCurrencies.map((option) => (
          <StyledMenuItem
            key={option}
            onClick={() => handleChange(option)}
            selected={option === activeCurrency}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <CurrencyIcon className="currency-icon">{currencyIcons[option]}</CurrencyIcon>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: option === activeCurrency ? 600 : 500,
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {option}
              </Typography>
            </Box>
            {option === activeCurrency && (
              <CheckIcon
                sx={{
                  fontSize: 18,
                  color: 'primary.main',
                  animation: 'fadeIn 0.2s ease'
                }}
              />
            )}
          </StyledMenuItem>
        ))}
      </StyledMenu>
    </Box>
  );
}
