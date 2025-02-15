import axios from 'axios';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { styled, alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Grid,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography
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

const OverviewWrapper = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  justifyContent: 'center',
  display: 'flex',
  flex: 1,
  overflowX: 'hidden',
  color: theme.palette.text.primary, // Use theme text color
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.default // Use theme background color
}));

const Label = styled(Typography)(({ theme }) => ({
  color: alpha('#637381', 0.99),
  marginBottom: theme.spacing(1)
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
  // const activeFiatCurrency = useSelector(selectActiveFiatCurrency);

  const imgUrl = useMemo(() => `https://s1.xrpl.to/token/${token.md5}`, [token.md5]);
  const user = token.user || token.name;
  const marketcap = (token.amount * token.exch) / metrics.USD;
  const voldivmarket = marketcap > 0 ? Decimal.div(token.vol24hxrp, marketcap).toNumber() : 0;
  const convertedMarketCap = Decimal.div(marketcap, metrics[activeFiatCurrency]).toNumber(); // .toFixed(5, Decimal.ROUND_DOWN)

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
    <OverviewWrapper>
      <Container maxWidth="md">
        <Stack alignItems="center" spacing={2} sx={{ mt: 2 }}>
          <LogoTrustline />
          <Typography variant="h4">Set {token.name} TrustLine</Typography>
        </Stack>

        <Card
          sx={{
            mt: 2,
            mb: 4,
            p: 2,
            borderRadius: 2,
            backgroundColor: (theme) => theme.palette.background.paper
          }}
        >
          <Stack alignItems="center" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                alt={`${user} ${token.name} Logo`}
                src={imgUrl}
                sx={{ width: 48, height: 48 }}
              />
              <Stack spacing={0.5}>
                <Typography variant="h5" color="primary">
                  {user}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip variant="outlined" icon={<TokenIcon />} label={token.name} size="small" />
                  {token.kyc && <Typography variant="subtitle2">KYC</Typography>}
                </Stack>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1}>
              {token.domain && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://${token.domain}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Chip
                    label={token.domain}
                    size="small"
                    deleteIcon={<Icon icon={linkExternal} width="14" height="14" />}
                    onDelete={handleDelete}
                    onClick={handleDelete}
                    icon={<Icon icon={link45deg} width="14" height="14" />}
                  />
                </Link>
              )}
              {token.whitepaper && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={token.whitepaper}
                  rel="noreferrer noopener nofollow"
                >
                  <Chip
                    label="Whitepaper"
                    size="small"
                    deleteIcon={<Icon icon={linkExternal} width="14" height="14" />}
                    onDelete={handleDelete}
                    onClick={handleDelete}
                    icon={<Icon icon={paperIcon} width="14" height="14" />}
                  />
                </Link>
              )}
            </Stack>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                width: '100%',
                justifyContent: 'center',
                py: 1
              }}
            >
              <Tooltip title="Rank by 24h Volume">
                <Chip label={`Rank #${token.id}`} color="primary" variant="outlined" size="small" />
              </Tooltip>
              <Chip
                label={`${fIntNumber(token.holders)} Holders`}
                color="error"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${fIntNumber(token.offers)} Offers`}
                color="warning"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${fNumber(token.vol24htx)} Trades`}
                color="secondary"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${fIntNumber(token.trustlines)} TrustLines`}
                color="info"
                variant="outlined"
                size="small"
              />
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              {token.social && token.social.telegram && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://t.me/${token.social.telegram}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Avatar
                    alt={`${user} ${token.name} Telegram Channel`}
                    src="/static/telegram.webp"
                    sx={{ width: 24, height: 24 }}
                  />
                </Link>
              )}
              {token.social && token.social.discord && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://discord.gg/${token.social.discord}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Avatar
                    alt={`${user} ${token.name} Discord Server`}
                    src="/static/discord.webp"
                    sx={{ width: 24, height: 24 }}
                  />
                </Link>
              )}
              {token.social && token.social.twitter && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://twitter.com/${token.social.twitter}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Avatar
                    alt={`${user} ${token.name} Twitter Profile`}
                    src="/static/twitter.webp"
                    sx={{ width: 24, height: 24 }}
                  />
                </Link>
              )}
              {token.social && token.social.facebook && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://facebook.com/${token.social.facebook}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Avatar
                    alt={`${user} ${token.name} Facebook Page`}
                    src="/static/facebook.webp"
                    sx={{ width: 24, height: 24 }}
                  />
                </Link>
              )}
              {token.social && token.social.linkedin && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://linkedin.com/${token.social.linkedin}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Avatar
                    alt={`${user} ${token.name} LinkedIn Profile`}
                    src="/static/linkedin.webp"
                    sx={{ width: 24, height: 24 }}
                  />
                </Link>
              )}
              {token.social && token.social.instagram && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://instagram.com/${token.social.instagram}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Avatar
                    alt={`${user} ${token.name} Instagram Profile`}
                    src="/static/instagram.webp"
                    sx={{ width: 24, height: 24 }}
                  />
                </Link>
              )}
              {token.social && token.social.youtube && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://youtube.com/${token.social.youtube}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Avatar
                    alt={`${user} ${token.name} Youtube Channel`}
                    src="/static/youtube.webp"
                    sx={{ width: 24, height: 24 }}
                  />
                </Link>
              )}
              {token.social && token.social.medium && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://medium.com/${token.social.medium}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Avatar
                    alt={`${user} ${token.name} Medium Publication`}
                    src="/static/medium.webp"
                    sx={{ width: 24, height: 24 }}
                  />
                </Link>
              )}
              {token.social && token.social.twitch && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://twitch.tv/${token.social.twitch}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Avatar
                    alt={`${user} ${token.name} Twitch Channel`}
                    src="/static/twitch.webp"
                    sx={{ width: 24, height: 24 }}
                  />
                </Link>
              )}
              {token.social && token.social.tiktok && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://tiktok.com/${token.social.tiktok}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Avatar
                    alt={`${user} ${token.name} Tiktok Profile`}
                    src="/static/tiktok.webp"
                    sx={{ width: 24, height: 24 }}
                  />
                </Link>
              )}
              {token.social && token.social.reddit && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://www.reddit.com/${token.social.reddit}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Avatar
                    alt={`${user} ${token.name} Reddit Community`}
                    src="/static/reddit.svg"
                    sx={{ width: 24, height: 24 }}
                  />
                </Link>
              )}
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                {/* Token Details Section */}
                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center">
                    <Link
                      underline="none"
                      color="inherit"
                      target="_blank"
                      href={`https://bithomp.com/explorer/${token.issuer}`}
                      rel="noreferrer noopener nofollow"
                      sx={{ flexGrow: 1 }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <PersonIcon style={{ color: '#B72136', fontSize: 'medium' }} />
                        <TruncatedTypography
                          variant="subtitle2"
                          sx={{ flexGrow: 1, maxWidth: isMobile ? '200px' : 'none' }}
                        >
                          {token.issuer}
                        </TruncatedTypography>
                        <IconButton edge="end" aria-label="bithomp">
                          <Avatar
                            alt={`${user} ${token.name} Bithomp Explorer`}
                            src="/static/bithomp.ico"
                            sx={{ width: 24, height: 24 }}
                          />
                        </IconButton>
                      </Stack>
                    </Link>
                  </Stack>

                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                    <LocalAtmIcon style={{ color: '#B72136', fontSize: 'medium' }} />
                    <TruncatedTypography
                      variant="subtitle2"
                      sx={{ flexGrow: 1, maxWidth: isMobile ? '200px' : 'none' }}
                    >
                      {token.currency}
                    </TruncatedTypography>
                    <CopyToClipboard
                      text={token.currency}
                      onCopy={() => openSnackbar('Copied!', 'success')}
                    >
                      <Tooltip title="Click to copy">
                        <IconButton>
                          <Icon icon={copyIcon} sx={{ fontSize: 'medium' }} />
                        </IconButton>
                      </Tooltip>
                    </CopyToClipboard>
                  </Stack>
                </Stack>

                {/* Market Stats Section */}
                <Stack spacing={1}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    {/* Market Stats */}
                    <Label>MARKET CAP</Label>
                    <Typography variant="body2" color="primary">
                      {currencySymbols[activeFiatCurrency]} {fNumber(convertedMarketCap)}
                    </Typography>

                    <Label>24H VOLUME</Label>
                    <Stack>
                      <Typography variant="body2" color="primary">
                        {currencySymbols[activeFiatCurrency]}{' '}
                        {fNumberWithCurreny(token.vol24hxrp, metrics[activeFiatCurrency])}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {fNumber(token.vol24hx)} {token.name}
                      </Typography>
                    </Stack>

                    <Label>VOLUME / MARKETCAP</Label>
                    <Typography variant="body2" color="primary">
                      {fNumber(voldivmarket)}
                    </Typography>

                    <Label>MARKET DOMINANCE</Label>
                    <Typography variant="body2" color="primary">
                      {fNumber(token.dom)} %
                    </Typography>

                    <Label>CIRCULATING SUPPLY</Label>
                    <Typography variant="body2" color="primary">
                      {fNumber(token.supply)}
                    </Typography>

                    <Label>TOTAL SUPPLY</Label>
                    <Typography variant="body2" color="primary">
                      {fNumber(token.amount)}
                    </Typography>

                    <Label>CREATED ON</Label>
                    <Typography variant="body2" color="primary">
                      {token.date}
                    </Typography>

                    <Label>BLACKHOLED</Label>
                    <Typography variant="body2" color="primary">
                      {info.blackholed ? 'YES' : 'NO'}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              {/* QR Code Section */}
              <Grid item xs={12} sm={6}>
                <Stack alignItems="center" spacing={2}>
                  <Box
                    component="img"
                    alt="XUMM QR"
                    src={qrUrl}
                    sx={{
                      width: '100%',
                      maxWidth: 280,
                      height: 'auto',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  />
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <LoadingButton
                      size="small"
                      onClick={handleTrustSet}
                      loading={loading}
                      variant="contained"
                      color={uuid ? 'error' : 'success'}
                      sx={{
                        position: 'relative',
                        overflow: 'hidden',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        backgroundColor: 'transparent',
                        transition: 'all 0.3s ease',
                        background: (theme) => `linear-gradient(45deg, 
                          ${uuid ? theme.palette.error.main : theme.palette.primary.main} 0%, 
                          ${alpha(
                            uuid ? theme.palette.error.main : theme.palette.primary.main,
                            0.8
                          )} 25%,
                          ${alpha(
                            uuid ? theme.palette.error.light : theme.palette.primary.light,
                            0.9
                          )} 50%,
                          ${alpha(
                            uuid ? theme.palette.error.main : theme.palette.primary.main,
                            0.8
                          )} 75%,
                          ${uuid ? theme.palette.error.main : theme.palette.primary.main} 100%)`,
                        backgroundSize: '200% 200%',
                        animation: 'gradient 5s ease infinite',
                        boxShadow: (theme) => `
                          0 0 10px ${alpha(
                            uuid ? theme.palette.error.main : theme.palette.primary.main,
                            0.5
                          )},
                          0 0 20px ${alpha(
                            uuid ? theme.palette.error.main : theme.palette.primary.main,
                            0.3
                          )},
                          0 0 30px ${alpha(
                            uuid ? theme.palette.error.main : theme.palette.primary.main,
                            0.2
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
                              uuid ? theme.palette.error.light : theme.palette.primary.light,
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
                              uuid ? theme.palette.error.main : theme.palette.primary.main,
                              0.6
                            )},
                            0 0 30px ${alpha(
                              uuid ? theme.palette.error.main : theme.palette.primary.main,
                              0.4
                            )},
                            0 0 45px ${alpha(
                              uuid ? theme.palette.error.main : theme.palette.primary.main,
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
                          background: (theme) => alpha(theme.palette.action.disabled, 0.5),
                          boxShadow: 'none'
                        },
                        '.MuiLoadingButton-loadingIndicator': {
                          color: '#fff',
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': {
                              transform: 'scale(1)'
                            },
                            '50%': {
                              transform: 'scale(1.1)'
                            },
                            '100%': {
                              transform: 'scale(1)'
                            }
                          }
                        }
                      }}
                    >
                      {uuid ? `Cancel (${counter})` : 'Generate QR'}
                    </LoadingButton>
                    {nextUrl && (
                      <Link
                        underline="none"
                        color="inherit"
                        target="_blank"
                        href={nextUrl}
                        rel="noreferrer noopener nofollow"
                      >
                        <Button size="small" variant="outlined">
                          Open in XUMM
                        </Button>
                      </Link>
                    )}
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Card>

        <Box sx={{ mt: 2 }}>
          <Label>TAGS</Label>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {token.tags &&
              token.tags.map((tag) => (
                <Link
                  key={normalizeTag(tag)}
                  href={`/view/${normalizeTag(tag)}`}
                  underline="none"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Chip label={tag} variant="outlined" size="small" clickable />
                </Link>
              ))}
          </Box>
        </Box>
      </Container>
    </OverviewWrapper>
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
