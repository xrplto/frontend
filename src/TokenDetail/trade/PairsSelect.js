import axios from 'axios';
import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { debounce } from 'lodash';

// Material
import {
  styled,
  Avatar,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// ----------------------------------------------------------------------

const CustomSelect = styled(Select)(({ theme }) => ({
  // '& .MuiOutlinedInput-notchedOutline' : {
  //     border: 'none'
  // }
}));
// ----------------------------------------------------------------------



const PairsSelect = memo(({ token, pair, setPair }) => {
  const BASE_URL = process.env.API_URL;
  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [pairs, setPairs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const getPairs = useCallback(() => {
    if (isLoading || !mountedRef.current) return; // Prevent concurrent requests and calls after unmount

    setIsLoading(true);
    axios
      .get(`${BASE_URL}/pairs?md5=${token.md5}`)
      .then((res) => {
        if (!mountedRef.current) return; // Component was unmounted

        if (res.status === 200 && res.data && res.data.pairs) {
          const newPairs = res.data.pairs;
          setPairs(newPairs);
          if (!pair || !newPairs.find((e) => e.pair === pair.pair)) {
            setPair(newPairs[0]);
          }
        } else {
          console.warn('No pairs data received from API');
        }
      })
      .catch((err) => {
        if (!mountedRef.current) return; // Component was unmounted
        console.log('Error on getting pairs!!!', err);
        // Don't clear pairs on error to prevent disappearing
      })
      .finally(() => {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      });
  }, [token.md5, pair, setPair, BASE_URL, isLoading]);

  useEffect(() => {
    mountedRef.current = true;

    // Initial load
    getPairs();

    // Set up interval for periodic updates
    const timer = setInterval(getPairs, 10000);

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [token.md5]); // Only depend on token.md5, not pairs.length or getPairs

  const handleChangePair = useCallback(
    (event) => {
      const strPair = event.target.value;
      const newPair = pairs.find((e) => e.pair === strPair);
      if (newPair) setPair(newPair);
    },
    [pairs, setPair]
  );

  const menuItems = useMemo(
    () =>
      pairs.map((row) => {
        const { id, pair, curr1, curr2 } = row;
        const name1 = curr1.name;
        const name2 = curr2.name;

        return (
          <MenuItem key={id} value={pair} sx={{ py: 0.5 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="caption" sx={{ color: '#B72136', fontWeight: 600 }}>
                {name1}
              </Typography>
              <Icon icon={arrowsExchange} width="14" height="14" />
              <Typography variant="caption" sx={{ color: darkMode ? '#007B55' : '#5569ff', fontWeight: 600 }}>
                {name2}
              </Typography>
              {!isMobile && (
                <Typography variant="caption" sx={{ color: '#B72136', ml: 1 }}>
                  {fNumber(curr1.value)}
                </Typography>
              )}
            </Stack>
          </MenuItem>
        );
      }),
    [pairs, darkMode, isMobile]
  );

  // Safety check for pair object
  if (!pair) {
    return (
      <Grid container spacing={0} sx={{ p: 0 }}>
        <Grid item>
          <FormControl sx={{ m: { xs: 0.5, sm: 1 }, minWidth: isMobile ? 90 : 120 }} size="small">
            <InputLabel id="demo-select-small" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Pairs</InputLabel>
            <CustomSelect
              labelId="demo-select-small"
              id="demo-select-small"
              value=""
              label="Pair"
              disabled
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              <MenuItem value="">Loading...</MenuItem>
            </CustomSelect>
          </FormControl>
        </Grid>
      </Grid>
    );
  }

  const curr1 = pair.curr1;
  const curr2 = pair.curr2;

  let soloDexURL = `https://sologenic.org/trade?network=mainnet&market=${curr1.currency}%2B${curr1.issuer}%2F${curr2.currency}`;
  if (curr2.currency !== 'XRP') soloDexURL += `%2B${curr2.issuer}`;

  let gatehubDexURL = `https://gatehub.net/markets/${curr1.currency}+${curr1.issuer}/${curr2.currency}`;
  if (curr2.currency !== 'XRP') gatehubDexURL += `+${curr2.issuer}`;

  let xpmarketDexURL = `https://gatehub.net/markets/${curr1.currency}+${curr1.issuer}/${curr2.currency}`;
  if (curr2.currency !== 'XRP') xpmarketDexURL += `+${curr2.issuer}`;

  const xummDexURL = `https://xumm.app/detect/xapp:xumm.dex?issuer=${curr1.issuer}&currency=${curr1.currency}`;

  return (
    <Grid container spacing={0} sx={{ p: 0, width: '100%' }}>
      <Grid item xs={12}>
        <FormControl sx={{ m: { xs: 0.5, sm: 1 }, minWidth: isMobile ? 200 : 300, width: '100%' }} size="small">
          <InputLabel id="demo-select-small" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Pairs</InputLabel>
          <CustomSelect
            labelId="demo-select-small"
            id="demo-select-small"
            value={pairs.find((p) => p.pair === pair.pair) ? pair.pair : ''}
            label="Pair"
            onChange={handleChangePair}
            sx={{ 
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              width: '100%',
              '& .MuiSelect-select': {
                py: isMobile ? 0.75 : 1
              }
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  zIndex: 9999,
                  maxHeight: '300px'
                }
              },
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left'
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left'
              }
            }}
          >
            {menuItems}
          </CustomSelect>
        </FormControl>
      </Grid>

      <Grid item>
        <Stack direction="row">
          {/*
                <StackDexStyle direction="row" sx={{ m: 1, minWidth: 120 }} spacing={2} alignItems="center">
                        DEX
                        <Tooltip title="Sologenic">
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={soloDexURL}
                                rel="noreferrer noopener nofollow"
                            >
                                <IconButton edge="end" aria-label="solo">
                                    <Avatar variant="rounded" alt="Sologenic" src="/static/solo.webp" sx={{ width: 24, height: 24 }} />
                                </IconButton>
                            </Link>
                        </Tooltip>
                        
                        <Tooltip title="GateHub">
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={gatehubDexURL}
                                rel="noreferrer noopener nofollow"
                            >
                                <IconButton edge="end" aria-label="solo">
                                    <Avatar variant="rounded" alt="Gatehub" src="/static/gatehub.webp" sx={{ width: 24, height: 24 }} />
                                </IconButton>
                            </Link>
                        </Tooltip>
                        <Tooltip title="XUMM">
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={xummDexURL}
                                rel="noreferrer noopener nofollow"
                            >
                                <IconButton edge="end" aria-label="solo">
                                    <Avatar variant="rounded" alt="XUMM" src="/static/xaman.webp" sx={{ width: 24, height: 24 }} />
                                </IconButton>
                            </Link>
                        </Tooltip>

                        <Tooltip title="xpmarket">
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={xpmarketDexURL}
                                rel="noreferrer noopener nofollow"
                            >
                                <IconButton edge="end" aria-label="solo">
                                    <Avatar variant="rounded" alt="xpmarket" src="/static/xpmarket.webp" sx={{ width: 24, height: 24 }} />
                                </IconButton>
                            </Link>
                        </Tooltip>
                    </StackDexStyle>
                    */}
        </Stack>
      </Grid>
    </Grid>
  );
});

export default PairsSelect;
