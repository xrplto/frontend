import axios from 'axios';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { styled, alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Link,
  Paper,
  Stack,
  Tooltip,
  Typography,
  Fade,
  Zoom
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import linkExternal from '@iconify/icons-charm/link-external';
import paperIcon from '@iconify/icons-akar-icons/paper';
import copyIcon from '@iconify/icons-fad/copy';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { fNumber, fIntNumber, fNumberWithCurreny } from 'src/utils/formatNumber';
import LogoTrustline from 'src/components/LogoTrustline';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { currencySymbols } from 'src/utils/constants';
import Decimal from 'decimal.js';

import PersonIcon from '@mui/icons-material/Person';
import TokenIcon from '@mui/icons-material/Token';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VerifiedIcon from '@mui/icons-material/Verified';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';

// Styled Components
const MainWrapper = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.95)} 0%, 
    ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
  backdropFilter: 'blur(20px)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 20% 80%, ${alpha(
      theme.palette.primary.main,
      0.08
    )} 0%, transparent 50%),
                 radial-gradient(circle at 80% 20%, ${alpha(
                   theme.palette.success.main,
                   0.06
                 )} 0%, transparent 50%)`,
    pointerEvents: 'none'
  }
}));

const HeroCard = styled(Card)(({ theme }) => ({
  borderRadius: '24px',
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.95)} 0%, 
    ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
    theme.palette.primary.main,
    0.04
  )}`,
  overflow: 'hidden',
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 16px ${alpha(
      theme.palette.primary.main,
      0.1
    )}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
    opacity: 0.8
  }
}));

const StatsCard = styled(Card)(({ theme }) => ({
  borderRadius: '20px',
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.9)} 0%, 
    ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}, 0 2px 8px ${alpha(
    theme.palette.primary.main,
    0.05
  )}`,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 16px ${alpha(
      theme.palette.primary.main,
      0.1
    )}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
    opacity: 0.8
  }
}));

const MetricCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(2),
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.8)} 0%, 
    ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '2px',
    background: `linear-gradient(90deg, 
      ${theme.palette.primary.main} 0%, 
      ${theme.palette.success.main} 100%)`,
    transform: 'scaleX(0)',
    transformOrigin: 'left',
    transition: 'transform 0.3s ease'
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.1)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
    '&::before': {
      transform: 'scaleX(1)'
    }
  }
}));

const QRSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.04)} 0%, 
    ${alpha(theme.palette.primary.main, 0.01)} 100%)`,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(3),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    background: `radial-gradient(circle, ${alpha(
      theme.palette.primary.main,
      0.1
    )} 0%, transparent 70%)`,
    borderRadius: '50%'
  }
}));

const SocialButton = styled(IconButton)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: theme.spacing(1.5),
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.8)} 0%, 
    ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px) scale(1.05)',
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.15)} 0%, 
      ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.2)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
  }
}));

const AnimatedChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  fontWeight: 600,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.8)} 0%, 
    ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:hover': {
    transform: 'scale(1.05) translateY(-1px)',
    boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.2)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
  }
}));

const GlowingButton = styled(LoadingButton)(({ theme, glowcolor }) => ({
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1.5, 4),
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'none',
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(135deg, 
    ${glowcolor || theme.palette.primary.main} 0%, 
    ${alpha(glowcolor || theme.palette.primary.main, 0.8)} 100%)`,
  boxShadow: `0 4px 15px ${alpha(glowcolor || theme.palette.primary.main, 0.4)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.2)}, transparent)`,
    transition: 'left 0.5s ease'
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 25px ${alpha(glowcolor || theme.palette.primary.main, 0.6)}`,
    '&::before': {
      left: '100%'
    }
  },
  '&:active': {
    transform: 'translateY(0)'
  }
}));

const Label = styled(Typography)(({ theme }) => ({
  color: alpha(theme.palette.text.secondary, 0.8),
  fontWeight: 600,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: theme.spacing(0.5)
}));

const ValueText = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1rem',
  color: theme.palette.text.primary
}));

const TruncatedTypography = styled(Typography)(({ theme }) => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}));

const normalizeTag = (tag) =>
  tag && tag.length > 0
    ? tag
        .split(' ')
        .join('-')
        .replace(/&/g, 'and')
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-]/g, '')
    : '';

const TrustLine = (props) => {
  const BASE_URL = process.env.API_URL;
  const QR_BLUR = '/static/blurqr.webp';
  const { accountProfile, openSnackbar, activeFiatCurrency } = useContext(AppContext);
  const data = props.data || {};
  const token = data.token || {};
  const info = token?.issuer_info || {};
  const [qrUrl, setQrUrl] = useState(QR_BLUR);
  const [uuid, setUuid] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState(150);
  const metrics = useSelector(selectMetrics);

  const imgUrl = useMemo(() => `https://s1.xrpl.to/token/${token.md5}`, [token.md5]);
  const user = token.user || token.name;
  const marketcap = (token.amount * token.exch) / metrics.USD;
  const voldivmarket = marketcap > 0 ? Decimal.div(token.vol24hxrp, marketcap).toNumber() : 0;
  const convertedMarketCap = Decimal.div(marketcap, metrics[activeFiatCurrency]).toNumber();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!uuid) return;

    let timer, dispatchTimer;
    const getPayload = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
        if (res.data.data.response.resolved_at) {
          startInterval();
          return;
        }
      } catch (err) {
        setCounter((prevCounter) => prevCounter - 1);
        if (counter <= 0) handleScanQRClose();
      }
    };

    const startInterval = () => {
      let times = 0;
      dispatchTimer = setInterval(async () => {
        try {
          const res = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
          if (res.data.data.response.dispatched_result === 'tesSUCCESS') {
            setSync((prevSync) => prevSync + 1);
            openSnackbar('Successfully set trustline!', 'success');
            stopInterval();
          } else if (++times >= 10) {
            openSnackbar('Operation rejected!', 'error');
            stopInterval();
          }
        } catch (err) {
          stopInterval();
        }
      }, 1000);
    };

    const stopInterval = () => {
      clearInterval(dispatchTimer);
      handleScanQRClose();
    };

    timer = setInterval(getPayload, 2000);
    return () => {
      clearInterval(timer);
      clearInterval(dispatchTimer);
    };
  }, [uuid, counter, BASE_URL, openSnackbar]);

  const onTrustSetXumm = useCallback(async () => {
    setCounter(150);
    setLoading(true);
    try {
      const LimitAmount = {
        issuer: token.issuer,
        currency: token.currency,
        value: new Decimal(token.amount).toDP(0, Decimal.ROUND_DOWN).toNumber()
      };
      const res = await axios.post(`${BASE_URL}/xumm/trustset`, { LimitAmount, Flags: 0x00020000 });
      if (res.status === 200) {
        setUuid(res.data.data.uuid);
        setQrUrl(res.data.data.qrUrl);
        setNextUrl(res.data.data.next);
      }
    } catch (err) {
      openSnackbar('Network error!', 'error');
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, token.amount, token.currency, token.issuer, openSnackbar]);

  const onDisconnectXumm = useCallback(async () => {
    setLoading(true);
    try {
      await axios.delete(`${BASE_URL}/xumm/logout/${uuid}`);
      setUuid(null);
    } catch (err) {
      // handle error if needed
    } finally {
      setQrUrl(QR_BLUR);
      setUuid(null);
      setNextUrl(null);
      setLoading(false);
    }
  }, [BASE_URL, uuid]);

  const handleScanQRClose = useCallback(() => {
    onDisconnectXumm(uuid);
  }, [onDisconnectXumm, uuid]);

  const handleDelete = () => {};

  const handleTrustSet = () => {
    if (uuid) onDisconnectXumm(uuid);
    else onTrustSetXumm();
  };

  return (
    <MainWrapper>
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <Fade in timeout={800}>
          <Stack alignItems="center" spacing={3} sx={{ mb: 4 }}>
            <LogoTrustline />
            <Stack alignItems="center" spacing={1}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textAlign: 'center'
                }}
              >
                Establish TrustLine
              </Typography>
              <Typography variant="h6" color="text.secondary" textAlign="center">
                Connect securely with {token.name} on the XRP Ledger
              </Typography>
            </Stack>
          </Stack>
        </Fade>

        {/* Main Content */}
        <Grid container spacing={4}>
          {/* Token Information Card */}
          <Grid item xs={12} lg={8}>
            <Zoom in timeout={1000}>
              <HeroCard>
                <CardContent sx={{ p: 4 }}>
                  {/* Token Header */}
                  <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
                    <Avatar
                      alt={`${user} ${token.name} Logo`}
                      src={imgUrl}
                      sx={{
                        width: 80,
                        height: 80,
                        border: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`
                      }}
                    />
                    <Stack spacing={1} sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {user}
                        </Typography>
                        {token.kyc && (
                          <Tooltip title="KYC Verified">
                            <VerifiedIcon color="success" />
                          </Tooltip>
                        )}
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <AnimatedChip
                          variant="filled"
                          icon={<TokenIcon />}
                          label={token.name}
                          color="primary"
                          size="small"
                        />
                        <AnimatedChip
                          variant="outlined"
                          label={`Rank #${token.id}`}
                          color="secondary"
                          size="small"
                        />
                      </Stack>
                    </Stack>
                  </Stack>

                  {/* Links Section */}
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 4 }}>
                    {token.domain && (
                      <Link
                        underline="none"
                        target="_blank"
                        href={`https://${token.domain}`}
                        rel="noreferrer noopener nofollow"
                      >
                        <AnimatedChip
                          label={token.domain}
                          size="small"
                          deleteIcon={<Icon icon={linkExternal} width="14" height="14" />}
                          onDelete={handleDelete}
                          onClick={handleDelete}
                          icon={<Icon icon={link45deg} width="14" height="14" />}
                          variant="outlined"
                          clickable
                        />
                      </Link>
                    )}
                    {token.whitepaper && (
                      <Link
                        underline="none"
                        target="_blank"
                        href={token.whitepaper}
                        rel="noreferrer noopener nofollow"
                      >
                        <AnimatedChip
                          label="Whitepaper"
                          size="small"
                          deleteIcon={<Icon icon={linkExternal} width="14" height="14" />}
                          onDelete={handleDelete}
                          onClick={handleDelete}
                          icon={<Icon icon={paperIcon} width="14" height="14" />}
                          variant="outlined"
                          clickable
                        />
                      </Link>
                    )}
                  </Stack>

                  {/* Quick Stats */}
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={6} sm={3}>
                      <MetricCard elevation={0}>
                        <Stack alignItems="center" spacing={1}>
                          <PeopleIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
                          <ValueText>{fIntNumber(token.holders)}</ValueText>
                          <Label>Holders</Label>
                        </Stack>
                      </MetricCard>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <MetricCard elevation={0}>
                        <Stack alignItems="center" spacing={1}>
                          <BarChartIcon
                            sx={{ color: theme.palette.secondary.main, fontSize: 24 }}
                          />
                          <ValueText>{fIntNumber(token.offers)}</ValueText>
                          <Label>Offers</Label>
                        </Stack>
                      </MetricCard>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <MetricCard elevation={0}>
                        <Stack alignItems="center" spacing={1}>
                          <ShowChartIcon sx={{ color: theme.palette.success.main, fontSize: 24 }} />
                          <ValueText>{fNumber(token.vol24htx)}</ValueText>
                          <Label>Trades</Label>
                        </Stack>
                      </MetricCard>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <MetricCard elevation={0}>
                        <Stack alignItems="center" spacing={1}>
                          <TrendingUpIcon sx={{ color: theme.palette.info.main, fontSize: 24 }} />
                          <ValueText>{fIntNumber(token.trustlines)}</ValueText>
                          <Label>TrustLines</Label>
                        </Stack>
                      </MetricCard>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  {/* Token Details */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={3}>
                        {/* Issuer */}
                        <Box>
                          <Label>Token Issuer</Label>
                          <Link
                            underline="none"
                            target="_blank"
                            href={`https://bithomp.com/explorer/${token.issuer}`}
                            rel="noreferrer noopener nofollow"
                          >
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, 
                                ${alpha(theme.palette.background.paper, 0.8)} 0%, 
                                ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  background: `linear-gradient(135deg, 
                                  ${alpha(theme.palette.primary.main, 0.08)} 0%, 
                                  ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                                  transform: 'translateX(4px)',
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                }
                              }}
                            >
                              <PersonIcon color="primary" />
                              <TruncatedTypography variant="body2" sx={{ flex: 1 }}>
                                {token.issuer}
                              </TruncatedTypography>
                              <Avatar
                                alt="Bithomp Explorer"
                                src="/static/bithomp.ico"
                                sx={{ width: 24, height: 24 }}
                              />
                            </Stack>
                          </Link>
                        </Box>

                        {/* Currency */}
                        <Box>
                          <Label>Currency Code</Label>
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              background: `linear-gradient(135deg, 
                              ${alpha(theme.palette.background.paper, 0.8)} 0%, 
                              ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`
                            }}
                          >
                            <LocalAtmIcon color="secondary" />
                            <ValueText sx={{ flex: 1 }}>{token.currency}</ValueText>
                            <CopyToClipboard
                              text={token.currency}
                              onCopy={() => openSnackbar('Copied!', 'success')}
                            >
                              <Tooltip title="Copy Currency Code">
                                <IconButton
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.15)
                                    }
                                  }}
                                >
                                  <Icon icon={copyIcon} />
                                </IconButton>
                              </Tooltip>
                            </CopyToClipboard>
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Stack spacing={3}>
                        {/* Market Cap */}
                        <Box>
                          <Label>Market Cap</Label>
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              background: `linear-gradient(135deg, 
                              ${alpha(theme.palette.background.paper, 0.8)} 0%, 
                              ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                            }}
                          >
                            <AccountBalanceIcon color="success" />
                            <ValueText>
                              {currencySymbols[activeFiatCurrency]} {fNumber(convertedMarketCap)}
                            </ValueText>
                          </Stack>
                        </Box>

                        {/* Security Status */}
                        <Box>
                          <Label>Security Status</Label>
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              background: `linear-gradient(135deg, 
                              ${alpha(theme.palette.background.paper, 0.8)} 0%, 
                              ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${alpha(
                                info.blackholed
                                  ? theme.palette.success.main
                                  : theme.palette.warning.main,
                                0.1
                              )}`
                            }}
                          >
                            <SecurityIcon color={info.blackholed ? 'success' : 'warning'} />
                            <ValueText>
                              {info.blackholed ? 'Blackholed (Secure)' : 'Not Blackholed'}
                            </ValueText>
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* Detailed Stats */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Market Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={4}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, 
                            ${alpha(theme.palette.background.paper, 0.8)} 0%, 
                            ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.1)}`
                            }
                          }}
                        >
                          <Label>24H Volume</Label>
                          <ValueText color="primary">
                            {currencySymbols[activeFiatCurrency]}{' '}
                            {fNumberWithCurreny(token.vol24hxrp, metrics[activeFiatCurrency])}
                          </ValueText>
                          <Typography variant="body2" color="text.secondary">
                            {fNumber(token.vol24hx)} {token.name}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, 
                            ${alpha(theme.palette.background.paper, 0.8)} 0%, 
                            ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.1)}`
                            }
                          }}
                        >
                          <Label>Volume/Market Cap</Label>
                          <ValueText color="primary">{fNumber(voldivmarket)}</ValueText>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, 
                            ${alpha(theme.palette.background.paper, 0.8)} 0%, 
                            ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.1)}`
                            }
                          }}
                        >
                          <Label>Market Dominance</Label>
                          <ValueText color="primary">{fNumber(token.dom)}%</ValueText>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, 
                            ${alpha(theme.palette.background.paper, 0.8)} 0%, 
                            ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.1)}`
                            }
                          }}
                        >
                          <Label>Circulating Supply</Label>
                          <ValueText color="primary">{fNumber(token.supply)}</ValueText>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, 
                            ${alpha(theme.palette.background.paper, 0.8)} 0%, 
                            ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.1)}`
                            }
                          }}
                        >
                          <Label>Total Supply</Label>
                          <ValueText color="primary">{fNumber(token.amount)}</ValueText>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, 
                            ${alpha(theme.palette.background.paper, 0.8)} 0%, 
                            ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.1)}`
                            }
                          }}
                        >
                          <Label>Created On</Label>
                          <ValueText color="primary">{token.date}</ValueText>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </HeroCard>
            </Zoom>
          </Grid>

          {/* QR Code Section */}
          <Grid item xs={12} lg={4}>
            <Zoom in timeout={1200}>
              <StatsCard>
                <CardContent sx={{ p: 3 }}>
                  <QRSection>
                    <Stack alignItems="center" spacing={3}>
                      <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
                        Scan QR Code
                      </Typography>

                      <Box
                        component="img"
                        alt="XUMM QR Code"
                        src={qrUrl}
                        sx={{
                          width: '100%',
                          maxWidth: 240,
                          height: 'auto',
                          borderRadius: 3,
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.2)}`
                        }}
                      />

                      <Stack spacing={2} sx={{ width: '100%' }}>
                        <GlowingButton
                          fullWidth
                          size="large"
                          onClick={handleTrustSet}
                          loading={loading}
                          variant="contained"
                          glowcolor={uuid ? theme.palette.error.main : theme.palette.primary.main}
                        >
                          {uuid ? `Cancel (${counter})` : 'Generate QR Code'}
                        </GlowingButton>

                        {nextUrl && (
                          <Link
                            underline="none"
                            target="_blank"
                            href={nextUrl}
                            rel="noreferrer noopener nofollow"
                          >
                            <Button
                              fullWidth
                              size="large"
                              variant="outlined"
                              sx={{ borderRadius: 2 }}
                            >
                              Open in XUMM
                            </Button>
                          </Link>
                        )}
                      </Stack>
                    </Stack>
                  </QRSection>
                </CardContent>
              </StatsCard>
            </Zoom>
          </Grid>
        </Grid>

        {/* Social Links */}
        {token.social && Object.keys(token.social).length > 0 && (
          <Fade in timeout={1400}>
            <Card
              sx={{
                mt: 4,
                borderRadius: '24px',
                background: `linear-gradient(135deg, 
                ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                boxShadow: `0 8px 32px ${alpha(
                  theme.palette.common.black,
                  0.06
                )}, 0 2px 8px ${alpha(theme.palette.primary.main, 0.04)}`,
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                  opacity: 0.8
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.primary.main,
                        0.15
                      )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                    }}
                  >
                    <PeopleIcon
                      sx={{
                        color: theme.palette.primary.main,
                        fontSize: '1.5rem',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      fontSize: '1.1rem',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    Social Links
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
                  {token.social?.telegram && (
                    <Link
                      underline="none"
                      target="_blank"
                      href={`https://t.me/${token.social.telegram}`}
                      rel="noreferrer noopener nofollow"
                    >
                      <SocialButton>
                        <Avatar
                          alt="Telegram"
                          src="/static/telegram.webp"
                          sx={{ width: 28, height: 28 }}
                        />
                      </SocialButton>
                    </Link>
                  )}
                  {token.social?.discord && (
                    <Link
                      underline="none"
                      target="_blank"
                      href={`https://discord.gg/${token.social.discord}`}
                      rel="noreferrer noopener nofollow"
                    >
                      <SocialButton>
                        <Avatar
                          alt="Discord"
                          src="/static/discord.webp"
                          sx={{ width: 28, height: 28 }}
                        />
                      </SocialButton>
                    </Link>
                  )}
                  {token.social?.twitter && (
                    <Link
                      underline="none"
                      target="_blank"
                      href={`https://twitter.com/${token.social.twitter}`}
                      rel="noreferrer noopener nofollow"
                    >
                      <SocialButton>
                        <Avatar
                          alt="Twitter"
                          src="/static/twitter.webp"
                          sx={{ width: 28, height: 28 }}
                        />
                      </SocialButton>
                    </Link>
                  )}
                  {token.social?.facebook && (
                    <Link
                      underline="none"
                      target="_blank"
                      href={`https://facebook.com/${token.social.facebook}`}
                      rel="noreferrer noopener nofollow"
                    >
                      <SocialButton>
                        <Avatar
                          alt="Facebook"
                          src="/static/facebook.webp"
                          sx={{ width: 28, height: 28 }}
                        />
                      </SocialButton>
                    </Link>
                  )}
                  {token.social?.linkedin && (
                    <Link
                      underline="none"
                      target="_blank"
                      href={`https://linkedin.com/${token.social.linkedin}`}
                      rel="noreferrer noopener nofollow"
                    >
                      <SocialButton>
                        <Avatar
                          alt="LinkedIn"
                          src="/static/linkedin.webp"
                          sx={{ width: 28, height: 28 }}
                        />
                      </SocialButton>
                    </Link>
                  )}
                  {token.social?.instagram && (
                    <Link
                      underline="none"
                      target="_blank"
                      href={`https://instagram.com/${token.social.instagram}`}
                      rel="noreferrer noopener nofollow"
                    >
                      <SocialButton>
                        <Avatar
                          alt="Instagram"
                          src="/static/instagram.webp"
                          sx={{ width: 28, height: 28 }}
                        />
                      </SocialButton>
                    </Link>
                  )}
                  {token.social?.youtube && (
                    <Link
                      underline="none"
                      target="_blank"
                      href={`https://youtube.com/${token.social.youtube}`}
                      rel="noreferrer noopener nofollow"
                    >
                      <SocialButton>
                        <Avatar
                          alt="YouTube"
                          src="/static/youtube.webp"
                          sx={{ width: 28, height: 28 }}
                        />
                      </SocialButton>
                    </Link>
                  )}
                  {token.social?.medium && (
                    <Link
                      underline="none"
                      target="_blank"
                      href={`https://medium.com/${token.social.medium}`}
                      rel="noreferrer noopener nofollow"
                    >
                      <SocialButton>
                        <Avatar
                          alt="Medium"
                          src="/static/medium.webp"
                          sx={{ width: 28, height: 28 }}
                        />
                      </SocialButton>
                    </Link>
                  )}
                  {token.social?.twitch && (
                    <Link
                      underline="none"
                      target="_blank"
                      href={`https://twitch.tv/${token.social.twitch}`}
                      rel="noreferrer noopener nofollow"
                    >
                      <SocialButton>
                        <Avatar
                          alt="Twitch"
                          src="/static/twitch.webp"
                          sx={{ width: 28, height: 28 }}
                        />
                      </SocialButton>
                    </Link>
                  )}
                  {token.social?.tiktok && (
                    <Link
                      underline="none"
                      target="_blank"
                      href={`https://tiktok.com/${token.social.tiktok}`}
                      rel="noreferrer noopener nofollow"
                    >
                      <SocialButton>
                        <Avatar
                          alt="TikTok"
                          src="/static/tiktok.webp"
                          sx={{ width: 28, height: 28 }}
                        />
                      </SocialButton>
                    </Link>
                  )}
                  {token.social?.reddit && (
                    <Link
                      underline="none"
                      target="_blank"
                      href={`https://www.reddit.com/${token.social.reddit}`}
                      rel="noreferrer noopener nofollow"
                    >
                      <SocialButton>
                        <Avatar
                          alt="Reddit"
                          src="/static/reddit.svg"
                          sx={{ width: 28, height: 28 }}
                        />
                      </SocialButton>
                    </Link>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        )}

        {/* Tags Section */}
        {token.tags && token.tags.length > 0 && (
          <Fade in timeout={1600}>
            <Card
              sx={{
                mt: 4,
                borderRadius: '24px',
                background: `linear-gradient(135deg, 
                ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                boxShadow: `0 8px 32px ${alpha(
                  theme.palette.common.black,
                  0.06
                )}, 0 2px 8px ${alpha(theme.palette.primary.main, 0.04)}`,
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                  opacity: 0.8
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.success.main,
                        0.15
                      )} 0%, ${alpha(theme.palette.success.main, 0.08)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`
                    }}
                  >
                    <TokenIcon
                      sx={{
                        color: theme.palette.success.main,
                        fontSize: '1.5rem',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      fontSize: '1.1rem',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    Tags
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {token.tags.map((tag) => (
                    <Link
                      key={normalizeTag(tag)}
                      href={`/view/${normalizeTag(tag)}`}
                      underline="none"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <AnimatedChip
                        label={tag}
                        variant="outlined"
                        size="small"
                        clickable
                        sx={{ mb: 1 }}
                      />
                    </Link>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        )}
      </Container>
    </MainWrapper>
  );
};

export default TrustLine;

export async function getServerSideProps(ctx) {
  const BASE_URL = process.env.API_URL;
  let data = null;
  try {
    const slug = ctx.params.slug;
    const res = await axios.get(`${BASE_URL}/token/${slug}`);
    data = res.data;
  } catch (e) {
    console.log(e);
  }

  if (!data || !data.token) {
    return {
      redirect: {
        permanent: false,
        destination: '/404'
      }
    };
  }

  const token = data.token;
  const ogp = {
    canonical: `https://xrpl.to/trustset/${token.slug}`,
    title: `Establish a ${token.user} ${token.name} Trustline on the XRP Ledger`,
    url: `https://xrpl.to/trustset/${token.slug}`,
    imgUrl: `https://s1.xrpl.to/token/${token.md5}`,
    desc: `Easily set up a ${token.user} ${token.name} Trustline on the XRPL for secure and streamlined transactions.`
  };

  return {
    props: { data, ogp }
  };
}
