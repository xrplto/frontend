import axios from 'axios';
import { useState, useEffect } from 'react';
// Material
import {
    Grid
} from '@mui/material';

// Components
import PairsList from './PairsList';

// ----------------------------------------------------------------------

export default function Market({token}) {
    const BASE_URL = process.env.API_URL;

    const [pairs, setPairs] = useState([]);

    useEffect(() => {
        function getPairs() {
            // https://api.xrpl.to/api/pairs?md5=0413ca7cfc258dfaf698c02fe304e607
            axios.get(`${BASE_URL}/pairs?md5=${token.md5}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setPairs(ret.pairs);
                    }
                }).catch(err => {
                    console.log("Error on getting pairs!!!", err);
                }).then(function () {
                    // always executed
                });
        }

        getPairs();

        // const timer = setInterval(getPairs, 10000);
        // return () => {
        //     clearInterval(timer);
        // }

    }, [token]);

    return (
        <Grid container spacing={3} sx={{p:0}}>
            <Grid item xs={12} md={12} lg={12} sx={{pl:0}}>
                <PairsList token={token} pairs={pairs} />
            </Grid>
        </Grid>
    );
}
