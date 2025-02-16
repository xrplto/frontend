import { useEffect, useState } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import calendarIcon from '@iconify/icons-ph/calendar-thin';
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
import { useContext } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { AppContext } from 'src/AppContext';
import Decimal from 'decimal.js';

// ----------------------------------------------------------------------
export default function ExtraButtons({ token }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    <Stack
      alignItems="center"
      spacing={isMobile ? 1.5 : 1}
      sx={{
        position: 'relative',
        width: '100%',
        p: isMobile ? 1 : 0
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

      <Grid
        container
        direction="row"
        spacing={isMobile ? 1 : 0.5}
        sx={{
          justifyContent: 'flex-end',
          width: '100%'
        }}
      >
        <Grid item xs={isMobile ? 12 : 'auto'}>
          <Button
            variant="contained"
            onClick={handleSetTrust}
            color={`${isRemove ? 'error' : 'primary'}`}
            size={isMobile ? 'medium' : 'small'}
            fullWidth={isMobile}
            disabled={CURRENCY_ISSUERS.XRP_MD5 === md5}
            sx={{
              minWidth: isMobile ? '100%' : 'auto',
              px: isMobile ? 2 : 2,
              py: isMobile ? 1 : 0.75,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              transition: 'all 0.3s ease',
              background: (theme) => `linear-gradient(45deg, 
                ${isRemove ? theme.palette.error.main : theme.palette.primary.main} 0%, 
                ${alpha(isRemove ? theme.palette.error.main : theme.palette.primary.main, 0.8)} 25%,
                ${alpha(
                  isRemove ? theme.palette.error.light : theme.palette.primary.light,
                  0.9
                )} 50%,
                ${alpha(isRemove ? theme.palette.error.main : theme.palette.primary.main, 0.8)} 75%,
                ${isRemove ? theme.palette.error.main : theme.palette.primary.main} 100%)`,
              backgroundSize: '200% 200%',
              animation: 'gradient 5s ease infinite',
              fontSize: isMobile ? '0.9rem' : 'inherit',
              fontWeight: isMobile ? 500 : 500,
              boxShadow: (theme) => `
                0 0 8px ${alpha(
                  isRemove ? theme.palette.error.main : theme.palette.primary.main,
                  0.4
                )},
                0 0 16px ${alpha(
                  isRemove ? theme.palette.error.main : theme.palette.primary.main,
                  0.2
                )},
                0 0 24px ${alpha(
                  isRemove ? theme.palette.error.main : theme.palette.primary.main,
                  0.1
                )}
              `,
              '@keyframes gradient': {
                '0%': {
                  backgroundPosition: '0% 50%'
                },
                '50%': {
                  backgroundPosition: '100% 50%'
                },
                '100%': {
                  backgroundPosition: '0% 50%'
                }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: (theme) =>
                  `radial-gradient(circle, ${alpha(
                    isRemove ? theme.palette.error.light : theme.palette.primary.light,
                    0.15
                  )} 0%, transparent 70%)`,
                animation: 'rotate 4s linear infinite',
                opacity: 0,
                transition: 'opacity 0.3s ease'
              },
              '@keyframes rotate': {
                '0%': {
                  transform: 'rotate(0deg)'
                },
                '100%': {
                  transform: 'rotate(360deg)'
                }
              },
              '&:hover': {
                transform: 'translateY(-2px) scale(1.02)',
                boxShadow: (theme) => `
                  0 0 15px ${alpha(
                    isRemove ? theme.palette.error.main : theme.palette.primary.main,
                    0.6
                  )},
                  0 0 30px ${alpha(
                    isRemove ? theme.palette.error.main : theme.palette.primary.main,
                    0.4
                  )},
                  0 0 45px ${alpha(
                    isRemove ? theme.palette.error.main : theme.palette.primary.main,
                    0.3
                  )}
                `,
                '&::before': {
                  opacity: 1
                }
              },
              '&:active': {
                transform: 'translateY(0)'
              },
              '&.Mui-disabled': {
                background: (theme) => theme.palette.action.disabledBackground,
                boxShadow: 'none'
              }
            }}
          >
            {`${isRemove ? 'Remove' : 'Set'} Trustline`}
          </Button>
        </Grid>
      </Grid>

      {token.date && (
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{
            backgroundColor: darkMode ? 'rgba(145, 158, 171, 0.08)' : 'rgba(145, 158, 171, 0.08)',
            borderRadius: '4px',
            px: isMobile ? 1.5 : 1,
            py: isMobile ? 0.75 : 0.5,
            alignSelf: isMobile ? 'stretch' : 'flex-end',
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'center' : 'flex-start',
            mt: isMobile ? 0.5 : 0
          }}
        >
          <Icon
            icon={calendarIcon}
            width={isMobile ? 16 : 14}
            height={isMobile ? 16 : 14}
            style={{ color: theme.palette.text.secondary }}
          />
          <Typography
            variant={isMobile ? 'body2' : 'caption'}
            noWrap
            sx={{
              fontSize: isMobile ? '0.8rem' : '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.2px',
              color: 'text.secondary',
              textTransform: 'uppercase'
            }}
          >
            Created:
          </Typography>
          <Typography
            variant={isMobile ? 'body2' : 'caption'}
            noWrap
            sx={{
              fontSize: isMobile ? '0.8rem' : '0.75rem',
              color: 'text.primary',
              fontWeight: 400
            }}
          >
            {token.date}
          </Typography>
        </Stack>
      )}

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{
          width: '100%',
          justifyContent: isMobile ? 'center' : 'flex-end',
          mt: isMobile ? 1 : 0
        }}
      >
        <LazyLoadImage
          src={darkMode ? '/static/sponsor-dark-theme.svg' : '/static/sponsor-light-theme.svg'}
          width={isMobile ? 20 : 20}
          height={isMobile ? 20 : 20}
        />
        <Typography
          variant="sponsored"
          sx={{
            fontSize: isMobile ? '0.8rem' : '0.75rem',
            fontWeight: isMobile ? 400 : 400
          }}
        >
          Sponsored
        </Typography>
      </Stack>
    </Stack>
  );
}
