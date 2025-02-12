import { useState, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

import { CopyToClipboard } from 'react-copy-to-clipboard';
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Material
import { withStyles } from '@mui/styles';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Link,
  Rating,
  Stack,
  styled,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import TokenIcon from '@mui/icons-material/Token';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import LocalFloristTwoToneIcon from '@mui/icons-material/LocalFloristTwoTone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import WarningIcon from '@mui/icons-material/Warning';

// Iconify
import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import linkExternal from '@iconify/icons-charm/link-external';
import paperIcon from '@iconify/icons-akar-icons/paper';
import copyIcon from '@iconify/icons-ph/copy';
// import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
// import listCheck from '@iconify/icons-ci/list-check';
import blackholeIcon from '@iconify/icons-arcticons/blackhole';
import currencyRipple from '@iconify/icons-tabler/currency-ripple';
import infoFilled from '@iconify/icons-ep/info-filled';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber, fIntNumber } from 'src/utils/formatNumber';

// Components
import ExplorersMenu from './ExplorersMenu';
import CommunityMenu from './CommunityMenu';
import ChatMenu from './ChatMenu';
import Watch from './Watch';
import Share from './Share';
import IssuerInfoDialog from './IssuerInfoDialog';
import EditTokenDialog from 'src/components/EditTokenDialog';
import Drawer from 'src/components/Drawer';
import TagsDrawer from 'src/components/TagsDrawer';
import LinksDrawer from 'src/components/LinksDrawer';
import PriceDesc from './PriceDesc';
import ExtraButtons from './ExtraButtons';

import Decimal from 'decimal.js';
import { currencySymbols } from 'src/utils/constants';

const IconCover = styled('div')(
  ({ theme }) => `
        width: 64px;
        height: 64px;
        border-radius: 16px;
        position: relative;
        overflow: hidden;
        transition: width 1s ease-in-out, height .5s ease-in-out !important;
        -webkit-tap-highlight-color: transparent;
        &:hover, &.Mui-focusVisible {
            z-index: 1;
            & .MuiImageBackdrop-root {
                opacity: 0.9;
            }
            & .MuiIconEditButton-root {
                opacity: 1;
            }
        }
    `
);

const IconWrapper = styled('div')(
  ({ theme }) => `
        box-sizing: border-box;
        display: inline-block;
        position: relative;
        width: 64px;
        height: 64px;
  `
);

const IconImage = styled('img')(
  ({ theme }) => `
    position: absolute;
    inset: 0px;
    box-sizing: border-box;
    padding: 0px;
    border: none;
    margin: auto;
    display: block;
    width: 0px; height: 0px;
    min-width: 100%;
    max-width: 100%;
    min-height: 100%;
    max-height: 100%;
    object-fit: cover;
    border-radius: 12px;
  `
);

const ImageBackdrop = styled('span')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundColor: theme.palette.common.white,
  opacity: 0,
  transition: theme.transitions.create('opacity')
}));

const CardOverlay = styled('div')(
  ({ theme }) => `
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: absolute;
    inset: 0;
`
);

const AdminImage = styled(LazyLoadImage)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden',
  '&:hover': {
    cursor: 'pointer',
    opacity: 0.6
  }
}));

const SupplyTypography = withStyles({
  root: {
    color: '#3366FF'
  }
})(Typography);

const TotalSupplyTypography = withStyles({
  root: {
    color: '#FFC107'
  }
})(Typography);

const VolumeTypography = withStyles({
  root: {
    color: '#FF6C40'
  }
})(Typography);

const MarketTypography = withStyles({
  root: {
    color: '#2CD9C5'
  }
})(Typography);

function truncate(str, n) {
  if (!str) return '';
  //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
}

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

// Helper functions before component
const hasShownWarningForToken = (tokenId) => {
  const currentSession = sessionStorage.getItem('currentSession');
  if (!currentSession) return false;

  try {
    const session = JSON.parse(currentSession);
    return session.scamWarnings.includes(tokenId);
  } catch (e) {
    return false;
  }
};

const markWarningShownForToken = (tokenId) => {
  let session;
  try {
    session = JSON.parse(sessionStorage.getItem('currentSession') || '{"scamWarnings":[]}');
  } catch (e) {
    session = { scamWarnings: [] };
  }

  if (!session.scamWarnings.includes(tokenId)) {
    session.scamWarnings.push(tokenId);
    sessionStorage.setItem('currentSession', JSON.stringify(session));
  }
};

// ----------------------------------------------------------------------
export default function UserDesc({ token }) {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { darkMode, accountProfile, openSnackbar, activeFiatCurrency } = useContext(AppContext);
  const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;
  const [rating, setRating] = useState(2);
  // const [trustToken, setTrustToken] = useState(null);
  const [openIssuerInfo, setOpenIssuerInfo] = useState(false);
  const [editToken, setEditToken] = useState(null);

  const [openTagsDrawer, setOpenTagsDrawer] = useState(false);
  const [openLinksDrawer, setOpenLinksDrawer] = useState(false);

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
    slug,
    tags,
    social,
    issuer_info,
    assessment,
    date,
    marketcap,
    vol24hx,
    vol24htx,
    vol24hxrp,
    amount,
    supply
  } = token;

  const [showStat, setShowStat] = useState(false);
  const metrics = useSelector(selectMetrics);

  const [omcf, setOMCF] = useState(token.isOMCF || 'no'); // is Old Market Cap Formula
  const convertedMarketCap = Decimal.div(marketcap, metrics[activeFiatCurrency]).toNumber(); // .toFixed(5, Decimal.ROUND_DOWN)
  const volume = fNumber(vol24hx);
  const voldivmarket = marketcap > 0 ? Decimal.div(vol24hxrp, marketcap).toNumber() : 0; // .toFixed(5, Decimal.ROUND_DOWN)
  const circulatingSupply = fNumber(supply);
  const totalSupply = fNumber(amount);

  const info = issuer_info || {};

  let user = token.user;
  if (!user) user = name;

  const isCommunity = true; /*social && (social.twitter || social.facebook || social.linkedin 
        || social.instagram || social.youtube || social.medium || social.twitch || social.tiktok || social.reddit);*/
  const isChat = social && (social.telegram || social.discord);

  // const imgUrl = `/static/tokens/${md5}.${ext}`;
  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  const img_xrplf_black = '/static/xrplf_black.svg';
  const img_xrplf_white = '/static/xrplf_white.svg';

  const img_xrplf = darkMode ? img_xrplf_white : img_xrplf_black;

  // const img_xrplf = "/static/xrp.webp";

  const handleDelete = () => {};

  const handleOpenIssuerInfo = () => {
    setOpenIssuerInfo(true);
  };

  const toggleTagsDrawer = (isOpen = true) => {
    setOpenTagsDrawer(isOpen);
  };

  const toggleLinksDrawer = (isOpen = true) => {
    setOpenLinksDrawer(isOpen);
  };

  const [openScamWarning, setOpenScamWarning] = useState(false);

  // Move the session initialization useEffect inside the component
  useEffect(() => {
    if (!sessionStorage.getItem('currentSession')) {
      sessionStorage.setItem('currentSession', JSON.stringify({ scamWarnings: [] }));
    }
  }, []);

  // Move the scam warning useEffect inside the component
  useEffect(() => {
    if (tags && tags.some((tag) => tag.toLowerCase() === 'scam') && !hasShownWarningForToken(id)) {
      setOpenScamWarning(true);
      markWarningShownForToken(id);
    }
  }, [tags, id]);

  return (
    <Stack spacing={1}>
      {editToken && <EditTokenDialog token={editToken} setToken={setEditToken} />}

      <IssuerInfoDialog open={openIssuerInfo} setOpen={setOpenIssuerInfo} token={token} />

      <Stack direction="row" spacing={1} alignItems="center">
        {isAdmin ? (
          <div>
            <IconCover>
              <IconWrapper>
                <IconImage src={imgUrl} />
              </IconWrapper>
              <IconButton
                className="MuiIconEditButton-root"
                aria-label="edit"
                sx={{
                  position: 'absolute',
                  left: '0vw',
                  top: '0vh',
                  opacity: 0,
                  zIndex: 1,
                  width: '64px',
                  height: '64px'
                }}
                onClick={() => setEditToken(token)}
              >
                <EditIcon sx={{ width: 32, height: 32 }} />
              </IconButton>
              <ImageBackdrop className="MuiImageBackdrop-root" />
            </IconCover>
          </div>
        ) : (
          <Avatar
            alt={`${user} ${name} Logo`}
            src={imgUrl}
            sx={{
              width: 64,
              height: 64,
              borderRadius: '16px'
            }}
          />
        )}
        <Stack spacing={0.2}>
          <Typography
            variant="span"
            fontWeight="700"
            color={darkMode ? '#22B14C' : '#3366FF'}
            alt={user}
            fontSize="1rem"
          >
            {name}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="s17">{truncate(user, 15)}</Typography>
            <Stack>{kyc && <Typography variant="kyc2">KYC</Typography>}</Stack>
          </Stack>
          {date && (
            <Typography variant="s7" noWrap>
              {date}
            </Typography>
          )}
        </Stack>
        <Grid
          container
          direction="row"
          spacing={0.5}
          sx={{ mt: 1 }}
          justifyContent={isTablet ? 'flex-end' : 'flex-start'}
        >
          <Grid item>
            <Watch token={token} />
          </Grid>
          <Grid item>
            <Share token={token} />
          </Grid>
        </Grid>
      </Stack>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 0.5, sm: 0.75, md: 1 },
          py: 0.5,
          overflow: 'auto',
          width: '100%',
          '& > *': {
            scrollSnapAlign: 'center',
            minWidth: 'fit-content'
          },
          '::-webkit-scrollbar': { display: 'none' },
          mb: isTablet ? 1 : 0
        }}
      >
        <Tooltip title={<Typography variant="body2">Rank by 24h Volume.</Typography>}>
          <Chip
            label={<Typography variant={isTablet ? 'body2' : 's16'}>Rank # {id}</Typography>}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ borderRadius: '6px', height: '24px' }}
          />
        </Tooltip>
        <Chip
          label={
            <Typography variant={isTablet ? 'body2' : 's16'}>
              {fIntNumber(holders)} Holders
            </Typography>
          }
          color="error"
          variant="outlined"
          size="small"
          sx={{ borderRadius: '6px', height: '24px' }}
        />
        <Chip
          label={
            <Typography variant={isTablet ? 'body2' : 's16'}>
              {fIntNumber(offers)} Offers
            </Typography>
          }
          color="warning"
          variant="outlined"
          size="small"
          sx={{ borderRadius: '6px', height: '24px' }}
        />
        <Chip
          label={
            <Typography variant={isTablet ? 'body2' : 's16'}>{fNumber(vol24htx)} Trades</Typography>
          }
          color="secondary"
          variant="outlined"
          size="small"
          sx={{ borderRadius: '6px', height: '24px' }}
        />
        <Chip
          label={
            <Typography variant={isTablet ? 'body2' : 's16'}>
              {fIntNumber(trustlines)} TrustLines
            </Typography>
          }
          color="info"
          variant="outlined"
          size="small"
          sx={{ borderRadius: '6px', height: '24px' }}
        />
      </Box>

      {isTablet && (
        <>
          <Grid item xs={12} lg={6} mb={1}>
            <PriceDesc token={token} />
          </Grid>

          <Grid item xs={12} lg={6}>
            <ExtraButtons token={token} />
          </Grid>

          <Divider sx={{ my: 1 }} />
        </>
      )}

      {showStat && (
        <Grid container item xs={12} sx={{ display: { xs: 'block', md: 'none' }, mb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={0.5}>
            <Stack direction="row" alignItems="center" gap={0.5}>
              <Typography variant="body2">Market Cap</Typography>
              <Tooltip
                title={
                  <Typography variant="body2">
                    The total market value of a token's circulating supply represents its overall
                    worth.
                    <br />
                    This concept is similar to free-float capitalization in the stock market.
                    <br />
                    {omcf === 'yes'
                      ? 'Price x Circulating Supply'
                      : '(Price x Circulating Supply) x (Average daily trading volume / Average daily trading volume for all tokens)'}
                    .
                  </Typography>
                }
              >
                <Icon icon={infoFilled} width={14} height={14} />
              </Tooltip>
            </Stack>

            <MarketTypography variant="body2">
              {currencySymbols[activeFiatCurrency]} {fNumber(convertedMarketCap)}
            </MarketTypography>
          </Stack>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 0.5 }}
          >
            <Stack direction="row" alignItems="center" gap={0.5}>
              <Typography variant="body2">Volume (24h)</Typography>
              <Tooltip
                title={
                  <Typography variant="body2">
                    Trading volume of {name} within the past 24 hours.
                  </Typography>
                }
              >
                <Icon icon={infoFilled} width={14} height={14} />
              </Tooltip>
            </Stack>
            <VolumeTypography variant="body2">
              {volume} <VolumeTypography variant="small"> {name}</VolumeTypography>
            </VolumeTypography>
          </Stack>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 0.5 }}
          >
            <Typography variant="body2">Volume / Marketcap</Typography>
            <VolumeTypography variant="body2">{fNumber(voldivmarket)}</VolumeTypography>
          </Stack>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 0.5 }}
          >
            <Stack direction="row" alignItems="center" gap={0.5}>
              <Typography variant="body2">Circulating Supply</Typography>
              <Tooltip
                title={
                  <Typography variant="body2">
                    The number of tokens in circulation within the market and held by the public is
                    comparable to the concept of outstanding shares in the stock market.
                  </Typography>
                }
              >
                <Icon icon={infoFilled} width={14} height={14} />
              </Tooltip>
            </Stack>
            <SupplyTypography variant="body2">{circulatingSupply}</SupplyTypography>
          </Stack>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 0.5 }}
          >
            <Typography variant="body2">Total Supply</Typography>
            <TotalSupplyTypography variant="body2">{totalSupply}</TotalSupplyTypography>
          </Stack>
        </Grid>
      )}
      {isTablet && (
        <Button
          color="inherit"
          onClick={() => setShowStat(!showStat)}
          sx={{
            width: '100%',
            backgroundColor: darkMode ? '#343445' : '#fff',
            '&:hover': {
              backgroundColor: darkMode ? '#2B2C38' : '#EBEDF0'
            },
            py: 0.5,
            mb: 0.5
          }}
        >
          {`${!showStat ? 'More' : 'less'} stats`}
        </Button>
      )}

      <Grid
        container
        spacing={0.5}
        alignItems="center"
        sx={{
          mt: 0.5,
          ml: isTablet ? 0 : '-4px',
          width: '100%'
        }}
      >
        {!isTablet ? (
          tags &&
          tags.map((tag) => (
            <Grid item key={`${md5}-${tag}`}>
              <Link
                href={`/view/${normalizeTag(tag)}`}
                sx={{ pl: 0, pr: 0, display: 'inline-flex' }}
                underline="none"
                rel="noreferrer noopener nofollow"
              >
                <Chip size="small" label={tag} onClick={handleDelete} sx={{ height: '24px' }} />
              </Link>
            </Grid>
          ))
        ) : (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: '100%' }}
          >
            <Typography variant="body2">Tags</Typography>

            <Box display="flex" alignItems="center">
              {tags &&
                tags.slice(0, 2).map((tag) => (
                  <Link
                    key={`${md5}-${tag}`}
                    href={`/view/${normalizeTag(tag)}`}
                    sx={{
                      pl: 0,
                      pr: 0,
                      display: 'inline-flex',
                      marginLeft: '-3px'
                    }}
                    underline="none"
                    rel="noreferrer noopener nofollow"
                  >
                    <Chip
                      label={tag}
                      size="small"
                      sx={{
                        borderInlineStart: `2px solid ${darkMode ? '#17171a' : '#fff'}`,
                        cursor: 'pointer',
                        fontSize: '12px',
                        height: '24px'
                      }}
                    />
                  </Link>
                ))}
              {tags && tags.length > 2 && (
                <Chip
                  label={`+${tags.slice(2).length}`}
                  size="small"
                  sx={{
                    fontSize: '12px',
                    borderInlineStart: `2px solid ${darkMode ? '#17171a' : '#fff'}`,
                    marginLeft: '-3px',
                    height: '24px'
                  }}
                  onClick={() => toggleTagsDrawer(true)}
                />
              )}
              <KeyboardArrowRightIcon
                sx={{ cursor: 'pointer', width: 20, height: 20 }}
                onClick={() => toggleTagsDrawer(true)}
              />
            </Box>
          </Stack>
        )}
      </Grid>

      {isTablet && <Divider sx={{ my: 1 }} />}

      <Grid
        container
        spacing={0.5}
        sx={{ p: 0, mt: 0.5, width: '100%', ml: isTablet ? 0 : '-4px' }}
      >
        {!isTablet ? (
          <>
            {domain && (
              <Grid item>
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://${domain}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Chip
                    label={domain}
                    size="small"
                    sx={{ pl: 0.5, pr: 0.5, borderRadius: '6px', height: '32px' }}
                    deleteIcon={
                      <Icon
                        icon={linkExternal}
                        width="14"
                        height="14"
                        style={{ color: theme.palette.primary.main }}
                      />
                    }
                    onDelete={handleDelete}
                    onClick={handleDelete}
                    icon={<Icon icon={link45deg} width="14" height="14" />}
                  />
                </Link>
              </Grid>
            )}
            {whitepaper && (
              <Grid item>
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`${whitepaper}`}
                  rel="noreferrer noopener nofollow"
                >
                  <Chip
                    label={'Whitepaper'}
                    size="small"
                    sx={{ pl: 0.5, pr: 0.5, borderRadius: '6px', height: '24px' }}
                    deleteIcon={
                      <Icon
                        icon={linkExternal}
                        width="14"
                        height="14"
                        style={{ color: theme.palette.primary.main }}
                      />
                    }
                    onDelete={handleDelete}
                    onClick={handleDelete}
                    icon={<Icon icon={paperIcon} width="14" height="14" />}
                  />
                </Link>
              </Grid>
            )}

            <Grid item>
              <ExplorersMenu issuer={issuer} />
            </Grid>
            {isChat && (
              <Grid item>
                <ChatMenu token={token} />
              </Grid>
            )}
            {isCommunity && (
              <Grid item>
                <CommunityMenu token={token} />
              </Grid>
            )}
          </>
        ) : (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: '100%' }}
          >
            <Typography variant="body2">Links</Typography>

            <Box display="flex" alignItems="center" onClick={() => toggleLinksDrawer(true)}>
              <Typography variant="caption" sx={{ fontSize: '11px' }}>
                Website, Explorers, Socials etc.
              </Typography>

              <KeyboardArrowRightIcon sx={{ cursor: 'pointer', width: 20, height: 20 }} />
            </Box>
          </Stack>
        )}
      </Grid>

      {isTablet && <Divider sx={{ my: 1 }} />}

      {issuer_info && (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: isTablet ? 0 : 2, width: '100%' }}
          >
            {isTablet && <Typography variant="body2">Issuer</Typography>}
            <Chip
              label={
                <Typography variant="s7">
                  Issuer: <Typography variant="s8">{truncate(issuer, 16)}</Typography>
                </Typography>
              }
              size="small"
              sx={{ pl: 0.5, pr: 0, borderRadius: '6px', height: '24px' }}
              deleteIcon={
                <Stack direction="row" spacing={0} alignItems="center">
                  <Tooltip title={'Copy Address'}>
                    <IconButton size="small" sx={{ p: 0.5 }}>
                      <CopyToClipboard
                        text={issuer}
                        onCopy={() => openSnackbar('Copied!', 'success')}
                      >
                        <Icon icon={copyIcon} width="14" height="14" />
                      </CopyToClipboard>
                    </IconButton>
                  </Tooltip>
                  {info.blackholed && (
                    <Tooltip title={'Blackholed'}>
                      <Icon
                        icon={blackholeIcon}
                        width="20"
                        height="20"
                        style={{ color: '#ff0000' }}
                      />
                    </Tooltip>
                  )}
                  {assessment && (
                    <Link
                      underline="none"
                      color="inherit"
                      target="_blank"
                      href={assessment}
                      rel="noreferrer noopener nofollow"
                    >
                      <Tooltip title={'Assessment'}>
                        <IconButton size="small" sx={{ p: 0.5 }}>
                          <LazyLoadImage src={img_xrplf} width={14} height={14} />
                        </IconButton>
                      </Tooltip>
                    </Link>
                  )}
                </Stack>
              }
              onDelete={handleDelete}
              onClick={handleOpenIssuerInfo}
              icon={
                <Avatar
                  alt="XRP Logo"
                  src="/static/xrp.webp"
                  sx={{ mr: 0.5, width: 16, height: 16 }}
                />
              }
            />
          </Stack>
          {isTablet && <Divider sx={{ mt: 1 }} />}
        </>
      )}

      <TagsDrawer
        isOpen={openTagsDrawer}
        toggleDrawer={toggleTagsDrawer}
        tags={tags}
        normalizeTag={normalizeTag}
        md5={md5}
      />

      <LinksDrawer isOpen={openLinksDrawer} toggleDrawer={toggleLinksDrawer} token={token} />

      <Dialog
        open={openScamWarning}
        onClose={() => setOpenScamWarning(false)}
        aria-labelledby="scam-warning-dialog"
        PaperProps={{
          sx: {
            maxWidth: '500px',
            border: '2px solid #ff3d00'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5 }}>
          <WarningIcon sx={{ color: '#ff3d00', width: 24, height: 24 }} />
          <Typography color="error" variant="h6">
            Scam Warning!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 1.5 }}>
          <DialogContentText>
            This token has been tagged as a potential SCAM. Exercise extreme caution:
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Do NOT trust any investment promises</li>
              <li>Do NOT connect your wallet to unknown sites</li>
              <li>Do NOT share your private keys or seed phrase</li>
              <li>DYOR (Do Your Own Research) before any interaction</li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setOpenScamWarning(false)} variant="contained" color="error">
            I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
