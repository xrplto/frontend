import { useRouter } from 'next/router';
import axios from 'axios';
import { useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import useWebSocket from 'react-use-websocket';
import { update_metrics } from 'src/redux/statusSlice';
import { LRUCache } from 'lru-cache';
import {
  Container,
  Box,
  Typography,
  Grid,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Stack,
  Divider,
  Badge
} from '@mui/material';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Topbar from 'src/components/Topbar';
import Link from 'next/link';
import { rippleTimeToISO8601, dropsToXrp, normalizeCurrencyCode } from 'src/utils/parse/utils';
import { formatDistanceToNow } from 'date-fns';
import BigNumber from 'bignumber.js';
import CryptoJS from 'crypto-js';
import { getHashIcon } from 'src/utils/extra';

// Create transaction cache with 1 hour TTL and max 100 entries
const txCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour in milliseconds
  updateAgeOnGet: true,
  updateAgeOnHas: true,
});

// Utility function to clear cache (useful for debugging)
export const clearTransactionCache = (hash) => {
  if (hash) {
    txCache.delete(hash);
    console.log(`Cleared cache for transaction: ${hash}`);
  } else {
    txCache.clear();
    console.log('Cleared entire transaction cache');
  }
};

const ipfsToGateway = (uri) => {
  if (!uri || !uri.startsWith('ipfs://')) {
    return uri;
  }
  // Use a public IPFS gateway to display the image
  const path = uri.substring(7);
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `https://ipfs.io/ipfs/${encodedPath}`;
};

const getNftImageUrl = (nftInfo) => {
  if (!nftInfo) {
    return null;
  }
  // Prefer meta.image as it's often the intended primary display
  const primaryImage = nftInfo.meta?.image;
  if (primaryImage) {
    return primaryImage;
  }

  // Fallback to the first image in files array
  if (Array.isArray(nftInfo.files) && nftInfo.files.length > 0) {
    const imageFile = nftInfo.files.find((file) => file.parsedType === 'image' && file.parsedUrl);
    if (imageFile) {
      return imageFile.parsedUrl;
    }
  }

  return null;
};

const KNOWN_SOURCE_TAGS = {
  101102979: { name: 'xrp.cafe', url: 'https://xrp.cafe' },
  20221212: { name: 'XPMarket', url: 'https://xpmarket.com' }
};

// Helper to render key-value pairs and make certain values clickable
const JsonViewer = ({ data }) => (
  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#fff' }}>
    {JSON.stringify(data, null, 2)}
  </pre>
);

const DetailRow = ({ label, children, ...props }) => (
  <Grid container item xs={12} sx={{ mb: 2, pb: 2, ...props }}>
    <Grid item xs={12} md={3}>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
    </Grid>
    <Grid item xs={12} md={9}>
      {children}
    </Grid>
  </Grid>
);

const TokenTooltipContent = ({ md5, tokenInfo, loading, error }) => {
  if (error) return <Typography sx={{ p: 1 }}>{error}</Typography>;
  if (loading) return <Typography sx={{ p: 1 }}>Loading...</Typography>;
  if (!tokenInfo || tokenInfo.res !== 'success' || !tokenInfo.token)
    return <Typography sx={{ p: 1 }}>No data available.</Typography>;

  const { token, exch } = tokenInfo;
  const imageUrl = md5 ? `https://s1.xrpl.to/token/${md5}` : null;
  const isXRP = token.currency === 'XRP' && token.issuer === 'XRPL';

  // Enhanced XRP tooltip
  if (isXRP) {
    return (
      <Box sx={{ p: 2, minWidth: 320, maxWidth: 400 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar src={imageUrl} sx={{ mr: 2, width: 48, height: 48 }} />
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold', mb: 0.5 }}>
              XRP
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Native XRPL Asset
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Price Information */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Price
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {exch && (
              <>
                <Chip
                  label={`$${new BigNumber(exch.USD).toFixed(4)}`}
                  size="small"
                  sx={{ fontSize: '0.75rem' }}
                />
                <Chip
                  label={`€${new BigNumber(exch.EUR).toFixed(4)}`}
                  size="small"
                  sx={{ fontSize: '0.75rem' }}
                />
                <Chip
                  label={`¥${new BigNumber(exch.JPY).toFixed(4)}`}
                  size="small"
                  sx={{ fontSize: '0.75rem' }}
                />
              </>
            )}
          </Box>
        </Box>

        {/* Performance */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Performance
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                24h Change
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'bold',
                  color: token.pro24h >= 0 ? 'success.main' : 'error.main'
                }}
              >
                {token.pro24h >= 0 ? '+' : ''}
                {token.pro24h?.toFixed(2)}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                7d Change
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'bold',
                  color: token.pro7d >= 0 ? 'success.main' : 'error.main'
                }}
              >
                {token.pro7d >= 0 ? '+' : ''}
                {token.pro7d?.toFixed(2)}%
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Market Data */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Market Data
          </Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                24h Volume
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {new BigNumber(token.vol24h || 0).toFormat(0)} XRP
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Supply
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {new BigNumber(token.supply || 0).toFormat(0)} XRP
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Holders
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {new BigNumber(token.holders || 0).toFormat(0)}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Additional Info */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Info
          </Typography>
          <Stack spacing={0.5}>
            {token.domain && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Domain
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {token.domain}
                </Typography>
              </Box>
            )}
            {token.tags && token.tags.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {token.tags.slice(0, 3).map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  ))}
                  {token.tags.length > 3 && (
                    <Chip
                      label={`+${token.tags.length - 3}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  )}
                </Box>
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
    );
  }

  // Enhanced tooltip for regular tokens
  return (
    <Box sx={{ p: 2, minWidth: 320, maxWidth: 400 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {imageUrl && <Avatar src={imageUrl} sx={{ mr: 2, width: 48, height: 48 }} />}
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold', mb: 0.5 }}>
            {token.name || token.user || 'Unknown Token'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {token.user && token.name !== token.user ? `"${token.user}"` : 'Token'}
          </Typography>
          {token.issuer && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {token.issuer.slice(0, 12)}...{token.issuer.slice(-6)}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Price Information */}
      {(token.usd || exch) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Price
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {token.usd && (
              <Chip
                label={`$${new BigNumber(token.usd).toFixed(6)}`}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
            {token.exch && (
              <Chip
                label={`${new BigNumber(token.exch).toFixed(6)} XRP`}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Performance */}
      {(token.pro24h || token.pro7d) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Performance
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {typeof token.pro24h === 'number' && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  24h Change
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    color: token.pro24h >= 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {token.pro24h >= 0 ? '+' : ''}
                  {token.pro24h.toFixed(2)}%
                </Typography>
              </Box>
            )}
            {typeof token.pro7d === 'number' && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  7d Change
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    color: token.pro7d >= 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {token.pro7d >= 0 ? '+' : ''}
                  {token.pro7d.toFixed(2)}%
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Market Data */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Market Data
        </Typography>
        <Stack spacing={0.5}>
          {token.marketcap > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Market Cap
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {new BigNumber(token.marketcap).toFormat(0)} XRP
              </Typography>
            </Box>
          )}
          {token.vol24h > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                24h Volume
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {new BigNumber(token.vol24h).toFormat(0)} XRP
              </Typography>
            </Box>
          )}
          {token.supply && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Supply
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {new BigNumber(token.supply).toFormat(0)}
              </Typography>
            </Box>
          )}
          {token.holders && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Holders
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {new BigNumber(token.holders).toFormat(0)}
              </Typography>
            </Box>
          )}
          {token.trustlines && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Trust Lines
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {new BigNumber(token.trustlines).toFormat(0)}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Verification & Features */}
      {(token.kyc || token.verified || token.AMM) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Features
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {token.kyc && (
              <Chip
                label="KYC"
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
            {token.verified && (
              <Chip
                label="Verified"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
            {token.AMM && (
              <Chip
                label="AMM"
                size="small"
                color="info"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Additional Info */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Info
        </Typography>
        <Stack spacing={0.5}>
          {token.domain && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Domain
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium', wordBreak: 'break-all' }}>
                {token.domain}
              </Typography>
            </Box>
          )}
          {token.social && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Social
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {token.social.twitter && (
                  <Chip
                    label="Twitter"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
                {token.social.telegram && (
                  <Chip
                    label="Telegram"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Box>
            </Box>
          )}
          {token.tags && token.tags.length > 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {token.tags.slice(0, 3).map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                ))}
                {token.tags.length > 3 && (
                  <Chip
                    label={`+${token.tags.length - 3}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Box>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

const TokenLinkWithTooltip = ({ slug, currency, rawCurrency, md5, variant = 'body1' }) => {
  const theme = useTheme();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isLpToken = rawCurrency && rawCurrency.length === 40 && /^[A-F0-9]{40}$/i.test(rawCurrency);
  const isXRP = currency === 'XRP' && md5 === '84e5efeb89c4eae8f68188982dc290d8';

  useEffect(() => {
    const fetchTokenName = async () => {
      if (isLpToken) {
        setLoading(true);
        try {
          const response = await axios.get(`https://api.xrpl.to/api/token/${md5}`);
          setTokenInfo(response.data);
        } catch (err) {
          console.error('Failed to fetch token info for LP token', err);
          setError('Could not load token data.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTokenName();
  }, [isLpToken, md5]);

  const handleFetchTokenInfo = async () => {
    if (tokenInfo || loading) return;
    setLoading(true);
    setError(null);
    try {
      let response;
      if (isXRP) {
        response = await axios.get('https://api.xrpl.to/api/token/xrp');
      } else {
        response = await axios.get(`https://api.xrpl.to/api/token/${md5}`);
      }
      setTokenInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch token info', err);
      setError('Could not load token data.');
    } finally {
      setLoading(false);
    }
  };

  let displayText = currency;
  if (isLpToken) {
    if (loading) {
      displayText = '...';
    } else if (tokenInfo?.token) {
      displayText = tokenInfo.token.name || tokenInfo.token.user || 'LP Token';
    } else {
      displayText = 'LP Token';
    }
  }

  const link = (
    <Link href={`/token/${slug}`} passHref>
      <Typography
        component="a"
        variant={variant}
        sx={{
          color: theme.palette.primary.main,
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
          ml: 0.5
        }}
      >
        {displayText}
      </Typography>
    </Link>
  );

  return (
    <Tooltip
      title={
        <TokenTooltipContent md5={md5} tokenInfo={tokenInfo} loading={loading} error={error} />
      }
      onOpen={handleFetchTokenInfo}
      placement="top"
      arrow
      PopperProps={{
        sx: {
          '& .MuiTooltip-tooltip': {
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: `1px solid ${theme.palette.divider}`,
            maxWidth: 'none'
          }
        }
      }}
    >
      <Box sx={{ cursor: 'pointer', display: 'inline-flex' }}>{link}</Box>
    </Tooltip>
  );
};

const AccountAvatar = ({ account }) => {
  const [imgSrc, setImgSrc] = useState(`https://s1.xrpl.to/account/${account}`);

  const handleImageError = () => {
    setImgSrc(getHashIcon(account));
  };

  return <Avatar src={imgSrc} onError={handleImageError} sx={{ width: 32, height: 32, mr: 1 }} />;
};

const TokenDisplay = ({ slug, currency, rawCurrency, variant = 'body1' }) => {
  const stringToHash = slug.replace('-', '_');
  const md5 = CryptoJS.MD5(stringToHash).toString();
  const imageUrl = `https://s1.xrpl.to/token/${md5}`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
      <Avatar src={imageUrl} sx={{ width: 20, height: 20, mr: 0.5 }} />
      <TokenLinkWithTooltip
        slug={slug}
        currency={currency}
        rawCurrency={rawCurrency}
        md5={md5}
        variant={variant}
      />
    </Box>
  );
};

const XrpDisplay = ({ variant = 'body2', showText = true }) => {
  const theme = useTheme();
  const [xrpTokenInfo, setXrpTokenInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchXrpInfo = async () => {
    if (xrpTokenInfo || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://api.xrpl.to/api/token/xrp');
      setXrpTokenInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch XRP info', err);
      setError('Could not load XRP data.');
    } finally {
      setLoading(false);
    }
  };

  const xrpElement = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Avatar
        src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8"
        sx={{ width: 20, height: 20 }}
      />
      {showText && <Typography variant={variant}>XRP</Typography>}
    </Box>
  );

  return (
    <Tooltip
      title={
        <TokenTooltipContent
          md5="84e5efeb89c4eae8f68188982dc290d8"
          tokenInfo={xrpTokenInfo}
          loading={loading}
          error={error}
        />
      }
      onOpen={handleFetchXrpInfo}
      placement="top"
      arrow
      PopperProps={{
        sx: {
          '& .MuiTooltip-tooltip': {
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: `1px solid ${theme.palette.divider}`,
            maxWidth: 'none'
          }
        }
      }}
    >
      <Box sx={{ cursor: 'pointer', display: 'inline-flex' }}>{xrpElement}</Box>
    </Tooltip>
  );
};

const AmountDisplay = ({ amount, variant = 'body1' }) => {
  const theme = useTheme();
  const [xrpTokenInfo, setXrpTokenInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchXrpInfo = async () => {
    if (xrpTokenInfo || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://api.xrpl.to/api/token/xrp');
      setXrpTokenInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch XRP info', err);
      setError('Could not load XRP data.');
    } finally {
      setLoading(false);
    }
  };

  if (typeof amount === 'string') {
    const xrpElement = (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8"
          sx={{ width: 20, height: 20, mr: 0.5 }}
        />
        <Typography variant={variant}>{dropsToXrp(amount)} XRP</Typography>
      </Box>
    );

    return (
      <Tooltip
        title={
          <TokenTooltipContent
            md5="84e5efeb89c4eae8f68188982dc290d8"
            tokenInfo={xrpTokenInfo}
            loading={loading}
            error={error}
          />
        }
        onOpen={handleFetchXrpInfo}
        placement="top"
        arrow
        PopperProps={{
          sx: {
            '& .MuiTooltip-tooltip': {
              bgcolor: 'background.paper',
              color: 'text.primary',
              border: `1px solid ${theme.palette.divider}`,
              maxWidth: 'none'
            }
          }
        }}
      >
        <Box sx={{ cursor: 'pointer', display: 'inline-flex' }}>{xrpElement}</Box>
      </Tooltip>
    );
  }
  if (typeof amount === 'object') {
    const currency = normalizeCurrencyCode(amount.currency);
    const slug = amount.issuer ? `${amount.issuer}-${amount.currency}` : null;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant={variant} component="span">
          {new BigNumber(amount.value).toFormat()}{' '}
        </Typography>
        {slug ? (
          <TokenDisplay
            slug={slug}
            currency={currency}
            rawCurrency={amount.currency}
            variant={variant}
          />
        ) : (
          <Typography
            variant={variant}
            component="span"
            sx={{ color: theme.palette.primary.main, ml: 0.5 }}
          >
            {currency}
          </Typography>
        )}
      </Box>
    );
  }
  return null;
};

function getPaymentFlagExplanation(flags) {
  const explanations = [];
  if (flags & 0x00020000)
    // tfPartialPayment
    explanations.push({
      title: 'Allow partial payment',
      description:
        'The payment is allowed to be partially executed, delivering less than the Amount.'
    });
  if (flags & 0x00010000)
    // tfNoDirectRipple
    explanations.push({
      title: 'No direct ripple',
      description: 'The payment is not allowed to use a direct path between sender and receiver.'
    });
  return explanations;
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const getTransactionDescription = (txData) => {
  const {
    TransactionType,
    Account,
    Destination,
    Amount,
    TakerGets,
    TakerPays,
    Fee,
    Flags,
    SendMax,
    LimitAmount,
    NFTokenID,
    Paths,
    meta,
    OfferSequence,
    cancelledNftOffers,
    acceptedOfferDetails,
    LPTokenIn,
    Amount2,
    TransferFee,
    NFTokenTaxon,
    URI
  } = txData;

  const getCurrency = (amount) => {
    if (typeof amount === 'string') return 'XRP';
    if (typeof amount === 'object' && amount && amount.currency) {
      return normalizeCurrencyCode(amount.currency);
    }
    return 'XRP';
  };

  const isSuccess = meta?.TransactionResult === 'tesSUCCESS';
  const deliveredAmount = meta?.delivered_amount || meta?.DeliveredAmount;
  const isConversion =
    TransactionType === 'Payment' &&
    (Boolean(Paths) || (SendMax && getCurrency(Amount) !== getCurrency(SendMax)));

  const formatAmount = (amount) => {
    if (typeof amount === 'string') {
      return `${dropsToXrp(amount)} XRP`;
    }
    if (typeof amount === 'object' && amount) {
      const currency = normalizeCurrencyCode(amount.currency);
      return `${new BigNumber(amount.value).toFormat()} ${currency}`;
    }
    return 'Unknown amount';
  };

  const formatAccount = (account) => {
    return `${account.slice(0, 8)}...${account.slice(-4)}`;
  };

  switch (TransactionType) {
    case 'Payment':
      if (isConversion && Account === Destination) {
        const sentAmount = SendMax ? formatAmount(SendMax) : formatAmount(Amount);
        const receivedAmount = deliveredAmount
          ? formatAmount(deliveredAmount)
          : formatAmount(Amount);
        return {
          title: 'Currency Conversion',
          description: `${formatAccount(Account)} converted ${sentAmount} to ${receivedAmount}. This was a self-conversion where the same account sent and received different currencies, effectively exchanging one asset for another through the XRPL's built-in decentralized exchange.`,
          details: [
            `Account ${formatAccount(Account)} initiated the conversion`,
            `Maximum willing to spend: ${sentAmount}`,
            `Actual amount received: ${receivedAmount}`,
            `Network fee: ${dropsToXrp(Fee)} XRP`,
            isSuccess ? 'Conversion completed successfully' : 'Conversion failed'
          ]
        };
      } else {
        const amount = deliveredAmount ? formatAmount(deliveredAmount) : formatAmount(Amount);
        const maxAmount = SendMax ? formatAmount(SendMax) : null;
        return {
          title: 'Payment Transfer',
          description: `${formatAccount(Account)} sent ${amount} to ${formatAccount(Destination)}. ${maxAmount ? `They were willing to spend up to ${maxAmount} but only ${amount} was needed.` : ''} ${Paths ? 'This payment used currency paths through the decentralized exchange to convert between different assets.' : 'This was a direct payment.'}`,
          details: [
            `From: ${formatAccount(Account)}`,
            `To: ${formatAccount(Destination)}`,
            `Amount sent: ${amount}`,
            maxAmount ? `Maximum authorized: ${maxAmount}` : null,
            `Network fee: ${dropsToXrp(Fee)} XRP`,
            Paths ? 'Used currency conversion paths' : 'Direct payment',
            isSuccess ? 'Payment delivered successfully' : 'Payment failed'
          ].filter(Boolean)
        };
      }

    case 'OfferCreate':
      const isSellOrder = Flags & 0x00080000;
      const takerGets = formatAmount(TakerGets);
      const takerPays = formatAmount(TakerPays);
      return {
        title: `${isSellOrder ? 'Sell' : 'Buy'} Order Created`,
        description: `${formatAccount(Account)} placed a ${isSellOrder ? 'sell' : 'buy'} order on the decentralized exchange. They want to ${isSellOrder ? `sell ${takerGets} in exchange for ${takerPays}` : `buy ${takerGets} by paying ${takerPays}`}. ${OfferSequence > 0 ? `This order replaces a previous order #${OfferSequence}.` : 'This is a new order.'}`,
        details: [
          `Order maker: ${formatAccount(Account)}`,
          `Order type: ${isSellOrder ? 'Sell' : 'Buy'} order`,
          `Offering: ${takerGets}`,
          `Requesting: ${takerPays}`,
          `Exchange rate: 1 ${getCurrency(TakerPays)} = ${new BigNumber(TakerGets.value || dropsToXrp(TakerGets)).div(TakerPays.value || dropsToXrp(TakerPays)).toFormat()} ${getCurrency(TakerGets)}`,
          OfferSequence > 0 ? `Replaces order #${OfferSequence}` : 'New order',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Order placed successfully' : 'Order placement failed'
        ]
      };

    case 'OfferCancel':
      return {
        title: 'Order Cancellation',
        description: `${formatAccount(Account)} cancelled their order #${OfferSequence} on the decentralized exchange. This removes the order from the order book, making it no longer available for matching with other orders.`,
        details: [
          `Order maker: ${formatAccount(Account)}`,
          `Cancelled order: #${OfferSequence}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Order cancelled successfully' : 'Cancellation failed'
        ]
      };

    case 'TrustSet':
      const trustAmount = LimitAmount ? formatAmount(LimitAmount) : 'Unknown';
      const trustIssuer = LimitAmount ? formatAccount(LimitAmount.issuer) : 'Unknown';
      return {
        title: 'Trust Line Configuration',
        description: `${formatAccount(Account)} ${LimitAmount && new BigNumber(LimitAmount.value).isZero() ? 'removed' : 'established or modified'} a trust line with ${trustIssuer}. Trust lines allow accounts to hold and transact with tokens issued by other accounts. ${LimitAmount && !new BigNumber(LimitAmount.value).isZero() ? `The trust limit is set to ${trustAmount}.` : 'The trust line has been removed.'}`,
        details: [
          `Account: ${formatAccount(Account)}`,
          `Token issuer: ${trustIssuer}`,
          `Trust limit: ${trustAmount}`,
          LimitAmount && new BigNumber(LimitAmount.value).isZero()
            ? 'Action: Trust line removed'
            : 'Action: Trust line created/modified',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Trust line updated successfully' : 'Trust line update failed'
        ]
      };

    case 'NFTokenMint':
      const transferFeePercent = TransferFee ? `${TransferFee / 1000}%` : '0%';
      return {
        title: 'NFT Minting',
        description: `${formatAccount(Account)} minted a new NFT${meta?.nftoken_id ? ` with ID ${meta.nftoken_id.slice(0, 16)}...` : ''}. ${TransferFee ? `This NFT has a ${transferFeePercent} transfer fee that goes to the original issuer on each sale.` : 'This NFT has no transfer fees.'} ${URI ? 'The NFT includes metadata accessible via URI.' : ''}`,
        details: [
          `Minter: ${formatAccount(Account)}`,
          meta?.nftoken_id ? `NFT ID: ${meta.nftoken_id}` : null,
          `Transfer fee: ${transferFeePercent}`,
          NFTokenTaxon ? `NFT Taxon: ${NFTokenTaxon}` : null,
          URI ? 'Includes metadata URI' : 'No metadata URI',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'NFT minted successfully' : 'NFT minting failed'
        ].filter(Boolean)
      };

    case 'NFTokenCreateOffer':
      const isBuyOffer = !(Flags & 1);
      const offerAmount = formatAmount(Amount);
      return {
        title: `NFT ${isBuyOffer ? 'Buy' : 'Sell'} Offer`,
        description: `${formatAccount(Account)} created a ${isBuyOffer ? 'buy' : 'sell'} offer for NFT ${NFTokenID ? NFTokenID.slice(0, 16) + '...' : 'Unknown'}. ${isBuyOffer ? `They are offering to pay ${offerAmount} to purchase this NFT.` : `They are offering to sell this NFT for ${offerAmount}.`} ${Destination ? `This offer is specifically directed to ${formatAccount(Destination)}.` : 'This offer is open to anyone.'}`,
        details: [
          `Offer creator: ${formatAccount(Account)}`,
          `Offer type: ${isBuyOffer ? 'Buy' : 'Sell'} offer`,
          NFTokenID ? `NFT ID: ${NFTokenID}` : null,
          `Offer amount: ${offerAmount}`,
          Destination ? `Directed to: ${formatAccount(Destination)}` : 'Open offer',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Offer created successfully' : 'Offer creation failed'
        ].filter(Boolean)
      };

    case 'NFTokenAcceptOffer':
      if (acceptedOfferDetails) {
        return {
          title: 'NFT Sale Completed',
          description: `${formatAccount(Account)} accepted an NFT offer, completing the sale of NFT ${acceptedOfferDetails.nftokenID.slice(0, 16)}... from ${formatAccount(acceptedOfferDetails.seller)} to ${formatAccount(acceptedOfferDetails.buyer)}. The NFT has been transferred and payment has been processed automatically.`,
          details: [
            `Transaction initiator: ${formatAccount(Account)}`,
            `NFT seller: ${formatAccount(acceptedOfferDetails.seller)}`,
            `NFT buyer: ${formatAccount(acceptedOfferDetails.buyer)}`,
            `NFT ID: ${acceptedOfferDetails.nftokenID}`,
            `Network fee: ${dropsToXrp(Fee)} XRP`,
            isSuccess ? 'NFT sale completed successfully' : 'NFT sale failed'
          ]
        };
      }
      return {
        title: 'NFT Offer Accepted',
        description: `${formatAccount(Account)} accepted an NFT offer, completing an NFT transaction.`,
        details: [
          `Transaction initiator: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Offer accepted successfully' : 'Offer acceptance failed'
        ]
      };

    case 'NFTokenCancelOffer':
      const offerCount = cancelledNftOffers?.length || 0;
      return {
        title: 'NFT Offer Cancellation',
        description: `${formatAccount(Account)} cancelled ${offerCount} NFT offer${offerCount !== 1 ? 's' : ''}. This removes the offer${offerCount !== 1 ? 's' : ''} from the NFT marketplace, making ${offerCount !== 1 ? 'them' : 'it'} no longer available for acceptance.`,
        details: [
          `Offer creator: ${formatAccount(Account)}`,
          `Offers cancelled: ${offerCount}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Offers cancelled successfully' : 'Offer cancellation failed'
        ]
      };

    case 'AMMDeposit':
      const depositAmount = Amount ? formatAmount(Amount) : null;
      const depositAmount2 = Amount2 ? formatAmount(Amount2) : null;
      return {
        title: 'AMM Liquidity Deposit',
        description: `${formatAccount(Account)} deposited liquidity into an Automated Market Maker (AMM) pool. ${depositAmount ? `They deposited ${depositAmount}` : ''}${depositAmount2 ? ` and ${depositAmount2}` : ''} to provide liquidity and earn a share of trading fees.`,
        details: [
          `Liquidity provider: ${formatAccount(Account)}`,
          depositAmount ? `Deposited: ${depositAmount}` : null,
          depositAmount2 ? `Also deposited: ${depositAmount2}` : null,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Liquidity deposited successfully' : 'Deposit failed'
        ].filter(Boolean)
      };

    case 'AMMWithdraw':
      const withdrawAmount = LPTokenIn ? formatAmount(LPTokenIn) : null;
      return {
        title: 'AMM Liquidity Withdrawal',
        description: `${formatAccount(Account)} withdrew liquidity from an Automated Market Maker (AMM) pool. ${withdrawAmount ? `They redeemed ${withdrawAmount} LP tokens` : 'They withdrew their liquidity position'} to receive back their share of the pool assets.`,
        details: [
          `Liquidity provider: ${formatAccount(Account)}`,
          withdrawAmount ? `LP tokens redeemed: ${withdrawAmount}` : 'Liquidity withdrawal',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Liquidity withdrawn successfully' : 'Withdrawal failed'
        ]
      };

    case 'OracleSet':
      return {
        title: 'Oracle Data Update',
        description: `${formatAccount(Account)} updated oracle data on the XRPL. Oracles provide external data (like price feeds) that can be used by other applications and smart contracts on the network.`,
        details: [
          `Oracle operator: ${formatAccount(Account)}`,
          'Action: Oracle data updated',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Oracle updated successfully' : 'Oracle update failed'
        ]
      };

    default:
      return {
        title: `${TransactionType} Transaction`,
        description: `${formatAccount(Account)} submitted a ${TransactionType} transaction to the XRPL network. This transaction type performs specific operations on the ledger.`,
        details: [
          `Transaction initiator: ${formatAccount(Account)}`,
          `Transaction type: ${TransactionType}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Transaction completed successfully' : 'Transaction failed'
        ]
      };
  }
};

const TransactionSummaryCard = ({ txData, theme }) => {
  const { hash, TransactionType, Account, Destination, Amount, meta, date, ledger_index, Fee } =
    txData;

  const isSuccess = meta?.TransactionResult === 'tesSUCCESS';
  const deliveredAmount = meta?.delivered_amount || meta?.DeliveredAmount;
  const description = getTransactionDescription(txData);

  const getTransactionIcon = () => {
    switch (TransactionType) {
      case 'Payment':
        return <SwapHorizIcon />;
      case 'OfferCreate':
      case 'OfferCancel':
        return <TrendingUpIcon />;
      case 'TrustSet':
        return <AccountBalanceWalletIcon />;
      default:
        return <SwapHorizIcon />;
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start" mb={3}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main
            }}
          >
            {getTransactionIcon()}
          </Box>
          <Box flex={1}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Typography variant="h5" component="h2">
                {description.title}
              </Typography>
              <Chip
                icon={isSuccess ? <CheckCircleIcon /> : <ErrorIcon />}
                label={isSuccess ? 'Success' : 'Failed'}
                color={isSuccess ? 'success' : 'error'}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Typography variant="body1" color="text.primary" sx={{ mb: 2, lineHeight: 1.6 }}>
              {description.description}
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              divider={<Divider orientation="vertical" flexItem />}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Hash
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                >
                  {hash.slice(0, 16)}...
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Ledger #{ledger_index}
                </Typography>
                <Typography variant="body2">
                  {formatDistanceToNow(new Date(rippleTimeToISO8601(date)))} ago
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Network Fee
                </Typography>
                <Typography variant="body2">{dropsToXrp(Fee)} XRP</Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>

        {(Amount || deliveredAmount) && (
          <Box
            p={2}
            sx={{ background: 'transparent', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}
          >
            <Typography variant="caption" color="text.secondary">
              Amount
            </Typography>
            <Box mt={1}>
              <AmountDisplay amount={deliveredAmount || Amount} variant="h6" />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const TransactionDetails = ({ txData, theme }) => {
  const [moreVisible, setMoreVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [rawVisible, setRawVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const {
    hash,
    ledger_index,
    meta,
    TransactionType,
    date,
    Account,
    Sequence,
    TakerGets,
    TakerPays,
    Fee,
    Flags,
    LastLedgerSequence,
    ctid,
    Amount,
    Destination,
    SendMax,
    Paths,
    Memos,
    SourceTag,
    OfferSequence,
    LimitAmount,
    Amount2,
    Asset,
    Asset2,
    NFTokenOffers,
    NFTokenTaxon,
    TransferFee,
    URI,
    OracleDocumentID,
    LastUpdateTime,
    PriceDataSeries,
    Provider,
    LPTokenIn,
    NFTokenSellOffer,
    NFTokenBuyOffer,
    NFTokenID
  } = txData;

  const clientInfo = KNOWN_SOURCE_TAGS[SourceTag];

  const { meta: metaToExclude, ...rawData } = txData;
  const deliveredAmount = meta?.delivered_amount || meta?.DeliveredAmount;

  const txUrl = `https://xrpl.to/tx/${hash}`;

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(txUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const txResult = meta?.TransactionResult;
  const transactionIndex = meta?.TransactionIndex;

  const [acceptedNftInfo, setAcceptedNftInfo] = useState(null);
  const [nftInfoLoading, setNftInfoLoading] = useState(false);
  const [offerNftInfo, setOfferNftInfo] = useState(null);
  const [offerNftInfoLoading, setOfferNftInfoLoading] = useState(false);
  const [mintedNftInfo, setMintedNftInfo] = useState(null);
  const [mintedNftInfoLoading, setMintedNftInfoLoading] = useState(false);
  const [cancelledNftInfo, setCancelledNftInfo] = useState({});
  const [cancelledNftInfoLoading, setCancelledNftInfoLoading] = useState({});

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCurrency = (amount) => {
    if (typeof amount === 'string') return 'XRP';
    if (typeof amount === 'object' && amount && amount.currency) {
      return normalizeCurrencyCode(amount.currency);
    }
    return 'XRP';
  };

  const isConversion =
    TransactionType === 'Payment' &&
    (Boolean(Paths) || (SendMax && getCurrency(Amount) !== getCurrency(SendMax)));

  const getBalanceChanges = () => {
    if (!meta || !meta.AffectedNodes) return { balanceChanges: [], exchanges: [] };

    const balanceChanges = {};
    const exchanges = [];

    for (const affectedNode of meta.AffectedNodes) {
      const node = affectedNode.ModifiedNode || affectedNode.DeletedNode;
      if (!node || !node.LedgerEntryType) continue;

      const finalFields = node.FinalFields || {};
      const previousFields = node.PreviousFields || {};

      if (node.LedgerEntryType === 'AccountRoot' && previousFields.Balance) {
        const account = finalFields.Account;
        const change = new BigNumber(finalFields.Balance).minus(previousFields.Balance);
        if (!balanceChanges[account]) balanceChanges[account] = [];
        balanceChanges[account].push({ currency: 'XRP', value: dropsToXrp(change.toString()) });
      } else if (node.LedgerEntryType === 'RippleState' && previousFields.Balance) {
        const lowAccount = finalFields.LowLimit.issuer;
        const highAccount = finalFields.HighLimit.issuer;
        const currency = finalFields.Balance.currency;
        const finalBalance = new BigNumber(finalFields.Balance.value);
        const prevBalance = new BigNumber(previousFields.Balance?.value || 0);
        const change = finalBalance.minus(prevBalance);

        if (!change.isZero()) {
          const normCurr = normalizeCurrencyCode(currency);

          let issuer = highAccount;
          // If balance is negative, the low account is the issuer.
          if (new BigNumber(finalFields.Balance.value).isNegative()) {
            issuer = lowAccount;
          } else if (
            finalBalance.isZero() &&
            previousFields.Balance &&
            new BigNumber(previousFields.Balance.value).isNegative()
          ) {
            // If final balance is 0 and previous was negative, low account was issuer.
            issuer = lowAccount;
          }

          if (!balanceChanges[lowAccount]) balanceChanges[lowAccount] = [];
          balanceChanges[lowAccount].push({
            currency: normCurr,
            rawCurrency: currency,
            value: change.toString(),
            issuer
          });

          if (!balanceChanges[highAccount]) balanceChanges[highAccount] = [];
          balanceChanges[highAccount].push({
            currency: normCurr,
            rawCurrency: currency,
            value: change.negated().toString(),
            issuer
          });
        }
      } else if (
        node.LedgerEntryType === 'Offer' &&
        node.PreviousFields?.TakerPays &&
        node.PreviousFields?.TakerGets
      ) {
        const maker = node.FinalFields.Account;

        const prevPays = node.PreviousFields.TakerPays;
        const finalPays = node.FinalFields.TakerPays;
        const prevGets = node.PreviousFields.TakerGets;
        const finalGets = node.FinalFields.TakerGets;

        const paid =
          typeof prevPays === 'object'
            ? new BigNumber(prevPays.value || 0).minus(finalPays.value || 0)
            : new BigNumber(prevPays || 0).minus(finalPays || 0);

        const got =
          typeof prevGets === 'object'
            ? new BigNumber(prevGets.value || 0).minus(finalGets.value || 0)
            : new BigNumber(prevGets || 0).minus(finalGets || 0);

        if (!paid.isZero() && !got.isZero()) {
          const paidAmount = {};
          if (typeof finalPays === 'object') {
            paidAmount.value = paid.toString();
            paidAmount.currency = normalizeCurrencyCode(finalPays.currency);
            paidAmount.rawCurrency = finalPays.currency;
            paidAmount.issuer = finalPays.issuer;
          } else {
            paidAmount.value = dropsToXrp(paid.toString());
            paidAmount.currency = 'XRP';
          }

          const gotAmount = {};
          if (typeof finalGets === 'object') {
            gotAmount.value = got.toString();
            gotAmount.currency = normalizeCurrencyCode(finalGets.currency);
            gotAmount.rawCurrency = finalGets.currency;
            gotAmount.issuer = finalGets.issuer;
          } else {
            gotAmount.value = dropsToXrp(got.toString());
            gotAmount.currency = 'XRP';
          }

          exchanges.push({ maker, paid: paidAmount, got: gotAmount });
        }
      }
    }

    const finalChanges = Object.entries(balanceChanges).map(([account, changes]) => ({
      account,
      changes
    }));
    return { balanceChanges: finalChanges, exchanges };
  };

  const getCancelledOfferDetails = () => {
    if (TransactionType !== 'OfferCancel' || !meta || !meta.AffectedNodes) {
      return null;
    }
    const deletedOfferNode = meta.AffectedNodes.find(
      (node) => node.DeletedNode && node.DeletedNode.LedgerEntryType === 'Offer'
    );
    if (deletedOfferNode) {
      return deletedOfferNode.DeletedNode.FinalFields;
    }
    return null;
  };

  const acceptedOfferDetails = useMemo(() => {
    if (TransactionType !== 'NFTokenAcceptOffer' || !meta || !meta.AffectedNodes) {
      return null;
    }
    const offerNode = meta.AffectedNodes.find(
      (node) => node.DeletedNode && node.DeletedNode.LedgerEntryType === 'NFTokenOffer'
    );
    if (offerNode) {
      const { NFTokenID, Owner, Destination } = offerNode.DeletedNode.FinalFields;
      let uri = null;

      for (const affectedNode of meta.AffectedNodes) {
        const node = affectedNode.ModifiedNode || affectedNode.DeletedNode;
        if (node?.LedgerEntryType === 'NFTokenPage') {
          const nftList = node.PreviousFields?.NFTokens || node.FinalFields?.NFTokens;
          if (nftList) {
            const nft = nftList.find((item) => item.NFToken.NFTokenID === NFTokenID);
            if (nft?.NFToken.URI) {
              uri = nft.NFToken.URI;
              break;
            }
          }
        }
      }

      return {
        nftokenID: NFTokenID,
        seller: Owner,
        buyer: Destination || Account,
        uri
      };
    }
    return null;
  }, [TransactionType, meta, Account]);

  const cancelledNftOffers = useMemo(() => {
    if (TransactionType !== 'NFTokenCancelOffer' || !meta || !meta.AffectedNodes) {
      return [];
    }
    return meta.AffectedNodes.filter(
      (node) => node.DeletedNode && node.DeletedNode.LedgerEntryType === 'NFTokenOffer'
    ).map((node) => ({ ...node.DeletedNode.FinalFields, offerId: node.DeletedNode.LedgerIndex }));
  }, [TransactionType, meta]);

  useEffect(() => {
    if (acceptedOfferDetails?.nftokenID) {
      const fetchNftInfo = async () => {
        setNftInfoLoading(true);
        try {
          const response = await axios.get(
            `https://api.xrpnft.com/api/nft/${acceptedOfferDetails.nftokenID}`
          );
          if (response.data.res === 'success') {
            setAcceptedNftInfo(response.data.nft);
          }
        } catch (err) {
          if (err.response?.status === 404) {
            // NFT not found via API, this is handled gracefully by falling back to metadata.
          } else {
            console.error('Failed to fetch accepted NFT info', err);
          }
        } finally {
          setNftInfoLoading(false);
        }
      };
      fetchNftInfo();
    }
  }, [acceptedOfferDetails]);

  useEffect(() => {
    if (TransactionType === 'NFTokenCreateOffer' && NFTokenID) {
      const fetchNftInfo = async () => {
        setOfferNftInfoLoading(true);
        try {
          const response = await axios.get(`https://api.xrpnft.com/api/nft/${NFTokenID}`);
          if (response.data.res === 'success') {
            setOfferNftInfo(response.data.nft);
          }
        } catch (err) {
          // silent fail is ok
        } finally {
          setOfferNftInfoLoading(false);
        }
      };
      fetchNftInfo();
    }
  }, [TransactionType, NFTokenID]);

  useEffect(() => {
    if (TransactionType === 'NFTokenMint' && meta?.nftoken_id) {
      const fetchNftInfo = async () => {
        setMintedNftInfoLoading(true);
        try {
          const response = await axios.get(`https://api.xrpnft.com/api/nft/${meta.nftoken_id}`);
          if (response.data.res === 'success') {
            setMintedNftInfo(response.data.nft);
          }
        } catch (err) {
          // silent fail is ok
        } finally {
          setMintedNftInfoLoading(false);
        }
      };
      fetchNftInfo();
    }
  }, [TransactionType, meta]);

  useEffect(() => {
    if (TransactionType === 'NFTokenCancelOffer' && cancelledNftOffers.length > 0) {
      cancelledNftOffers.forEach((offer) => {
        if (!cancelledNftInfo[offer.NFTokenID] && !cancelledNftInfoLoading[offer.NFTokenID]) {
          setCancelledNftInfoLoading((prev) => ({ ...prev, [offer.NFTokenID]: true }));
          axios
            .get(`https://api.xrpnft.com/api/nft/${offer.NFTokenID}`)
            .then((response) => {
              if (response.data.res === 'success') {
                setCancelledNftInfo((prev) => ({
                  ...prev,
                  [offer.NFTokenID]: response.data.nft
                }));
              } else {
                setCancelledNftInfo((prev) => ({ ...prev, [offer.NFTokenID]: { error: true } }));
              }
            })
            .catch((err) => {
              console.error(`Failed to fetch NFT info for ${offer.NFTokenID}`, err);
              setCancelledNftInfo((prev) => ({ ...prev, [offer.NFTokenID]: { error: true } }));
            })
            .finally(() => {
              setCancelledNftInfoLoading((prev) => ({
                ...prev,
                [offer.NFTokenID]: false
              }));
            });
        }
      });
    }
  }, [cancelledNftOffers]);

  const { balanceChanges, exchanges } = getBalanceChanges();

  const initiatorChanges = balanceChanges.find((bc) => bc.account === Account);

  let conversionExchange;
  if (isConversion && exchanges.length === 0 && deliveredAmount && SendMax) {
    // For self-conversion, the user sent SendMax and received DeliveredAmount
    if (typeof deliveredAmount === 'string') {
      // User sent SendMax (token) and received XRP
      conversionExchange = {
        paid: {
          value: SendMax.value,
          currency: normalizeCurrencyCode(SendMax.currency),
          rawCurrency: SendMax.currency,
          issuer: SendMax.issuer
        },
        got: {
          value: dropsToXrp(deliveredAmount),
          currency: 'XRP'
        }
      };
    } else if (typeof deliveredAmount === 'object' && deliveredAmount.value) {
      // User sent SendMax (could be XRP or token) and received token
      if (typeof SendMax === 'string') {
        // User sent XRP and received token
        conversionExchange = {
          paid: {
            value: dropsToXrp(SendMax),
            currency: 'XRP'
          },
          got: {
            value: deliveredAmount.value,
            currency: normalizeCurrencyCode(deliveredAmount.currency),
            rawCurrency: deliveredAmount.currency,
            issuer: deliveredAmount.issuer
          }
        };
      } else {
        // User sent token and received different token
        conversionExchange = {
          paid: {
            value: SendMax.value,
            currency: normalizeCurrencyCode(SendMax.currency),
            rawCurrency: SendMax.currency,
            issuer: SendMax.issuer
          },
          got: {
            value: deliveredAmount.value,
            currency: normalizeCurrencyCode(deliveredAmount.currency),
            rawCurrency: deliveredAmount.currency,
            issuer: deliveredAmount.issuer
          }
        };
      }
    }
  }

  const cancelledOffer = getCancelledOfferDetails();
  const trustSetState = useMemo(() => {
    if (TransactionType !== 'TrustSet' || !meta || !meta.AffectedNodes) {
      return null;
    }

    const rippleStateNode = meta.AffectedNodes.find((node) => {
      const n = node.ModifiedNode || node.DeletedNode || node.CreatedNode;
      return n && n.LedgerEntryType === 'RippleState';
    });

    if (!rippleStateNode) return null;

    let fields;
    if (rippleStateNode.CreatedNode) {
      fields = rippleStateNode.CreatedNode.NewFields;
    } else {
      const node = rippleStateNode.ModifiedNode || rippleStateNode.DeletedNode;
      fields = rippleStateNode.DeletedNode ? node.PreviousFields : node.FinalFields;
    }

    if (!fields || typeof fields.Flags === 'undefined' || !fields.LowLimit) return null;

    const flags = fields.Flags;
    const lowIssuer = fields.LowLimit.issuer;
    const isLowAccount = Account === lowIssuer;

    const noRipple = isLowAccount ? (flags & 0x00100000) !== 0 : (flags & 0x00200000) !== 0;
    const frozen = isLowAccount ? (flags & 0x00400000) !== 0 : (flags & 0x00800000) !== 0;
    const authorized = isLowAccount ? (flags & 0x00040000) !== 0 : (flags & 0x00080000) !== 0;

    return {
      rippling: !noRipple,
      frozen,
      authorized
    };
  }, [TransactionType, meta, Account]);

  const getFlagExplanation = (flags, type) => {
    const explanations = [];
    if (type === 'OfferCreate') {
      if (flags & 0x00010000)
        explanations.push(
          'Passive: The offer does not consume offers that exactly match the price. It will be killed if it crosses the spread.'
        );
      if (flags & 0x00020000)
        explanations.push(
          'Immediate or Cancel: The offer executes immediately against existing offers, or is canceled.'
        );
      if (flags & 0x00040000)
        explanations.push('Fill or Kill: The offer must be fully filled or it is killed.');
      if (flags & 0x00080000) explanations.push('Sell: The offer is a sell offer.');
    }
    return explanations;
  };

  const getNFTokenMintFlagExplanation = (flags) => {
    const explanations = [];
    if (flags & 1) explanations.push('Burnable');
    if (flags & 2) explanations.push('OnlyXRP');
    if (flags & 8) explanations.push('Transferable');
    return explanations.join(', ');
  };

  const getAMMWithdrawFlagExplanation = (flags) => {
    if (flags & 0x00010000) return 'Withdraw all tokens';
    if (flags & 0x00100000) return 'Withdraw single asset by LP amount';
    if (flags & 0x00040000) return 'Withdraw single asset by asset amount';
    if (flags & 0x00200000) return 'Withdraw up to LP amount';
    return null;
  };

  const flagExplanations =
    TransactionType === 'Payment'
      ? getPaymentFlagExplanation(Flags)
      : getFlagExplanation(Flags, TransactionType);

  const mainExchange = exchanges.find((e) => e.maker === Account);
  let displayExchange = mainExchange || conversionExchange;

  if (
    !displayExchange &&
    TransactionType === 'OfferCreate' &&
    initiatorChanges?.changes.length >= 2
  ) {
    const changes = initiatorChanges.changes;
    const paidChange = changes.find((c) => new BigNumber(c.value).isNegative());
    const gotChange = changes.find((c) => new BigNumber(c.value).isPositive());

    if (paidChange && gotChange) {
      const paidValue = new BigNumber(paidChange.value).abs();
      const gotValue = new BigNumber(gotChange.value);

      let gotAmountFromChanges;
      if (gotChange.currency === 'XRP') {
        gotAmountFromChanges = gotValue.plus(dropsToXrp(Fee));
      } else {
        gotAmountFromChanges = gotValue;
      }

      let paidAmountFromChanges;
      if (paidChange.currency === 'XRP') {
        paidAmountFromChanges = paidValue.minus(dropsToXrp(Fee));
      } else {
        paidAmountFromChanges = paidValue;
      }

      displayExchange = {
        paid: {
          value: paidAmountFromChanges.toString(),
          currency: paidChange.currency,
          rawCurrency: paidChange.rawCurrency,
          issuer: paidChange.issuer
        },
        got: {
          value: gotAmountFromChanges.toString(),
          currency: gotChange.currency,
          rawCurrency: gotChange.rawCurrency,
          issuer: gotChange.issuer
        }
      };
    }
  }

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const isSuccess = txResult === 'tesSUCCESS';

  let failureReason = {};
  if (!isSuccess) {
    if (txResult === 'tecPATH_DRY') {
      failureReason = {
        title: 'Path dry',
        description:
          'The transaction failed because the provided paths did not have enough liquidity to send anything at all. This could mean that the source and destination accounts are not linked by trust lines.'
      };
    } else if (txResult === 'tecUNFUNDED_PAYMENT') {
      failureReason = {
        title: 'Unfunded payment',
        description:
          'The transaction failed because the sending account is trying to send more XRP than it holds, not counting the reserve.'
      };
    } else {
      failureReason = {
        title: 'Transaction Failed',
        description: `The transaction failed with result code: ${txResult}`
      };
    }
  }

  return (
    <Box>
      <TransactionSummaryCard txData={txData} theme={theme} />

      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 3,
          background: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: `
            0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
            0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
            inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: { xs: 'none', sm: 'translateY(-2px)' },
            boxShadow: `
              0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
              0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
              inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
            border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ wordBreak: 'break-all', mr: 2 }}>
            Transaction Details
          </Typography>
          <Tooltip title={copied ? 'Copied!' : 'Copy Hash'}>
            <IconButton onClick={copyToClipboard} size="small">
              <FileCopyOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={3}>
          {/* Main Transaction Details */}
          <Grid item xs={12}>
            <Box
              sx={{ 
                p: 3, 
                background: 'transparent',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 2
              }}
            >
              <Typography variant="h6" gutterBottom>
                Key Information
              </Typography>
              <Stack spacing={2}>
                <DetailRow label="Type">
                  <Chip
                    label={
                      TransactionType === 'OfferCreate'
                        ? `${Flags & 0x00080000 ? 'Sell' : 'Buy'} Order`
                        : TransactionType === 'NFTokenCreateOffer'
                          ? `NFT ${Flags & 1 ? 'Sell' : 'Buy'} Offer`
                          : TransactionType === 'OfferCancel' && cancelledOffer
                            ? `Cancel ${cancelledOffer.Flags & 0x00080000 ? 'Sell' : 'Buy'} Order`
                            : isConversion
                              ? 'Currency Conversion'
                              : TransactionType
                    }
                    color="primary"
                    variant="outlined"
                  />
                </DetailRow>

                <DetailRow label="Accounts">
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccountAvatar account={Account} />
                      <Link href={`/profile/${Account}`} passHref>
                        <Typography
                          component="a"
                          variant="body2"
                          sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {Account}
                        </Typography>
                      </Link>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (Initiator)
                      </Typography>
                    </Box>
                    {Destination && Account !== Destination && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountAvatar account={Destination} />
                        <Link href={`/profile/${Destination}`} passHref>
                          <Typography
                            component="a"
                            variant="body2"
                            sx={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {Destination}
                          </Typography>
                        </Link>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          (Destination)
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </DetailRow>

                <DetailRow label="Full Timestamp">
                  <Typography variant="body2" color="text.secondary">
                    {new Date(rippleTimeToISO8601(date)).toLocaleString()}
                  </Typography>
                </DetailRow>

                {/* Account Information */}
                {TransactionType === 'Payment' && (
                  <>
                    {isConversion && Account === Destination ? (
                      <DetailRow label="Address">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccountAvatar account={Account} />
                          <Link href={`/profile/${Account}`} passHref>
                            <Typography
                              component="a"
                              variant="body1"
                              sx={{
                                color: theme.palette.primary.main,
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' }
                              }}
                            >
                              {Account}
                            </Typography>
                          </Link>
                        </Box>
                      </DetailRow>
                    ) : (
                      <>
                        <DetailRow label="Source">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccountAvatar account={Account} />
                            <Link href={`/profile/${Account}`} passHref>
                              <Typography
                                component="a"
                                variant="body1"
                                sx={{
                                  color: theme.palette.primary.main,
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                {Account}
                              </Typography>
                            </Link>
                          </Box>
                        </DetailRow>
                        <DetailRow label="Destination">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccountAvatar account={Destination} />
                            <Link href={`/profile/${Destination}`} passHref>
                              <Typography
                                component="a"
                                variant="body1"
                                sx={{
                                  color: theme.palette.primary.main,
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                {Destination}
                              </Typography>
                            </Link>
                          </Box>
                        </DetailRow>
                      </>
                    )}

                    {!isConversion ? (
                      <DetailRow label={deliveredAmount ? 'Delivered Amount' : 'Amount'}>
                        <AmountDisplay amount={deliveredAmount || Amount} />
                      </DetailRow>
                    ) : (
                      !displayExchange &&
                      isSuccess && (
                        <DetailRow label="Amount">
                          <AmountDisplay amount={deliveredAmount || Amount} />
                        </DetailRow>
                      )
                    )}
                    {SendMax && (
                      <DetailRow label="Max amount">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            It was instructed to spend up to
                          </Typography>
                          <AmountDisplay amount={SendMax} />
                        </Box>
                      </DetailRow>
                    )}
                  </>
                )}

                {/* Offer Details */}
                {TransactionType === 'OfferCreate' && (
                  <>
                    <DetailRow label="Offer Maker">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountAvatar account={Account} />
                        <Link href={`/profile/${Account}`} passHref>
                          <Typography
                            component="a"
                            variant="body1"
                            sx={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {Account}
                          </Typography>
                        </Link>
                      </Box>
                    </DetailRow>
                    <DetailRow label="Offer Sequence">
                      <Typography variant="body1">#{Sequence}</Typography>
                    </DetailRow>
                    <DetailRow label="Taker Gets">
                      <AmountDisplay amount={TakerGets} />
                    </DetailRow>
                    <DetailRow label="Taker Pays">
                      <AmountDisplay amount={TakerPays} />
                    </DetailRow>
                  </>
                )}

                {/* Client Information */}
                {clientInfo && (
                  <DetailRow label="Client">
                    <Link href={clientInfo.url} target="_blank" rel="noopener noreferrer" passHref>
                      <Typography
                        component="a"
                        variant="body1"
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {clientInfo.name}
                      </Typography>
                    </Link>
                  </DetailRow>
                )}

                {/* Failure Information */}
                {!isSuccess && failureReason.title && (
                  <>
                    <DetailRow label="Failure Reason">
                      <Typography variant="body1" color="error.main">
                        {failureReason.title}
                      </Typography>
                    </DetailRow>
                    <DetailRow label="Description">
                      <Typography variant="body2" color="text.secondary">
                        {failureReason.description}
                      </Typography>
                    </DetailRow>
                  </>
                )}

                {/* Memos */}
                {Memos && Memos.length > 0 && (
                  <DetailRow label="Memo">
                    <Stack spacing={1}>
                      {Memos.map((memo) => {
                        const memoType =
                          memo.Memo.MemoType &&
                          CryptoJS.enc.Hex.parse(memo.Memo.MemoType).toString(CryptoJS.enc.Utf8);
                        const memoData =
                          memo.Memo.MemoData &&
                          CryptoJS.enc.Hex.parse(memo.Memo.MemoData).toString(CryptoJS.enc.Utf8);
                        const memoKey = `${memo.Memo.MemoType || ''}-${memo.Memo.MemoData || ''}`;
                        return (
                          <Box
                            key={memoKey}
                            sx={{
                              p: 1,
                              background: 'transparent',
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              borderRadius: 1
                            }}
                          >
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                              {[memoType, memoData].filter(Boolean).join(' ')}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Stack>
                  </DetailRow>
                )}

                {TransactionType === 'OfferCreate' && (
                  <>
                    <DetailRow label="Offer Sequence">
                      <Typography variant="body1">#{Sequence}</Typography>
                    </DetailRow>
                    <DetailRow label="Taker Gets">
                      <AmountDisplay amount={TakerGets} />
                    </DetailRow>
                    <DetailRow label="Taker Pays">
                      <AmountDisplay amount={TakerPays} />
                    </DetailRow>

                    {OfferSequence > 0 && (
                      <DetailRow label="Replaces Offer">
                        <Typography variant="body1">#{OfferSequence}</Typography>
                      </DetailRow>
                    )}

                    <DetailRow label="Order Priority">
                      <Typography variant="body2">
                        {Flags & 0x00080000
                          ? 'Priority is to fully sell the specified amount'
                          : 'Priority is to buy only the specified amount'}
                      </Typography>
                    </DetailRow>
                  </>
                )}

                {TransactionType === 'OfferCancel' && cancelledOffer && (
                  <>
                    <DetailRow label="Cancelled Offer">
                      <Typography variant="body1">#{OfferSequence}</Typography>
                    </DetailRow>
                    <DetailRow label="Was Offering">
                      <AmountDisplay amount={cancelledOffer.TakerGets} />
                    </DetailRow>
                    <DetailRow label="Was Requesting">
                      <AmountDisplay amount={cancelledOffer.TakerPays} />
                    </DetailRow>
                  </>
                )}

                {TransactionType === 'TrustSet' && (
                  <>
                    {LimitAmount && (
                      <>
                        <DetailRow label="Token Issuer">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccountAvatar account={LimitAmount.issuer} />
                            <Link href={`/profile/${LimitAmount.issuer}`} passHref>
                              <Typography
                                component="a"
                                variant="body1"
                                sx={{
                                  color: theme.palette.primary.main,
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                {LimitAmount.issuer}
                              </Typography>
                            </Link>
                          </Box>
                        </DetailRow>
                        <DetailRow label="Trust Limit">
                          <AmountDisplay amount={LimitAmount} />
                        </DetailRow>
                      </>
                    )}
                    {trustSetState && (
                      <DetailRow label="Trust Line Settings">
                        <Stack spacing={0.5}>
                          <Typography variant="body2">
                            Rippling: {trustSetState.rippling ? 'Enabled' : 'Disabled'}
                          </Typography>
                          <Typography variant="body2">
                            Frozen: {trustSetState.frozen ? 'Yes' : 'No'}
                          </Typography>
                          <Typography variant="body2">
                            Authorized: {trustSetState.authorized ? 'Yes' : 'No'}
                          </Typography>
                        </Stack>
                      </DetailRow>
                    )}
                  </>
                )}

                {TransactionType === 'AMMDeposit' && (
                  <>
                    {(Amount || Amount2) && (
                      <DetailRow label="Deposited Assets">
                        <Stack spacing={1}>
                          {Amount && <AmountDisplay amount={Amount} />}
                          {Amount2 && <AmountDisplay amount={Amount2} />}
                        </Stack>
                      </DetailRow>
                    )}
                  </>
                )}

                {TransactionType === 'NFTokenCancelOffer' && (
                  <>
                    {cancelledNftOffers.length > 0 ? (
                      <DetailRow
                        label={
                          cancelledNftOffers.length > 1 ? 'Cancelled Offers' : 'Cancelled Offer'
                        }
                      >
                        {cancelledNftOffers.map((offer) => {
                          const nftInfo = cancelledNftInfo[offer.NFTokenID];
                          const isLoading = cancelledNftInfoLoading[offer.NFTokenID];
                          const fallbackView = (
                            <Grid container spacing={1}>
                              <DetailRow label="Offer" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                                  {offer.offerId}
                                </Typography>
                              </DetailRow>
                              <DetailRow label="NFT" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                                <Link href={`/nft/${offer.NFTokenID}`} passHref>
                                  <Typography
                                    component="a"
                                    variant="body1"
                                    sx={{
                                      color: theme.palette.primary.main,
                                      textDecoration: 'none',
                                      '&:hover': { textDecoration: 'underline' },
                                      wordBreak: 'break-all'
                                    }}
                                  >
                                    {offer.NFTokenID}
                                  </Typography>
                                </Link>
                              </DetailRow>
                              <DetailRow label="Amount" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                                <AmountDisplay amount={offer.Amount} />
                              </DetailRow>
                              {offer.Destination && (
                                <DetailRow
                                  label="Destination"
                                  sx={{ mb: 1, pb: 1, borderBottom: 'none' }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AccountAvatar account={offer.Destination} />
                                    <Link href={`/profile/${offer.Destination}`} passHref>
                                      <Typography
                                        component="a"
                                        variant="body1"
                                        sx={{
                                          color: theme.palette.primary.main,
                                          textDecoration: 'none',
                                          '&:hover': { textDecoration: 'underline' }
                                        }}
                                      >
                                        {offer.Destination}
                                      </Typography>
                                    </Link>
                                  </Box>
                                </DetailRow>
                              )}
                            </Grid>
                          );
                          return (
                            <Box key={offer.offerId} sx={{ p: 2, width: '100%', mb: 2, background: 'transparent', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}>
                              <Grid container spacing={2}>
                                {isLoading ? (
                                  <Grid item xs={12}>
                                    <Typography>Loading NFT data...</Typography>
                                  </Grid>
                                ) : nftInfo && !nftInfo.error ? (
                                  <>
                                    <Grid item xs={12} md={4}>
                                      {(() => {
                                        const imageUrl = getNftImageUrl(nftInfo);
                                        if (!imageUrl) return null;
                                        return (
                                          <Box
                                            component="img"
                                            src={ipfsToGateway(imageUrl)}
                                            alt={nftInfo.meta?.name || 'NFT Image'}
                                            sx={{
                                              width: '100%',
                                              maxWidth: '220px',
                                              borderRadius: 2
                                            }}
                                          />
                                        );
                                      })()}
                                    </Grid>
                                    <Grid item xs={12} md={8}>
                                      {fallbackView}
                                    </Grid>
                                  </>
                                ) : (
                                  <Grid item xs={12}>
                                    {fallbackView}
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          );
                        })}
                      </DetailRow>
                    ) : (
                      NFTokenOffers &&
                      NFTokenOffers.length > 0 && (
                        <DetailRow label={NFTokenOffers.length > 1 ? 'Offers' : 'Offer'}>
                          {NFTokenOffers.map((offer) => (
                            <Typography key={offer} variant="body1" sx={{ wordBreak: 'break-all' }}>
                              {offer}
                            </Typography>
                          ))}
                        </DetailRow>
                      )
                    )}
                  </>
                )}

                {TransactionType === 'NFTokenAcceptOffer' && acceptedOfferDetails && (
                  <>
                    {NFTokenSellOffer && (
                      <DetailRow label="Sell Offer">
                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                          {NFTokenSellOffer}
                        </Typography>
                      </DetailRow>
                    )}
                    {NFTokenBuyOffer && (
                      <DetailRow label="Buy Offer">
                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                          {NFTokenBuyOffer}
                        </Typography>
                      </DetailRow>
                    )}
                    <DetailRow label="Transfer from">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountAvatar account={acceptedOfferDetails.seller} />
                        <Link href={`/profile/${acceptedOfferDetails.seller}`} passHref>
                          <Typography
                            component="a"
                            variant="body1"
                            sx={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {acceptedOfferDetails.seller}
                          </Typography>
                        </Link>
                      </Box>
                    </DetailRow>
                    <DetailRow label="Transfer to">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountAvatar account={acceptedOfferDetails.buyer} />
                        <Link href={`/profile/${acceptedOfferDetails.buyer}`} passHref>
                          <Typography
                            component="a"
                            variant="body1"
                            sx={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {acceptedOfferDetails.buyer}
                          </Typography>
                        </Link>
                      </Box>
                    </DetailRow>
                    <DetailRow label="NFT Data">
                      {nftInfoLoading ? (
                        <Typography>Loading NFT data...</Typography>
                      ) : acceptedNftInfo ? (
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            {(() => {
                              const imageUrl = getNftImageUrl(acceptedNftInfo);
                              if (!imageUrl) return null;
                              return (
                                <Box
                                  component="img"
                                  src={ipfsToGateway(imageUrl)}
                                  alt={acceptedNftInfo.meta?.name || 'NFT Image'}
                                  sx={{
                                    width: '100%',
                                    maxWidth: '220px',
                                    borderRadius: 2
                                  }}
                                />
                              );
                            })()}
                          </Grid>
                          <Grid item xs={12} md={8}>
                            <DetailRow label="NFT" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Link href={`/nft/${acceptedNftInfo.NFTokenID}`} passHref>
                                <Typography
                                  component="a"
                                  variant="body1"
                                  sx={{
                                    color: theme.palette.primary.main,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                    wordBreak: 'break-all'
                                  }}
                                >
                                  {acceptedNftInfo.NFTokenID}
                                </Typography>
                              </Link>
                            </DetailRow>
                            <DetailRow label="Issuer" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccountAvatar account={acceptedNftInfo.issuer} />
                                <Link href={`/profile/${acceptedNftInfo.issuer}`} passHref>
                                  <Typography
                                    component="a"
                                    variant="body1"
                                    sx={{
                                      color: theme.palette.primary.main,
                                      textDecoration: 'none',
                                      '&:hover': { textDecoration: 'underline' }
                                    }}
                                  >
                                    {acceptedNftInfo.issuer}
                                  </Typography>
                                </Link>
                              </Box>
                            </DetailRow>
                            {typeof acceptedNftInfo.royalty !== 'undefined' && (
                              <DetailRow
                                label="Transfer Fee"
                                sx={{ mb: 1, pb: 1, borderBottom: 'none' }}
                              >
                                <Typography variant="body1">
                                  {acceptedNftInfo.royalty / 1000}%
                                </Typography>
                              </DetailRow>
                            )}
                            <DetailRow label="Flag" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Typography variant="body1">
                                {getNFTokenMintFlagExplanation(acceptedNftInfo.flag)}
                              </Typography>
                            </DetailRow>
                            <DetailRow
                              label="NFT Taxon"
                              sx={{ mb: 1, pb: 1, borderBottom: 'none' }}
                            >
                              <Typography variant="body1">{acceptedNftInfo.taxon}</Typography>
                            </DetailRow>
                            {(() => {
                              const decodedUri =
                                acceptedNftInfo.meta?.image ||
                                (acceptedNftInfo.URI
                                  ? CryptoJS.enc.Hex.parse(acceptedNftInfo.URI).toString(
                                      CryptoJS.enc.Utf8
                                    )
                                  : null);
                              if (!decodedUri) return null;
                              return (
                                <DetailRow label="URI" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                                  <Link
                                    href={decodedUri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    passHref
                                  >
                                    <Typography
                                      component="a"
                                      variant="body1"
                                      sx={{
                                        color: theme.palette.primary.main,
                                        textDecoration: 'none',
                                        '&:hover': { textDecoration: 'underline' },
                                        wordBreak: 'break-all'
                                      }}
                                    >
                                      {decodedUri}
                                    </Typography>
                                  </Link>
                                </DetailRow>
                              );
                            })()}
                          </Grid>
                        </Grid>
                      ) : (
                        <Grid container spacing={1}>
                          <DetailRow label="NFT" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                            <Link href={`/nft/${acceptedOfferDetails.nftokenID}`} passHref>
                              <Typography
                                component="a"
                                variant="body1"
                                sx={{
                                  color: theme.palette.primary.main,
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' },
                                  wordBreak: 'break-all'
                                }}
                              >
                                {acceptedOfferDetails.nftokenID}
                              </Typography>
                            </Link>
                          </DetailRow>
                          {(() => {
                            const decodedUri = acceptedOfferDetails.uri
                              ? CryptoJS.enc.Hex.parse(acceptedOfferDetails.uri).toString(
                                  CryptoJS.enc.Utf8
                                )
                              : null;
                            if (!decodedUri) return null;
                            return (
                              <DetailRow label="URI" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                                <Link
                                  href={decodedUri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  passHref
                                >
                                  <Typography
                                    component="a"
                                    variant="body1"
                                    sx={{
                                      color: theme.palette.primary.main,
                                      textDecoration: 'none',
                                      '&:hover': { textDecoration: 'underline' },
                                      wordBreak: 'break-all'
                                    }}
                                  >
                                    {decodedUri}
                                  </Typography>
                                </Link>
                              </DetailRow>
                            );
                          })()}
                        </Grid>
                      )}
                    </DetailRow>
                  </>
                )}

                {TransactionType === 'NFTokenCreateOffer' && (
                  <>
                    {offerNftInfoLoading ? (
                      <DetailRow label="NFT">
                        <Typography>Loading NFT data...</Typography>
                      </DetailRow>
                    ) : offerNftInfo ? (
                      <DetailRow label="NFT Data">
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            {(() => {
                              const imageUrl = getNftImageUrl(offerNftInfo);
                              if (!imageUrl) return null;
                              return (
                                <Box
                                  component="img"
                                  src={ipfsToGateway(imageUrl)}
                                  alt={offerNftInfo.meta?.name || 'NFT Image'}
                                  sx={{
                                    width: '100%',
                                    maxWidth: '220px',
                                    borderRadius: 2
                                  }}
                                />
                              );
                            })()}
                          </Grid>
                          <Grid item xs={12} md={8}>
                            <DetailRow label="NFT" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Link href={`/nft/${offerNftInfo.NFTokenID}`} passHref>
                                <Typography
                                  component="a"
                                  variant="body1"
                                  sx={{
                                    color: theme.palette.primary.main,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                    wordBreak: 'break-all'
                                  }}
                                >
                                  {offerNftInfo.NFTokenID}
                                </Typography>
                              </Link>
                            </DetailRow>
                            <DetailRow label="Issuer" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccountAvatar account={offerNftInfo.issuer} />
                                <Link href={`/profile/${offerNftInfo.issuer}`} passHref>
                                  <Typography
                                    component="a"
                                    variant="body1"
                                    sx={{
                                      color: theme.palette.primary.main,
                                      textDecoration: 'none',
                                      '&:hover': { textDecoration: 'underline' }
                                    }}
                                  >
                                    {offerNftInfo.issuer}
                                  </Typography>
                                </Link>
                              </Box>
                            </DetailRow>
                          </Grid>
                        </Grid>
                      </DetailRow>
                    ) : (
                      <DetailRow label="NFT">
                        <Link href={`/nft/${NFTokenID}`} passHref>
                          <Typography
                            component="a"
                            variant="body1"
                            sx={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {NFTokenID}
                          </Typography>
                        </Link>
                      </DetailRow>
                    )}

                    <DetailRow label="NFT Offer Details">
                      <Box sx={{ p: 2, width: '100%', background: 'transparent', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}>
                        <Grid container spacing={1}>
                          {meta.offer_id && (
                            <DetailRow label="Offer" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                                {meta.offer_id}
                              </Typography>
                            </DetailRow>
                          )}
                          <DetailRow label="Amount" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                            <AmountDisplay amount={Amount} />
                          </DetailRow>
                          {Destination && (
                            <DetailRow
                              label="Destination"
                              sx={{ mb: 1, pb: 1, borderBottom: 'none' }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccountAvatar account={Destination} />
                                <Link href={`/profile/${Destination}`} passHref>
                                  <Typography
                                    component="a"
                                    variant="body1"
                                    sx={{
                                      color: theme.palette.primary.main,
                                      textDecoration: 'none',
                                      '&:hover': { textDecoration: 'underline' }
                                    }}
                                  >
                                    {Destination}
                                  </Typography>
                                </Link>
                              </Box>
                            </DetailRow>
                          )}
                        </Grid>
                      </Box>
                    </DetailRow>
                  </>
                )}

                {TransactionType === 'NFTokenMint' && (
                  <>
                    <DetailRow label="NFT Data">
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          {mintedNftInfoLoading ? (
                            <Typography>Loading NFT image...</Typography>
                          ) : (
                            (() => {
                              const imageUrl = getNftImageUrl(mintedNftInfo);
                              if (!imageUrl) return null;
                              return (
                                <Box
                                  component="img"
                                  src={ipfsToGateway(imageUrl)}
                                  alt={mintedNftInfo.meta?.name || 'NFT Image'}
                                  sx={{
                                    width: '100%',
                                    maxWidth: '220px',
                                    borderRadius: 2
                                  }}
                                />
                              );
                            })()
                          )}
                        </Grid>
                        <Grid item xs={12} md={8}>
                          {meta.nftoken_id && (
                            <DetailRow label="NFT" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Link href={`/nft/${meta.nftoken_id}`} passHref>
                                <Typography
                                  component="a"
                                  variant="body1"
                                  sx={{
                                    color: theme.palette.primary.main,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                    wordBreak: 'break-all'
                                  }}
                                >
                                  {meta.nftoken_id}
                                </Typography>
                              </Link>
                            </DetailRow>
                          )}
                          {typeof TransferFee !== 'undefined' && (
                            <DetailRow
                              label="Transfer Fee"
                              sx={{ mb: 1, pb: 1, borderBottom: 'none' }}
                            >
                              <Typography variant="body1">{TransferFee / 1000}%</Typography>
                            </DetailRow>
                          )}
                          {Flags > 0 && (
                            <DetailRow label="Flag" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Typography variant="body1">
                                {getNFTokenMintFlagExplanation(Flags)}
                              </Typography>
                            </DetailRow>
                          )}
                          {typeof NFTokenTaxon !== 'undefined' && (
                            <DetailRow
                              label="NFT Taxon"
                              sx={{ mb: 1, pb: 1, borderBottom: 'none' }}
                            >
                              <Typography variant="body1">{NFTokenTaxon}</Typography>
                            </DetailRow>
                          )}
                          {URI && (
                            <DetailRow label="URI" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Link
                                href={CryptoJS.enc.Hex.parse(URI).toString(CryptoJS.enc.Utf8)}
                                target="_blank"
                                rel="noopener noreferrer"
                                passHref
                              >
                                <Typography
                                  component="a"
                                  variant="body1"
                                  sx={{
                                    color: theme.palette.primary.main,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                    wordBreak: 'break-all'
                                  }}
                                >
                                  {CryptoJS.enc.Hex.parse(URI).toString(CryptoJS.enc.Utf8)}
                                </Typography>
                              </Link>
                            </DetailRow>
                          )}
                        </Grid>
                      </Grid>
                    </DetailRow>
                  </>
                )}

                {TransactionType === 'OracleSet' && (
                  <>
                    <DetailRow label="Oracle Data">
                      <Box sx={{ p: 2, width: '100%', background: 'transparent', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2 }}>
                        <Grid container spacing={1}>
                          {typeof OracleDocumentID !== 'undefined' && (
                            <DetailRow
                              label="Document ID"
                              sx={{ mb: 1, pb: 1, borderBottom: 'none' }}
                            >
                              <Typography variant="body1">{OracleDocumentID}</Typography>
                            </DetailRow>
                          )}
                          {Provider && (
                            <DetailRow label="Provider" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Typography variant="body1">
                                {CryptoJS.enc.Hex.parse(Provider).toString(CryptoJS.enc.Utf8)}
                              </Typography>
                            </DetailRow>
                          )}
                          {typeof LastUpdateTime !== 'undefined' && (
                            <DetailRow
                              label="Last Update Time"
                              sx={{ mb: 1, pb: 1, borderBottom: 'none' }}
                            >
                              <Typography variant="body1">
                                {formatDistanceToNow(new Date(LastUpdateTime * 1000))} ago (
                                {new Date(LastUpdateTime * 1000).toLocaleString()})
                              </Typography>
                            </DetailRow>
                          )}
                          {URI && (
                            <DetailRow label="URI" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Link
                                href={CryptoJS.enc.Hex.parse(URI).toString(CryptoJS.enc.Utf8)}
                                target="_blank"
                                rel="noopener noreferrer"
                                passHref
                              >
                                <Typography
                                  component="a"
                                  variant="body1"
                                  sx={{
                                    color: theme.palette.primary.main,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                    wordBreak: 'break-all'
                                  }}
                                >
                                  {CryptoJS.enc.Hex.parse(URI).toString(CryptoJS.enc.Utf8)}
                                </Typography>
                              </Link>
                            </DetailRow>
                          )}
                        </Grid>
                      </Box>
                    </DetailRow>

                    {PriceDataSeries && PriceDataSeries.length > 0 && (
                      <DetailRow label="Price Data Series">
                        <Box>
                          {PriceDataSeries.map((series) => {
                            const { AssetPrice, BaseAsset, QuoteAsset, Scale } = series.PriceData;
                            if (!AssetPrice) return null;
                            const price = new BigNumber(parseInt(AssetPrice, 16)).dividedBy(
                              new BigNumber(10).pow(Scale)
                            );
                            const base =
                              BaseAsset === 'XRP' ? 'XRP' : normalizeCurrencyCode(BaseAsset);
                            const quote =
                              QuoteAsset === 'XRP' ? 'XRP' : normalizeCurrencyCode(QuoteAsset);
                            const keyStr = `${BaseAsset}-${QuoteAsset}-${AssetPrice}`;
                            return (
                              <Typography key={keyStr} variant="body2">
                                1 {base} = {price.toFormat()} {quote}
                              </Typography>
                            );
                          })}
                        </Box>
                      </DetailRow>
                    )}
                  </>
                )}

                {TransactionType === 'AMMWithdraw' && (
                  <>
                    {LPTokenIn && (
                      <DetailRow label="LP Tokens Withdrawn">
                        <AmountDisplay amount={LPTokenIn} />
                      </DetailRow>
                    )}
                    {Flags > 0 && getAMMWithdrawFlagExplanation(Flags) && (
                      <DetailRow label="Withdrawal Mode">
                        <Typography variant="body1">
                          {getAMMWithdrawFlagExplanation(Flags)}
                        </Typography>
                      </DetailRow>
                    )}
                  </>
                )}

                {displayExchange && isSuccess && (
                  <>
                    <DetailRow label="Exchanged">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" color="error.main">
                          -{new BigNumber(displayExchange.paid.value).toFormat()}
                        </Typography>
                        {displayExchange.paid.rawCurrency ? (
                          <TokenDisplay
                            slug={`${displayExchange.paid.issuer}-${displayExchange.paid.rawCurrency}`}
                            currency={displayExchange.paid.currency}
                            rawCurrency={displayExchange.paid.rawCurrency}
                          />
                        ) : (
                          <AmountDisplay amount={displayExchange.paid.value} variant="body1" />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" color="success.main">
                          +{new BigNumber(displayExchange.got.value).toFormat()}
                        </Typography>
                        {displayExchange.got.rawCurrency ? (
                          <TokenDisplay
                            slug={`${displayExchange.got.issuer}-${displayExchange.got.rawCurrency}`}
                            currency={displayExchange.got.currency}
                            rawCurrency={displayExchange.got.rawCurrency}
                          />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                            <Avatar
                              src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8"
                              sx={{ width: 20, height: 20, mr: 0.5 }}
                            />
                            <Typography variant="body1" component="span">
                              {displayExchange.got.currency}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </DetailRow>
                    <DetailRow label="Rate">
                      <Stack spacing={0.5}>
                        {(() => {
                          const paidValue = new BigNumber(displayExchange.paid.value);
                          const gotValue = new BigNumber(displayExchange.got.value);

                          if (
                            paidValue.isZero() ||
                            gotValue.isZero() ||
                            !paidValue.isFinite() ||
                            !gotValue.isFinite()
                          ) {
                            return (
                              <Typography variant="body2" color="text.secondary">
                                Rate not available
                              </Typography>
                            );
                          }

                          return (
                            <>
                              <Typography variant="body2">
                                1 {displayExchange.got.currency} ={' '}
                                {paidValue.div(gotValue).toFormat(6)}{' '}
                                {displayExchange.paid.currency}
                              </Typography>
                              <Typography variant="body2">
                                1 {displayExchange.paid.currency} ={' '}
                                {gotValue.div(paidValue).toFormat(6)} {displayExchange.got.currency}
                              </Typography>
                            </>
                          );
                        })()}
                      </Stack>
                    </DetailRow>
                  </>
                )}

                {flagExplanations.length > 0 && TransactionType === 'Payment' ? (
                  flagExplanations.map((flag) => (
                    <DetailRow key={flag.title} label={flag.title}>
                      <Typography variant="body2">{flag.description}</Typography>
                    </DetailRow>
                  ))
                ) : flagExplanations.length > 0 ? (
                  <DetailRow label={TransactionType + ' Flags'}>
                    {flagExplanations.map((text) => (
                      <Typography key={text} variant="body2">
                        {text}
                      </Typography>
                    ))}
                  </DetailRow>
                ) : null}

                {Memos && Memos.length > 0 && (
                  <DetailRow label="Memo">
                    {Memos.map((memo) => {
                      const memoType =
                        memo.Memo.MemoType &&
                        CryptoJS.enc.Hex.parse(memo.Memo.MemoType).toString(CryptoJS.enc.Utf8);
                      const memoData =
                        memo.Memo.MemoData &&
                        CryptoJS.enc.Hex.parse(memo.Memo.MemoData).toString(CryptoJS.enc.Utf8);
                      const memoKey = `${memo.Memo.MemoType || ''}-${memo.Memo.MemoData || ''}`;
                      return (
                        <Typography key={memoKey} variant="body1" sx={{ wordBreak: 'break-all' }}>
                          {[memoType, memoData].filter(Boolean).join(' ')}
                        </Typography>
                      );
                    })}
                  </DetailRow>
                )}
              </Stack>
            </Box>
          </Grid>

          {/* Affected Accounts */}
          {balanceChanges.length > 0 && isSuccess && (
            <Grid item xs={12}>
              <Box
                sx={{ 
                  p: 3, 
                  background: 'transparent',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Affected Accounts ({balanceChanges.length})
                </Typography>
                <Stack spacing={2}>
                  {balanceChanges.map(({ account, changes }, index) => (
                    <Card
                      key={account}
                      elevation={0}
                      sx={{ p: 2, background: 'transparent', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}
                    >
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        alignItems="flex-start"
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                          <AccountAvatar account={account} />
                          <Box ml={1}>
                            <Link href={`/profile/${account}`} passHref>
                              <Typography
                                component="a"
                                variant="body2"
                                fontWeight="medium"
                                sx={{
                                  color: theme.palette.primary.main,
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                {account === Account ? 'Initiator' : `Account ${index + 1}`}
                              </Typography>
                            </Link>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', wordBreak: 'break-all' }}
                            >
                              {account}
                            </Typography>
                          </Box>
                        </Box>
                        <Box flex={1}>
                          <Stack spacing={1}>
                            {changes.map((change) => {
                              const isPositive = new BigNumber(change.value).isPositive();
                              const sign = isPositive ? '+' : '';
                              const color = isPositive ? 'success.main' : 'error.main';
                              const changeKey = `${change.currency}-${change.issuer || 'XRP'}-${change.value}`;

                              return (
                                <Box key={changeKey} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" color={color} fontWeight="medium">
                                    {sign}
                                    {new BigNumber(change.value).toFormat()}
                                  </Typography>
                                  {change.currency === 'XRP' ? (
                                    <XrpDisplay variant="body2" />
                                  ) : (
                                    <TokenDisplay
                                      slug={`${change.issuer}-${change.rawCurrency}`}
                                      currency={change.currency}
                                      rawCurrency={change.rawCurrency}
                                      variant="body2"
                                    />
                                  )}
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </Grid>
          )}

          {/* Exchange Information */}
          {displayExchange && isSuccess && (
            <Grid item xs={12}>
              <Box
                sx={{ 
                  p: 3, 
                  background: 'transparent',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Exchange Details
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Exchanged
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" color="error.main" fontWeight="medium">
                          -{new BigNumber(displayExchange.paid.value).toFormat()}
                        </Typography>
                        {displayExchange.paid.rawCurrency ? (
                          <TokenDisplay
                            slug={`${displayExchange.paid.issuer}-${displayExchange.paid.rawCurrency}`}
                            currency={displayExchange.paid.currency}
                            rawCurrency={displayExchange.paid.rawCurrency}
                          />
                        ) : (
                          <XrpDisplay variant="body1" />
                        )}
                      </Box>
                      <SwapHorizIcon color="action" />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" color="success.main" fontWeight="medium">
                          +{new BigNumber(displayExchange.got.value).toFormat()}
                        </Typography>
                        {displayExchange.got.rawCurrency ? (
                          <TokenDisplay
                            slug={`${displayExchange.got.issuer}-${displayExchange.got.rawCurrency}`}
                            currency={displayExchange.got.currency}
                            rawCurrency={displayExchange.got.rawCurrency}
                          />
                        ) : (
                          <XrpDisplay variant="body1" />
                        )}
                      </Box>
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Exchange Rate
                    </Typography>
                    <Stack spacing={0.5}>
                      {(() => {
                        const paidValue = new BigNumber(displayExchange.paid.value);
                        const gotValue = new BigNumber(displayExchange.got.value);

                        if (
                          paidValue.isZero() ||
                          gotValue.isZero() ||
                          !paidValue.isFinite() ||
                          !gotValue.isFinite()
                        ) {
                          return (
                            <Typography variant="body2" color="text.secondary">
                              Rate not available
                            </Typography>
                          );
                        }

                        return (
                          <>
                            <Typography variant="body2">
                              1 {displayExchange.got.currency} ={' '}
                              {paidValue.div(gotValue).toFormat(6)} {displayExchange.paid.currency}
                            </Typography>
                            <Typography variant="body2">
                              1 {displayExchange.paid.currency} ={' '}
                              {gotValue.div(paidValue).toFormat(6)} {displayExchange.got.currency}
                            </Typography>
                          </>
                        );
                      })()}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          )}

          {/* Transaction Link */}
          <Grid item xs={12}>
            <Box
              sx={{ 
                p: 2, 
                background: 'transparent',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 2
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Transaction Link:
                </Typography>
                <Link href={`/tx/${hash}`} passHref>
                  <Typography
                    component="a"
                    variant="body2"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                      wordBreak: 'break-all',
                      fontFamily: 'monospace'
                    }}
                  >
                    {txUrl}
                  </Typography>
                </Link>
                <Tooltip title={urlCopied ? 'Copied!' : 'Copy Link'}>
                  <IconButton onClick={copyUrlToClipboard} size="small">
                    <FileCopyOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </Grid>
        </Grid>

        {/* Advanced Details Accordion */}
        <Accordion
          expanded={moreVisible}
          onChange={() => setMoreVisible(!moreVisible)}
          sx={{
            background: 'transparent',
            boxShadow: 'none',
            '&:before': { display: 'none' },
            mt: 3
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: 'transparent',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'transparent'
              }
            }}
          >
            <Typography fontWeight="medium">Advanced Details</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0, pt: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="Additional Data" />
                <Tab label="Raw Data" />
                <Tab label="Metadata" />
              </Tabs>
            </Box>
            <TabPanel value={selectedTab} index={0}>
              <Stack spacing={2}>
                <DetailRow label="Flags value">
                  <Chip label={Flags} variant="outlined" size="small" />
                </DetailRow>
                <DetailRow label="Sequence">
                  <Typography variant="body1">#{Sequence}</Typography>
                </DetailRow>
                {TransactionType === 'OfferCreate' && (
                  <DetailRow label="Compact Tx ID">
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {ctid}
                    </Typography>
                  </DetailRow>
                )}
                <DetailRow label="Last ledger">
                  <Typography variant="body1">
                    #{LastLedgerSequence} ({LastLedgerSequence - ledger_index} ledgers)
                  </Typography>
                </DetailRow>
                {SourceTag && (
                  <DetailRow label="Source Tag">
                    <Typography variant="body1">{SourceTag}</Typography>
                  </DetailRow>
                )}
              </Stack>
            </TabPanel>
            <TabPanel value={selectedTab} index={1}>
              <Box
                sx={{
                  p: 2,
                  background: 'transparent',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 2
                }}
              >
                <JsonViewer data={rawData} />
              </Box>
            </TabPanel>
            <TabPanel value={selectedTab} index={2}>
              <Box
                sx={{
                  p: 2,
                  background: 'transparent',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 2
                }}
              >
                <JsonViewer data={meta} />
              </Box>
            </TabPanel>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

const TxPage = ({ txData, error }) => {
  const router = useRouter();
  const theme = useTheme();

  const dispatch = useDispatch();

  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
  useWebSocket(WSS_FEED_URL, {
    onMessage: (event) => {
      try {
        const json = JSON.parse(event.data);
        dispatch(update_metrics(json));
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    },
    shouldReconnect: () => true
  });

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar />
      <Header />
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Transaction Details
          </Typography>
        </Box>
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <TransactionDetails txData={txData} theme={theme} />
        )}
      </Container>
      <Footer />
    </Box>
  );
};

export async function getServerSideProps(context) {
  const { hash } = context.params;

  if (!/^[0-9A-F]{64}$/i.test(hash)) {
    return {
      props: {
        txData: null,
        error: 'Invalid transaction hash format.'
      }
    };
  }

  // Check cache first
  const cachedData = txCache.get(hash);
  if (cachedData) {
    console.log(`Cache hit for transaction: ${hash}`);
    // Set cache headers for browser caching
    context.res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
    return {
      props: {
        txData: cachedData,
        error: null
      }
    };
  }

  const xrplNodes = [
    'https://xrplcluster.com/',
    'https://s1.ripple.com:51234/',
    'https://s2.ripple.com:51234/',
    'https://xrpl.ws/'
  ];
  
  let response;
  let lastError;
  
  for (const node of xrplNodes) {
    try {
      response = await axios.post(node, {
        method: 'tx',
        params: [
          {
            transaction: hash,
            binary: false,
            ledger_index: "validated"
          }
        ]
      });
      break; // Success, exit loop
    } catch (error) {
      lastError = error;
      console.error(`Failed to fetch from ${node}:`, error.message);
      continue; // Try next node
    }
  }
  
  if (!response) {
    throw lastError || new Error('All XRPL nodes failed');
  }
  
  try {

    if (response.data.result.error === 'txnNotFound') {
      return {
        notFound: true
      };
    }

    if (response.data.result.error) {
      return {
        props: {
          txData: null,
          error: response.data.result.error_message || 'Transaction not found'
        }
      };
    }

    const { meta, ...rest } = response.data.result;
    // if (meta) {
    //   const deliveredAmount = meta.delivered_amount;
    //   if (typeof deliveredAmount === 'object' && deliveredAmount.value) {
    //     meta.delivered_amount.value = new BigNumber(deliveredAmount.value).toFormat();
    //   }
    // }

    const txData = { ...rest, meta };
    
    // Cache the successful response
    txCache.set(hash, txData);
    console.log(`Cached transaction: ${hash}`);
    
    // Set cache headers for browser caching
    context.res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );

    return {
      props: {
        txData,
        error: null
      }
    };
  } catch (error) {
    console.error(error);
    let errorMessage = 'Failed to fetch transaction data.';
    if (
      error.response &&
      error.response.data &&
      error.response.data.result &&
      error.response.data.result.error_message
    ) {
      errorMessage = error.response.data.result.error_message;
    }
    return {
      props: {
        txData: null,
        error: errorMessage
      }
    };
  }
}

export default TxPage;
