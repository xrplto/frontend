import { useRouter } from 'next/router';
import axios from 'axios';
import { useState, useMemo, useEffect, useContext } from 'react';
import { LRUCache } from 'lru-cache';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { Copy, ArrowLeftRight, Wallet, TrendingUp, AlertCircle, Home, Search, Share2, Send, Link as LinkIcon, FileText, Scale, Settings, Code } from 'lucide-react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Link from 'next/link';
import { rippleTimeToISO8601, dropsToXrp, normalizeCurrencyCode, getNftCoverUrl } from 'src/utils/parseUtils';
import { formatDistanceToNow } from 'date-fns';
import Decimal from 'decimal.js-light';
import CryptoJS from 'crypto-js';
import { getHashIcon } from 'src/utils/formatters';

function formatDecimal(decimal, decimalPlaces = null) {
  let str = decimalPlaces !== null ? decimal.toFixed(decimalPlaces) : decimal.toString();
  // Only add commas to integer part, not decimal part
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// Minimal MUI shims for legacy compatibility
const alpha = (color, opacity) => {
  if (!color) return `rgba(0,0,0,${opacity})`;
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  }
  return color;
};

const useTheme = () => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  return {
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: { main: '#4285f4' },
      success: { main: '#10b981' },
      error: { main: '#ef4444' },
      text: { primary: isDark ? '#fff' : '#000', secondary: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' },
      background: { default: isDark ? '#000' : '#fff', paper: isDark ? '#111' : '#fff' },
      divider: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    }
  };
};

const sx2style = (sx) => {
  if (!sx) return {};
  const s = {}, u = 8;
  for (const [k, v] of Object.entries(sx)) {
    if (v === undefined || typeof v === 'object') continue;
    if (k === 'p') s.padding = `${v * u}px`;
    else if (k === 'pt') s.paddingTop = `${v * u}px`;
    else if (k === 'pb') s.paddingBottom = `${v * u}px`;
    else if (k === 'px') { s.paddingLeft = s.paddingRight = `${v * u}px`; }
    else if (k === 'py') { s.paddingTop = s.paddingBottom = `${v * u}px`; }
    else if (k === 'mt') s.marginTop = `${v * u}px`;
    else if (k === 'mb') s.marginBottom = `${v * u}px`;
    else if (k === 'mr') s.marginRight = `${v * u}px`;
    else if (k === 'ml') s.marginLeft = `${v * u}px`;
    else if (k === 'mx') { s.marginLeft = s.marginRight = `${v * u}px`; }
    else if (k === 'my') { s.marginTop = s.marginBottom = `${v * u}px`; }
    else if (k === 'gap') s.gap = typeof v === 'number' ? `${v * u}px` : v;
    else if (k === 'bgcolor') s.backgroundColor = v;
    else s[k] = v;
  }
  return s;
};

const Box = ({ children, sx, component: C = 'div', ...p }) => <C style={sx2style(sx)} {...p}>{children}</C>;
const Typography = ({ children, variant, component: C, sx, ...p }) => { const Tag = C || (variant?.startsWith('h') ? variant : 'span'); return <Tag style={sx2style(sx)} {...p}>{children}</Tag>; };
const Card = ({ children, sx, ...p }) => <div style={{ borderRadius: '12px', ...sx2style(sx) }} {...p}>{children}</div>;
const CardContent = ({ children, sx, ...p }) => <div style={{ padding: '16px', ...sx2style(sx) }} {...p}>{children}</div>;
const Chip = ({ label, sx, ...p }) => <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', padding: '2px 8px', fontSize: '12px', ...sx2style(sx) }} {...p}>{label}</span>;
const Stack = ({ children, direction = 'column', spacing = 1, alignItems, sx, ...p }) => <div style={{ display: 'flex', flexDirection: direction === 'row' ? 'row' : 'column', gap: `${spacing * 8}px`, alignItems, ...sx2style(sx) }} {...p}>{children}</div>;
const Avatar = ({ src, children, sx, onError, ...p }) => <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0e0e0', ...sx2style(sx) }} {...p}>{src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={onError} /> : children}</div>;
const Tooltip = ({ children, title, onOpen, ...p }) => <span title={typeof title === 'string' ? title : ''} onMouseEnter={onOpen} {...p}>{children}</span>;
const IconButton = ({ children, onClick, sx, ...p }) => <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'inline-flex', ...sx2style(sx) }} onClick={onClick} {...p}>{children}</button>;
const Divider = ({ sx, ...p }) => <hr style={{ border: 'none', borderTop: '1px solid rgba(128,128,128,0.2)', margin: '8px 0', ...sx2style(sx) }} {...p} />;
const FileCopyOutlinedIcon = ({ sx }) => <Copy size={sx?.fontSize ? parseInt(sx.fontSize) : 16} />;
const SwapHorizIcon = () => <ArrowLeftRight size={18} />;
const TrendingUpIcon = () => <TrendingUp size={18} />;
const AccountBalanceWalletIcon = () => <Wallet size={18} />;
const Grid = ({ children, container, spacing = 0, size, sx, ...p }) => {
  if (container) return <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${spacing * 8}px`, ...sx2style(sx) }} {...p}>{children}</div>;
  const xs = size?.xs || 12, md = size?.md;
  const width = md ? undefined : `${(xs / 12) * 100}%`;
  return <div style={{ flex: md ? `0 0 ${(md / 12) * 100}%` : `0 0 ${width}`, maxWidth: md ? `${(md / 12) * 100}%` : width, ...sx2style(sx) }} {...p}>{children}</div>;
};

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

// Parse date from either ISO string (xrpscan) or ripple epoch (raw XRPL)
const parseTransactionDate = (date) => {
  if (!date) return null;
  if (typeof date === 'string') return new Date(date);
  if (typeof date === 'number') {
    const iso = rippleTimeToISO8601(date);
    return iso ? new Date(iso) : null;
  }
  return null;
};

// Helper to get NFT image with fallbacks
const getNftImage = (nft) => {
  if (!nft) return null;
  // Try getNftCoverUrl first
  const coverUrl = getNftCoverUrl(nft, 'medium', 'image');
  if (coverUrl) return coverUrl;
  // Fallback to meta.image with IPFS handling
  const metaImage = nft.meta?.image;
  if (metaImage) {
    if (metaImage.startsWith('ipfs://')) {
      const path = metaImage.replace('ipfs://', '');
      return `https://ipfs.io/ipfs/${encodeURIComponent(path)}`;
    }
    return metaImage;
  }
  return null;
};

// Safe hex to UTF-8 decode with error handling
const safeHexDecode = (hex) => {
  if (!hex) return null;
  try {
    return CryptoJS.enc.Hex.parse(hex).toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
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
const JsonViewer = ({ data, isDark: isDarkProp }) => {
  const { themeName } = useContext(AppContext);
  const isDark = isDarkProp ?? themeName === 'XrplToDarkTheme';
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);

  const copyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightJson = (json) => {
    return json
      .replace(/(".*?"):/g, '<span style="color: #4285f4;">$1</span>:')
      .replace(/: (".*?")/g, ': <span style="color: #10b981;">$1</span>')
      .replace(/: (true|false)/g, ': <span style="color: #f59e0b;">$1</span>')
      .replace(/: (null)/g, ': <span style="color: #ef4444;">$1</span>')
      .replace(/: (-?\d+\.?\d*)/g, ': <span style="color: #8b5cf6;">$1</span>');
  };

  return (
    <div className="relative">
      <button
        onClick={copyJson}
        title={copied ? 'Copied!' : 'Copy JSON'}
        className={cn(
          "absolute top-2 right-2 z-10 p-2 rounded-full transition-colors",
          isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"
        )}
      >
        <Copy size={14} />
      </button>
      <pre
        className={cn(
          "font-mono text-xs leading-relaxed p-4 rounded-md whitespace-pre-wrap break-words",
          isDark ? "bg-white/[0.02] text-white/90" : "bg-gray-100 text-gray-800"
        )}
        dangerouslySetInnerHTML={{ __html: highlightJson(jsonString) }}
      />
    </div>
  );
};

const DetailRow = ({ label, children, index = 0 }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const isOdd = index % 2 === 1;

  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-3",
      isOdd && (isDark ? "bg-white/[0.02]" : "bg-gray-50/50")
    )}>
      <span className={cn("text-[13px] min-w-[140px]", isDark ? "text-white/50" : "text-gray-500")}>{label}</span>
      <div className={cn("flex-1 text-right text-[13px]", isDark ? "text-white/90" : "text-gray-800")}>{children}</div>
    </div>
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
        component="span"
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

const TransactionSummaryCard = ({ txData, activeTab, setActiveTab, aiExplanation, aiLoading, onExplainWithAI, onCloseAI, swapInfo }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const { hash, TransactionType, Account, meta, date, ledger_index, Fee, Flags } = txData;
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const txUrl = `https://xrpl.to/tx/${hash}`;
  const shareText = `Check out this transaction on XRPL: ${txUrl}`;

  const XIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  const TelegramIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>;
  const DiscordIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>;

  const shareOptions = [
    { name: 'X', icon: <XIcon />, url: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}` },
    { name: 'Telegram', icon: <TelegramIcon />, url: `https://t.me/share/url?url=${encodeURIComponent(txUrl)}&text=${encodeURIComponent('Check out this transaction on XRPL')}` },
    { name: 'Discord', icon: <DiscordIcon />, action: () => { navigator.clipboard.writeText(shareText); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); } },
    { name: 'Copy', icon: <LinkIcon size={14} />, action: () => { navigator.clipboard.writeText(shareText); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); } }
  ];

  const isSuccess = meta?.TransactionResult === 'tesSUCCESS';
  const description = getTransactionDescription(txData);
  const parsedDate = parseTransactionDate(date);
  const timeAgo = parsedDate && !isNaN(parsedDate.getTime()) ? formatDistanceToNow(parsedDate) : null;
  const dateStr = parsedDate && !isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })
    : null;

  const copyHash = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'summary', label: 'SUMMARY', icon: <FileText size={12} /> },
    { id: 'balances', label: 'BALANCES', icon: <Scale size={12} /> },
    { id: 'technical', label: 'TECHNICAL', icon: <Settings size={12} /> },
    { id: 'raw', label: 'RAW', icon: <Code size={12} /> }
  ];

  const isSwap = swapInfo && swapInfo.paid && swapInfo.got;

  return (
    <div className={cn(
      "rounded-xl mb-4 overflow-hidden",
      isDark ? "bg-transparent" : "bg-white"
    )} style={{
      border: `1.5px solid ${isDark ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.08)'}`
    }}>
      {/* Header bar */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3",
        isDark ? "border-b border-[rgba(59,130,246,0.12)]" : "border-b border-[rgba(0,0,0,0.08)]"
      )}>
        <div className="flex items-center gap-3">
          <span className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center text-sm font-medium",
            isSuccess ? "bg-[#22c55e] text-white" : "bg-[#ef4444] text-white"
          )}>
            {isSuccess ? '✓' : '✗'}
          </span>
          <span className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wide",
            isDark ? "bg-[rgba(59,130,246,0.08)] text-white/80 border border-[rgba(59,130,246,0.15)]" : "bg-gray-50 text-gray-600 border border-gray-200"
          )}>
            <ArrowLeftRight size={12} />
            {isSwap ? 'Swap' : 'Transaction'}
          </span>
          {/* Swap Summary Inline */}
          {isSwap && isSuccess && (
            <div className="flex items-center gap-2 ml-2">
              <span className={cn("text-[13px] font-mono", isDark ? "text-white/50" : "text-gray-500")}>
                {Account.slice(0, 4)}..{Account.slice(-3)}
              </span>
              <span className={isDark ? "text-white/30" : "text-gray-400"}>→</span>
              <span className="text-[#ef4444] text-[14px] font-medium font-mono">
                -{formatDecimal(new Decimal(swapInfo.paid.value))}
              </span>
              <span className={cn("text-[13px]", isDark ? "text-white/70" : "text-gray-600")}>
                {swapInfo.paid.currency}
              </span>
              <span className={isDark ? "text-white/30" : "text-gray-400"}>→</span>
              <span className="text-[#22c55e] text-[14px] font-medium font-mono">
                +{formatDecimal(new Decimal(swapInfo.got.value))}
              </span>
              <span className={cn("text-[13px]", isDark ? "text-white/70" : "text-gray-600")}>
                {swapInfo.got.currency}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShareOpen(!shareOpen)}
              title="Share"
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-lg border transition-all duration-200",
                isDark
                  ? "border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06]"
                  : "border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100"
              )}
            >
              <Share2 size={14} className={isDark ? "text-white/50" : "text-gray-500"} />
            </button>
            {shareOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShareOpen(false)} />
                <div className={cn(
                  "absolute right-0 top-11 z-50 rounded-lg border p-1.5 min-w-[140px]",
                  isDark ? "bg-[#111] border-white/10" : "bg-white border-gray-200 shadow-lg"
                )}>
                  {shareOptions.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => {
                        if (opt.url) window.open(opt.url, '_blank');
                        else opt.action();
                        setShareOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded text-[13px] text-left",
                        isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      {opt.icon}
                      <span>{opt.name === 'Copy' && linkCopied ? 'Copied!' : opt.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {(aiExplanation || aiLoading) ? (
            <button
              onClick={onCloseAI}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          ) : (
            <button
              onClick={onExplainWithAI}
              className="group flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#8b5cf6]/25 hover:border-[#8b5cf6]/40 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/15 transition-all duration-200"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-[#a78bfa] group-hover:text-[#c4b5fd] transition-colors">
                <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor"/>
                <path d="M19 16L19.5 18.5L22 19L19.5 19.5L19 22L18.5 19.5L16 19L18.5 18.5L19 16Z" fill="currentColor"/>
              </svg>
              <span className="text-[12px] text-[#c4b5fd] group-hover:text-[#ddd6fe] transition-colors">Explain with AI</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Loading State */}
      {aiLoading && (
        <div className={cn(
          "px-6 py-5 relative overflow-hidden",
          isDark ? "border-b border-[rgba(59,130,246,0.12)]" : "border-b border-[rgba(0,0,0,0.08)]"
        )}>
          <style jsx>{`
            @keyframes scanline {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
            @keyframes glow {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.8; }
            }
            @keyframes pulse-bar {
              0%, 100% { opacity: 0.15; }
              50% { opacity: 0.4; }
            }
          `}</style>
          <div className="space-y-2.5">
            {[92, 78, 95, 65, 82, 100, 55, 70].map((width, i) => (
              <div
                key={i}
                className="h-[6px] rounded-sm overflow-hidden relative"
                style={{ width: `${width}%` }}
              >
                <div
                  className="absolute inset-0 rounded-sm"
                  style={{
                    background: i === 5 ? 'rgba(139,92,246,0.3)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    animation: `pulse-bar 2s ease-in-out infinite`,
                    animationDelay: `${i * 0.15}s`
                  }}
                />
                <div
                  className="absolute inset-0 rounded-sm"
                  style={{
                    background: i === 5
                      ? 'linear-gradient(90deg, transparent, #8b5cf6, transparent)'
                      : `linear-gradient(90deg, transparent, ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}, transparent)`,
                    animation: `scanline 1.5s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              </div>
            ))}
          </div>
          <div className={cn("mt-5 text-[13px] font-mono flex items-center gap-2", isDark ? "text-white/40" : "text-gray-400")}>
            <span
              className="inline-block w-2 h-2 rounded-full bg-[#8b5cf6]"
              style={{ animation: 'glow 1s ease-in-out infinite' }}
            />
            Analyzing
            <span className="inline-flex tracking-widest">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  style={{
                    animation: 'glow 1s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`
                  }}
                >.</span>
              ))}
            </span>
          </div>
        </div>
      )}

      {/* AI Explanation Panel */}
      {aiExplanation && !aiLoading && (() => {
        // Parse summary - handle both parsed object and raw/malformed JSON formats
        let summaryText = 'AI analysis complete.';
        let keyPoints = [];

        const raw = aiExplanation.summary?.raw || aiExplanation.summary;
        if (typeof raw === 'string') {
          // Extract summary from potentially malformed JSON
          const summaryMatch = raw.match(/"summary"\s*:\s*"([^"]+)"/);
          if (summaryMatch) summaryText = summaryMatch[1];
          // Extract keyPoints array
          const keyPointsMatch = raw.match(/"keyPoints"\s*:\s*\[([^\]]*)/);
          if (keyPointsMatch) {
            const points = keyPointsMatch[1].match(/"([^"]+)"/g);
            if (points) keyPoints = points.map(p => p.replace(/"/g, ''));
          }
        } else if (typeof raw === 'object' && raw?.summary) {
          summaryText = raw.summary;
          keyPoints = raw.keyPoints || [];
        }

        return (
        <div className={cn(
          "px-6 py-5",
          isDark ? "border-b border-[rgba(139,92,246,0.12)]" : "border-b border-[rgba(0,0,0,0.08)]"
        )}>
          {/* Title with summary */}
          <h3 className="text-[15px] mb-5">
            <span className="text-[#a78bfa] font-medium">{aiExplanation.extracted?.type || 'Transaction'}:</span>{' '}
            <span className={isDark ? "text-white" : "text-gray-900"}>
              {summaryText}
            </span>
          </h3>

          {/* Key Points */}
          {keyPoints.length > 0 && (
            <div className="mb-5">
              <h4 className={cn("text-[11px] font-medium uppercase tracking-wider mb-3", isDark ? "text-white/60" : "text-gray-500")}>
                Key Points
              </h4>
              <ul className="space-y-2">
                {keyPoints.map((point, idx) => (
                  <li key={idx} className={cn("flex items-start gap-2 text-[13px] font-mono", isDark ? "text-white/80" : "text-gray-700")}>
                    <span className="text-[#8b5cf6]">•</span>
                    <span>{typeof point === 'string' ? point : JSON.stringify(point)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Information */}
          {aiExplanation.extracted?.platform && (() => {
            const platformUrl = Object.values(KNOWN_SOURCE_TAGS).find(t => t.name === aiExplanation.extracted.platform)?.url;
            return (
              <div>
                <h4 className={cn("text-[11px] font-medium uppercase tracking-wider mb-2", isDark ? "text-white/60" : "text-gray-500")}>
                  Additional Information
                </h4>
                <p className={cn("text-[13px]", isDark ? "text-white/70" : "text-gray-600")}>
                  Transaction via {platformUrl ? (
                    <a href={platformUrl} target="_blank" rel="noopener noreferrer" className="text-[#a78bfa] hover:underline">{aiExplanation.extracted.platform}</a>
                  ) : (
                    <span className="text-[#a78bfa]">{aiExplanation.extracted.platform}</span>
                  )}
                </p>
              </div>
            );
          })()}
        </div>
        );
      })()}

      {/* Transaction type */}
      <div className={cn(
        "px-4 py-4 text-center",
        isDark ? "border-b border-[rgba(59,130,246,0.12)]" : "border-b border-[rgba(0,0,0,0.08)]"
      )}>
        <span className={cn("text-[14px]", isDark ? "text-white/60" : "text-gray-500")}>
          {description.title}
        </span>
      </div>

      {/* Tabs */}
      <div className={cn(
        "flex items-center gap-2 px-4 py-3",
        isDark ? "border-b border-[rgba(59,130,246,0.12)]" : "border-b border-[rgba(0,0,0,0.08)]"
      )}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors border",
              activeTab === tab.id
                ? isDark
                  ? "bg-white/5 text-[#f97316] border-[#f97316]/30"
                  : "bg-orange-50 text-[#f97316] border-[#f97316]/30"
                : isDark
                  ? "text-white/60 border-white/10 hover:border-white/20"
                  : "text-gray-500 border-gray-200 hover:border-gray-300"
            )}
          >
            <span className={activeTab === tab.id ? "text-[#f97316]" : ""}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Info grid */}
      <div className={cn(
        "grid grid-cols-3",
        isDark ? "divide-x divide-[rgba(59,130,246,0.12)]" : "divide-x divide-[rgba(0,0,0,0.08)]"
      )}>
        <div className="px-4 py-3">
          <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-400")}>
            Signature
          </div>
          <div className="flex items-center gap-1.5">
            <code className={cn("text-[13px] font-mono", isDark ? "text-white/80" : "text-gray-700")}>
              {hash.slice(0, 4)}...{hash.slice(-4)}
            </code>
            <button onClick={copyHash} className={cn("p-0.5 rounded transition-colors", isDark ? "text-white/40 hover:text-[#3b82f6]" : "text-gray-400 hover:text-[#3b82f6]")}>
              <Copy size={12} />
            </button>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-400")}>
            Time
          </div>
          <div className={cn("text-[13px]", isDark ? "text-white/80" : "text-gray-700")}>
            {timeAgo ? <><span className="text-[#3b82f6]">{timeAgo} ago</span> {dateStr && <span className={isDark ? "text-white/50" : "text-gray-500"}>({dateStr})</span>}</> : 'Unknown'}
          </div>
        </div>
        <div className="px-4 py-3">
          <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-400")}>
            Ledger
          </div>
          <div className={cn("text-[13px] font-mono", isDark ? "text-white/80" : "text-gray-700")}>
            #{ledger_index?.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

const TransactionDetails = ({ txData }) => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

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

  const explainWithAI = async () => {
    if (aiLoading || aiExplanation) return;
    setAiLoading(true);
    try {
      const response = await axios.get(`https://api.xrpl.to/api/ai/${hash}`);
      if (response.data) {
        setAiExplanation(response.data);
      }
    } catch (err) {
      console.error('AI explanation failed:', err);
      setAiExplanation({
        summary: { summary: 'Unable to generate AI explanation at this time.', keyPoints: [] }
      });
    } finally {
      setAiLoading(false);
    }
  };

  const closeAI = () => {
    setAiExplanation(null);
    setAiLoading(false);
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
    const parsedDate = parseTransactionDate(date);
    const rawTxData = {
      ...txData,
      // Add human-readable timestamp
      date_human: parsedDate ? parsedDate.toISOString() : date,
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
            `https://api.xrpl.to/api/nft/${acceptedOfferDetails.nftokenID}`
          );
          if (response.data?.NFTokenID) {
            setAcceptedNftInfo(response.data);
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
          const response = await axios.get(`https://api.xrpl.to/api/nft/${NFTokenID}`);
          if (response.data?.NFTokenID) {
            setOfferNftInfo(response.data);
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
          const response = await axios.get(`https://api.xrpl.to/api/nft/${meta.nftoken_id}`);
          if (response.data?.NFTokenID) {
            setMintedNftInfo(response.data);
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
            .get(`https://api.xrpl.to/api/nft/${offer.NFTokenID}`)
            .then((response) => {
              if (response.data?.NFTokenID) {
                setCancelledNftInfo((prev) => ({
                  ...prev,
                  [offer.NFTokenID]: response.data
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
    // For self-conversion, get actual amounts from balance changes when available
    // Balance changes already have XRP values converted (not in drops)
    const paidFromChanges = initiatorChanges?.changes?.find(c => {
      const val = new Decimal(c.value);
      if (typeof SendMax === 'string') {
        return c.currency === 'XRP' && val.isNegative();
      }
      return c.currency === normalizeCurrencyCode(SendMax.currency) && val.isNegative();
    });

    const gotFromChanges = initiatorChanges?.changes?.find(c => {
      const val = new Decimal(c.value);
      if (typeof deliveredAmount === 'string') {
        return c.currency === 'XRP' && val.isPositive();
      }
      return c.currency === normalizeCurrencyCode(deliveredAmount.currency) && val.isPositive();
    });

    if (typeof deliveredAmount === 'string') {
      // User sent token and received XRP
      const actualPaidValue = paidFromChanges
        ? new Decimal(paidFromChanges.value).abs().toString()
        : SendMax.value;
      // Use balance change for XRP (already in XRP, not drops)
      const actualGotValue = gotFromChanges
        ? new Decimal(gotFromChanges.value).toString()
        : dropsToXrp(deliveredAmount);
      conversionExchange = {
        paid: {
          value: actualPaidValue,
          currency: normalizeCurrencyCode(SendMax.currency),
          rawCurrency: SendMax.currency,
          issuer: SendMax.issuer
        },
        got: {
          value: actualGotValue,
          currency: 'XRP'
        }
      };
    } else if (typeof deliveredAmount === 'object' && deliveredAmount.value) {
      // User sent SendMax (could be XRP or token) and received token
      if (typeof SendMax === 'string') {
        // User sent XRP and received token
        const actualPaidValue = paidFromChanges
          ? new Decimal(paidFromChanges.value).abs().toString()
          : dropsToXrp(SendMax);
        const actualGotValue = gotFromChanges
          ? new Decimal(gotFromChanges.value).toString()
          : deliveredAmount.value;
        conversionExchange = {
          paid: {
            value: actualPaidValue,
            currency: 'XRP'
          },
          got: {
            value: actualGotValue,
            currency: normalizeCurrencyCode(deliveredAmount.currency),
            rawCurrency: deliveredAmount.currency,
            issuer: deliveredAmount.issuer
          }
        };
      } else {
        // User sent token and received different token
        const actualPaidValue = paidFromChanges
          ? new Decimal(paidFromChanges.value).abs().toString()
          : SendMax.value;
        const actualGotValue = gotFromChanges
          ? new Decimal(gotFromChanges.value).toString()
          : deliveredAmount.value;
        conversionExchange = {
          paid: {
            value: actualPaidValue,
            currency: normalizeCurrencyCode(SendMax.currency),
            rawCurrency: SendMax.currency,
            issuer: SendMax.issuer
          },
          got: {
            value: actualGotValue,
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

  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <div>
      <TransactionSummaryCard
        txData={txData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        aiExplanation={aiExplanation}
        aiLoading={aiLoading}
        onExplainWithAI={explainWithAI}
        onCloseAI={closeAI}
        swapInfo={displayExchange}
      />

      {/* SUMMARY Tab */}
      {activeTab === 'summary' && (
        <div className={cn(
          "rounded-xl overflow-hidden",
          isDark ? "bg-transparent" : "bg-white"
        )} style={{
          border: `1.5px solid ${isDark ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.08)'}`
        }}>
          <div className={cn(
            "px-4 py-3",
            isDark ? "border-b border-[rgba(59,130,246,0.12)]" : "border-b border-[rgba(0,0,0,0.08)]"
          )}>
            <span className={cn(
              "text-[11px] font-medium uppercase tracking-wider",
              isDark ? "text-white/40" : "text-gray-400"
            )}>
              Details
            </span>
          </div>

          <div>
            {/* Main Transaction Details */}
            <DetailRow label="Type" index={0}>
              <span className="px-2 py-0.5 rounded text-[12px] bg-primary/10 text-primary border border-primary/20">
                {TransactionType === 'OfferCreate'
                  ? `${Flags & 0x00080000 ? 'Sell' : 'Buy'} Order`
                  : TransactionType === 'NFTokenCreateOffer'
                    ? `NFT ${Flags & 1 ? 'Sell' : 'Buy'} Offer`
                        : TransactionType === 'OfferCancel' && cancelledOffer
                          ? `Cancel ${cancelledOffer.Flags & 0x00080000 ? 'Sell' : 'Buy'} Order`
                          : isConversion ? 'Swap' : TransactionType}
                  </span>
                </DetailRow>

                <DetailRow label="Timestamp" index={1}>
                  <span className="font-mono">
                    {(() => {
                      const d = parseTransactionDate(date);
                      return d && !isNaN(d.getTime()) ? d.toLocaleString() : 'Unknown';
                    })()}
                  </span>
                </DetailRow>

                {/* Account Information */}
                {TransactionType === 'Payment' && (
                  <>
                    {isConversion && Account === Destination ? (
                      <DetailRow label="Account">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccountAvatar account={Account} />
                          <Link href={`/address/${Account}`} passHref>
                            <Typography
                              component="span"
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
                            <Link href={`/address/${Account}`} passHref>
                              <Typography
                                component="span"
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
                            <Link href={`/address/${Destination}`} passHref>
                              <Typography
                                component="span"
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
                          component="span"
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
                            <Link href={`/address/${LimitAmount.issuer}`} passHref>
                              <Typography
                                component="span"
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
                                    component="span"
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
                                    <Link href={`/address/${offer.Destination}`} passHref>
                                      <Typography
                                        component="span"
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
                                      {getNftImage(nftInfo) && (
                                        <Box
                                          component="img"
                                          src={getNftImage(nftInfo)}
                                          alt={nftInfo.meta?.name || 'NFT Image'}
                                          sx={{
                                            width: '100%',
                                            maxWidth: '220px',
                                            borderRadius: 2
                                          }}
                                        />
                                      )}
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
                        <Link href={`/address/${acceptedOfferDetails.seller}`} passHref>
                          <Typography
                            component="span"
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
                        <Link href={`/address/${acceptedOfferDetails.buyer}`} passHref>
                          <Typography
                            component="span"
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
                    {/* NFT Card */}
                    {nftInfoLoading ? (
                      <DetailRow label="NFT">
                        <Typography>Loading NFT data...</Typography>
                      </DetailRow>
                    ) : acceptedNftInfo ? (
                      <div className={cn(
                        "mx-4 my-3 rounded-xl overflow-hidden",
                        isDark ? "bg-white/[0.02] border border-white/10" : "bg-gray-50 border border-gray-200"
                      )}>
                        <div className="flex flex-col sm:flex-row">
                          {/* NFT Image */}
                          {getNftImage(acceptedNftInfo) && (
                            <div className="sm:w-48 flex-shrink-0">
                              <Link href={`/nft/${acceptedNftInfo.NFTokenID}`}>
                                <img
                                  src={getNftImage(acceptedNftInfo)}
                                  alt={acceptedNftInfo.meta?.name || 'NFT'}
                                  className="w-full sm:w-48 h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                />
                              </Link>
                            </div>
                          )}
                          {/* NFT Details */}
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <Link href={`/nft/${acceptedNftInfo.NFTokenID}`}>
                                  <h3 className={cn(
                                    "text-[15px] font-medium hover:text-[#4285f4] cursor-pointer",
                                    isDark ? "text-white" : "text-gray-900"
                                  )}>
                                    {acceptedNftInfo.meta?.name || 'Unnamed NFT'}
                                  </h3>
                                </Link>
                                {acceptedNftInfo.collection && (
                                  <Link href={`/collection/${acceptedNftInfo.cslug || acceptedNftInfo.collection}`}>
                                    <span className="text-[12px] text-[#4285f4] hover:underline cursor-pointer">
                                      {acceptedNftInfo.collection}
                                    </span>
                                  </Link>
                                )}
                              </div>
                              {typeof acceptedNftInfo.royalty !== 'undefined' && acceptedNftInfo.royalty > 0 && (
                                <span className={cn(
                                  "text-[11px] px-2 py-0.5 rounded",
                                  isDark ? "bg-white/10 text-white/60" : "bg-gray-200 text-gray-600"
                                )}>
                                  {acceptedNftInfo.royalty / 1000}% royalty
                                </span>
                              )}
                            </div>
                            <div className="space-y-2 mt-3">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[11px] uppercase w-16", isDark ? "text-white/40" : "text-gray-400")}>Issuer</span>
                                <div className="flex items-center gap-1">
                                  <AccountAvatar account={acceptedNftInfo.issuer} />
                                  <Link href={`/address/${acceptedNftInfo.issuer}`}>
                                    <span className="text-[12px] text-[#4285f4] hover:underline font-mono">
                                      {acceptedNftInfo.issuer.slice(0, 8)}...{acceptedNftInfo.issuer.slice(-4)}
                                    </span>
                                  </Link>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[11px] uppercase w-16", isDark ? "text-white/40" : "text-gray-400")}>ID</span>
                                <Link href={`/nft/${acceptedNftInfo.NFTokenID}`}>
                                  <span className="text-[11px] text-[#4285f4] hover:underline font-mono">
                                    {acceptedNftInfo.NFTokenID.slice(0, 12)}...{acceptedNftInfo.NFTokenID.slice(-8)}
                                  </span>
                                </Link>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[11px] uppercase w-16", isDark ? "text-white/40" : "text-gray-400")}>Taxon</span>
                                <span className={cn("text-[12px]", isDark ? "text-white/70" : "text-gray-600")}>{acceptedNftInfo.taxon}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <DetailRow label="NFT">
                        <Link href={`/nft/${acceptedOfferDetails.nftokenID}`}>
                          <span className="text-[#4285f4] hover:underline break-all text-[13px] font-mono">
                            {acceptedOfferDetails.nftokenID}
                          </span>
                        </Link>
                      </DetailRow>
                    )}
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
                            {getNftImage(offerNftInfo) && (
                              <Box
                                component="img"
                                src={getNftImage(offerNftInfo)}
                                alt={offerNftInfo.meta?.name || 'NFT Image'}
                                sx={{
                                  width: '100%',
                                  maxWidth: '220px',
                                  borderRadius: 2
                                }}
                              />
                            )}
                          </Grid>
                          <Grid size={{ xs: 12, md: 8 }}>
                            <DetailRow label="NFT" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Link href={`/nft/${offerNftInfo.NFTokenID}`}>
                                <span className="text-[#4285f4] hover:underline break-all">
                                  {offerNftInfo.NFTokenID}
                                </span>
                              </Link>
                            </DetailRow>
                            <DetailRow label="Issuer" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccountAvatar account={offerNftInfo.issuer} />
                                <Link href={`/address/${offerNftInfo.issuer}`}>
                                  <span className="text-[#4285f4] hover:underline">
                                    {offerNftInfo.issuer}
                                  </span>
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
                            component="span"
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
                                <Link href={`/address/${Destination}`} passHref>
                                  <Typography
                                    component="span"
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
                          ) : getNftImage(mintedNftInfo) ? (
                            <Box
                              component="img"
                              src={getNftImage(mintedNftInfo)}
                              alt={mintedNftInfo?.meta?.name || 'NFT Image'}
                              sx={{
                                width: '100%',
                                maxWidth: '220px',
                                borderRadius: 2
                              }}
                            />
                          ) : null}
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                          {meta.nftoken_id && (
                            <DetailRow label="NFT" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Link href={`/nft/${meta.nftoken_id}`} passHref>
                                <Typography
                                  component="span"
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
                          {URI && safeHexDecode(URI) && (
                            <DetailRow label="URI" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Link
                                href={safeHexDecode(URI)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span className="text-[#4285f4] hover:underline break-all text-[13px]">
                                  {safeHexDecode(URI)}
                                </span>
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
                          {Provider && safeHexDecode(Provider) && (
                            <DetailRow label="Provider" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Typography variant="body1">
                                {safeHexDecode(Provider)}
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
                          {URI && safeHexDecode(URI) && (
                            <DetailRow label="URI" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                              <Link
                                href={safeHexDecode(URI)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span className="text-[#4285f4] hover:underline break-all text-[13px]">
                                  {safeHexDecode(URI)}
                                </span>
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
                        component="span"
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
                    {txData.Domain && safeHexDecode(txData.Domain) && (
                      <DetailRow label="Domain">
                        <Typography variant="body1">
                          {safeHexDecode(txData.Domain)}
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
                    <Link href={`/address/${txData.RegularKey}`} passHref>
                      <Typography
                        component="span"
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
                    {txData.FinishAfter && parseTransactionDate(txData.FinishAfter) && (
                      <DetailRow label="Can Finish After">
                        <Typography variant="body1">
                          {parseTransactionDate(txData.FinishAfter).toLocaleString()}
                        </Typography>
                      </DetailRow>
                    )}
                    {txData.CancelAfter && parseTransactionDate(txData.CancelAfter) && (
                      <DetailRow label="Expires After">
                        <Typography variant="body1">
                          {parseTransactionDate(txData.CancelAfter).toLocaleString()}
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
                        <Link href={`/address/${txData.Issuer}`} passHref>
                          <Typography
                            component="span"
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
                        <Link href={`/address/${txData.Subject}`} passHref>
                          <Typography
                            component="span"
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
                      {Memos.map((memo, idx) => {
                        // Check if string is valid hex (only 0-9, a-f, A-F and even length)
                        const isHex = (str) => /^[0-9a-fA-F]+$/.test(str) && str.length % 2 === 0;

                        // Decode hex to UTF-8, return null if invalid
                        const decodeHex = (hexString) => {
                          if (!hexString) return null;
                          try {
                            const bytes = [];
                            for (let i = 0; i < hexString.length; i += 2) {
                              bytes.push(parseInt(hexString.substr(i, 2), 16));
                            }
                            const decoded = new TextDecoder('utf-8').decode(new Uint8Array(bytes));
                            // Check if result has replacement chars (invalid UTF-8)
                            if (decoded.includes('\uFFFD')) return hexString;
                            return decoded;
                          } catch {
                            return hexString;
                          }
                        };

                        // Smart decode: only decode if it looks like hex
                        const decodeMemo = (value) => {
                          if (!value) return null;
                          // If it's already readable text (from xrpscan), use as-is
                          if (!isHex(value)) return value;
                          // Otherwise decode from hex
                          return decodeHex(value);
                        };

                        const memoType = decodeMemo(memo.Memo.MemoType);
                        const memoData = decodeMemo(memo.Memo.MemoData);

                        return (
                          <Typography key={idx} variant="body2" sx={{ fontSize: '13px', wordBreak: 'break-all' }}>
                            {[memoType, memoData].filter(Boolean).join(': ')}
                          </Typography>
                        );
                      })}
                    </Stack>
                  </DetailRow>
                )}
          </div>

          {/* Transaction Link */}
        <div className={cn(
          "mt-4 px-4 py-3 rounded-lg border",
          isDark ? "border-white/10" : "border-gray-200"
        )}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-[13px]", isDark ? "text-white/50" : "text-gray-500")}>
              Transaction Link:
            </span>
            <Link href={`/tx/${hash}`} passHref>
              <span className="text-primary text-[13px] font-mono hover:underline break-all">
                {txUrl}
              </span>
            </Link>
            <button onClick={copyUrlToClipboard} className={cn("p-1 rounded hover:bg-white/10", isDark ? "text-white/40" : "text-gray-400")}>
              <Copy size={14} />
            </button>
          </div>
        </div>
        </div>
      )}

      {/* BALANCES Tab */}
      {activeTab === 'balances' && (
        <div className={cn(
          "rounded-xl overflow-hidden",
          isDark ? "bg-transparent" : "bg-white"
        )} style={{
          border: `1.5px solid ${isDark ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.08)'}`
        }}>
          <div className={cn(
            "px-4 py-3",
            isDark ? "border-b border-[rgba(59,130,246,0.12)]" : "border-b border-[rgba(0,0,0,0.08)]"
          )}>
            <span className={cn(
              "text-[11px] font-medium uppercase tracking-wider",
              isDark ? "text-white/40" : "text-gray-400"
            )}>
              Balance Changes ({balanceChanges.length})
            </span>
          </div>
          {balanceChanges.length > 0 && isSuccess ? (
            <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              {balanceChanges.map(({ account, changes }, idx) => (
                <div
                  key={account}
                  className={cn(
                    "px-4 py-3 flex items-start gap-4 flex-wrap",
                    idx % 2 === 1 && (isDark ? "bg-white/[0.02]" : "bg-gray-50/50")
                  )}
                >
                  <div className="flex items-center gap-2 min-w-[280px] flex-1">
                    <AccountAvatar account={account} />
                    <Link href={`/address/${account}`} passHref>
                      <span className="text-primary text-[13px] font-mono hover:underline break-all">
                        {account}
                      </span>
                    </Link>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {changes.map((change) => {
                      const isPositive = new Decimal(change.value).isPositive();
                      const sign = isPositive ? '+' : '';
                      const color = isPositive ? '#10b981' : '#ef4444';
                      const changeKey = `${change.currency}-${change.issuer || 'XRP'}-${change.value}`;
                      return (
                        <span
                          key={changeKey}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[13px]"
                          style={{
                            backgroundColor: `${color}15`,
                            border: `1px solid ${color}30`,
                            color
                          }}
                        >
                          {sign}{formatDecimal(new Decimal(change.value))}
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
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={cn("px-4 py-8 text-center text-[13px]", isDark ? "text-white/40" : "text-gray-400")}>
              No balance changes
            </div>
          )}
        </div>
      )}

      {/* TECHNICAL Tab */}
      {activeTab === 'technical' && (
        <div className={cn(
          "rounded-xl overflow-hidden",
          isDark ? "bg-transparent" : "bg-white"
        )} style={{
          border: `1.5px solid ${isDark ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.08)'}`
        }}>
          <div className={cn(
            "px-4 py-3",
            isDark ? "border-b border-[rgba(59,130,246,0.12)]" : "border-b border-[rgba(0,0,0,0.08)]"
          )}>
            <span className={cn(
              "text-[11px] font-medium uppercase tracking-wider",
              isDark ? "text-white/40" : "text-gray-400"
            )}>
              Technical Details
            </span>
          </div>
          <div>
            <DetailRow label="Flags" index={0}>
              <span className="px-2 py-0.5 rounded text-[12px] bg-primary/10 text-primary border border-primary/20">
                {Flags}
              </span>
            </DetailRow>
            <DetailRow label="Sequence" index={1}>
              <span className="text-[13px]">#{Sequence?.toLocaleString()}</span>
            </DetailRow>
            {ctid && (
              <DetailRow label="CTID" index={2}>
                <code className="text-[13px] font-mono">{ctid}</code>
              </DetailRow>
            )}
            {LastLedgerSequence && (
              <DetailRow label="Last Ledger" index={3}>
                <span className="text-[13px]">
                  #{LastLedgerSequence.toLocaleString()} ({LastLedgerSequence - ledger_index} ledgers)
                </span>
              </DetailRow>
            )}
            {SourceTag && (
              <DetailRow label="Source Tag" index={4}>
                <span className="text-[13px]">{SourceTag}</span>
              </DetailRow>
            )}
          </div>
        </div>
      )}

      {/* RAW Tab */}
      {activeTab === 'raw' && (
        <div className={cn(
          "rounded-xl overflow-hidden",
          isDark ? "bg-transparent" : "bg-white"
        )} style={{
          border: `1.5px solid ${isDark ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.08)'}`
        }}>
          <div className={cn(
            "px-4 py-3",
            isDark ? "border-b border-[rgba(59,130,246,0.12)]" : "border-b border-[rgba(0,0,0,0.08)]"
          )}>
            <span className={cn(
              "text-[11px] font-medium uppercase tracking-wider",
              isDark ? "text-white/40" : "text-gray-400"
            )}>
              Raw Transaction JSON
            </span>
          </div>
          <div className="p-4">
            <JsonViewer data={rawData} isDark={isDark} />
          </div>

          <div className={cn(
            "px-4 py-3 border-t",
            isDark ? "border-white/10" : "border-gray-200"
          )}>
            <span className={cn(
              "text-[11px] font-medium uppercase tracking-wider",
              isDark ? "text-white/40" : "text-gray-400"
            )}>
              Transaction Metadata
            </span>
          </div>
          <div className="p-4">
            <JsonViewer data={meta} isDark={isDark} />
          </div>
        </div>
      )}

      {/* Copy notification toast */}
      {urlCopied && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={cn(
            "px-4 py-2.5 rounded-lg text-[13px] font-medium shadow-lg flex items-center gap-2",
            isDark ? "bg-[#1a1a1a] text-white border border-white/10" : "bg-white text-gray-800 border border-gray-200"
          )}>
            <span className="text-[#22c55e]">✓</span>
            Link copied to clipboard
          </div>
        </div>
      )}
    </div>
  );
};

const TxPage = ({ txData, error }) => {
  const router = useRouter();
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 py-8 max-w-[1920px] mx-auto w-full px-4">
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
          </h1>
        </div>
        {error ? (
          <div className={cn(
            "rounded-xl border-[1.5px] p-8 text-center max-w-md mx-auto mt-8",
            isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50/50"
          )}>
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5",
              isDark ? "bg-red-500/10" : "bg-red-50"
            )}>
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h2 className={cn(
              "text-xl font-medium mb-2",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Transaction Not Found
            </h2>
            <p className={cn(
              "text-[14px] mb-6",
              isDark ? "text-white/60" : "text-gray-500"
            )}>
              {error}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/">
                <button className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] text-[13px] font-normal transition-colors",
                  isDark
                    ? "border-white/15 text-white/80 hover:border-primary hover:bg-primary/5"
                    : "border-gray-300 text-gray-700 hover:border-primary hover:bg-primary/5"
                )}>
                  <Home size={14} />
                  Go Home
                </button>
              </Link>
              <button
                onClick={() => router.back()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] text-[13px] font-normal transition-colors",
                  isDark
                    ? "border-white/15 text-white/80 hover:border-primary hover:bg-primary/5"
                    : "border-gray-300 text-gray-700 hover:border-primary hover:bg-primary/5"
                )}
              >
                <Search size={14} />
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <TransactionDetails txData={txData} />
        )}
      </div>
      <Footer />
    </div>
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

  const response = await axios.get(`https://api.xrpscan.com/api/v1/tx/${hash}`)
    .then(res => ({ data: { result: res.data } }))
    .catch(() => null);

  if (!response) {
    return {
      props: {
        txData: null,
        error: 'Transaction not found. Please check the hash and try again.'
      }
    };
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

    const txData = { ...rest, meta: meta ?? null };

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
