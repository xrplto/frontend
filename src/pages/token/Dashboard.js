// material
import { Box, Grid, Container, Typography } from '@mui/material';

// components
import {
  AppCurrentVisits,
  AppWebsiteVisits,
  AppCurrentSubject,
  AppConversionRates
} from './app';

// ----------------------------------------------------------------------

export default function Dashboard() {
    return (
        <Grid container spacing={3} sx={{p:0}} p={-24}>
            <Grid item xs={12} md={6} lg={8} sx={{pl:0}}>
                <AppWebsiteVisits />
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
