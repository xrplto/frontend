// Material
import {
    Divider,
    Grid,
    Stack
} from '@mui/material';

// Components
import UserDesc from './UserDesc';
import PriceDesc from './PriceDesc';
import ExtraDesc from './ExtraDesc';
import ExtraButtons from './ExtraButtons';
// ----------------------------------------------------------------------

export default function Common({token}) {
    return (
        <Grid container direction="row" justify="center" alignItems="stretch">
            <Grid item xs={12} md={6} lg={5} sx={{ mt: 3 }}>
                <UserDesc token={token} />
            </Grid>
            <Grid item xs={12} md={6} lg={7} sx={{ mt: 3 }}>
                <Grid container direction="row">
                    <Grid item xs={12} lg={6}>
                        <PriceDesc token={token} />
                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <ExtraButtons token={token} />
                    </Grid>
                    <Grid item xs={12}>
                        <Stack spacing={2}>
                            <Divider orientation="horizontal" variant="middle" flexItem />
                            <ExtraDesc token={token} />
                        </Stack>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
}

