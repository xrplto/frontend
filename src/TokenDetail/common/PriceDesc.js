// Material
import { Divider, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';

// Components
import BearBullChip from './BearBullChip';
import LowHighBar24H from './LowHighBar24H';

// Utils
import { fNumberWithCurreny } from 'src/utils/formatNumber';

import NumberTooltip from 'src/components/NumberTooltip';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { currencySymbols } from 'src/utils/constants';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import LoadChart from 'src/components/LoadChart';

// ----------------------------------------------------------------------
export default function PriceDesc({ token }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency } = useContext(AppContext);

  const { name, exch, pro7d, pro24h, pro5m, pro1h, md5 } = token;

  let user = token.user;
  if (!user) user = name;

  return (
    <Stack spacing={0.25}>
      <Typography variant="h1" color="#33C2FF" fontSize="0.875rem">
        {user} Price ({name})
      </Typography>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Stack direction="row" spacing={0.25} alignItems="center">
          <Typography variant="price" noWrap sx={{ fontSize: '1.5rem' }}>
            <NumberTooltip
              prepend={currencySymbols[activeFiatCurrency]}
              number={fNumberWithCurreny(exch, metrics[activeFiatCurrency])}
            />
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={0.25} alignItems="center">
        <BearBullChip
          value={pro5m}
          tooltip={
            <Stack alignItems="center" spacing={0.25}>
              5m Change
              <LoadChart url={`${BASE_URL}/sparkline/${md5}?pro5m=${pro5m}`} />
            </Stack>
          }
          label="5m"
        />
        <BearBullChip
          value={pro1h}
          tooltip={
            <Stack alignItems="center" spacing={0.25}>
              1h Change
              <LoadChart url={`${BASE_URL}/sparkline/${md5}?pro1h=${pro1h}`} />
            </Stack>
          }
          label="1h"
        />
        <BearBullChip
          value={pro24h}
          tooltip={
            <Stack alignItems="center" spacing={0.25}>
              24h Change
              <LoadChart url={`${BASE_URL}/sparkline/${md5}?pro24h=${pro24h}`} />
            </Stack>
          }
          label="24h"
        />
        <BearBullChip
          value={pro7d}
          tooltip={
            <Stack alignItems="center" spacing={0.25}>
              7d Change
              <LoadChart url={`${BASE_URL}/sparkline/${md5}?pro7d=${pro7d}`} />
            </Stack>
          }
          label="7d"
        />
      </Stack>

      <LowHighBar24H token={token} />

      {isTablet && <Divider />}
    </Stack>
  );
}
