import { useState } from 'react';

// Material
import {
    Avatar,
    Button,
    Chip,
    Grid,
    Link,
    Stack,
    Typography
} from '@mui/material';

// Components
import TrustSetDialog from 'src/components/TrustSetDialog';

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
        ext,
        md5,
        tags,
        social
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
            {trustToken && <TrustSetDialog token={trustToken} setToken={setTrustToken} /> }

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
                    <Link
                        underline="none"
                        color="inherit"
                        // target="_blank"
                        href={`/buy-xrp`}
                        rel="noreferrer noopener nofollow"
                    >
                        <Button
                            variant="outlined"
                            color='primary'
                            size="small"
                        >
                            Buy XRP
                        </Button>
                    </Link>
                </Grid>

                
            </Grid>

            <Stack direction='row' alignItems='center' sx={{mt:1}}>
                <Avatar sx={{ width: 24, height: 24 }} src="/static/sponsor.png"/>
                <Typography variant="sponsored">Sponsored</Typography>
            </Stack>
        </Stack>
    );
}
