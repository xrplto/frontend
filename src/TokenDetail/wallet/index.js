import axios from 'axios';
import { useState, useEffect } from 'react';
// Material
import {
    Grid
} from '@mui/material';

// Components
import Summary from './Summary';

// ----------------------------------------------------------------------

export default function Wallet({token}) {

    return (
        <Grid container spacing={3} sx={{p:0}}>
            <Grid item xs={12} md={12} lg={12} sx={{pl:0}}>
                <Summary token={token} />
            </Grid>
        </Grid>
    );
}
