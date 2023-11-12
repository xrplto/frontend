import axios from 'axios';
import { performance } from 'perf_hooks';
import { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import Decimal from 'decimal.js';
import { CopyToClipboard } from 'react-copy-to-clipboard';

// Material
import {
  alpha,
  styled,
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

import PersonIcon from '@mui/icons-material/Person';
import TokenIcon from '@mui/icons-material/Token';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';

// Iconify
import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import linkExternal from '@iconify/icons-charm/link-external';
import paperIcon from '@iconify/icons-akar-icons/paper';
import copyIcon from '@iconify/icons-fad/copy';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber, fIntNumber } from 'src/utils/formatNumber';

// Components
import LogoTrustline from 'src/components/LogoTrustline';

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    align-items: center;
    justify-content: center;
    display: flex;
    flex: 1;
    overflow-x: hidden;
`
);

const Label = withStyles({
  root: {
    color: alpha('#637381', 0.99)
  }
})(Typography);

function TrustLine(props) {
  const BASE_URL = process.env.API_URL;
  const QR_BLUR = '/static/blurqr.webp';

  const { accountProfile, openSnackbar } = useContext(AppContext);

  let data = {};
  if (props && props.data) data = props.data;
  const token = data.token;
  const info = token?.issuer_info || {};

  const [qrUrl, setQrUrl] = useState(QR_BLUR);
  const [uuid, setUuid] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);

  const [loading, setLoading] = useState(false);

  const [counter, setCounter] = useState(150);

  const {
    id,
    issuer,
    currency,
    amount,
    date,
    exch,
    usd,
    name,
    domain,
    dom,
    whitepaper,
    kyc,
    holders,
    offers,
    trustlines,
    ext,
    md5,
    vol24hxrp, // XRP amount with pair token
    vol24hx, // Token amount with pair XRP
    vol24htx,
    supply, // Circulating Supply
    tags,
    tag,
    social,
    marketcap
  } = token;

  let user = token.user;
  if (!user) user = name;

  // const imgUrl = `/static/tokens/${md5}.${ext}`;
  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  // const marketcap = amount * exch / metrics.USD;

  useEffect(() => {
    var timer = null;
    var isRunning = false;
    var count = counter;
    var dispatchTimer = null;

    async function getDispatchResult() {
      try {
        const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
        const res = ret.data.data.response;
        // const account = res.account;
        const dispatched_result = res.dispatched_result;

        return dispatched_result;
      } catch (err) {}
    }

    const startInterval = () => {
      let times = 0;

      dispatchTimer = setInterval(async () => {
        const dispatched_result = await getDispatchResult();

        if (dispatched_result && dispatched_result === 'tesSUCCESS') {
          setSync(sync + 1);
          openSnackbar('Successfully set trustline!', 'success');
          stopInterval();
          return;
        }

        times++;

        if (times >= 10) {
          openSnackbar('Operation rejected!', 'error');
          stopInterval();
          return;
        }
      }, 1000);
    };

    // Stop the interval
    const stopInterval = () => {
      clearInterval(dispatchTimer);
      setOpenScanQR(false);
      setQrUrl(QR_BLUR);
      setUuid(null);
      setNextUrl(null);
    };

    async function getPayload() {
      // console.log(count + " " + isRunning, uuid);
      if (isRunning) return;
      isRunning = true;
      try {
        const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
        const res = ret.data.data.response;
        // const account = res.account;
        const resolved_at = res.resolved_at;
        if (resolved_at) {
          startInterval();
          return;
        }
      } catch (err) {}
      isRunning = false;
      count--;
      setCounter(count);
      if (count <= 0) {
        openSnackbar('Timeout!', 'error');
        handleScanQRClose();
      }
    }
    if (uuid) {
      timer = setInterval(getPayload, 2000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [uuid]);

  const onTrustSetXumm = async () => {
    /*{
            "TransactionType": "TrustSet",
            "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
            "Fee": "12",
            "Flags": 262144,
            "LastLedgerSequence": 8007750,
            "LimitAmount": {
              "currency": "USD",
              "issuer": "rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc",
              "value": "100"
            },
            "Sequence": 12
        }*/
    setCounter(150);
    setLoading(true);
    try {
      // message: "Error: Payload encoding error: Decimal precision out of range"
      let LimitAmount = {};
      LimitAmount.issuer = issuer;
      LimitAmount.currency = currency;
      LimitAmount.value = new Decimal(amount)
        .toDP(0, Decimal.ROUND_DOWN)
        .toNumber();

      const Flags = 0x00020000;

      const body = { LimitAmount, Flags };

      const res = await axios.post(`${BASE_URL}/xumm/trustset`, body);

      if (res.status === 200) {
        const uuid = res.data.data.uuid;
        const qrlink = res.data.data.qrUrl;
        const nextlink = res.data.data.next;

        setUuid(uuid);
        setQrUrl(qrlink);
        setNextUrl(nextlink);
      }
    } catch (err) {
      // console.log(err);
      openSnackbar('Network error!', 'error');
    }
    setLoading(false);
  };

  const onDisconnectXumm = async (uuid) => {
    setLoading(true);
    try {
      const res = await axios.delete(`${BASE_URL}/xumm/logout/${uuid}`);
      if (res.status === 200) {
        setUuid(null);
      }
    } catch (err) {}
    setQrUrl(QR_BLUR);
    setUuid(null);
    setNextUrl(null);
    setLoading(false);
  };

  const handleScanQRClose = () => {
    onDisconnectXumm(uuid);
  };

  const handleDelete = () => {};

  const handleTrustSet = () => {
    if (uuid) onDisconnectXumm(uuid);
    else onTrustSetXumm();
  };


  const voldivmarket =
    marketcap > 0 ? Decimal.div(vol24hxrp, marketcap).toNumber() : 0; // .toFixed(5, Decimal.ROUND_DOWN)


    function normalizeTag(tag) {
      if (tag && tag.length > 0) {
        const tag1 = tag.split(' ').join('-'); // Replace space
        const tag2 = tag1.replace(/&/g, 'and'); // Replace &
        const tag3 = tag2.toLowerCase(); // Make lowercase
        const final = tag3.replace(/[^a-zA-Z0-9-]/g, '');
        return final;
      }
      return '';
    }

  // Open in XUMM
  // https://xumm.app/detect/xapp:xumm.dex?issuer=rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz&currency=534F4C4F00000000000000000000000000000000

  return (
    <OverviewWrapper>
      <Container maxWidth="sm">
        <Stack alignItems="center" spacing={2} sx={{ mt: 2 }}>
          <LogoTrustline />
          <Typography variant="h1_trustline" sx={{ mt: 1 }}>
            Set {name} TrustLine
          </Typography>
        </Stack>

        <Card sx={{ mt: 1, mb: 8 }}>
          <Stack alignItems="center">
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 2 }}
            >
              <Avatar alt={user} src={imgUrl} sx={{ width: 64, height: 64 }} />
              <Stack spacing={1}>
                <Typography variant="h2" fontSize="1.2rem" color="primary">
                  {user}
                </Typography>
                <Stack direction="row">
                  <Chip
                    variant={'outlined'}
                    icon={<TokenIcon />}
                    label={name}
                    size="small"
                  />
                  {kyc && (
                    <Typography variant="kyc" sx={{ ml: 0.5}}>
                      KYC
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              {domain && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://${domain}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Chip
                    label={domain}
                    sx={{ pl: 0.5, pr: 0.5 }}
                    size="small"
                    deleteIcon={
                      <Icon icon={linkExternal} width="16" height="16" />
                    }
                    onDelete={handleDelete}
                    onClick={handleDelete}
                    icon={<Icon icon={link45deg} width="16" height="16" />}
                  />
                </Link>
              )}

              {whitepaper && (
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`${whitepaper}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Chip
                    label={'Whitepaper'}
                    sx={{ pl: 0.5, pr: 0.5 }}
                    size="small"
                    deleteIcon={
                      <Icon icon={linkExternal} width="16" height="16" />
                    }
                    onDelete={handleDelete}
                    onClick={handleDelete}
                    icon={<Icon icon={paperIcon} width="16" height="16" />}
                  />
                </Link>
              )}
            </Stack>

            <Box
  sx={{
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow chips to wrap to the next row
    gap: 1,
    py: 1,
    overflowX: 'auto', // Horizontal scrolling for small screens
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    '& > *': {
      scrollSnapAlign: 'center',
    },
    '::-webkit-scrollbar': { display: 'none' },
  }}
>
  <Tooltip title={<Typography variant="body2">Rank by 24h Volume.</Typography>}>
    <Chip
      label={<Typography variant="s16">Rank # {id}</Typography>}
      color="primary"
      variant="outlined"
      size="small"
      sx={{ borderRadius: '8px', mr: 1, mb: 1 }} // Added margin-right for spacing
    />
  </Tooltip>
  <Chip
    label={<Typography variant="s16">{fIntNumber(holders)} Holders</Typography>}
    color="error"
    variant="outlined"
    size="small"
    sx={{ borderRadius: '8px', mr: 1, mb: 1 }} // Added margin-right for spacing
  />
  <Chip
    label={<Typography variant="s16">{fIntNumber(offers)} Offers</Typography>}
    color="warning"
    variant="outlined"
    size="small"
    sx={{ borderRadius: '8px', mr: 1, mb: 1 }} // Added margin-right for spacing
  />
  <Chip
    label={<Typography variant="s16">{fNumber(vol24htx)} Trades</Typography>}
    color="secondary"
    variant="outlined"
    size="small"
    sx={{ borderRadius: '8px', mr: 1, mb: 1 }} // Added margin-right for spacing
  />
  <Chip
    label={<Typography variant="s16">{fIntNumber(trustlines)} TrustLines</Typography>}
    color="info"
    variant="outlined"
    size="small"
    sx={{ borderRadius: '8px', mb: 1 }} // Added margin-bottom for spacing
  />
</Box>



            <Box
              sx={{
                display: 'flex',
                overflow: 'auto',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                '& > *': {
                  scrollSnapAlign: 'center'
                },
                '::-webkit-scrollbar': { display: 'none' }
              }}
            >
              <Stack direction="row" spacing={{ xs: .5, sm: 2 }} sx={{ mt: 3 }}>
                {social && social.telegram && (
                  <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://t.me/${social.telegram}`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Avatar
                      alt="telegram"
                      src="/static/telegram.webp"
                      sx={{
                        width: { xs: 20, sm: 24 }, // Adjust width for different screen sizes
                        height: { xs: 20, sm: 24 }, // Adjust height for different screen sizes
                        mr: { xs: 1, sm: 2 }, // Adjust margin for different screen sizes
                      }}
                    />
                  </Link>
                )}
                {social && social.discord && (
                  <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://discord.gg/${social.discord}`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Avatar
                      alt="discord"
                      src="/static/discord.webp"
                      sx={{
                        width: { xs: 20, sm: 24 }, // Adjust width for different screen sizes
                        height: { xs: 20, sm: 24 }, // Adjust height for different screen sizes
                        mr: { xs: 1, sm: 2 }, // Adjust margin for different screen sizes
                      }}
                    />
                  </Link>
                )}
                {social && social.twitter && (
                  <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://twitter.com/${social.twitter}`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Avatar
                      alt="twitter"
                      src="/static/twitter.webp"
                      sx={{
                        width: { xs: 20, sm: 24 }, 
                        height: { xs: 20, sm: 24 }, 
                        mr: { xs: 1, sm: 2 }, 
                      }}
                    />
                  </Link>
                )}
                {social && social.facebook && (
                  <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://facebook.com/${social.facebook}`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Avatar
                      alt="facebook"
                      src="/static/facebook.webp"
                      sx={{
                        width: { xs: 20, sm: 24 }, 
                        height: { xs: 20, sm: 24 }, 
                        mr: { xs: 1, sm: 2 }, 
                      }}
                    />
                  </Link>
                )}
                {social && social.linkedin && (
                  <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://linkedin.com/${social.linkedin}`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Avatar
                      alt="linkedin"
                      src="/static/linkedin.webp"
                      sx={{
                        width: { xs: 20, sm: 24 }, 
                        height: { xs: 20, sm: 24 }, 
                        mr: { xs: 1, sm: 2 }, 
                      }}
                    />
                  </Link>
                )}
                {social && social.instagram && (
                  <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://instagram.com/${social.instagram}`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Avatar
                      alt="instagram"
                      src="/static/instagram.webp"
                      sx={{
                        width: { xs: 20, sm: 24 }, 
                        height: { xs: 20, sm: 24 }, 
                        mr: { xs: 1, sm: 2 }, 
                      }}
                    />
                  </Link>
                )}
                {social && social.youtube && (
                  <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://youtube.com/${social.youtube}`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Avatar
                      alt="youtube"
                      src="/static/youtube.webp"
                      sx={{
                        width: { xs: 20, sm: 24 }, 
                        height: { xs: 20, sm: 24 }, 
                        mr: { xs: 1, sm: 2 }, 
                      }}
                    />
                  </Link>
                )}
                {social && social.medium && (
                  <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://medium.com/${social.medium}`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Avatar
                      alt="medium"
                      src="/static/medium.webp"
                      sx={{
                        width: { xs: 20, sm: 24 }, 
                        height: { xs: 20, sm: 24 }, 
                        mr: { xs: 1, sm: 2 }, 
                      }}
                    />
                  </Link>
                )}
                {social && social.twitch && (
                  <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://twitch.tv/${social.twitch}`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Avatar
                      alt="twitch"
                      src="/static/twitch.webp"
                      sx={{
                        width: { xs: 20, sm: 24 }, 
                        height: { xs: 20, sm: 24 }, 
                        mr: { xs: 1, sm: 2 }, 
                      }}
                    />
                  </Link>
                )}
                {social && social.tiktok && (
                  <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://tiktok.com/${social.tiktok}`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Avatar
                      alt="tiktok"
                      src="/static/tiktok.webp"
                      sx={{
                        width: { xs: 20, sm: 24 }, 
                        height: { xs: 20, sm: 24 }, 
                        mr: { xs: 1, sm: 2 }, 
                      }}
                    />
                  </Link>
                )}
                {social && social.reddit && (
                  <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://www.reddit.com/${social.reddit}`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Avatar
                      alt="reddit"
                      src="/static/reddit.svg"
                      sx={{
                        width: { xs: 20, sm: 24 }, 
                        height: { xs: 20, sm: 24 }, 
                        mr: { xs: 1, sm: 2 }, 
                      }}
                    />
                  </Link>
                )}
              </Stack>
            </Box>

            <Stack spacing={0} sx={{ mt: 2 }}>
              <Stack direction="row" alignItems="center">
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://bithomp.com/explorer/${issuer}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <PersonIcon style={{ color: '#B72136' }} fontSize="small" />
                    <Typography variant="s7">{issuer}</Typography>
                    <IconButton edge="end" aria-label="bithomp">
                      <Avatar
                        alt="bithomp"
                        src="/static/bithomp.ico"
                        sx={{ width: 18, height: 18 }}
                      />
                    </IconButton>
                  </Stack>
                </Link>
              </Stack>

              <Stack direction="row" spacing={0.5} alignItems="center">
                <LocalAtmIcon style={{ color: '#B72136' }} fontSize="small" />
                <Typography variant="s7">{currency}</Typography>
                <CopyToClipboard
                  text={currency}
                  onCopy={() => openSnackbar('Copied!', 'success')}
                >
                  <Tooltip title={'Click to copy'}>
                    <IconButton>
                      <Icon icon={copyIcon} />
                    </IconButton>
                  </Tooltip>
                </CopyToClipboard>
              </Stack>
            </Stack>

            <Grid
              container
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              sx={{ mt: 3, mb: 3 }}
            >
              <Grid item xs={12} sm={6}>
                <Stack alignItems="center">
                  <Box
                    component="img"
                    alt="XUMM QR"
                    src={qrUrl}
                    sx={{ width: 200, height: 200 }}
                  />
                  <Stack
  direction={{ xs: 'column', sm: 'row' }} // Adjust the direction based on the screen size
  spacing={1}
  alignItems="center"
>
  <LoadingButton
    size="small"
    onClick={handleTrustSet}
    loading={loading}
    variant="contained"
    color={uuid ? 'error' : 'success'}
    sx={{ mt: 1, mb: { xs: 1, sm: 0 } }} // Adjust margin-bottom for smaller screens
  >
    {uuid ? `Cancel (${counter})` : `Generate QR`}
  </LoadingButton>

  {nextUrl && (
    <Link
      underline="none"
      color="inherit"
      target="_blank"
      href={nextUrl}
      rel="noreferrer noopener nofollow"
    >
      <Button size="small" variant="outlined" sx={{ mt: 1 }}>
        Open in XUMM
      </Button>
    </Link>
  )}
</Stack>

                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack alignItems="center" sx={{ mt: 2 }}>
                  <Label>CREATED ON</Label>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    {date}
                  </Typography>

                  <Label>MARKET CAP</Label>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    ${fNumber(marketcap)}
                  </Typography>

                  <Label>24H  VOLUME</Label>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: -.3 }}
                  >
                    {fNumber(vol24hxrp)} XRP
                  </Typography>


                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    {fNumber(vol24hx)} {name}
                  </Typography>


                  <Label>VOLUME / MARKETCAP</Label>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    {fNumber(voldivmarket)}
                  </Typography>



                  <Label>MARKET DOMINANCE</Label>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    {fNumber(dom)} %
                  </Typography>


                  <Label>CIRCULATING SUPPLY</Label>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    {fNumber(supply)}
                  </Typography>
                  
                  <Label>TOTAL SUPPLY</Label>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    {fNumber(amount)}
                  </Typography>
                  
                  <Label>BLACKHOLED</Label>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    {info.blackholed ? 'YES' : 'NO'}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Card>
        <Label>TAGS</Label>
<Box
  sx={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 1,
    mt: 1,
    mb: 2
  }}
>
  {tags && tags.map((tag, index) => (
    <Link 
      key={index} 
      href={`/view/${normalizeTag(tag)}`}
      underline="none" 
      target="_blank" 
      rel="noreferrer noopener"
    >
      <Chip
        label={tag}
        variant="outlined"
        size="small"
        sx={{ mb: 1 }}
        clickable
      />
    </Link>
  ))}
</Box>

        
      </Container>
    </OverviewWrapper>
    
  );
}

export default TrustLine;

export async function getServerSideProps(ctx) {
  const BASE_URL = process.env.API_URL;

  let data = null;
  try {
    const slug = ctx.params.slug;
    var t1 = performance.now();

    // https://api.xrpl.to/api/token/bitstamp-usd
    const res = await axios.get(`${BASE_URL}/token/${slug}`);

    data = res.data;

    var t2 = performance.now();
    var dt = (t2 - t1).toFixed(2);

    console.log(`3. getServerSideProps(trustline) slug: ${slug} took: ${dt}ms`);
  } catch (e) {
    console.log(e);
  }
  let ret = {};
  if (data && data.token) {
    let ogp = {};
    const token = data.token;
    const { name, ext, md5, slug } = token;

    let user = token.user;
    if (!user) user = name;

    ogp.canonical = `https://xrpl.to/trustset/${slug}`;
    ogp.title = `Establish a ${name} Trustline on the XRP Ledger`;
    ogp.url = `https://xrpl.to/trustset/${slug}`;
    // ogp.imgUrl = `https://xrpl.to/static/tokens/${md5}.${ext}`;
    ogp.imgUrl = `https://s1.xrpl.to/token/${md5}`;
    ogp.desc = `Easily set up a ${name} Trustline on the XRPL for secure and streamlined transactions.`;

    ret = { data, ogp };
  } else {
        return {
            redirect: {
                permanent: false,
                destination: '/404'
            }
        }
   }

  return {
    props: ret // will be passed to the page component as props
  };
}

// This function gets called at build time
// export async function getStaticPaths() {
//     // Call an external API endpoint to get posts
//     const res = await fetch('https://.../posts')
//     const posts = await res.json()

//     // Get the paths we want to pre-render based on posts
//     const paths = posts.map((post) => ({
//       params: { id: post.id },
//     }))

//     // We'll pre-render only these paths at build time.
//     // { fallback: false } means other routes should 404.
//     return { paths, fallback: false }
// }
