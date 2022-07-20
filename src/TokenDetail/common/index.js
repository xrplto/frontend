// Material
import {
    Grid,
} from '@mui/material';

// Components
import UserDesc from './UserDesc';
import PriceDesc from './PriceDesc';
import ExtraDesc from './ExtraDesc';
// ----------------------------------------------------------------------

export default function Common({token}) {
    return (
        <Grid container direction="row" justify="center" alignItems="stretch">
            <Grid item xs={12} md={6} lg={5} sx={{ mt: 3 }}>
                <UserDesc token={token} />
            </Grid>
            <Grid item xs={12} md={6} lg={7} sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <PriceDesc token={token} />
                    </Grid>
                    <Grid item xs={12}>
                        <ExtraDesc token={token} />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
}

