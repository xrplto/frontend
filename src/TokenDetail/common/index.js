import { memo } from 'react';
import { Divider, Grid, Stack, useMediaQuery, useTheme } from '@mui/material';
import UserDesc from './UserDesc';
import PriceDesc from './PriceDesc';
import ExtraDesc from './ExtraDesc';
import ExtraButtons from './ExtraButtons';

const Common = memo(({ token }) => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Grid container direction="row" justifyContent="center" alignItems="stretch" spacing={0.5}>
      <Grid item xs={12} md={6} lg={5} sx={{ mt: 0.5 }}>
        <UserDesc token={token} />
      </Grid>
      <Grid item xs={12} md={6} lg={7} sx={{ mt: 0.5 }}>
        <Grid container direction="row" spacing={0.5}>
          {!isTablet && (
            <>
              <Grid item xs={12} lg={6}>
                <PriceDesc token={token} />
              </Grid>
              <Grid item xs={12} lg={6}>
                <ExtraButtons token={token} />
              </Grid>
            </>
          )}
          <Grid item xs={12}>
            <Stack spacing={0.5}>
              {!isTablet && <Divider orientation="horizontal" variant="middle" flexItem />}
              <ExtraDesc token={token} />
            </Stack>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
});

Common.displayName = 'Common';

export default Common;
