// Material
import { /*alpha,*/ styled } from '@mui/material/styles';
import {
    Grid,
    Stack
} from '@mui/material';

// Components
import PriceChart from './PriceChart';
import PriceStatistics from './PriceStatistics';
import Description from './Description';

// ----------------------------------------------------------------------

export default function Overview({token}) {
    
    return (
        <Grid container spacing={{ xs: 0, md: 3 }}>
            <Grid item xs={12} md={12} lg={8}>
                <PriceChart token={token} />
            </Grid>

            <Grid item xs={12} md={12} lg={4}>
                <PriceStatistics token={token} />
            </Grid>

            <Grid item xs={12} md={12} lg={8}>
                <Description token={token} />
            </Grid>

            <Grid item xs={12} md={12} lg={4}>
            </Grid>
        </Grid>
    );
}
