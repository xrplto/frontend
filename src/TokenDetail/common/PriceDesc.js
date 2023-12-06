// Material
import {
  Box,
  Divider,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';

// Components
import BearBullChip from './BearBullChip';
import LowHighBar24H from './LowHighBar24H';

// Utils
import { fNumber, fNumberWithCurreny } from 'src/utils/formatNumber';

import NumberTooltip from 'src/components/NumberTooltip';
import { useSelector } from 'react-redux';
import { selectActiveFiatCurrency, selectMetrics } from 'src/redux/statusSlice';
import { currencySymbols } from 'src/utils/constants';

// ----------------------------------------------------------------------
export default function PriceDesc({ token }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const metrics = useSelector(selectMetrics);
  const activeFiatCurrency = useSelector(selectActiveFiatCurrency);

  const { name, exch, pro7d, pro24h, md5 } = token;

  let user = token.user;
  if (!user) user = name;

  return (
    <Stack>
      <Typography variant="h1" color="#33C2FF" fontSize="1.2rem">
        {user} Price ({name})
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mt: 0 }} alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="price" noWrap>
            <NumberTooltip prepend={currencySymbols[activeFiatCurrency]} number={fNumberWithCurreny(exch, metrics[activeFiatCurrency])}/>
          </Typography>
          <Typography variant="subtitle1" style={{ marginTop: 8 }}>
            <NumberTooltip number={fNumber(exch)}/> XRP
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
       
      <BearBullChip
  value={pro24h}
  tooltip={
    <Stack alignItems="center">
      24h (%)
      <Box
        component="img"
        alt={`${user} ${name} 24H Price Graph`}
        sx={{ width: 135, height: 50, mt: 2 }}
        src={`${BASE_URL}/sparkline/${md5}?pro24h=${pro24h}`}
      />
    </Stack>
  }
/>

        
        <BearBullChip
          value={pro7d}
          tooltip={
            <Stack alignItems="center">
              7d (%)
              <Box
                component="img"
                alt={`${user} ${name} 7D Price Graph`}
                sx={{ width: 135, height: 50, mt: 2 }}
                src={`${BASE_URL}/sparkline/${md5}?pro7d=${pro7d}`}
              />
            </Stack>
          }
        />
      </Stack>

      <LowHighBar24H token={token} />

      {isTablet && <Divider />}
    </Stack>
  );
}
