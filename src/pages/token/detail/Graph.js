// material
import { Grid } from '@mui/material';

// components
import {
  AppCurrentVisits,
  AppCurrentSubject,
  AppConversionRates
} from './app';

import PriceChart from './charts/PriceChart';

// ----------------------------------------------------------------------

export default function Graph({detail}) {
    return (
        <Grid container spacing={3} sx={{p:0}} p={-24}>
            <Grid item xs={12} md={6} lg={8} sx={{pl:0}}>
                <PriceChart detail={detail} />
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
                <AppCurrentVisits />
            </Grid>

            <Grid item xs={12} md={6} lg={8}>
                <AppConversionRates />
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
                <AppCurrentSubject />
            </Grid>
        </Grid>
    );
}
