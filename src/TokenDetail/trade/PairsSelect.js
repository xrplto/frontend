import axios from 'axios';
import { useState, useEffect, useMemo, useCallback, memo, useRef, useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { FormControl, InputLabel, MenuItem, Select, Stack, Typography, useTheme, useMediaQuery } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { fNumber } from 'src/utils/formatNumber';



const PairsSelect = memo(({ token, pair, setPair }) => {
  const { darkMode } = useContext(AppContext);
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [pairs, setPairs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const getPairs = useCallback(() => {
    if (isLoading || !mountedRef.current) return;
    setIsLoading(true);
    axios.get(`${process.env.API_URL}/pairs?md5=${token.md5}`)
      .then((res) => {
        if (!mountedRef.current) return;
        if (res.data?.pairs) {
          setPairs(res.data.pairs);
          if (!pair || !res.data.pairs.find(e => e.pair === pair.pair)) {
            setPair(res.data.pairs[0]);
          }
        }
      })
      .catch(err => console.log('Error getting pairs:', err))
      .finally(() => mountedRef.current && setIsLoading(false));
  }, [token.md5, pair, setPair, isLoading]);

  useEffect(() => {
    mountedRef.current = true;
    getPairs();
    const timer = setInterval(getPairs, 10000);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [token.md5]);

  const handleChangePair = useCallback((e) => {
    const newPair = pairs.find(p => p.pair === e.target.value);
    if (newPair) setPair(newPair);
  }, [pairs, setPair]);

  const menuItems = useMemo(() =>
    pairs.map(({ id, pair, curr1, curr2 }) => (
      <MenuItem key={id} value={pair} sx={{ py: 0.5 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="caption" sx={{ color: '#B72136', fontWeight: 600 }}>{curr1.name}</Typography>
          <SwapHorizIcon sx={{ width: '14px', height: '14px' }} />
          <Typography variant="caption" sx={{ color: darkMode ? '#007B55' : '#5569ff', fontWeight: 600 }}>{curr2.name}</Typography>
          {!isMobile && <Typography variant="caption" sx={{ color: '#B72136', ml: 1 }}>{fNumber(curr1.value)}</Typography>}
        </Stack>
      </MenuItem>
    )), [pairs, darkMode, isMobile]);

  if (!pair) return (
    <FormControl sx={{ m: { xs: 0.5, sm: 1 }, minWidth: isMobile ? 200 : 300, width: '100%' }} size="small">
      <InputLabel sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Pairs</InputLabel>
      <Select value="" label="Pair" disabled sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
        <MenuItem value="">Loading...</MenuItem>
      </Select>
    </FormControl>
  );

  return (
    <FormControl sx={{ m: { xs: 0.5, sm: 1 }, minWidth: isMobile ? 200 : 300, width: '100%' }} size="small">
      <InputLabel sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Pairs</InputLabel>
      <Select
        value={pairs.find(p => p.pair === pair.pair) ? pair.pair : ''}
        label="Pair"
        onChange={handleChangePair}
        sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem', width: '100%', '& .MuiSelect-select': { py: isMobile ? 0.75 : 1 } }}
        MenuProps={{ PaperProps: { sx: { zIndex: 9999, maxHeight: '300px' } } }}
      >
        {menuItems}
      </Select>
    </FormControl>
  );
});

export default PairsSelect;
