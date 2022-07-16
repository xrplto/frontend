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
        <Grid container spacing={3} sx={{p:0}}>
            <Grid item xs={12} md={6} lg={8} sx={{pl:0}}>
                <PriceChart token={token} />
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
                <PriceStatistics token={token} />
            </Grid>

            <Grid item xs={12} md={6} lg={8}>
                <Description token={token} />
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
            </Grid>
        </Grid>
    );
}
