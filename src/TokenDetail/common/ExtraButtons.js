import { useState } from 'react';

// Material
import {
    Avatar,
    Button,
    Chip,
    Grid,
    Stack,
    Typography
} from '@mui/material';

// Components
import TrustSet from './TrustSet';

// ----------------------------------------------------------------------
export default function ExtraButtons({token}) {
    const [trustToken, setTrustToken] = useState(null);

    const {
        id,
        issuer,
        name,
        domain,
        whitepaper,
        kyc,
        holders,
        offers,
        trustlines,
        imgExt,
        md5,
        tags,
        social,
        urlSlug
    } = token;

    let user = token.user;
    if (!user) user = name;

    const handleSetTrust = (e) => {
        setTrustToken(token);
    }

    const handleByCrypto = (e) => {
    }
  
    return (
        <Stack alignItems='center'>
            <TrustSet token={trustToken} setToken={setTrustToken}/>

            <Grid container direction="row" spacing={1} sx={{mt: 2}}>
                <Grid item>
                    <Button
                        variant="outlined"
                        onClick={handleSetTrust}
                        color='primary'
                        size="small"
                    >
                        TrustSet
                    </Button>
                </Grid>

                <Grid item>
                    <Button
                        variant="outlined"
                        onClick={handleByCrypto}
                        color='primary'
                        size="small"
                    >
                        Buy Crypto
                    </Button>
                </Grid>

                
            </Grid>

            <Stack direction='row' alignItems='center' sx={{mt:1}}>
                <Avatar sx={{ width: 24, height: 24 }} src="/static/sponsor.png"/>
                <Typography variant="sponsored">Sponsored</Typography>
            </Stack>
        </Stack>
    );
}
