import { useEffect, useState } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import calendarIcon from '@iconify/icons-ph/calendar-thin';

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
import Decimal from 'decimal.js';

// ----------------------------------------------------------------------
export default function ExtraButtons({ token }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [trustToken, setTrustToken] = useState(null);
  const [lines, setLines] = useState([]);
  const [isRemove, setIsRemove] = useState(false);
  const [balance, setBalance] = useState(0);
  const [limit, setLimit] = useState(0);

  // Step 2: Access the darkMode variable from AppContext
  const { darkMode, accountProfile, sync } = useContext(AppContext);

  const {
    id,
    issuer,
    name,
    currency,
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

  useEffect(() => {
    if (!accountProfile) return;
    axios
      .get(`${BASE_URL}/account/lines/${accountProfile?.account}`)
      .then((res) => {
        let ret = res.status === 200 ? res.data : undefined;
        if (ret) {
          const trustlines = ret.lines;

          const trustlineToRemove = trustlines.find((trustline) => {
            return (
              (trustline.LowLimit.issuer === issuer || trustline.HighLimit.issuer === issuer) &&
              trustline.LowLimit.currency === currency
            );
          });

          if (trustlineToRemove) {
            setBalance(Decimal.abs(trustlineToRemove.Balance.value).toString());
            setLimit(trustlineToRemove.HighLimit.value);
          }

          setIsRemove(trustlineToRemove);
        }
      })
      .catch((err) => {
        console.log('Error on getting account lines!!!', err);
      });
  }, [trustToken, accountProfile, sync]);

  const handleSetTrust = (e) => {
    setTrustToken(token);
  };

  const handleByCrypto = (e) => {};

  return (
    <Stack alignItems="center" spacing={1} sx={{ position: 'relative', width: '100%' }}>
      {trustToken && (
        <TrustSetDialog
          balance={balance}
          limit={limit}
          token={trustToken}
          setToken={setTrustToken}
        />
      )}

      {token.date && (
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: darkMode ? 'rgba(145, 158, 171, 0.08)' : 'rgba(145, 158, 171, 0.08)',
            borderRadius: '6px',
            px: 1,
            py: 0.5,
            zIndex: 1
          }}
        >
          <Icon
            icon={calendarIcon}
            width={14}
            height={14}
            style={{ color: theme.palette.text.secondary }}
          />
          <Typography
            variant="caption"
            noWrap
            sx={{
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.2px',
              color: 'text.secondary',
              textTransform: 'uppercase'
            }}
          >
            Created:
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{
              fontSize: '0.75rem',
              color: 'text.primary',
              fontWeight: 400
            }}
          >
            {token.date}
          </Typography>
        </Stack>
      )}

      <Grid container direction="row" spacing={0.5} sx={{ mt: 4 }}>
        <Grid item>
          <Button
            variant="contained"
            onClick={handleSetTrust}
            color={`${isRemove ? 'error' : 'primary'}`}
            size="small"
            disabled={CURRENCY_ISSUERS.XRP_MD5 === md5}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            {`${isRemove ? 'Remove' : 'Set'} Trustline`}
          </Button>
        </Grid>

        <Grid item>
          <Link
            underline="none"
            color="inherit"
            href={`/buy-xrp`}
            rel="noreferrer noopener nofollow"
          >
            <Button
              variant="outlined"
              color="primary"
              size="small"
              sx={{ minWidth: 'auto', px: 1 }}
            >
              Buy XRP
            </Button>
          </Link>
        </Grid>
      </Grid>

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{
          width: isTablet ? '100%' : 'auto',
          justifyContent: isTablet ? 'flex-end' : 'flex-start'
        }}
      >
        <LazyLoadImage
          src={darkMode ? '/static/sponsor-dark-theme.svg' : '/static/sponsor-light-theme.svg'}
          width={20}
          height={20}
        />
        <Typography variant="sponsored" sx={{ fontSize: '0.75rem' }}>
          Sponsored
        </Typography>
      </Stack>
    </Stack>
  );
}
