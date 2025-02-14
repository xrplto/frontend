import React, { useState, useEffect, useContext } from 'react';
import { Box, IconButton, Menu, MenuItem, alpha, Tooltip, Typography } from '@mui/material';
import { currencyConfig, currencyIcons } from 'src/utils/constants';
import { AppContext } from 'src/AppContext';
import CheckIcon from '@mui/icons-material/Check';

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
      <Tooltip title="Change currency" arrow>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
            borderRadius: 1,
            padding: '6px 8px',
            '&:hover': {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2)
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {currencyIcons[activeCurrency]}
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: (theme) => theme.palette.text.primary
              }}
            >
              {activeCurrency}
            </Typography>
          </Box>
        </IconButton>
      </Tooltip>
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
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1,
            minWidth: 120,
            '& .MuiList-root': {
              padding: '4px'
            }
          }
        }}
      >
        {availableFiatCurrencies.map((option) => (
          <MenuItem
            key={option}
            onClick={() => handleChange(option)}
            selected={option === activeCurrency}
            sx={{
              minHeight: 36,
              borderRadius: 1,
              px: 1.5,
              py: 0.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              '&.Mui-selected': {
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12)
                }
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {currencyIcons[option]}
              <Typography variant="body2">{option}</Typography>
            </Box>
            {option === activeCurrency && (
              <CheckIcon
                sx={{
                  fontSize: 16,
                  color: 'primary.main'
                }}
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
