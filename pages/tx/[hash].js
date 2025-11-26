import { useRouter } from 'next/router';
import axios from 'axios';
import { useState, useMemo, useEffect, useContext } from 'react';
import { useDispatch } from 'react-redux';
import useWebSocket from 'react-use-websocket';
import { update_metrics } from 'src/redux/statusSlice';
import { LRUCache } from 'lru-cache';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { Copy, CheckCircle, XCircle, ArrowLeftRight, Wallet, TrendingUp } from 'lucide-react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Link from 'next/link';
import { rippleTimeToISO8601, dropsToXrp, normalizeCurrencyCode } from 'src/utils/parseUtils';
import { formatDistanceToNow } from 'date-fns';
import Decimal from 'decimal.js-light';

// Helper function to format decimal with thousand separators (like BigNumber.toFormat)
function formatDecimal(decimal, decimalPlaces = null) {
  let str = decimalPlaces !== null ? decimal.toFixed(decimalPlaces) : decimal.toString();
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
import CryptoJS from 'crypto-js';
import { getHashIcon } from 'src/utils/formatters';

// Create transaction cache with 1 hour TTL and max 100 entries
const txCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour in milliseconds
  updateAgeOnGet: true,
  updateAgeOnHas: true
});

// Utility function to clear cache (useful for debugging)
export const clearTransactionCache = (hash) => {
  if (hash) {
    txCache.delete(hash);
  } else {
    txCache.clear();
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
  74920348: { name: 'First Ledger', url: 'https://firstledger.net' },
  10011010: { name: 'Magnetic', url: 'https://magnetic.com' },
  101102979: { name: 'xrp.cafe', url: 'https://xrp.cafe' },
  20221212: { name: 'XPMarket', url: 'https://xpmarket.com' },
  69420589: { name: 'Bidds', url: 'https://bidds.com' },
  110100111: { name: 'Sologenic', url: 'https://sologenic.com' },
  19089388: { name: 'N/A', url: null },
  20102305: { name: 'Opulence', url: 'https://opulence.com' },
  13888813: { name: 'Zerpmon', url: 'https://zerpmon.com' },
  11782013: { name: 'ANODEX', url: 'https://anodex.com' },
  100010010: { name: 'Xrpl Daddy', url: 'https://xrpldaddy.com' },
  123321: { name: 'BearBull Scalper', url: 'https://bearbull.com' },
  494456745: { name: 'N/A', url: null },
  42697468: { name: 'Bithomp', url: 'https://bithomp.com' },
  4152544945: { name: 'ArtDept.fun', url: 'https://artdept.fun' },
  411555: { name: 'N/A', url: null },
  80085: { name: 'Zerpaay', url: 'https://zerpaay.com' },
  510162502: { name: 'Sonar Muse', url: 'https://sonarmuse.com' },
  80008000: { name: 'Orchestra', url: 'https://orchestra.com' }
};

// Helper to render JSON with syntax highlighting
const JsonViewer = ({ data }) => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const copyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighting
  const highlightJson = (json) => {
    return json
      .replace(/(".*?"):/g, '<span style="color: #4285f4;">$1</span>:') // Keys in blue
      .replace(/: (".*?")/g, ': <span style="color: #10b981;">$1</span>') // String values in green
      .replace(/: (true|false)/g, ': <span style="color: #f59e0b;">$1</span>') // Booleans in orange
      .replace(/: (null)/g, ': <span style="color: #ef4444;">$1</span>') // Null in red
      .replace(/: (-?\d+\.?\d*)/g, ': <span style="color: #8b5cf6;">$1</span>'); // Numbers in purple
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1
        }}
      >
        <Tooltip title={copied ? 'Copied!' : 'Copy JSON'}>
          <IconButton
            onClick={copyJson}
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              '&:hover': {
                backgroundColor: alpha(theme.palette.background.paper, 0.95)
              }
            }}
          >
            <FileCopyOutlinedIcon sx={{ fontSize: '16px' }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        sx={{
          maxHeight: '600px',
          overflowY: 'auto',
          overflowX: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: 1.6,
          backgroundColor: alpha(theme.palette.divider, 0.03),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: '6px',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: alpha(theme.palette.divider, 0.05)
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.divider, 0.2),
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: alpha(theme.palette.divider, 0.3)
            }
          }
        }}
      >
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: theme.palette.text.primary
          }}
          dangerouslySetInnerHTML={{ __html: highlightJson(jsonString) }}
        />
      </Box>
    </Box>
  );
};

const DetailRow = ({ label, children, ...props }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, ...props }}>
      <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.5), minWidth: '100px', fontSize: '13px', pt: 0.3 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

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
          <Avatar src={imageUrl} sx={{ mr: 1.5, width: 32, height: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 500, mb: 0.5 }}>
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
          <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
            Price
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {exch && (
              <>
                <Chip
                  label={`$${new Decimal(exch.USD).toFixed(4)}`}
                  size="small"
                  sx={{
                    fontSize: '10px',
                    height: '18px',
                    px: 0.5,
                    backgroundColor: alpha('#4285f4', 0.06),
                    color: '#4285f4',
                    border: `1px solid ${alpha('#4285f4', 0.15)}`,
                    fontWeight: 400
                  }}
                />
                <Chip
                  label={`€${new Decimal(exch.EUR).toFixed(4)}`}
                  size="small"
                  sx={{
                    fontSize: '10px',
                    height: '18px',
                    px: 0.5,
                    backgroundColor: alpha('#4285f4', 0.06),
                    color: '#4285f4',
                    border: `1px solid ${alpha('#4285f4', 0.15)}`,
                    fontWeight: 400
                  }}
                />
                <Chip
                  label={`¥${new Decimal(exch.JPY).toFixed(4)}`}
                  size="small"
                  sx={{
                    fontSize: '10px',
                    height: '18px',
                    px: 0.5,
                    backgroundColor: alpha('#4285f4', 0.06),
                    color: '#4285f4',
                    border: `1px solid ${alpha('#4285f4', 0.15)}`,
                    fontWeight: 400
                  }}
                />
              </>
            )}
          </Box>
        </Box>

        {/* Performance */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
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
                  fontWeight: 500,
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
                  fontWeight: 500,
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
          <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
            Market Data
          </Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                24h Volume
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {formatDecimal(new Decimal(token.vol24h || 0), 0)} XRP
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Supply
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {formatDecimal(new Decimal(token.supply || 0), 0)} XRP
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Holders
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {formatDecimal(new Decimal(token.holders || 0), 0)}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Additional Info */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
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
                      sx={{
                        fontSize: '10px',
                        height: '18px',
                        px: 0.5,
                        backgroundColor: alpha('#4285f4', 0.06),
                        color: '#4285f4',
                        border: `1px solid ${alpha('#4285f4', 0.15)}`,
                        fontWeight: 400
                      }}
                    />
                  ))}
                  {token.tags.length > 3 && (
                    <Chip
                      label={`+${token.tags.length - 3}`}
                      size="small"
                      sx={{
                        fontSize: '10px',
                        height: '18px',
                        px: 0.5,
                        backgroundColor: alpha('#4285f4', 0.06),
                        color: '#4285f4',
                        border: `1px solid ${alpha('#4285f4', 0.15)}`,
                        fontWeight: 400
                      }}
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
        {imageUrl && <Avatar src={imageUrl} sx={{ mr: 1.5, width: 32, height: 32 }} />}
        <Box>
          <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 500, mb: 0.5 }}>
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
          <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
            Price
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {token.usd && (
              <Chip
                label={`$${new Decimal(token.usd).toFixed(6)}`}
                size="small"
                sx={{
                  fontSize: '10px',
                  height: '18px',
                  px: 0.5,
                  backgroundColor: alpha('#4285f4', 0.06),
                  color: '#4285f4',
                  border: `1px solid ${alpha('#4285f4', 0.15)}`,
                  fontWeight: 400
                }}
              />
            )}
            {token.exch && (
              <Chip
                label={`${new Decimal(token.exch).toFixed(6)} XRP`}
                size="small"
                sx={{
                  fontSize: '10px',
                  height: '18px',
                  px: 0.5,
                  backgroundColor: alpha('#4285f4', 0.06),
                  color: '#4285f4',
                  border: `1px solid ${alpha('#4285f4', 0.15)}`,
                  fontWeight: 400
                }}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Performance */}
      {(token.pro24h || token.pro7d) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
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
                    fontWeight: 500,
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
                    fontWeight: 500,
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
        <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
          Market Data
        </Typography>
        <Stack spacing={0.5}>
          {token.marketcap > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Market Cap
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {formatDecimal(new Decimal(token.marketcap), 0)} XRP
              </Typography>
            </Box>
          )}
          {token.vol24h > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                24h Volume
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {formatDecimal(new Decimal(token.vol24h), 0)} XRP
              </Typography>
            </Box>
          )}
          {token.supply && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Supply
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {formatDecimal(new Decimal(token.supply), 0)}
              </Typography>
            </Box>
          )}
          {token.holders && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Holders
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {formatDecimal(new Decimal(token.holders), 0)}
              </Typography>
            </Box>
          )}
          {token.trustlines && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Trust Lines
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {formatDecimal(new Decimal(token.trustlines), 0)}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Verification & Features */}
      {(token.kyc || token.verified || token.AMM) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
            Features
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {token.kyc && (
              <Chip
                label="KYC"
                size="small"
                sx={{
                  fontSize: '10px',
                  height: '18px',
                  px: 0.5,
                  backgroundColor: alpha('#10b981', 0.06),
                  color: '#10b981',
                  border: `1px solid ${alpha('#10b981', 0.15)}`,
                  fontWeight: 400
                }}
              />
            )}
            {token.verified && (
              <Chip
                label="Verified"
                size="small"
                sx={{
                  fontSize: '10px',
                  height: '18px',
                  px: 0.5,
                  backgroundColor: alpha('#4285f4', 0.06),
                  color: '#4285f4',
                  border: `1px solid ${alpha('#4285f4', 0.15)}`,
                  fontWeight: 400
                }}
              />
            )}
            {token.AMM && (
              <Chip
                label="AMM"
                size="small"
                sx={{
                  fontSize: '10px',
                  height: '18px',
                  px: 0.5,
                  backgroundColor: alpha('#4285f4', 0.06),
                  color: '#4285f4',
                  border: `1px solid ${alpha('#4285f4', 0.15)}`,
                  fontWeight: 400
                }}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Additional Info */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
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
                    sx={{
                      fontSize: '10px',
                      height: '18px',
                      px: 0.5,
                      backgroundColor: alpha('#4285f4', 0.06),
                      color: '#4285f4',
                      border: `1px solid ${alpha('#4285f4', 0.15)}`,
                      fontWeight: 400
                    }}
                  />
                )}
                {token.social.telegram && (
                  <Chip
                    label="Telegram"
                    size="small"
                    sx={{
                      fontSize: '10px',
                      height: '18px',
                      px: 0.5,
                      backgroundColor: alpha('#4285f4', 0.06),
                      color: '#4285f4',
                      border: `1px solid ${alpha('#4285f4', 0.15)}`,
                      fontWeight: 400
                    }}
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
                    sx={{
                      fontSize: '10px',
                      height: '18px',
                      px: 0.5,
                      backgroundColor: alpha('#4285f4', 0.06),
                      color: '#4285f4',
                      border: `1px solid ${alpha('#4285f4', 0.15)}`,
                      fontWeight: 400
                    }}
                  />
                ))}
                {token.tags.length > 3 && (
                  <Chip
                    label={`+${token.tags.length - 3}`}
                    size="small"
                    sx={{
                      fontSize: '10px',
                      height: '18px',
                      px: 0.5,
                      backgroundColor: alpha('#4285f4', 0.06),
                      color: '#4285f4',
                      border: `1px solid ${alpha('#4285f4', 0.15)}`,
                      fontWeight: 400
                    }}
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

  return <Avatar src={imgSrc} onError={handleImageError} sx={{ width: 20, height: 20, mr: 0.5 }} />;
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
          {formatDecimal(new Decimal(amount.value))}{' '}
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
      return `${formatDecimal(new Decimal(amount.value))} ${currency}`;
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
          title: 'Token Swap',
          description: `${formatAccount(Account)} swapped ${sentAmount} for ${receivedAmount} using the DEX.`,
          details: [
            `Swapper: ${formatAccount(Account)}`,
            `Spent: ${sentAmount}`,
            `Received: ${receivedAmount}`,
            `Network fee: ${dropsToXrp(Fee)} XRP`,
            isSuccess ? 'Swap successful' : 'Swap failed'
          ]
        };
      } else {
        const amount = deliveredAmount ? formatAmount(deliveredAmount) : formatAmount(Amount);
        const maxAmount = SendMax ? formatAmount(SendMax) : null;
        const usedPaths = Boolean(Paths);

        return {
          title: usedPaths ? 'Cross-Currency Payment' : 'Payment',
          description: `${formatAccount(Account)} sent ${amount} to ${formatAccount(Destination)}.${maxAmount && maxAmount !== amount ? ` (authorized up to ${maxAmount})` : ''}${usedPaths ? ' The payment auto-converted currencies.' : ''}`,
          details: [
            `From: ${formatAccount(Account)}`,
            `To: ${formatAccount(Destination)}`,
            `Amount: ${amount}`,
            maxAmount && maxAmount !== amount ? `Max authorized: ${maxAmount}` : null,
            `Network fee: ${dropsToXrp(Fee)} XRP`,
            usedPaths ? 'Auto-converted via DEX' : 'Direct transfer',
            isSuccess ? 'Delivered' : 'Failed'
          ].filter(Boolean)
        };
      }

    case 'OfferCreate':
      const isSellOrder = Flags & 0x00080000;
      const takerGets = formatAmount(TakerGets);
      const takerPays = formatAmount(TakerPays);

      // Calculate exchange rate
      const exchangeRate = (() => {
        try {
          const getsVal = new Decimal(TakerGets.value || dropsToXrp(TakerGets));
          const paysVal = new Decimal(TakerPays.value || dropsToXrp(TakerPays));
          const rate = getsVal.div(paysVal);
          return `${rate.toFixed(rate.lt(0.01) ? 6 : 4)} ${getCurrency(TakerGets)} per ${getCurrency(TakerPays)}`;
        } catch {
          return null;
        }
      })();

      return {
        title: `${isSellOrder ? 'Sell' : 'Buy'} Order`,
        description: `${formatAccount(Account)} wants to ${isSellOrder ? `sell ${takerGets} for ${takerPays}` : `buy ${takerGets} with ${takerPays}`}${exchangeRate ? ` at a rate of ${exchangeRate}` : ''}.${OfferSequence > 0 ? ` This replaces order #${OfferSequence}.` : ''}`,
        details: [
          `Order maker: ${formatAccount(Account)}`,
          `Order type: ${isSellOrder ? 'Sell' : 'Buy'} order`,
          `Offering: ${takerGets}`,
          `Requesting: ${takerPays}`,
          exchangeRate ? `Rate: ${exchangeRate}` : null,
          OfferSequence > 0 ? `Replaces order #${OfferSequence}` : 'New order',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Order placed successfully' : 'Order placement failed'
        ].filter(Boolean)
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
      const isRemovingTrust = LimitAmount && new Decimal(LimitAmount.value).isZero();

      return {
        title: isRemovingTrust ? 'Trust Line Removed' : 'Trust Line Created',
        description: `${formatAccount(Account)} ${isRemovingTrust ? `removed their trust line with ${trustIssuer}` : `can now hold up to ${trustAmount} from ${trustIssuer}`}.`,
        details: [
          `Account: ${formatAccount(Account)}`,
          `Token issuer: ${trustIssuer}`,
          `Limit: ${trustAmount}`,
          isRemovingTrust ? 'Removed trust line' : 'Created/updated trust line',
          `Fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Success' : 'Failed'
        ]
      };

    case 'NFTokenMint':
      const transferFeePercent = TransferFee ? `${TransferFee / 1000}%` : '0%';
      return {
        title: 'NFT Minted',
        description: `${formatAccount(Account)} created a new NFT${TransferFee ? ` with ${transferFeePercent} royalty` : ''}.`,
        details: [
          `Creator: ${formatAccount(Account)}`,
          meta?.nftoken_id ? `NFT ID: ${meta.nftoken_id}` : null,
          TransferFee ? `Royalty: ${transferFeePercent}` : 'No royalties',
          NFTokenTaxon ? `Taxon: ${NFTokenTaxon}` : null,
          URI ? 'Has metadata' : null,
          `Fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Minted' : 'Failed'
        ].filter(Boolean)
      };

    case 'NFTokenCreateOffer':
      const isBuyOffer = !(Flags & 1);
      const offerAmount = formatAmount(Amount);
      return {
        title: `NFT ${isBuyOffer ? 'Buy' : 'Sell'} Offer`,
        description: `${formatAccount(Account)} ${isBuyOffer ? `offered ${offerAmount} to buy` : `listed for ${offerAmount}`} NFT ${NFTokenID ? NFTokenID.slice(0, 12) + '...' : ''}${Destination ? ` (private offer to ${formatAccount(Destination)})` : ''}.`,
        details: [
          `${isBuyOffer ? 'Buyer' : 'Seller'}: ${formatAccount(Account)}`,
          `Price: ${offerAmount}`,
          NFTokenID ? `NFT: ${NFTokenID}` : null,
          Destination ? `Private offer to ${formatAccount(Destination)}` : 'Public offer',
          `Fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Created' : 'Failed'
        ].filter(Boolean)
      };

    case 'NFTokenAcceptOffer':
      if (acceptedOfferDetails) {
        return {
          title: 'NFT Sold',
          description: `NFT ${acceptedOfferDetails.nftokenID.slice(0, 12)}... transferred from ${formatAccount(acceptedOfferDetails.seller)} to ${formatAccount(acceptedOfferDetails.buyer)}.`,
          details: [
            `Seller: ${formatAccount(acceptedOfferDetails.seller)}`,
            `Buyer: ${formatAccount(acceptedOfferDetails.buyer)}`,
            `NFT: ${acceptedOfferDetails.nftokenID}`,
            `Fee: ${dropsToXrp(Fee)} XRP`,
            isSuccess ? 'Sold' : 'Failed'
          ]
        };
      }
      return {
        title: 'NFT Trade',
        description: `${formatAccount(Account)} completed an NFT trade.`,
        details: [
          `Trader: ${formatAccount(Account)}`,
          `Fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Completed' : 'Failed'
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
        title: 'Added Liquidity',
        description: `${formatAccount(Account)} added ${depositAmount}${depositAmount2 ? ` + ${depositAmount2}` : ''} to earn trading fees.`,
        details: [
          `Provider: ${formatAccount(Account)}`,
          depositAmount ? `Deposit: ${depositAmount}` : null,
          depositAmount2 ? `Also: ${depositAmount2}` : null,
          `Fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Added' : 'Failed'
        ].filter(Boolean)
      };

    case 'AMMWithdraw':
      const withdrawAmount = LPTokenIn ? formatAmount(LPTokenIn) : null;
      return {
        title: 'Removed Liquidity',
        description: `${formatAccount(Account)} withdrew ${withdrawAmount || 'their liquidity'} from the pool.`,
        details: [
          `Provider: ${formatAccount(Account)}`,
          withdrawAmount ? `LP tokens: ${withdrawAmount}` : null,
          `Fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Withdrawn' : 'Failed'
        ].filter(Boolean)
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

    case 'OracleDelete':
      return {
        title: 'Oracle Deletion',
        description: `${formatAccount(Account)} deleted an oracle from the XRPL. This removes the oracle's price feed data from the network.`,
        details: [
          `Oracle operator: ${formatAccount(Account)}`,
          'Action: Oracle deleted',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Oracle deleted successfully' : 'Oracle deletion failed'
        ]
      };

    case 'AccountSet':
      return {
        title: 'Account Settings Update',
        description: `${formatAccount(Account)} modified their account settings. This can include setting up domain verification, email hash, message keys, or enabling/disabling account features like requiring destination tags.`,
        details: [
          `Account: ${formatAccount(Account)}`,
          'Action: Account settings modified',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Settings updated successfully' : 'Settings update failed'
        ]
      };

    case 'AccountDelete':
      return {
        title: 'Account Deletion',
        description: `${formatAccount(Account)} deleted their account and sent the remaining XRP balance to ${Destination ? formatAccount(Destination) : 'another account'}. Account deletion is permanent and cannot be undone.`,
        details: [
          `Deleted account: ${formatAccount(Account)}`,
          Destination ? `XRP sent to: ${formatAccount(Destination)}` : null,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Account deleted successfully' : 'Account deletion failed'
        ].filter(Boolean)
      };

    case 'SetRegularKey':
      return {
        title: 'Regular Key Configuration',
        description: `${formatAccount(Account)} configured a regular key pair for their account. Regular keys provide an extra layer of security by allowing you to change signing keys without changing your account address.`,
        details: [
          `Account: ${formatAccount(Account)}`,
          'Action: Regular key updated',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Regular key set successfully' : 'Regular key setup failed'
        ]
      };

    case 'CheckCreate':
      return {
        title: 'Check Created',
        description: `${formatAccount(Account)} created a check payable to ${formatAccount(Destination)}. Checks are like paper checks - they authorize the recipient to pull a payment when ready, up to a specified amount.`,
        details: [
          `Check creator: ${formatAccount(Account)}`,
          `Payable to: ${formatAccount(Destination)}`,
          SendMax ? `Maximum amount: ${formatAmount(SendMax)}` : null,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Check created successfully' : 'Check creation failed'
        ].filter(Boolean)
      };

    case 'CheckCash':
      return {
        title: 'Check Cashed',
        description: `${formatAccount(Account)} cashed a check, receiving the authorized payment. The check has been redeemed and removed from the ledger.`,
        details: [
          `Check recipient: ${formatAccount(Account)}`,
          Amount ? `Amount received: ${formatAmount(Amount)}` : null,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Check cashed successfully' : 'Check cashing failed'
        ].filter(Boolean)
      };

    case 'CheckCancel':
      return {
        title: 'Check Cancelled',
        description: `${formatAccount(Account)} cancelled a check. The check is no longer valid and has been removed from the ledger.`,
        details: [
          `Cancelled by: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Check cancelled successfully' : 'Check cancellation failed'
        ]
      };

    case 'EscrowCreate':
      return {
        title: 'Escrow Created',
        description: `${formatAccount(Account)} created an escrow of ${formatAmount(Amount)} to ${formatAccount(Destination)}. The funds are locked and will be released when conditions are met or at a specified time.`,
        details: [
          `Escrow creator: ${formatAccount(Account)}`,
          `Beneficiary: ${formatAccount(Destination)}`,
          `Escrowed amount: ${formatAmount(Amount)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Escrow created successfully' : 'Escrow creation failed'
        ]
      };

    case 'EscrowFinish':
      return {
        title: 'Escrow Completed',
        description: `${formatAccount(Account)} completed an escrow, releasing the locked funds to the intended recipient. The escrow conditions have been satisfied.`,
        details: [
          `Completed by: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Escrow completed successfully' : 'Escrow completion failed'
        ]
      };

    case 'EscrowCancel':
      return {
        title: 'Escrow Cancelled',
        description: `${formatAccount(Account)} cancelled an expired escrow, returning the locked funds to the original sender. Escrows can only be cancelled after they expire.`,
        details: [
          `Cancelled by: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Escrow cancelled successfully' : 'Escrow cancellation failed'
        ]
      };

    case 'PaymentChannelCreate':
      return {
        title: 'Payment Channel Created',
        description: `${formatAccount(Account)} opened a payment channel to ${formatAccount(Destination)} with ${formatAmount(Amount)} reserved. Payment channels enable fast, off-ledger microtransactions.`,
        details: [
          `Channel creator: ${formatAccount(Account)}`,
          `Destination: ${formatAccount(Destination)}`,
          `Reserved amount: ${formatAmount(Amount)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Payment channel created successfully' : 'Payment channel creation failed'
        ]
      };

    case 'PaymentChannelFund':
      return {
        title: 'Payment Channel Funded',
        description: `${formatAccount(Account)} added more funds to a payment channel. This extends the channel's capacity for microtransactions.`,
        details: [
          `Funded by: ${formatAccount(Account)}`,
          Amount ? `Additional amount: ${formatAmount(Amount)}` : null,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Payment channel funded successfully' : 'Payment channel funding failed'
        ].filter(Boolean)
      };

    case 'PaymentChannelClaim':
      return {
        title: 'Payment Channel Claim',
        description: `${formatAccount(Account)} claimed funds from a payment channel. This can close the channel or withdraw accumulated payments.`,
        details: [
          `Claimed by: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Payment channel claim successful' : 'Payment channel claim failed'
        ]
      };

    case 'DepositPreauth':
      return {
        title: 'Deposit Authorization',
        description: `${formatAccount(Account)} ${Destination ? `pre-authorized ${formatAccount(Destination)} to send payments` : 'removed a deposit authorization'}. This allows bypassing deposit authorization requirements for specific accounts.`,
        details: [
          `Account: ${formatAccount(Account)}`,
          Destination ? `Authorized: ${formatAccount(Destination)}` : 'Authorization removed',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Authorization updated successfully' : 'Authorization update failed'
        ]
      };

    case 'NFTokenBurn':
      return {
        title: 'NFT Burned',
        description: `${formatAccount(Account)} permanently destroyed an NFT. Burning an NFT removes it from circulation forever.`,
        details: [
          `Burned by: ${formatAccount(Account)}`,
          NFTokenID ? `NFT ID: ${NFTokenID}` : null,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'NFT burned successfully' : 'NFT burning failed'
        ].filter(Boolean)
      };

    case 'Clawback':
      return {
        title: 'Token Clawback',
        description: `${formatAccount(Account)} clawed back tokens they issued from ${formatAccount(Destination)}. Clawback allows issuers to recover their issued tokens from holders.`,
        details: [
          `Issuer: ${formatAccount(Account)}`,
          `Clawed back from: ${formatAccount(Destination)}`,
          Amount ? `Amount: ${formatAmount(Amount)}` : null,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Clawback successful' : 'Clawback failed'
        ].filter(Boolean)
      };

    case 'AMMCreate':
      return {
        title: 'AMM Pool Created',
        description: `${formatAccount(Account)} created a new Automated Market Maker pool. This enables decentralized token swaps between two assets.`,
        details: [
          `Pool creator: ${formatAccount(Account)}`,
          Amount ? `Initial deposit: ${formatAmount(Amount)}` : null,
          Amount2 ? `Second asset: ${formatAmount(Amount2)}` : null,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'AMM pool created successfully' : 'AMM pool creation failed'
        ].filter(Boolean)
      };

    case 'AMMBid':
      return {
        title: 'AMM Auction Bid',
        description: `${formatAccount(Account)} placed a bid for an AMM's auction slot. Winning the auction grants a discounted trading fee for a period of time.`,
        details: [
          `Bidder: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Bid placed successfully' : 'Bid failed'
        ]
      };

    case 'AMMVote':
      return {
        title: 'AMM Fee Vote',
        description: `${formatAccount(Account)} voted on the trading fee for an AMM pool. Liquidity providers can vote to adjust the pool's fee structure.`,
        details: [
          `Voter: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Vote recorded successfully' : 'Vote failed'
        ]
      };

    case 'AMMDelete':
      return {
        title: 'AMM Pool Deleted',
        description: `${formatAccount(Account)} deleted an empty AMM pool. Pools can only be deleted when all liquidity has been withdrawn.`,
        details: [
          `Deleted by: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'AMM pool deleted successfully' : 'AMM pool deletion failed'
        ]
      };

    case 'AMMClawback':
      return {
        title: 'AMM Token Clawback',
        description: `${formatAccount(Account)} clawed back tokens from an AMM pool. This allows issuers to recover their tokens that have been deposited into AMM pools.`,
        details: [
          `Issuer: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'AMM clawback successful' : 'AMM clawback failed'
        ]
      };

    case 'DIDSet':
      return {
        title: 'Decentralized ID Updated',
        description: `${formatAccount(Account)} created or updated their Decentralized Identifier (DID). DIDs enable verifiable digital identities on the XRPL.`,
        details: [
          `Account: ${formatAccount(Account)}`,
          'Action: DID updated',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'DID updated successfully' : 'DID update failed'
        ]
      };

    case 'DIDDelete':
      return {
        title: 'Decentralized ID Deleted',
        description: `${formatAccount(Account)} deleted their Decentralized Identifier (DID) from the ledger.`,
        details: [
          `Account: ${formatAccount(Account)}`,
          'Action: DID deleted',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'DID deleted successfully' : 'DID deletion failed'
        ]
      };

    case 'CredentialCreate':
      return {
        title: 'Credential Issued',
        description: `${formatAccount(Account)} provisionally issued a credential to ${formatAccount(Destination)}. Credentials are attestations that can be accepted or rejected by the recipient.`,
        details: [
          `Issuer: ${formatAccount(Account)}`,
          `Subject: ${formatAccount(Destination)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Credential issued successfully' : 'Credential issuance failed'
        ]
      };

    case 'CredentialAccept':
      return {
        title: 'Credential Accepted',
        description: `${formatAccount(Account)} accepted a credential that was provisionally issued to them. The credential is now active on the ledger.`,
        details: [
          `Accepted by: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Credential accepted successfully' : 'Credential acceptance failed'
        ]
      };

    case 'CredentialDelete':
      return {
        title: 'Credential Revoked',
        description: `${formatAccount(Account)} deleted a credential from the ledger, effectively revoking it. Revoked credentials can no longer be used for verification.`,
        details: [
          `Revoked by: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Credential revoked successfully' : 'Credential revocation failed'
        ]
      };

    case 'DelegateKeySet':
      return {
        title: 'Delegation Permission',
        description: `${formatAccount(Account)} ${Destination ? `granted ${formatAccount(Destination)} permission to send certain transactions on their behalf` : 'revoked delegation permissions'}. This enables secure account delegation.`,
        details: [
          `Account: ${formatAccount(Account)}`,
          Destination ? `Delegate: ${formatAccount(Destination)}` : 'Delegation revoked',
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Delegation updated successfully' : 'Delegation update failed'
        ]
      };

    case 'XChainCreateBridge':
      return {
        title: 'Cross-Chain Bridge Created',
        description: `${formatAccount(Account)} created a bridge between two blockchains. This enables cross-chain value transfers between the XRPL and sidechains.`,
        details: [
          `Bridge creator: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Bridge created successfully' : 'Bridge creation failed'
        ]
      };

    case 'XChainCommit':
      return {
        title: 'Cross-Chain Transfer Started',
        description: `${formatAccount(Account)} initiated a cross-chain transfer. Funds are locked on this chain and will be claimable on the destination chain.`,
        details: [
          `Initiated by: ${formatAccount(Account)}`,
          Amount ? `Transfer amount: ${formatAmount(Amount)}` : null,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Transfer committed successfully' : 'Transfer commit failed'
        ].filter(Boolean)
      };

    case 'XChainClaim':
      return {
        title: 'Cross-Chain Transfer Completed',
        description: `${formatAccount(Account)} claimed funds from a cross-chain transfer. The transfer from another chain is now complete.`,
        details: [
          `Claimed by: ${formatAccount(Account)}`,
          Amount ? `Amount received: ${formatAmount(Amount)}` : null,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Cross-chain claim successful' : 'Cross-chain claim failed'
        ].filter(Boolean)
      };

    case 'XChainCreateClaimID':
      return {
        title: 'Cross-Chain Claim ID Created',
        description: `${formatAccount(Account)} created a claim ID for a cross-chain transfer. This ID is used to track and complete the transfer on the destination chain.`,
        details: [
          `Created by: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Claim ID created successfully' : 'Claim ID creation failed'
        ]
      };

    case 'XChainAddAccountCreateAttestation':
      return {
        title: 'Cross-Chain Attestation',
        description: `${formatAccount(Account)} provided an attestation for a cross-chain account creation. Attestations verify that transactions occurred on another chain.`,
        details: [
          `Attester: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Attestation added successfully' : 'Attestation failed'
        ]
      };

    case 'XChainModifyBridge':
      return {
        title: 'Cross-Chain Bridge Modified',
        description: `${formatAccount(Account)} modified settings for a cross-chain bridge. This can update bridge parameters or configuration.`,
        details: [
          `Modified by: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Bridge modified successfully' : 'Bridge modification failed'
        ]
      };

    case 'Remit':
      return {
        title: 'Remittance Payment',
        description: `${formatAccount(Account)} sent a remittance payment${Destination ? ` to ${formatAccount(Destination)}` : ''}. Remit transactions can combine multiple operations in a single transaction.`,
        details: [
          `Sender: ${formatAccount(Account)}`,
          Destination ? `Recipient: ${formatAccount(Destination)}` : null,
          Amount ? `Amount: ${formatAmount(Amount)}` : null,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Remittance successful' : 'Remittance failed'
        ].filter(Boolean)
      };

    case 'Invoke':
      return {
        title: 'Hook Invocation',
        description: `${formatAccount(Account)} invoked a transaction hook. Hooks are smart contract-like functions that execute when triggered by transactions.`,
        details: [
          `Invoked by: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Hook invoked successfully' : 'Hook invocation failed'
        ]
      };

    case 'Batch':
      return {
        title: 'Batch Transaction',
        description: `${formatAccount(Account)} submitted a batch of up to 8 transactions that succeed or fail atomically. All transactions in the batch execute together or none execute.`,
        details: [
          `Batch submitter: ${formatAccount(Account)}`,
          `Network fee: ${dropsToXrp(Fee)} XRP`,
          isSuccess ? 'Batch executed successfully' : 'Batch execution failed'
        ]
      };

    case 'EnableAmendment':
      return {
        title: 'Protocol Amendment Enabled',
        description: `A protocol amendment was enabled on the XRPL network. Amendments upgrade the network's features and capabilities through validator consensus.`,
        details: [
          'System transaction',
          'Action: Protocol amendment enabled',
          isSuccess ? 'Amendment enabled successfully' : 'Amendment enable failed'
        ]
      };

    case 'SetFee':
      return {
        title: 'Network Fee Update',
        description: `The network's base transaction fee was updated. This system transaction is submitted by validators to adjust fees based on network load.`,
        details: [
          'System transaction',
          'Action: Base fee updated',
          isSuccess ? 'Fee updated successfully' : 'Fee update failed'
        ]
      };

    case 'UNLModify':
      return {
        title: 'UNL Modification',
        description: `The Unique Node List (UNL) was modified. The UNL defines which validators the network trusts for consensus.`,
        details: [
          'System transaction',
          'Action: UNL updated',
          isSuccess ? 'UNL modified successfully' : 'UNL modification failed'
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

const TransactionSummaryCard = ({ txData }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
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
        mb: 2.5,
        background: 'transparent',
        border: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
        borderRadius: '12px'
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 400, fontSize: '18px' }}>
            {description.title}
          </Typography>
          <Chip
            label={isSuccess ? 'Success' : 'Failed'}
            size="small"
            sx={{
              fontSize: '10px',
              height: '18px',
              px: 0.5,
              backgroundColor: alpha(isSuccess ? '#10b981' : '#ef4444', 0.08),
              color: isSuccess ? '#10b981' : '#ef4444',
              border: `1px solid ${alpha(isSuccess ? '#10b981' : '#ef4444', 0.15)}`,
              fontWeight: 400
            }}
          />
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr auto 1fr' },
            gap: 1.5,
            alignItems: 'center'
          }}
        >
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.5), fontSize: '12px' }}>
            Hash
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>
            {hash}
          </Typography>

          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.5), fontSize: '12px' }}>
            Time
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '13px' }}>
            {formatDistanceToNow(new Date(rippleTimeToISO8601(date)))} ago
          </Typography>

          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.5), fontSize: '12px' }}>
            Ledger
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '13px' }}>
            #{ledger_index.toLocaleString()}
          </Typography>

          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.5), fontSize: '12px' }}>
            Fee
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '13px' }}>
            {dropsToXrp(Fee)} XRP
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const TransactionDetails = ({ txData }) => {
  const theme = useTheme();
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

  const copyForLLM = () => {
    // Copy the complete raw transaction data from rippled
    const rawTxData = {
      ...txData,
      // Add human-readable timestamp
      date_human: rippleTimeToISO8601(date),
      // Ensure meta is included
      meta: meta
    };

    const jsonString = JSON.stringify(rawTxData, null, 2);

    navigator.clipboard.writeText(jsonString);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
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
        const change = new Decimal(finalFields.Balance).minus(previousFields.Balance);
        if (!balanceChanges[account]) balanceChanges[account] = [];
        balanceChanges[account].push({ currency: 'XRP', value: dropsToXrp(change.toString()) });
      } else if (node.LedgerEntryType === 'RippleState' && previousFields.Balance) {
        const lowAccount = finalFields.LowLimit.issuer;
        const highAccount = finalFields.HighLimit.issuer;
        const currency = finalFields.Balance.currency;
        const finalBalance = new Decimal(finalFields.Balance.value);
        const prevBalance = new Decimal(previousFields.Balance?.value || 0);
        const change = finalBalance.minus(prevBalance);

        if (!change.isZero()) {
          const normCurr = normalizeCurrencyCode(currency);

          let issuer = highAccount;
          // If balance is negative, the low account is the issuer.
          if (new Decimal(finalFields.Balance.value).isNegative()) {
            issuer = lowAccount;
          } else if (
            finalBalance.isZero() &&
            previousFields.Balance &&
            new Decimal(previousFields.Balance.value).isNegative()
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
            ? new Decimal(prevPays.value || 0).minus(finalPays.value || 0)
            : new Decimal(prevPays || 0).minus(finalPays || 0);

        const got =
          typeof prevGets === 'object'
            ? new Decimal(prevGets.value || 0).minus(finalGets.value || 0)
            : new Decimal(prevGets || 0).minus(finalGets || 0);

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
    const paidChange = changes.find((c) => new Decimal(c.value).isNegative());
    const gotChange = changes.find((c) => new Decimal(c.value).isPositive());

    if (paidChange && gotChange) {
      const paidValue = new Decimal(paidChange.value).abs();
      const gotValue = new Decimal(gotChange.value);

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
      <TransactionSummaryCard txData={txData} />

      <Box
        sx={{
          p: 2.5,
          borderRadius: '12px',
          background: 'transparent',
          border: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ wordBreak: 'break-all', mr: 1.5, fontWeight: 400 }}>
              Transaction Details
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy Hash'}>
              <IconButton onClick={copyToClipboard} size="small" aria-label="Copy transaction hash">
                <FileCopyOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Tooltip title={urlCopied ? 'Copied!' : 'Copy for LLM'}>
            <Box
              component="button"
              onClick={copyForLLM}
              aria-label="Copy transaction summary for LLM"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.2,
                py: 0.6,
                fontSize: '11px',
                fontWeight: 400,
                color: '#4285f4',
                backgroundColor: 'transparent',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: alpha('#4285f4', 0.04),
                  borderColor: '#4285f4'
                }
              }}
            >
              <FileCopyOutlinedIcon sx={{ fontSize: '14px' }} />
              Copy for LLM
            </Box>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          {/* Main Transaction Details */}
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                p: 2,
                background: alpha(theme.palette.divider, 0.04),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: '8px'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 400, fontSize: '14px', mb: 1.5, pb: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                Key Information
              </Typography>
              <Stack spacing={1.5}>
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
                              ? 'Swap'
                              : TransactionType
                    }
                    size="small"
                    sx={{
                      fontSize: '10px',
                      height: '18px',
                      px: 0.5,
                      backgroundColor: alpha('#4285f4', 0.06),
                      color: '#4285f4',
                      border: `1px solid ${alpha('#4285f4', 0.15)}`,
                      fontWeight: 400
                    }}
                  />
                </DetailRow>

                <DetailRow label="Timestamp">
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '13px' }}>
                    {new Date(rippleTimeToISO8601(date)).toLocaleString()}
                  </Typography>
                </DetailRow>

                {/* Account Information */}
                {TransactionType === 'Payment' && (
                  <>
                    {isConversion && Account === Destination ? (
                      <DetailRow label="Account">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccountAvatar account={Account} />
                          <Link href={`/profile/${Account}`} passHref>
                            <Typography
                              component="a"
                              variant="body2"
                              sx={{
                                color: theme.palette.primary.main,
                                textDecoration: 'none',
                                fontFamily: 'monospace',
                                fontSize: '13px',
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
                        <DetailRow label="From">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccountAvatar account={Account} />
                            <Link href={`/profile/${Account}`} passHref>
                              <Typography
                                component="a"
                                variant="body2"
                                sx={{
                                  color: theme.palette.primary.main,
                                  textDecoration: 'none',
                                  fontFamily: 'monospace',
                                  fontSize: '13px',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                {Account}
                              </Typography>
                            </Link>
                          </Box>
                        </DetailRow>
                        <DetailRow label="To">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccountAvatar account={Destination} />
                            <Link href={`/profile/${Destination}`} passHref>
                              <Typography
                                component="a"
                                variant="body2"
                                sx={{
                                  color: theme.palette.primary.main,
                                  textDecoration: 'none',
                                  fontFamily: 'monospace',
                                  fontSize: '13px',
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
                      <DetailRow label="Amount">
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
                      <DetailRow label="Max Spend">
                        <AmountDisplay amount={SendMax} />
                      </DetailRow>
                    )}
                  </>
                )}

                {/* Client Information */}
                {clientInfo && clientInfo.name !== 'N/A' && (
                  <DetailRow label="Platform">
                    {clientInfo.url ? (
                      <Link
                        href={clientInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        passHref
                      >
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
                    ) : (
                      <Typography variant="body1">{clientInfo.name}</Typography>
                    )}
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
                            <Box
                              key={offer.offerId}
                              sx={{
                                p: 2,
                                width: '100%',
                                mb: 2,
                                background: 'transparent',
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                borderRadius: 2
                              }}
                            >
                              <Grid container spacing={2}>
                                {isLoading ? (
                                  <Grid size={{ xs: 12 }}>
                                    <Typography>Loading NFT data...</Typography>
                                  </Grid>
                                ) : nftInfo && !nftInfo.error ? (
                                  <>
                                    <Grid size={{ xs: 12, md: 4 }}>
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
                                    <Grid size={{ xs: 12, md: 8 }}>
                                      {fallbackView}
                                    </Grid>
                                  </>
                                ) : (
                                  <Grid size={{ xs: 12 }}>
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
                          <Grid size={{ xs: 12, md: 4 }}>
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
                          <Grid size={{ xs: 12, md: 8 }}>
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
                          <Grid size={{ xs: 12, md: 4 }}>
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
                          <Grid size={{ xs: 12, md: 8 }}>
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
                      <Box
                        sx={{
                          p: 2,
                          width: '100%',
                          background: 'transparent',
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          borderRadius: 2
                        }}
                      >
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
                        <Grid size={{ xs: 12, md: 4 }}>
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
                        <Grid size={{ xs: 12, md: 8 }}>
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
                      <Box
                        sx={{
                          p: 2,
                          width: '100%',
                          background: 'transparent',
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          borderRadius: 2
                        }}
                      >
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
                            const price = new Decimal(parseInt(AssetPrice, 16)).div(
                              new Decimal(10).pow(Scale)
                            );
                            const base =
                              BaseAsset === 'XRP' ? 'XRP' : normalizeCurrencyCode(BaseAsset);
                            const quote =
                              QuoteAsset === 'XRP' ? 'XRP' : normalizeCurrencyCode(QuoteAsset);
                            const keyStr = `${BaseAsset}-${QuoteAsset}-${AssetPrice}`;
                            return (
                              <Typography key={keyStr} variant="body2">
                                1 {base} = {price.toString()} {quote}
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

                {/* NFTokenBurn Details */}
                {TransactionType === 'NFTokenBurn' && NFTokenID && (
                  <DetailRow label="Burned NFT">
                    <Link href={`/nft/${NFTokenID}`} passHref>
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
                        {NFTokenID}
                      </Typography>
                    </Link>
                  </DetailRow>
                )}

                {/* AccountSet Details */}
                {TransactionType === 'AccountSet' && (
                  <>
                    {txData.Domain && (
                      <DetailRow label="Domain">
                        <Typography variant="body1">
                          {CryptoJS.enc.Hex.parse(txData.Domain).toString(CryptoJS.enc.Utf8)}
                        </Typography>
                      </DetailRow>
                    )}
                    {txData.EmailHash && (
                      <DetailRow label="Email Hash">
                        <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                          {txData.EmailHash}
                        </Typography>
                      </DetailRow>
                    )}
                    {txData.MessageKey && (
                      <DetailRow label="Message Key">
                        <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                          {txData.MessageKey}
                        </Typography>
                      </DetailRow>
                    )}
                    {txData.SetFlag !== undefined && (
                      <DetailRow label="Flag Enabled">
                        <Typography variant="body1">{txData.SetFlag}</Typography>
                      </DetailRow>
                    )}
                    {txData.ClearFlag !== undefined && (
                      <DetailRow label="Flag Disabled">
                        <Typography variant="body1">{txData.ClearFlag}</Typography>
                      </DetailRow>
                    )}
                  </>
                )}

                {/* SetRegularKey Details */}
                {TransactionType === 'SetRegularKey' && txData.RegularKey && (
                  <DetailRow label="Regular Key">
                    <Link href={`/profile/${txData.RegularKey}`} passHref>
                      <Typography
                        component="a"
                        variant="body1"
                        sx={{
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {txData.RegularKey}
                      </Typography>
                    </Link>
                  </DetailRow>
                )}

                {/* Check Transactions */}
                {(TransactionType === 'CheckCreate' || TransactionType === 'CheckCash' || TransactionType === 'CheckCancel') && (
                  <>
                    {txData.CheckID && (
                      <DetailRow label="Check ID">
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {txData.CheckID}
                        </Typography>
                      </DetailRow>
                    )}
                    {TransactionType === 'CheckCash' && txData.DeliverMin && (
                      <DetailRow label="Minimum Delivery">
                        <AmountDisplay amount={txData.DeliverMin} />
                      </DetailRow>
                    )}
                  </>
                )}

                {/* Escrow Transactions */}
                {(TransactionType === 'EscrowCreate' || TransactionType === 'EscrowFinish' || TransactionType === 'EscrowCancel') && (
                  <>
                    {txData.FinishAfter && (
                      <DetailRow label="Can Finish After">
                        <Typography variant="body1">
                          {new Date(rippleTimeToISO8601(txData.FinishAfter)).toLocaleString()}
                        </Typography>
                      </DetailRow>
                    )}
                    {txData.CancelAfter && (
                      <DetailRow label="Expires After">
                        <Typography variant="body1">
                          {new Date(rippleTimeToISO8601(txData.CancelAfter)).toLocaleString()}
                        </Typography>
                      </DetailRow>
                    )}
                    {txData.OfferSequence && TransactionType !== 'OfferCancel' && (
                      <DetailRow label="Escrow Sequence">
                        <Typography variant="body1">#{txData.OfferSequence}</Typography>
                      </DetailRow>
                    )}
                    {txData.Condition && (
                      <DetailRow label="Condition">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {txData.Condition}
                        </Typography>
                      </DetailRow>
                    )}
                    {txData.Fulfillment && (
                      <DetailRow label="Fulfillment">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {txData.Fulfillment}
                        </Typography>
                      </DetailRow>
                    )}
                  </>
                )}

                {/* Payment Channel Transactions */}
                {(TransactionType === 'PaymentChannelCreate' || TransactionType === 'PaymentChannelFund' || TransactionType === 'PaymentChannelClaim') && (
                  <>
                    {txData.Channel && (
                      <DetailRow label="Channel ID">
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {txData.Channel}
                        </Typography>
                      </DetailRow>
                    )}
                    {txData.SettleDelay && (
                      <DetailRow label="Settlement Delay">
                        <Typography variant="body1">{txData.SettleDelay} seconds</Typography>
                      </DetailRow>
                    )}
                    {txData.PublicKey && (
                      <DetailRow label="Public Key">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {txData.PublicKey}
                        </Typography>
                      </DetailRow>
                    )}
                    {txData.Balance && (
                      <DetailRow label="Channel Balance">
                        <AmountDisplay amount={txData.Balance} />
                      </DetailRow>
                    )}
                  </>
                )}

                {/* DID Transactions */}
                {(TransactionType === 'DIDSet' || TransactionType === 'DIDDelete') && (
                  <>
                    {txData.DIDDocument && (
                      <DetailRow label="DID Document">
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {txData.DIDDocument}
                        </Typography>
                      </DetailRow>
                    )}
                    {txData.Data && (
                      <DetailRow label="Data">
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {txData.Data}
                        </Typography>
                      </DetailRow>
                    )}
                  </>
                )}

                {/* Credential Transactions */}
                {(TransactionType === 'CredentialCreate' || TransactionType === 'CredentialAccept' || TransactionType === 'CredentialDelete') && (
                  <>
                    {txData.CredentialType && (
                      <DetailRow label="Credential Type">
                        <Typography variant="body1">{txData.CredentialType}</Typography>
                      </DetailRow>
                    )}
                    {txData.Issuer && (
                      <DetailRow label="Issuer">
                        <Link href={`/profile/${txData.Issuer}`} passHref>
                          <Typography
                            component="a"
                            variant="body1"
                            sx={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {txData.Issuer}
                          </Typography>
                        </Link>
                      </DetailRow>
                    )}
                    {txData.Subject && (
                      <DetailRow label="Subject">
                        <Link href={`/profile/${txData.Subject}`} passHref>
                          <Typography
                            component="a"
                            variant="body1"
                            sx={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {txData.Subject}
                          </Typography>
                        </Link>
                      </DetailRow>
                    )}
                  </>
                )}

                {/* AMM Create Details */}
                {TransactionType === 'AMMCreate' && (
                  <>
                    {txData.TradingFee !== undefined && (
                      <DetailRow label="Trading Fee">
                        <Typography variant="body1">{txData.TradingFee / 1000}%</Typography>
                      </DetailRow>
                    )}
                    {Asset && (
                      <DetailRow label="Asset 1">
                        <Typography variant="body1">
                          {Asset.currency === 'XRP' ? 'XRP' : `${normalizeCurrencyCode(Asset.currency)} (${Asset.issuer?.slice(0, 8)}...)`}
                        </Typography>
                      </DetailRow>
                    )}
                    {Asset2 && (
                      <DetailRow label="Asset 2">
                        <Typography variant="body1">
                          {Asset2.currency === 'XRP' ? 'XRP' : `${normalizeCurrencyCode(Asset2.currency)} (${Asset2.issuer?.slice(0, 8)}...)`}
                        </Typography>
                      </DetailRow>
                    )}
                  </>
                )}

                {displayExchange && isSuccess && (
                  <>
                    <DetailRow label="Sold">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1,
                          py: 0.5,
                          backgroundColor: alpha('#ef4444', 0.08),
                          border: `1px solid ${alpha('#ef4444', 0.15)}`,
                          borderRadius: '6px',
                          width: 'fit-content'
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 500, fontSize: '13px' }}>
                          {formatDecimal(new Decimal(displayExchange.paid.value))}
                        </Typography>
                        {displayExchange.paid.rawCurrency ? (
                          <TokenDisplay
                            slug={`${displayExchange.paid.issuer}-${displayExchange.paid.rawCurrency}`}
                            currency={displayExchange.paid.currency}
                            rawCurrency={displayExchange.paid.rawCurrency}
                            variant="body2"
                          />
                        ) : (
                          <XrpDisplay variant="body2" showText={true} />
                        )}
                      </Box>
                    </DetailRow>
                    <DetailRow label="Received">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1,
                          py: 0.5,
                          backgroundColor: alpha('#10b981', 0.08),
                          border: `1px solid ${alpha('#10b981', 0.15)}`,
                          borderRadius: '6px',
                          width: 'fit-content'
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 500, fontSize: '13px' }}>
                          {formatDecimal(new Decimal(displayExchange.got.value))}
                        </Typography>
                        {displayExchange.got.rawCurrency ? (
                          <TokenDisplay
                            slug={`${displayExchange.got.issuer}-${displayExchange.got.rawCurrency}`}
                            currency={displayExchange.got.currency}
                            rawCurrency={displayExchange.got.rawCurrency}
                            variant="body2"
                          />
                        ) : (
                          <XrpDisplay variant="body2" showText={true} />
                        )}
                      </Box>
                    </DetailRow>
                    <DetailRow label="Rate">
                      {(() => {
                        try {
                          const paidValue = new Decimal(displayExchange.paid.value);
                          const gotValue = new Decimal(displayExchange.got.value);

                          if (paidValue.isZero() || gotValue.isZero()) {
                            return (
                              <Typography variant="body2" sx={{ fontSize: '13px', color: alpha(theme.palette.text.primary, 0.6) }}>
                                N/A
                              </Typography>
                            );
                          }

                          const rate = paidValue.div(gotValue);
                          return (
                            <Typography variant="body2" sx={{ fontSize: '13px' }}>
                              1 {displayExchange.got.currency} = {rate.toFixed(rate.lt(0.000001) ? 15 : rate.lt(0.01) ? 10 : 6)} {displayExchange.paid.currency}
                            </Typography>
                          );
                        } catch (error) {
                          return (
                            <Typography variant="body2" sx={{ fontSize: '13px', color: alpha(theme.palette.text.primary, 0.6) }}>
                              N/A
                            </Typography>
                          );
                        }
                      })()}
                    </DetailRow>
                  </>
                )}

                {flagExplanations.length > 0 && (
                  <DetailRow label="Flags">
                    <Stack spacing={0.5}>
                      {TransactionType === 'Payment' ? (
                        flagExplanations.map((flag) => (
                          <Chip
                            key={flag.title}
                            label={flag.title}
                            size="small"
                            sx={{
                              fontSize: '10px',
                              height: '18px',
                              px: 0.5,
                              backgroundColor: alpha('#f59e0b', 0.08),
                              color: '#f59e0b',
                              border: `1px solid ${alpha('#f59e0b', 0.15)}`,
                              fontWeight: 400,
                              width: 'fit-content'
                            }}
                          />
                        ))
                      ) : (
                        flagExplanations.map((text) => (
                          <Chip
                            key={text}
                            label={text}
                            size="small"
                            sx={{
                              fontSize: '10px',
                              height: '18px',
                              px: 0.5,
                              backgroundColor: alpha('#f59e0b', 0.08),
                              color: '#f59e0b',
                              border: `1px solid ${alpha('#f59e0b', 0.15)}`,
                              fontWeight: 400,
                              width: 'fit-content'
                            }}
                          />
                        ))
                      )}
                    </Stack>
                  </DetailRow>
                )}

                {Memos && Memos.length > 0 && (
                  <DetailRow label="Memo">
                    <Stack spacing={0.5}>
                      {Memos.map((memo) => {
                        const decodeMemoHex = (hexString) => {
                          if (!hexString) return null;
                          try {
                            const bytes = [];
                            for (let i = 0; i < hexString.length; i += 2) {
                              bytes.push(parseInt(hexString.substr(i, 2), 16));
                            }
                            return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
                          } catch (err) {
                            return hexString;
                          }
                        };

                        const memoType = memo.Memo.MemoType && decodeMemoHex(memo.Memo.MemoType);
                        const memoData = memo.Memo.MemoData && decodeMemoHex(memo.Memo.MemoData);
                        const memoKey = `${memo.Memo.MemoType || ''}-${memo.Memo.MemoData || ''}`;

                        return (
                          <Typography key={memoKey} variant="body2" sx={{ fontSize: '13px', wordBreak: 'break-all' }}>
                            {[memoType, memoData].filter(Boolean).join(': ')}
                          </Typography>
                        );
                      })}
                    </Stack>
                  </DetailRow>
                )}
              </Stack>
            </Box>
          </Grid>

          {/* Affected Accounts */}
          {balanceChanges.length > 0 && isSuccess && (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 2,
                  background: alpha(theme.palette.divider, 0.04),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: '8px'
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 400, fontSize: '14px', mb: 1.5, pb: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  Balance Changes ({balanceChanges.length})
                </Typography>
                <Stack spacing={1.5}>
                  {balanceChanges.map(({ account, changes }) => (
                    <Box
                      key={account}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        flexWrap: 'wrap'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '300px', flex: 1 }}>
                        <AccountAvatar account={account} />
                        <Link href={`/profile/${account}`} passHref>
                          <Typography
                            component="a"
                            variant="body2"
                            sx={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              fontFamily: 'monospace',
                              fontSize: '13px',
                              wordBreak: 'break-all',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {account}
                          </Typography>
                        </Link>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        {changes.map((change) => {
                          const isPositive = new Decimal(change.value).isPositive();
                          const sign = isPositive ? '+' : '';
                          const color = isPositive ? '#10b981' : '#ef4444';
                          const changeKey = `${change.currency}-${change.issuer || 'XRP'}-${change.value}`;

                          return (
                            <Box
                              key={changeKey}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1,
                                py: 0.5,
                                backgroundColor: alpha(color, 0.08),
                                border: `1px solid ${alpha(color, 0.15)}`,
                                borderRadius: '6px'
                              }}
                            >
                              <Typography variant="body2" sx={{ color, fontWeight: 500, fontSize: '13px' }}>
                                {sign}{formatDecimal(new Decimal(change.value))}
                              </Typography>
                              {change.currency === 'XRP' ? (
                                <XrpDisplay variant="body2" showText={true} />
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
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>
          )}


          {/* Transaction Link */}
          <Grid size={{ xs: 12 }}>
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
                  <IconButton onClick={copyUrlToClipboard} size="small" aria-label="Copy URL">
                    <FileCopyOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </Grid>
        </Grid>

        {/* Technical Details */}
        <Box
          sx={{
            mt: 2,
            p: 2,
            background: alpha(theme.palette.divider, 0.04),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: '8px'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 400, fontSize: '14px', mb: 1.5, pb: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            Technical Details
          </Typography>
          <Stack spacing={1.5}>
            <DetailRow label="Flags">
              <Chip
                label={Flags}
                size="small"
                sx={{
                  fontSize: '10px',
                  height: '18px',
                  px: 0.5,
                  backgroundColor: alpha('#4285f4', 0.06),
                  color: '#4285f4',
                  border: `1px solid ${alpha('#4285f4', 0.15)}`,
                  fontWeight: 400
                }}
              />
            </DetailRow>
            <DetailRow label="Sequence">
              <Typography variant="body2" sx={{ fontSize: '13px' }}>#{Sequence}</Typography>
            </DetailRow>
            {TransactionType === 'OfferCreate' && (
              <DetailRow label="CTID">
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '13px' }}>
                  {ctid}
                </Typography>
              </DetailRow>
            )}
            <DetailRow label="Last Ledger">
              <Typography variant="body2" sx={{ fontSize: '13px' }}>
                #{LastLedgerSequence} ({LastLedgerSequence - ledger_index} ledgers)
              </Typography>
            </DetailRow>
            {SourceTag && (
              <DetailRow label="Source Tag">
                <Typography variant="body2" sx={{ fontSize: '13px' }}>{SourceTag}</Typography>
              </DetailRow>
            )}
          </Stack>
        </Box>

        {/* Raw Transaction Data */}
        <Box
          sx={{
            mt: 2,
            p: 2,
            background: alpha(theme.palette.divider, 0.04),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: '8px'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 400, fontSize: '14px', mb: 1.5, pb: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            Raw Transaction Data
          </Typography>
          <Box sx={{ mt: 1.5 }}>
            <JsonViewer data={rawData} />
          </Box>
        </Box>

        {/* Transaction Metadata */}
        <Box
          sx={{
            mt: 2,
            p: 2,
            background: alpha(theme.palette.divider, 0.04),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: '8px'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 400, fontSize: '14px', mb: 1.5, pb: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            Transaction Metadata
          </Typography>
          <Box sx={{ mt: 1.5 }}>
            <JsonViewer data={meta} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const TxPage = ({ txData, error }) => {
  const router = useRouter();
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

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
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 py-8 max-w-screen-lg mx-auto w-full px-4">
        {/* NOTE: This file contains extensive MUI components that need manual migration to Tailwind.
            The imports have been updated, but the component JSX still uses many MUI components like:
            Box, Typography, Paper, Card, CardContent, Stack, Grid, Chip, Avatar, Tooltip, etc.
            This is a very large and complex file (4000+ lines) with many sub-components.

            Key areas to migrate:
            - Replace all Box with div + Tailwind classes
            - Replace Typography with appropriate HTML tags (h1-h6, p, span) + text-* classes
            - Replace Card/Paper with div + rounded-xl + border-[1.5px] styling
            - Replace MUI icons with Lucide React icons (already imported)
            - Replace alpha() color function calls with Tailwind opacity classes (e.g., text-white/60)
            - Replace theme.palette references with isDark conditional classes
            - Sub-components like JsonViewer, DetailRow, TokenTooltipContent, etc. all need migration

            See pages/nft-traders.js for a complete migration example.
        */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal mb-2">
            Transaction Details
          </Typography>
        </Box>
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <TransactionDetails txData={txData} />
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
    // Set cache headers for browser caching
    context.res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return {
      props: {
        txData: cachedData,
        error: null
      }
    };
  }

  const xrplNodes = [
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
            ledger_index: 'validated'
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
    //     meta.delivered_amount.value = new Decimal(deliveredAmount.value).toString();
    //   }
    // }

    const txData = { ...rest, meta };

    // Cache the successful response
    txCache.set(hash, txData);

    // Set cache headers for browser caching
    context.res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

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
