import { useState } from 'react';
import axios from 'axios';

// Material
import {
  Avatar,
  Button,
  Chip,
  Grid,
  Link,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { CURRENCY_ISSUERS } from 'src/utils/constants';

// Components
import TrustSetDialog from 'src/components/TrustSetDialog';

// Step 1: Import the necessary dependencies
import { useContext } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { AppContext } from 'src/AppContext';

// ----------------------------------------------------------------------
export default function ExtraButtons({ token }) {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [trustToken, setTrustToken] = useState(null);
  const [lines, setLines] = useState([]);

  // Step 2: Access the darkMode variable from AppContext
  const { darkMode } = useContext(AppContext);

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
  };

  const handleByCrypto = (e) => {};

  return (
    <Stack alignItems="center">
      {trustToken && (
        <TrustSetDialog
          token={trustToken}
          setToken={setTrustToken}
        />
      )}

      <Grid container direction="row" spacing={1}>
        <Grid item>
          <Button
            variant="contained"
            onClick={handleSetTrust}
            color="primary"
            size="small"
            disabled={CURRENCY_ISSUERS.XRP_MD5 === md5}
          >
            Set Trustline
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
            <Button variant="outlined" color="primary" size="small">
              Buy XRP
            </Button>
          </Link>
        </Grid>
      </Grid>

      <Stack
        direction="row"
        alignItems="center"
        sx={{ mt: 1, width: isTablet ? '100%' : 'auto' }}
        justifyContent={isTablet ? 'flex-end' : 'flex-start'}
      >
        {/* Step 4: Use darkMode to select the appropriate image */}
        <LazyLoadImage
          src={darkMode ? "/static/sponsor-dark-theme.svg" : "/static/sponsor-light-theme.svg"}
          width={24}
          height={24}
        />
        <Typography variant="sponsored">Sponsored</Typography>
      </Stack>
    </Stack>
  );
}
