import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import { alpha } from '@mui/material/styles';

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
import Image from 'next/image';
import { AppContext } from 'src/AppContext';
import Decimal from 'decimal.js';

// ----------------------------------------------------------------------
export default function ExtraButtons({ token }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [trustToken, setTrustToken] = useState(null);
  const [isRemove, setIsRemove] = useState(false);
  const [balance, setBalance] = useState(0);
  const [limit, setLimit] = useState(0);

  const { darkMode, accountProfile, sync } = useContext(AppContext);
  const { issuer, currency, md5 } = token;

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
  }, [trustToken, accountProfile, sync, issuer, currency]);

  const handleSetTrust = () => {
    setTrustToken(token);
  };

  return (
    <Stack
      alignItems={isMobile ? 'stretch' : 'flex-end'}
      spacing={isMobile ? 0.25 : 0.5}
      sx={{
        position: 'relative',
        width: '100%',
        p: 0
      }}
    >
      {trustToken && (
        <TrustSetDialog
          balance={balance}
          limit={limit}
          token={trustToken}
          setToken={setTrustToken}
        />
      )}

      <Stack
        direction={isMobile ? 'row' : 'column'}
        alignItems={isMobile ? 'center' : 'flex-end'}
        spacing={isMobile ? 1 : 0.5}
        sx={{ width: '100%' }}
      >
        <Button
          variant="contained"
          onClick={handleSetTrust}
          color={isRemove ? 'error' : 'primary'}
          size="small"
          fullWidth={isMobile}
          disabled={CURRENCY_ISSUERS.XRP_MD5 === md5}
          sx={{
            px: isMobile ? 1 : 1.5,
            py: isMobile ? 0.375 : 0.5,
            minHeight: isMobile ? 28 : 32,
            borderRadius: 1,
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: 500,
            textTransform: 'none',
            flex: isMobile ? 1 : 'none',
            background: (theme) =>
              `linear-gradient(135deg, 
                ${isRemove ? theme.palette.error.main : theme.palette.primary.main}, 
                ${isRemove ? theme.palette.error.dark : theme.palette.primary.dark})`,
            boxShadow: (theme) =>
              `0 2px 8px ${alpha(
                isRemove ? theme.palette.error.main : theme.palette.primary.main,
                isMobile ? 0.2 : 0.3
              )}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: isMobile ? 'none' : 'translateY(-1px)',
              boxShadow: (theme) =>
                `0 4px 12px ${alpha(
                  isRemove ? theme.palette.error.main : theme.palette.primary.main,
                  0.4
                )}`
            },
            '&:active': {
              transform: 'translateY(0)'
            }
          }}
        >
          {`${isRemove ? 'Remove' : 'Set'} Trustline`}
        </Button>

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.25}
          sx={{
            opacity: 0.7,
            '&:hover': { opacity: 1 },
            ml: isMobile ? 'auto' : 0
          }}
        >
          <Image
            src={darkMode ? '/static/sponsor-dark-theme.svg' : '/static/sponsor-light-theme.svg'}
            width={isMobile ? 12 : 16}
            height={isMobile ? 12 : 16}
            alt="Sponsor"
          />
          <Typography
            variant="caption"
            sx={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: 400,
              color: 'text.secondary'
            }}
          >
            Sponsored
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}
