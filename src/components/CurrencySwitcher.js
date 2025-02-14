import React, { useState, useEffect, useContext } from 'react';
import { Box, IconButton, Menu, MenuItem, alpha } from '@mui/material';
import { currencyConfig, currencyIcons } from 'src/utils/constants';
import { AppContext } from 'src/AppContext';

export default function CurrencySwithcer() {
  const { activeFiatCurrency, toggleFiatCurrency } = useContext(AppContext);
  const [activeCurrency, setActiveCurrency] = useState(activeFiatCurrency);
  const { availableFiatCurrencies } = currencyConfig;
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const defaultIndex = availableFiatCurrencies?.indexOf(activeFiatCurrency);
    defaultIndex > -1
      ? setActiveCurrency(availableFiatCurrencies[defaultIndex])
      : setActiveCurrency(availableFiatCurrencies[0]);
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
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
          borderRadius: 1,
          '&:hover': {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2)
          }
        }}
      >
        {currencyIcons[activeCurrency]}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
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
          <MenuItem
            key={option}
            onClick={() => handleChange(option)}
            selected={option === activeCurrency}
            sx={{
              minHeight: 'auto',
              py: 1,
              px: 2
            }}
          >
            <Box component="span" sx={{ mr: 1 }}>
              {currencyIcons[option]}
            </Box>
            {option}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
