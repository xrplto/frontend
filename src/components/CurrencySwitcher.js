import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { useDispatch, useSelector } from 'react-redux';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { currencyConfig, currencyIcons } from 'src/utils/constants';
import { InputAdornment } from '@mui/material';
import { update_activeCurrency } from 'src/redux/statusSlice';

export default function CurrencySwithcer() {
  const [activeCurrency, setActiveCurrency] = useState(null);
  const { activeFiatCurrency } = useSelector((state) => state.status);
  const { availableFiatCurrencies } = currencyConfig;
  const dispatch = useDispatch();

  useEffect(() => {
    const defaultIndex = availableFiatCurrencies?.indexOf(activeFiatCurrency);
    defaultIndex > -1
      ? setActiveCurrency(availableFiatCurrencies[defaultIndex])
      : setActiveCurrency(availableFiatCurrencies[0]);
  }, [activeFiatCurrency]);

  const handleChange = (_, newValue) => {
    dispatch(update_activeCurrency({ activeFiatCurrency: newValue }));
    setActiveCurrency(newValue);
  };

  return (
    <Box sx={{ minWidth: 120, mr:1 }}>
      <Autocomplete
        autoHighlight
        openOnFocus
        blurOnSelect
        disableClearable
        size="small"
        disablePortal
        id="xrplto-currency-switcher"
        options={availableFiatCurrencies}
        value={activeCurrency}
        onChange={handleChange}
        renderOption={(props, option) => {
          return (
            <Box
              component="li"
              sx={{ p: 0, m: 0 }}
              display={'flex'}
              gap={2}
              {...props}
              width={'100%'}
            >
              {currencyIcons[option]}
              {option}
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  {currencyIcons[activeCurrency]}
                </InputAdornment>
              )
            }}
            variant="standard"
            sx={{
              '& .MuiInputBase-root': {
                backgroundColor: 'background.paper',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                '&:before': {
                  borderBottom: 'none'
                }
              }
            }}
          />
        )}
      />
    </Box>
  );
}
