import { useRouter } from 'next/router';
import api from 'src/utils/api';
import { useState, useMemo, useEffect, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import Head from 'next/head';
import { ThemeContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { Copy, Sparkles, Home, Search } from 'lucide-react';
import { TxShareModal } from 'src/components/ShareButtons';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Link from 'next/link';
import {
  rippleToUnixTimestamp,
  dropsToXrp,
  normalizeCurrencyCode,
  getNftCoverUrl,
  BLACKHOLE_ACCOUNTS
} from 'src/utils/parseUtils';
import { formatDistanceToNow } from 'date-fns';
import Decimal from 'decimal.js-light';
import CryptoJS from 'crypto-js';

function formatDecimal(decimal, decimalPlaces = null) {
  let str = decimalPlaces !== null ? decimal.toFixed(decimalPlaces) : decimal.toString();
  // Only add commas to integer part, not decimal part
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// Lightweight UI shims (Tailwind-based)
const alpha = (color, opacity) => {
  if (!color) return `rgba(0,0,0,${opacity})`;
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16),
      g = parseInt(color.slice(3, 5), 16),
      b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  }
  return color;
};

const useTheme = () => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  return {
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: { main: '#4285f4' },
      success: { main: '#10b981' },
      error: { main: '#ef4444' },
      text: {
        primary: isDark ? '#fff' : '#000',
        secondary: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
      },
      background: { default: isDark ? '#000' : '#fff', paper: isDark ? '#111' : '#fff' },
      divider: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    }
  };
};

const sx2style = (sx) => {
  if (!sx) return {};
  const s = {},
    u = 8;
  for (const [k, v] of Object.entries(sx)) {
    if (v === undefined || typeof v === 'object') continue;
    if (k === 'p') s.padding = `${v * u}px`;
    else if (k === 'pt') s.paddingTop = `${v * u}px`;
    else if (k === 'pb') s.paddingBottom = `${v * u}px`;
    else if (k === 'px') {
      s.paddingLeft = s.paddingRight = `${v * u}px`;
    } else if (k === 'py') {
      s.paddingTop = s.paddingBottom = `${v * u}px`;
    } else if (k === 'mt') s.marginTop = `${v * u}px`;
    else if (k === 'mb') s.marginBottom = `${v * u}px`;
    else if (k === 'mr') s.marginRight = `${v * u}px`;
    else if (k === 'ml') s.marginLeft = `${v * u}px`;
    else if (k === 'mx') {
      s.marginLeft = s.marginRight = `${v * u}px`;
    } else if (k === 'my') {
      s.marginTop = s.marginBottom = `${v * u}px`;
    } else if (k === 'gap') s.gap = typeof v === 'number' ? `${v * u}px` : v;
    else if (k === 'bgcolor') s.backgroundColor = v;
    else s[k] = v;
  }
  return s;
};

const Box = ({ children, sx, component: C = 'div', className: cls, ...p }) => (
  <C style={sx2style(sx)} className={cls} {...p}>
    {children}
  </C>
);
const Typography = ({ children, variant, component: C, sx, ...p }) => {
  const Tag = C || (variant?.startsWith('h') ? variant : 'span');
  return (
    <Tag style={sx2style(sx)} {...p}>
      {children}
    </Tag>
  );
};
const Chip = ({ label, sx, ...p }) => (
  <span
    className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px]"
    style={sx2style(sx)}
    {...p}
  >
    {label}
  </span>
);
const Stack = ({ children, direction = 'column', spacing = 1, alignItems, sx, ...p }) => (
  <div
    className={cn('flex', direction === 'row' ? 'flex-row' : 'flex-col')}
    style={{ gap: `${spacing * 8}px`, alignItems, ...sx2style(sx) }}
    {...p}
  >
    {children}
  </div>
);
const Avatar = ({ src, children, sx, onError, ...p }) => (
  <div
    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[#e0e0e0]"
    style={sx2style(sx)}
    {...p}
  >
    {src ? (
      <img
        key={src}
        src={src}
        alt=""
        className="w-full h-full object-cover"
        onError={onError}
      />
    ) : (
      children
    )}
  </div>
);
const Tooltip = ({ children, title, onOpen, ...p }) => {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const handleEnter = () => {
    setShow(true);
    onOpen?.();
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    }
  };
  return (
    <span
      ref={ref}
      className="inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
      {...p}
    >
      {children}
      {show &&
        title &&
        typeof title !== 'string' &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            className={cn(
              'fixed z-[99999] min-w-[200px] -translate-x-1/2 -translate-y-full rounded-xl p-3 backdrop-blur-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] border',
              'bg-white/90 border-black/10 dark:bg-black/85 dark:border-white/10'
            )}
            style={{ top: pos.top, left: pos.left }}
          >
            {title}
          </div>,
          document.body
        )}
    </span>
  );
};
const Divider = ({ sx, ...p }) => (
  <hr
    className="border-none border-t border-gray-500/20 my-2"
    style={sx2style(sx)}
    {...p}
  />
);
const Grid = ({ children, container, spacing = 0, size, sx, ...p }) => {
  if (container)
    return (
      <div
        className="flex flex-wrap"
        style={{ gap: `${spacing * 8}px`, ...sx2style(sx) }}
        {...p}
      >
        {children}
      </div>
    );
  const xs = size?.xs || 12,
    md = size?.md;
  const width = md ? undefined : `${(xs / 12) * 100}%`;
  return (
    <div
      style={{
        flex: md ? `0 0 ${(md / 12) * 100}%` : `0 0 ${width}`,
        maxWidth: md ? `${(md / 12) * 100}%` : width,
        ...sx2style(sx)
      }}
      {...p}
    >
      {children}
    </div>
  );
};

// Parse date from either ISO string (api.xrpl.to) or ripple epoch (raw XRPL)
const parseTransactionDate = (date) => {
  if (!date) return null;
  if (typeof date === 'string') return new Date(date);
  if (typeof date === 'number') {
    return new Date(rippleToUnixTimestamp(date));
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
  10011010: { name: 'Magnetic', url: 'https://xmagnetic.org' },
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
  const { themeName } = useContext(ThemeContext);
  const isDark = isDarkProp ?? themeName === 'XrplToDarkTheme';
  const [copied, setCopied] = useState(false);
  const isMobileView = typeof window !== 'undefined' && window.innerWidth <= 640;
  const jsonString = JSON.stringify(data, null, isMobileView ? 1 : 2);
  const lines = jsonString.split('\n');

  const copyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightLine = (line) => {
    // Escape HTML entities first to prevent XSS from API response data
    const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped
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
        className={cn(
          'absolute top-2 right-2 z-10 px-2.5 py-1 rounded-md text-[11px] font-medium transition-[background-color,border-color] max-sm:top-1 max-sm:right-1 max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[9px]',
          copied
            ? 'text-emerald-400'
            : 'bg-black/5 hover:bg-black/10 text-gray-500 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white/60'
        )}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <div
        className={cn(
          'rounded-lg overflow-hidden border',
          'bg-gray-50 border-gray-200 dark:bg-white/[0.02] dark:border-white/5'
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="font-mono text-[12px] leading-[1.6] max-sm:text-[9px] max-sm:leading-[1.25]">
              {lines.map((line, i) => (
                <tr key={i} className={cn('hover:bg-gray-100 dark:hover:bg-white/[0.03]')}>
                  <td
                    className={cn(
                      'px-3 py-0.5 text-right select-none w-[1%] whitespace-nowrap max-sm:hidden',
                      'text-gray-300 border-r border-gray-200 dark:text-white/20 dark:border-r dark:border-white/5'
                    )}
                  >
                    {i + 1}
                  </td>
                  <td className="px-3 py-0.5 max-sm:px-1 max-sm:py-0">
                    <pre
                      className={cn('whitespace-pre', 'text-gray-700 dark:text-white/80')}
                      dangerouslySetInnerHTML={{ __html: highlightLine(line) }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, children, index = 0, alignValue = 'right' }) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const isOdd = index % 2 === 1;

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start sm:items-center px-4 py-2.5 min-h-[44px] gap-0.5 sm:gap-0',
        isOdd && ('bg-gray-50/50 dark:bg-white/[0.02]')
      )}
    >
      <span className={cn('text-[13px]', 'text-gray-500 dark:text-white/50')}>{label}</span>
      <div
        className={cn(
          'text-[13px] flex items-center gap-2 min-w-0 overflow-hidden',
          alignValue === 'right' ? 'sm:justify-end' : 'justify-start',
          'text-gray-800 dark:text-white/90'
        )}
      >
        {children}
      </div>
    </div>
  );
};

const TokenTooltipContent = ({ md5, tokenInfo, loading, error }) => {
  if (error) return <Typography sx={{ p: 1 }}>{error}</Typography>;
  if (loading) return <Typography sx={{ p: 1 }}>Loading...</Typography>;
  const token = tokenInfo?.data?.token || tokenInfo?.token;
  const exch = tokenInfo?.data?.exch || tokenInfo?.exch;
  if (!tokenInfo || !token)
    return <Typography sx={{ p: 1 }}>No data available.</Typography>;
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

  // Enhanced tooltip for regular tokens - clean symmetrical layout
  const chipStyle = {
    fontSize: '10px',
    height: '20px',
    px: 1,
    backgroundColor: 'rgba(66,133,244,0.08)',
    color: '#4285f4',
    border: '1px solid rgba(66,133,244,0.2)',
    fontWeight: 400
  };
  const greenChipStyle = {
    ...chipStyle,
    backgroundColor: 'rgba(16,185,129,0.08)',
    color: '#10b981',
    border: '1px solid rgba(16,185,129,0.2)'
  };
  const Row = ({ label, value }) => (
    <div className="flex justify-between py-1">
      <span className="text-white/50 text-[13px]">{label}</span>
      <span className="text-white/90 text-[13px] font-medium">
        {value}
      </span>
    </div>
  );

  return (
    <div className="min-w-[280px] max-w-[320px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {imageUrl && <Avatar src={imageUrl} sx={{ width: 40, height: 40 }} />}
        <div>
          <div className="text-[16px] font-medium text-white">
            {token.name || token.user || 'Unknown'}
          </div>
          {token.user && token.name !== token.user && (
            <div className="text-[12px] text-white/50">"{token.user}"</div>
          )}
          {token.issuer && (
            <div className="text-[11px] text-white/50 font-mono">
              {token.issuer.slice(0, 8)}...{token.issuer.slice(-6)}
            </div>
          )}
        </div>
      </div>

      {/* Price */}
      {(token.usd || token.exch) && (
        <div className="flex gap-2 mb-4">
          {token.usd && <Chip label={`$${new Decimal(token.usd).toFixed(6)}`} sx={chipStyle} />}
          {token.exch && (
            <Chip label={`${new Decimal(token.exch).toFixed(6)} XRP`} sx={chipStyle} />
          )}
        </div>
      )}

      {/* Market Data Grid */}
      <div className="border-t border-white/10 pt-3 mb-3">
        {token.marketcap > 0 && (
          <Row label="Market Cap" value={`${formatDecimal(new Decimal(token.marketcap), 0)} XRP`} />
        )}
        {token.supply && <Row label="Supply" value={formatDecimal(new Decimal(token.supply), 0)} />}
        {token.holders && (
          <Row label="Holders" value={formatDecimal(new Decimal(token.holders), 0)} />
        )}
        {token.trustlines && (
          <Row label="Trust Lines" value={formatDecimal(new Decimal(token.trustlines), 0)} />
        )}
      </div>

      {/* Features & Social Row */}
      {(token.kyc || token.AMM || token.social?.twitter) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {token.kyc && <Chip label="KYC" sx={greenChipStyle} />}
          {token.AMM && <Chip label="AMM" sx={chipStyle} />}
          {token.social?.twitter && <Chip label="Twitter" sx={chipStyle} />}
        </div>
      )}

      {/* Info */}
      {token.domain && (
        <div className="border-t border-white/10 pt-3 mb-3">
          <Row label="Domain" value={token.domain} />
        </div>
      )}

      {/* Tags */}
      {token.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {token.tags.slice(0, 4).map((tag) => (
            <Chip key={tag} label={tag} sx={chipStyle} />
          ))}
        </div>
      )}
    </div>
  );
};

const TokenLinkWithTooltip = ({ slug, currency, rawCurrency, md5, variant = 'body1' }) => {
  const theme = useTheme();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // LP tokens in XRPL start with '03' byte - other 40-char hex codes are just regular currency codes
  const isLpToken = rawCurrency && rawCurrency.length === 40 && /^[A-F0-9]{40}$/i.test(rawCurrency) && rawCurrency.startsWith('03');
  const isXRP = currency === 'XRP' && md5 === '84e5efeb89c4eae8f68188982dc290d8';

  useEffect(() => {
    const fetchTokenName = async () => {
      if (isLpToken) {
        setLoading(true);
        try {
          const response = await api.get(`https://api.xrpl.to/v1/token/${slug}`);
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
  }, [isLpToken, slug]);

  const handleFetchTokenInfo = async () => {
    if (tokenInfo || loading) return;
    setLoading(true);
    setError(null);
    try {
      let response;
      if (isXRP) {
        response = await api.get('https://api.xrpl.to/v1/token/xrpl-xrp');
      } else {
        response = await api.get(`https://api.xrpl.to/v1/token/${slug}`);
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
    >
      <Box sx={{ cursor: 'pointer', display: 'inline-flex' }}>{link}</Box>
    </Tooltip>
  );
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
      const response = await api.get('https://api.xrpl.to/v1/token/xrpl-xrp');
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
      const response = await api.get('https://api.xrpl.to/v1/token/xrpl-xrp');
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Avatar
          src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8"
          sx={{ width: 20, height: 20 }}
        />
        <Typography variant={variant}>{formatDecimal(new Decimal(dropsToXrp(amount)))} XRP</Typography>
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
      >
        <Box sx={{ cursor: 'pointer', display: 'inline-flex' }}>{xrpElement}</Box>
      </Tooltip>
    );
  }
  if (typeof amount === 'object') {
    const currency = normalizeCurrencyCode(amount.currency);
    // Handle XRP as object (some APIs return it this way with value in drops)
    if (amount.currency === 'XRP' && !amount.issuer) {
      const xrpValue = dropsToXrp(String(amount.value));
      const xrpElement = (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Avatar
            src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8"
            sx={{ width: 20, height: 20 }}
          />
          <Typography variant={variant}>{formatDecimal(new Decimal(xrpValue))} XRP</Typography>
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
        >
          <Box sx={{ cursor: 'pointer', display: 'inline-flex' }}>{xrpElement}</Box>
        </Tooltip>
      );
    }
    const slug = amount.issuer ? `${amount.issuer}-${amount.currency}` : null;
    const stringToHash = slug ? slug.replace('-', '_') : null;
    const md5 = stringToHash ? CryptoJS.MD5(stringToHash).toString() : null;
    const imageUrl = md5 ? `https://s1.xrpl.to/token/${md5}` : null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {imageUrl && <Avatar src={imageUrl} sx={{ width: 20, height: 20 }} />}
        <Typography variant={variant} component="span">
          {formatDecimal(new Decimal(amount.value))}
        </Typography>
        {slug ? (
          <TokenLinkWithTooltip
            slug={slug}
            currency={currency}
            rawCurrency={amount.currency}
            md5={md5}
            variant={variant}
          />
        ) : (
          <Typography
            variant={variant}
            component="span"
            sx={{ color: theme.palette.primary.main }}
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
      // Handle XRP as object (some APIs return it this way with value in drops)
      if (amount.currency === 'XRP' && !amount.issuer) {
        return `${dropsToXrp(String(amount.value))} XRP`;
      }
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
      const withdrawLPAmount = LPTokenIn ? formatAmount(LPTokenIn) : null;
      const withdrawAsset1 = Amount ? formatAmount(Amount) : null;
      const withdrawAsset2 = Amount2 ? formatAmount(Amount2) : null;
      const isSingleSided = (withdrawAsset1 || withdrawAsset2) && !withdrawLPAmount;
      const withdrawDesc = withdrawLPAmount
        ? `${withdrawLPAmount} LP tokens`
        : withdrawAsset1 && withdrawAsset2
          ? `${withdrawAsset1} + ${withdrawAsset2}`
          : withdrawAsset1 || withdrawAsset2 || 'liquidity';
      return {
        title: isSingleSided ? 'Single-Sided Withdrawal' : 'Removed Liquidity',
        description: `${formatAccount(Account)} withdrew ${withdrawDesc} from the AMM pool.`,
        details: [
          `Provider: ${formatAccount(Account)}`,
          withdrawLPAmount ? `LP tokens burned: ${withdrawLPAmount}` : null,
          withdrawAsset1 ? `Withdrew: ${withdrawAsset1}` : null,
          withdrawAsset2 ? `Also withdrew: ${withdrawAsset2}` : null,
          isSingleSided ? 'Type: Single-sided withdrawal' : null,
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
      const tradingFeePercent = txData.TradingFee ? `${txData.TradingFee / 1000}%` : '0%';
      const deposit1 = Amount ? formatAmount(Amount) : null;
      const deposit2 = Amount2 ? formatAmount(Amount2) : null;
      return {
        title: 'AMM Pool Created',
        description: `${formatAccount(Account)} created a new Automated Market Maker pool${deposit1 && deposit2 ? ` with ${deposit1} and ${deposit2}` : ''}${tradingFeePercent !== '0%' ? ` (${tradingFeePercent} trading fee)` : ''}. This enables decentralized token swaps between two assets.`,
        details: [
          `Pool creator: ${formatAccount(Account)}`,
          deposit1 ? `Initial deposit: ${deposit1}` : null,
          deposit2 ? `Second deposit: ${deposit2}` : null,
          `Trading fee: ${tradingFeePercent}`,
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

const TransactionSummaryCard = ({
  txData,
  activeTab,
  setActiveTab,
  aiExplanation,
  aiLoading,
  onExplainWithAI,
  onCloseAI,
  swapInfo,
  isBurn,
  isBlackholed
}) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const { hash, TransactionType, Account, meta, date, ledger_index, Fee, Flags } = txData;
  const [copied, setCopied] = useState(false);
  const [timeAgo, setTimeAgo] = useState(null);
  const [dateStr, setDateStr] = useState(null);

  const isSuccess = meta?.TransactionResult === 'tesSUCCESS';
  const description = getTransactionDescription(txData);
  const parsedDate = parseTransactionDate(date);

  // Compute time-dependent strings on client only to avoid hydration mismatch
  useEffect(() => {
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      setTimeAgo(formatDistanceToNow(parsedDate));
      setDateStr(
        parsedDate.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        })
      );
    }
  }, [date]);

  const copyHash = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'balances', label: 'Balances' },
    { id: 'technical', label: 'Technical' },
    { id: 'raw', label: 'Raw' }
  ];

  const isSwap = swapInfo && swapInfo.paid && swapInfo.got;

  return (
    <div
      className={cn(
        'rounded-xl mb-4 overflow-hidden border-[1.5px] max-w-full',
        'bg-white border-black/[0.08] dark:bg-transparent dark:border-white/10'
      )}
    >
      {/* Header bar */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 px-4 py-3',
          'border-b border-[rgba(0,0,0,0.08)] dark:border-b dark:border-[rgba(255,255,255,0.10)]'
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <span
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-medium',
              isSuccess
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/15 text-red-400 border border-red-500/20'
            )}
          >
            {isSuccess ? 'Success' : 'Failed'}
          </span>
          <span
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-medium',
              isBurn
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                : 'bg-gray-50 text-gray-600 border border-gray-200 dark:bg-white/5 dark:text-white/80 dark:border dark:border-white/10'
            )}
          >
            {isBurn ? 'Burn' : isSwap ? 'Swap' : TransactionType}
          </span>
          {/* Swap Summary Inline */}
          {isSwap && isSuccess && (
            <div className="flex items-center gap-2 ml-0 sm:ml-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/15">
                <span className="text-red-400 text-[12px] font-medium font-mono">
                  -{formatDecimal(new Decimal(swapInfo.paid.value))} {swapInfo.paid.currency}
                </span>
              </span>
              <span className={cn('text-[11px]', 'text-gray-400 dark:text-white/30')}>to</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15">
                <span className="text-emerald-400 text-[12px] font-medium font-mono">
                  +{formatDecimal(new Decimal(swapInfo.got.value))} {swapInfo.got.currency}
                </span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TxShareModal hash={hash} type={TransactionType} />
          {aiExplanation || aiLoading ? (
            <button
              onClick={onCloseAI}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-[background-color,border-color] duration-200',
                'border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 dark:border-white/10 dark:hover:border-white/20 dark:text-white/50 dark:hover:text-white/70'
              )}
            >
              Close AI
            </button>
          ) : (
            <button
              onClick={onExplainWithAI}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-[background-color,border-color] duration-200',
                'border-[#8b5cf6]/30 hover:border-[#8b5cf6]/50 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 text-[#7c3aed] hover:text-[#6d28d9] dark:border-[#8b5cf6]/25 dark:hover:border-[#8b5cf6]/40 dark:bg-[#8b5cf6]/10 dark:hover:bg-[#8b5cf6]/15 dark:text-[#c4b5fd] dark:hover:text-[#ddd6fe]'
              )}
            >
              <Sparkles size={12} />
              Explain with AI
            </button>
          )}
        </div>
      </div>

      {/* AI Loading State */}
      {aiLoading && (
        <div
          className={cn(
            'px-6 py-5 relative overflow-hidden',
            'border-b border-[rgba(0,0,0,0.08)] dark:border-b dark:border-[rgba(255,255,255,0.10)]'
          )}
        >
          <style jsx>{`
            @keyframes scanline {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(200%);
              }
            }
            @keyframes glow {
              0%,
              100% {
                opacity: 0.3;
              }
              50% {
                opacity: 0.8;
              }
            }
            @keyframes pulse-bar {
              0%,
              100% {
                opacity: 0.15;
              }
              50% {
                opacity: 0.4;
              }
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
                    background:
                      i === 5
                        ? 'rgba(139,92,246,0.3)'
                        : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    animation: `pulse-bar 2s ease-in-out infinite`,
                    animationDelay: `${i * 0.15}s`
                  }}
                />
                <div
                  className="absolute inset-0 rounded-sm"
                  style={{
                    background:
                      i === 5
                        ? 'linear-gradient(90deg, transparent, #8b5cf6, transparent)'
                        : `linear-gradient(90deg, transparent, ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}, transparent)`,
                    animation: `scanline 1.5s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              </div>
            ))}
          </div>
          <div
            className={cn(
              'mt-5 text-[13px] font-mono flex items-center gap-2',
              'text-gray-400 dark:text-white/50'
            )}
          >
            <span
              className="inline-block w-2 h-2 rounded-full bg-[#8b5cf6]"
              style={{ animation: 'glow 1s ease-in-out infinite' }}
            />
            Analyzing
            <span className="inline-flex tracking-widest">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    animation: 'glow 1s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`
                  }}
                >
                  .
                </span>
              ))}
            </span>
          </div>
        </div>
      )}

      {/* AI Explanation Panel */}
      {aiExplanation &&
        !aiLoading &&
        (() => {
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
              if (points) keyPoints = points.map((p) => p.replace(/"/g, ''));
            }
          } else if (typeof raw === 'object' && raw?.summary) {
            summaryText = raw.summary;
            keyPoints = raw.keyPoints || [];
          }

          return (
            <div
              className={cn(
                'px-6 py-5',
                'border-b border-[rgba(0,0,0,0.08)] dark:border-b dark:border-[rgba(139,92,246,0.12)]'
              )}
            >
              {/* Title with summary */}
              <h3 className="text-[15px] mb-5">
                <span className="text-[#a78bfa] font-medium">
                  {aiExplanation.extracted?.type || 'Transaction'}:
                </span>{' '}
                <span className={'text-gray-900 dark:text-white'}>{summaryText}</span>
              </h3>

              {/* Key Points */}
              {keyPoints.length > 0 && (
                <div className="mb-5">
                  <h4
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wider mb-3',
                      'text-gray-500 dark:text-white/60'
                    )}
                  >
                    Key Points
                  </h4>
                  <ul className="space-y-2">
                    {keyPoints.map((point, idx) => (
                      <li
                        key={idx}
                        className={cn(
                          'flex items-start gap-2 text-[13px] font-mono',
                          'text-gray-700 dark:text-white/80'
                        )}
                      >
                        <span className="text-[#8b5cf6]">•</span>
                        <span>{typeof point === 'string' ? point : JSON.stringify(point)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Additional Information */}
              {aiExplanation.extracted?.platform &&
                (() => {
                  const platformUrl = Object.values(KNOWN_SOURCE_TAGS).find(
                    (t) => t.name === aiExplanation.extracted.platform
                  )?.url;
                  return (
                    <div>
                      <h4
                        className={cn(
                          'text-[11px] font-medium uppercase tracking-wider mb-2',
                          'text-gray-500 dark:text-white/60'
                        )}
                      >
                        Additional Information
                      </h4>
                      <p className={cn('text-[13px]', 'text-gray-600 dark:text-white/70')}>
                        Transaction via{' '}
                        {platformUrl ? (
                          <a
                            href={platformUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#a78bfa] hover:underline"
                          >
                            {aiExplanation.extracted.platform}
                          </a>
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

      {/* Tabs */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3 overflow-x-auto',
          'border-b border-[rgba(0,0,0,0.08)] dark:border-b dark:border-[rgba(255,255,255,0.10)]'
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 sm:px-4 py-2 rounded-lg text-[12px] font-medium transition-[background-color,border-color] border shrink-0',
              activeTab === tab.id
                ? 'bg-black/[0.06] text-black/80 border-black/10 dark:bg-white/10 dark:text-white/90 dark:border-white/15'
                : 'text-gray-500 border-gray-200 hover:bg-black/[0.04] hover:text-gray-700 dark:text-white/50 dark:border-white/10 dark:hover:bg-white/[0.06] dark:hover:text-white/70'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Info grid */}
      <div
        className={cn(
          'grid grid-cols-1 sm:grid-cols-[1fr_2fr_1fr]',
          'sm:divide-x divide-gray-100 dark:sm:divide-x dark:divide-white/[0.06]'
        )}
      >
        <div className="px-4 py-3">
          <div
            className={cn(
              'text-[10px] uppercase tracking-wider mb-1.5',
              'text-gray-500 dark:text-white/50'
            )}
          >
            Signature
          </div>
          <div className="flex items-center gap-1.5">
            <code
              className={cn('text-[13px] font-mono', 'text-gray-700 dark:text-white/80')}
            >
              {hash.slice(0, 4)}...{hash.slice(-4)}
            </code>
            <button
              onClick={copyHash}
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-medium transition-[background-color,border-color]',
                copied
                  ? 'text-emerald-400'
                  : 'text-gray-500 hover:text-primary dark:text-white/50 dark:hover:text-primary'
              )}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
        <div className="px-4 py-3">
          <div
            className={cn(
              'text-[10px] uppercase tracking-wider mb-1.5',
              'text-gray-500 dark:text-white/50'
            )}
          >
            Time
          </div>
          <div className={cn('text-[13px] break-words', 'text-gray-700 dark:text-white/80')}>
            {timeAgo ? (
              <>
                <span className="text-primary">{timeAgo} ago</span>{' '}
                <span className={cn('hidden sm:inline', 'text-gray-500 dark:text-white/50')}>({dateStr})</span>
              </>
            ) : (
              'Unknown'
            )}
          </div>
        </div>
        <div className="px-4 py-3 sm:text-right">
          <div
            className={cn(
              'text-[10px] uppercase tracking-wider mb-1.5',
              'text-gray-500 dark:text-white/50'
            )}
          >
            Ledger
          </div>
          <Link href={`/ledger/${ledger_index}`}>
            <span className="text-[13px] font-mono text-primary hover:underline cursor-pointer">
              #{ledger_index?.toLocaleString()}
            </span>
          </Link>
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
  const [isDestBlackholed, setIsDestBlackholed] = useState(false);
  const [destAccountData, setDestAccountData] = useState(null);

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
    NFTokenID,
    Owner
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
      const response = await api.get(`https://api.xrpl.to/v1/tx-explain/${hash}`);
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

  // Extract AMMCreate details from metadata
  const getAMMCreateDetails = () => {
    if (!meta || !meta.AffectedNodes) return null;
    if (TransactionType !== 'AMMCreate') return null;

    let lpTokenBalance = null;
    let ammAccount = null;

    // Find the created AMM node to get LP token balance
    for (const affectedNode of meta.AffectedNodes) {
      if (affectedNode.CreatedNode?.LedgerEntryType === 'AMM') {
        const newFields = affectedNode.CreatedNode.NewFields;
        if (newFields?.LPTokenBalance) {
          lpTokenBalance = newFields.LPTokenBalance;
          ammAccount = newFields.Account;
          break;
        }
      }
    }

    return {
      lpTokenBalance,
      ammAccount
    };
  };

  // Extract AMM withdrawal/deposit details from metadata
  const getAMMChanges = () => {
    if (!meta || !meta.AffectedNodes) return null;
    if (TransactionType !== 'AMMWithdraw' && TransactionType !== 'AMMDeposit') return null;

    const isWithdraw = TransactionType === 'AMMWithdraw';
    let lpTokenChange = null;
    let assetsReceived = [];
    let assetsDeposited = [];

    // Find LP token change from RippleState (LP tokens have currency starting with '03')
    // And find XRP/token changes for the initiating account
    for (const affectedNode of meta.AffectedNodes) {
      const node = affectedNode.ModifiedNode || affectedNode.DeletedNode;
      if (!node || !node.LedgerEntryType) continue;

      const finalFields = node.FinalFields || {};
      const previousFields = node.PreviousFields || {};

      // Check for LP token changes (RippleState with LP token currency)
      if (node.LedgerEntryType === 'RippleState') {
        const currency = finalFields.Balance?.currency || previousFields.Balance?.currency;
        const isLpToken = currency && currency.startsWith('03');

        if (isLpToken) {
          const prevBalance = previousFields.Balance?.value ? new Decimal(previousFields.Balance.value) : new Decimal(0);
          const finalBalance = finalFields.Balance?.value ? new Decimal(finalFields.Balance.value) : new Decimal(0);
          const change = finalBalance.minus(prevBalance);

          // For user's LP token change (not the AMM's)
          const lowAccount = finalFields.LowLimit?.issuer;
          const highAccount = finalFields.HighLimit?.issuer;
          const ammIssuer = highAccount; // AMM account is typically the high limit issuer for LP tokens

          // User is the low account for LP token trustlines
          if (lowAccount === Account) {
            lpTokenChange = {
              value: change.abs().toString(),
              currency: normalizeCurrencyCode(currency),
              rawCurrency: currency,
              issuer: ammIssuer,
              direction: change.isNegative() ? 'burned' : 'received'
            };
          }
        }
      }

      // Check for XRP changes for the initiating account
      if (node.LedgerEntryType === 'AccountRoot' && finalFields.Account === Account) {
        if (previousFields.Balance) {
          const change = new Decimal(finalFields.Balance).minus(previousFields.Balance);
          // Add fee back for withdraw to get actual received amount
          const feeDrops = new Decimal(Fee || 0);
          const actualChange = isWithdraw ? change.plus(feeDrops) : change;

          if (!actualChange.isZero()) {
            const xrpAmount = {
              value: dropsToXrp(actualChange.abs().toString()),
              currency: 'XRP',
              direction: actualChange.isPositive() ? 'received' : 'deposited'
            };
            if (isWithdraw && actualChange.isPositive()) {
              assetsReceived.push(xrpAmount);
            } else if (!isWithdraw && actualChange.isNegative()) {
              assetsDeposited.push(xrpAmount);
            }
          }
        }
      }

      // Check for token changes for the initiating account (non-LP tokens)
      if (node.LedgerEntryType === 'RippleState') {
        const currency = finalFields.Balance?.currency || previousFields.Balance?.currency;
        const isLpToken = currency && currency.startsWith('03');

        if (!isLpToken && previousFields.Balance?.value) {
          const lowAccount = finalFields.LowLimit?.issuer;
          const highAccount = finalFields.HighLimit?.issuer;

          if (lowAccount === Account || highAccount === Account) {
            const prevBalance = new Decimal(previousFields.Balance.value);
            const finalBalance = new Decimal(finalFields.Balance?.value || 0);
            let change = finalBalance.minus(prevBalance);

            // Adjust for perspective (balance is from low account's view)
            if (highAccount === Account) {
              change = change.negated();
            }

            if (!change.isZero()) {
              const tokenAmount = {
                value: change.abs().toString(),
                currency: normalizeCurrencyCode(currency),
                rawCurrency: currency,
                issuer: lowAccount === Account ? highAccount : lowAccount,
                direction: change.isPositive() ? 'received' : 'deposited'
              };
              if (isWithdraw && change.isPositive()) {
                assetsReceived.push(tokenAmount);
              } else if (!isWithdraw && change.isNegative()) {
                assetsDeposited.push(tokenAmount);
              }
            }
          }
        }
      }
    }

    return {
      lpTokenChange,
      assetsReceived,
      assetsDeposited
    };
  };

  const ammChanges = (TransactionType === 'AMMWithdraw' || TransactionType === 'AMMDeposit') ? getAMMChanges() : null;
  const ammCreateDetails = TransactionType === 'AMMCreate' ? getAMMCreateDetails() : null;

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

    // Find all deleted NFTokenOffer nodes
    const offerNodes = meta.AffectedNodes.filter(
      (node) => node.DeletedNode && node.DeletedNode.LedgerEntryType === 'NFTokenOffer'
    );

    if (offerNodes.length === 0) return null;

    // Check if this is a brokered sale (both buy and sell offers)
    const sellOfferNode = offerNodes.find(n => (n.DeletedNode.FinalFields.Flags & 1) !== 0);
    const buyOfferNode = offerNodes.find(n => (n.DeletedNode.FinalFields.Flags & 1) === 0);
    const isBrokered = sellOfferNode && buyOfferNode;

    // Use the first offer found for NFT details
    const primaryOffer = offerNodes[0].DeletedNode.FinalFields;
    const { NFTokenID } = primaryOffer;

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

    if (isBrokered) {
      // Brokered sale: seller is sell offer owner, buyer is buy offer owner
      return {
        nftokenID: NFTokenID,
        seller: sellOfferNode.DeletedNode.FinalFields.Owner,
        buyer: buyOfferNode.DeletedNode.FinalFields.Owner,
        amount: buyOfferNode.DeletedNode.FinalFields.Amount, // What buyer paid
        uri
      };
    } else {
      // Single offer accepted
      const { Owner, Destination, Amount, Flags } = primaryOffer;
      const isSellOffer = (Flags & 1) !== 0;
      return {
        nftokenID: NFTokenID,
        seller: isSellOffer ? Owner : (Destination || Account),
        buyer: isSellOffer ? (Destination || Account) : Owner,
        amount: Amount,
        uri
      };
    }
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
          const response = await api.get(
            `https://api.xrpl.to/v1/nft/${acceptedOfferDetails.nftokenID}`
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
          const response = await api.get(`https://api.xrpl.to/v1/nft/${NFTokenID}`);
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
          const response = await api.get(`https://api.xrpl.to/v1/nft/${meta.nftoken_id}`);
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
          api
            .get(`https://api.xrpl.to/v1/nft/${offer.NFTokenID}`)
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
    const paidFromChanges = initiatorChanges?.changes?.find((c) => {
      const val = new Decimal(c.value);
      if (typeof SendMax === 'string') {
        return c.currency === 'XRP' && val.isNegative();
      }
      return c.currency === normalizeCurrencyCode(SendMax.currency) && val.isNegative();
    });

    const gotFromChanges = initiatorChanges?.changes?.find((c) => {
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
    // tfLPToken: Double-asset withdrawal proportional to LP tokens
    if (flags & 0x00010000) return 'Proportional withdrawal (LP Token amount)';
    // tfWithdrawAll: Withdraw all LP tokens for both assets
    if (flags & 0x00020000) return 'Withdraw all LP tokens';
    // tfOneAssetWithdrawAll: Withdraw all LP tokens for single asset
    if (flags & 0x00040000) return 'Withdraw all LP tokens for single asset';
    // tfSingleAsset: Single asset withdrawal proportional to LP amount
    if (flags & 0x00080000) return 'Single asset withdrawal';
    // tfTwoAsset: Double-asset withdrawal
    if (flags & 0x00100000) return 'Two-asset withdrawal';
    // tfOneAssetLPToken: Single asset by LP token amount
    if (flags & 0x00200000) return 'Single asset by LP amount';
    // tfLimitLPToken: Limit by max LP token
    if (flags & 0x00400000) return 'Limited by LP token amount';
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

  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [activeTab, setActiveTab] = useState('summary');

  // Check if this is a burn transaction
  const isBurn = TransactionType === 'Payment' && Destination && (
    BLACKHOLE_ACCOUNTS.includes(Destination) ||
    (typeof Amount === 'object' && Amount?.issuer === Destination) ||
    (typeof deliveredAmount === 'object' && deliveredAmount?.issuer === Destination)
  );

  // Check if destination account is blackholed
  useEffect(() => {
    const checkBlackholed = async () => {
      if (!isBurn || !Destination) return;

      // Skip if destination is already a known blackhole address
      if (BLACKHOLE_ACCOUNTS.includes(Destination)) {
        setIsDestBlackholed(true);
        return;
      }

      try {
        // Fetch both endpoints - balance has more info, live has RegularKey
        const [balanceRes, liveRes] = await Promise.all([
          api.get(`https://api.xrpl.to/v1/account/balance/${Destination}?rank=true`).catch(() => null),
          api.get(`https://api.xrpl.to/v1/account/info/live/${Destination}`).catch(() => null)
        ]);

        const balanceData = balanceRes?.data;
        const liveData = liveRes?.data?.account_data;

        if (!balanceData && !liveData) return;

        // Merge data from both endpoints
        const mergedData = {
          ...balanceData,
          RegularKey: liveData?.RegularKey
        };
        setDestAccountData(mergedData);

        // Check if account is blackholed:
        // 1. Master key disabled (lsfDisableMaster = 0x00100000)
        // 2. RegularKey is missing or set to a blackhole address
        const lsfDisableMaster = 0x00100000;
        const flags = balanceData?.flags || liveData?.Flags || 0;
        const masterDisabled = (flags & lsfDisableMaster) !== 0;
        const regularKeyBlackholed = !liveData?.RegularKey ||
          BLACKHOLE_ACCOUNTS.includes(liveData?.RegularKey);

        if (masterDisabled && regularKeyBlackholed) {
          setIsDestBlackholed(true);
        }
      } catch (err) {
        // If account info not found, can't confirm blackholed
        // Could not fetch account info for blackhole check
      }
    };

    checkBlackholed();
  }, [isBurn, Destination]);

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
        isBurn={isBurn}
        isBlackholed={isDestBlackholed}
      />

      {/* SUMMARY Tab */}
      {activeTab === 'summary' && (
        <div
          className={cn(
            'rounded-xl overflow-hidden border-[1.5px]',
            'bg-white border-black/[0.08] dark:bg-transparent dark:border-white/10'
          )}
        >
          <div
            className={cn(
              'px-4 py-3',
              'border-b border-gray-100 dark:border-b dark:border-white/10'
            )}
          >
            <span
              className={cn(
                'text-[11px] font-medium uppercase tracking-wider',
                'text-gray-400 dark:text-white/50'
              )}
            >
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
                      : isConversion
                        ? 'Swap'
                        : TransactionType}
              </span>
            </DetailRow>

            <DetailRow label="Timestamp" index={1}>
              <span className="font-mono" suppressHydrationWarning>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Link href={`/address/${Account}`} passHref>
                        <Typography
                          component="span"
                          variant="body2"
                          className="font-mono text-[13px] no-underline hover:underline truncate block"
                          sx={{ color: theme.palette.primary.main }}
                          title={Account}
                        >
                          <span className="hidden sm:inline">{Account}</span>
                          <span className="inline sm:hidden">{Account.slice(0, 10)}...{Account.slice(-6)}</span>
                        </Typography>
                      </Link>
                    </Box>
                  </DetailRow>
                ) : (
                  <>
                    <DetailRow label="From">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Link href={`/address/${Account}`} passHref>
                          <Typography
                            component="span"
                            variant="body2"
                            className="font-mono text-[13px] no-underline hover:underline truncate block"
                            sx={{ color: theme.palette.primary.main }}
                            title={Account}
                          >
                            <span className="hidden sm:inline">{Account}</span>
                            <span className="inline sm:hidden">{Account.slice(0, 10)}...{Account.slice(-6)}</span>
                          </Typography>
                        </Link>
                      </Box>
                    </DetailRow>
                    <DetailRow label="To">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} className="min-w-0 flex-wrap">
                        {isDestBlackholed && destAccountData ? (
                          <Tooltip
                            title={
                              <div className="min-w-[240px]">
                                <div className="text-[13px] font-medium mb-1 text-[#f87171]">
                                  Blackholed Account
                                </div>
                                <div className="text-[11px] text-white/50 mb-2 font-mono">
                                  {Destination.slice(0, 10)}...{Destination.slice(-8)}
                                </div>
                                <div className="border-t border-white/10 pt-2">
                                  <div className="flex justify-between text-[11px] mb-1">
                                    <span className="text-white/50">Balance</span>
                                    <span className="text-white">{destAccountData.total?.toFixed(2) || '0'} XRP</span>
                                  </div>
                                  {destAccountData.rank && (
                                    <div className="flex justify-between text-[11px] mb-1">
                                      <span className="text-white/50">Richlist Rank</span>
                                      <span className="text-white">#{destAccountData.rank.toLocaleString()}</span>
                                    </div>
                                  )}
                                  {destAccountData.inception && (
                                    <div className="flex justify-between text-[11px] mb-1">
                                      <span className="text-white/50">Created</span>
                                      <span className="text-white">{new Date(destAccountData.inception).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-[11px] mb-1">
                                    <span className="text-white/50">Master Key</span>
                                    <span className="text-[#f87171]">Disabled</span>
                                  </div>
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-white/50">Regular Key</span>
                                    <span className="text-[#f87171] font-mono text-[10px]">
                                      {destAccountData.RegularKey ? `${destAccountData.RegularKey.slice(0, 8)}...` : 'None'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            }
                          >
                            <Link href={`/address/${Destination}`} passHref>
                              <Typography
                                component="span"
                                variant="body2"
                                className="font-mono text-[13px] text-[#f87171] no-underline hover:underline truncate block"
                                title={Destination}
                              >
                                <span className="hidden sm:inline">{Destination}</span>
                                <span className="inline sm:hidden">{Destination.slice(0, 10)}...{Destination.slice(-6)}</span>
                              </Typography>
                            </Link>
                          </Tooltip>
                        ) : (
                          <Link href={`/address/${Destination}`} passHref>
                            <Typography
                              component="span"
                              variant="body2"
                              className="font-mono text-[13px] no-underline hover:underline truncate block"
                              sx={{ color: theme.palette.primary.main }}
                              title={Destination}
                            >
                              <span className="hidden sm:inline">{Destination}</span>
                              <span className="inline sm:hidden">{Destination.slice(0, 10)}...{Destination.slice(-6)}</span>
                            </Typography>
                          </Link>
                        )}
                        {isBurn && (
                          <Tooltip
                            title={
                              <div className="min-w-[200px]">
                                <div className={cn('text-[13px] font-medium mb-2', isDestBlackholed ? 'text-[#f87171]' : 'text-[#fb923c]')}>
                                  {isDestBlackholed ? 'Blackholed Account' : 'Token Burn'}
                                </div>
                                <div className="text-[12px] text-white/70 leading-[1.4]">
                                  {isDestBlackholed
                                    ? 'This account has its master key disabled and no valid regular key. It cannot sign transactions, making tokens sent here permanently destroyed.'
                                    : 'Tokens sent back to their issuer are burned and permanently removed from circulation.'}
                                </div>
                              </div>
                            }
                          >
                            <span
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[10px] font-medium cursor-help',
                                isDestBlackholed
                                  ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                  : 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                              )}
                            >
                              {isDestBlackholed ? 'Blackholed' : 'Burn'}
                            </span>
                          </Tooltip>
                        )}
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
                  <Link href={clientInfo.url} target="_blank" rel="noopener noreferrer" passHref>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                        <Link href={`/address/${LimitAmount.issuer}`} passHref>
                          <Typography
                            component="span"
                            variant="body1"
                            className="truncate block font-mono text-[13px]"
                            sx={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            title={LimitAmount.issuer}
                          >
                            <span className="hidden sm:inline">{LimitAmount.issuer}</span>
                            <span className="inline sm:hidden">{LimitAmount.issuer.slice(0, 10)}...{LimitAmount.issuer.slice(-6)}</span>
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
                {/* Show assets deposited from metadata or transaction fields */}
                {(ammChanges?.assetsDeposited?.length > 0 || Amount || Amount2) && (
                  <DetailRow label="Assets Deposited">
                    <div className="flex flex-wrap gap-2">
                      {ammChanges?.assetsDeposited?.length > 0 ? (
                        ammChanges.assetsDeposited.map((asset, idx) => (
                          <span
                            key={`${asset.currency}-${idx}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[13px] bg-red-500/10 border border-red-500/20 text-[#ef4444]"
                          >
                            -{formatDecimal(new Decimal(asset.value))}
                            {asset.currency === 'XRP' ? (
                              <XrpDisplay variant="body2" showText={true} />
                            ) : (
                              <TokenDisplay
                                slug={`${asset.issuer}-${asset.rawCurrency}`}
                                currency={asset.currency}
                                rawCurrency={asset.rawCurrency}
                                variant="body2"
                              />
                            )}
                          </span>
                        ))
                      ) : (
                        <>
                          {Amount && (
                            <div className="border border-[#666] rounded-md px-2.5 py-1.5">
                              <AmountDisplay amount={Amount} />
                            </div>
                          )}
                          {Amount2 && (
                            <div className="border border-[#666] rounded-md px-2.5 py-1.5">
                              <AmountDisplay amount={Amount2} />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </DetailRow>
                )}
                {/* Show LP tokens received from metadata */}
                {ammChanges?.lpTokenChange && ammChanges.lpTokenChange.direction === 'received' && (
                  <DetailRow label="LP Tokens Received">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[13px] bg-emerald-500/10 border border-emerald-500/20 text-[#10b981]"
                      >
                        +{formatDecimal(new Decimal(ammChanges.lpTokenChange.value))}
                        <TokenDisplay
                          slug={`${ammChanges.lpTokenChange.issuer}-${ammChanges.lpTokenChange.rawCurrency}`}
                          currency={ammChanges.lpTokenChange.currency}
                          rawCurrency={ammChanges.lpTokenChange.rawCurrency}
                          variant="body2"
                        />
                      </span>
                    </div>
                  </DetailRow>
                )}
              </>
            )}

            {TransactionType === 'NFTokenCancelOffer' && (
              <>
                {cancelledNftOffers.length > 0 ? (
                  <DetailRow
                    label={cancelledNftOffers.length > 1 ? 'Cancelled Offers' : 'Cancelled Offer'}
                  >
                    {cancelledNftOffers.map((offer) => {
                      const nftInfo = cancelledNftInfo[offer.NFTokenID];
                      const isLoading = cancelledNftInfoLoading[offer.NFTokenID];
                      const fallbackView = (
                        <Grid container spacing={1}>
                          <DetailRow label="Offer" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                            <span className={cn('text-[13px] font-mono', 'text-gray-700 dark:text-white/70')} title={offer.offerId}>
                              <span className="hidden sm:inline break-all">{offer.offerId}</span>
                              <span className="inline sm:hidden">{offer.offerId.slice(0, 12)}...{offer.offerId.slice(-8)}</span>
                            </span>
                          </DetailRow>
                          <DetailRow label="NFT" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                            <Link href={`/nft/${offer.NFTokenID}`} passHref>
                              <span className="text-primary text-[13px] font-mono hover:underline" title={offer.NFTokenID}>
                                <span className="hidden sm:inline break-all">{offer.NFTokenID}</span>
                                <span className="inline sm:hidden">{offer.NFTokenID.slice(0, 12)}...{offer.NFTokenID.slice(-8)}</span>
                              </span>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                                <Link href={`/address/${offer.Destination}`} passHref>
                                  <span className="text-primary text-[13px] font-mono hover:underline" title={offer.Destination}>
                                    <span className="hidden sm:inline">{offer.Destination}</span>
                                    <span className="inline sm:hidden">{offer.Destination.slice(0, 10)}...{offer.Destination.slice(-6)}</span>
                                  </span>
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
                                <Grid size={{ xs: 12, md: 8 }}>{fallbackView}</Grid>
                              </>
                            ) : (
                              <Grid size={{ xs: 12 }}>{fallbackView}</Grid>
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
                        <span key={offer} className={cn('text-[13px] font-mono block', 'text-gray-700 dark:text-white/70')} title={offer}>
                          <span className="hidden sm:inline break-all">{offer}</span>
                          <span className="inline sm:hidden">{offer.slice(0, 12)}...{offer.slice(-8)}</span>
                        </span>
                      ))}
                    </DetailRow>
                  )
                )}
              </>
            )}

            {TransactionType === 'NFTokenAcceptOffer' && acceptedOfferDetails && (
              <>
                {(NFTokenSellOffer || NFTokenBuyOffer) && (
                  <DetailRow label={NFTokenSellOffer ? 'Sell Offer' : 'Buy Offer'}>
                    <span
                      className={cn(
                        'text-[13px] font-mono',
                        'text-gray-700 dark:text-white/70'
                      )}
                      title={NFTokenSellOffer || NFTokenBuyOffer}
                    >
                      {(NFTokenSellOffer || NFTokenBuyOffer).slice(0, 16)}...{(NFTokenSellOffer || NFTokenBuyOffer).slice(-12)}
                    </span>
                  </DetailRow>
                )}
                {NFTokenSellOffer && NFTokenBuyOffer && (
                  <DetailRow label="Buy Offer">
                    <span
                      className={cn(
                        'text-[13px] font-mono',
                        'text-gray-700 dark:text-white/70'
                      )}
                      title={NFTokenBuyOffer}
                    >
                      {NFTokenBuyOffer.slice(0, 16)}...{NFTokenBuyOffer.slice(-12)}
                    </span>
                  </DetailRow>
                )}
                <DetailRow label="From">
                  <Link href={`/address/${acceptedOfferDetails.seller}`}>
                    <span className="text-primary text-[13px] font-mono hover:underline" title={acceptedOfferDetails.seller}>
                      <span className="hidden sm:inline">{acceptedOfferDetails.seller}</span>
                      <span className="inline sm:hidden">{acceptedOfferDetails.seller.slice(0, 10)}...{acceptedOfferDetails.seller.slice(-6)}</span>
                    </span>
                  </Link>
                </DetailRow>
                <DetailRow label="To">
                  <Link href={`/address/${acceptedOfferDetails.buyer}`}>
                    <span className="text-primary text-[13px] font-mono hover:underline" title={acceptedOfferDetails.buyer}>
                      <span className="hidden sm:inline">{acceptedOfferDetails.buyer}</span>
                      <span className="inline sm:hidden">{acceptedOfferDetails.buyer.slice(0, 10)}...{acceptedOfferDetails.buyer.slice(-6)}</span>
                    </span>
                  </Link>
                </DetailRow>
                {acceptedOfferDetails.amount && (
                  <DetailRow label="Sale Price">
                    <AmountDisplay amount={acceptedOfferDetails.amount} />
                  </DetailRow>
                )}
                {/* NFT Card - Structured Layout */}
                {nftInfoLoading ? (
                  <div className={cn('mx-4 my-3 p-4 rounded-xl', 'bg-gray-50 dark:bg-white/[0.02]')}>
                    <div className="flex items-center gap-3">
                      <div className="w-28 h-28 rounded-lg bg-white/5 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ) : acceptedNftInfo ? (
                  <div
                    className={cn(
                      'mx-4 my-3 rounded-xl overflow-hidden',
                      'bg-gray-50 border border-gray-200 dark:bg-white/[0.02] dark:border dark:border-white/10'
                    )}
                  >
                    <div className="flex">
                      {/* NFT Image - Fixed square */}
                      {getNftImage(acceptedNftInfo) && (
                        <Link href={`/nft/${acceptedNftInfo.NFTokenID}`} className="flex-shrink-0">
                          <img
                            src={getNftImage(acceptedNftInfo)}
                            alt={acceptedNftInfo.meta?.name || 'NFT'}
                            className="w-28 h-28 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </Link>
                      )}
                      {/* NFT Info - Grid Layout */}
                      <div className="flex-1 p-3 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link href={`/nft/${acceptedNftInfo.NFTokenID}`}>
                              <h3 className={cn('text-[14px] font-medium hover:text-primary cursor-pointer', 'text-gray-900 dark:text-white')}>
                                {acceptedNftInfo.meta?.name || 'Unnamed NFT'}
                              </h3>
                            </Link>
                            {acceptedNftInfo.collection && (
                              <Link href={`/nfts/${acceptedNftInfo.cslug || acceptedNftInfo.collection}`}>
                                <span className="text-[11px] text-primary hover:underline">{acceptedNftInfo.collection}</span>
                              </Link>
                            )}
                          </div>
                          {typeof acceptedNftInfo.royalty !== 'undefined' && acceptedNftInfo.royalty > 0 && (
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded', 'bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-white/50')}>
                              {acceptedNftInfo.royalty / 1000}% royalty
                            </span>
                          )}
                        </div>
                        {/* Structured NFT Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2">
                          <div>
                            <span className={cn('text-[10px] uppercase block', 'text-gray-400 dark:text-white/30')}>Issuer</span>
                            <Link href={`/address/${acceptedNftInfo.issuer}`}>
                              <span className="text-[11px] text-primary hover:underline font-mono">{acceptedNftInfo.issuer.slice(0, 8)}...{acceptedNftInfo.issuer.slice(-4)}</span>
                            </Link>
                          </div>
                          <div>
                            <span className={cn('text-[10px] uppercase block', 'text-gray-400 dark:text-white/30')}>ID</span>
                            <Link href={`/nft/${acceptedNftInfo.NFTokenID}`}>
                              <span className="text-[11px] text-primary hover:underline font-mono">{acceptedNftInfo.NFTokenID.slice(0, 8)}...{acceptedNftInfo.NFTokenID.slice(-8)}</span>
                            </Link>
                          </div>
                          <div>
                            <span className={cn('text-[10px] uppercase block', 'text-gray-400 dark:text-white/30')}>Taxon</span>
                            <span className={cn('text-[11px]', 'text-gray-600 dark:text-white/70')}>{acceptedNftInfo.taxon}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <DetailRow label="NFT">
                    <Link href={`/nft/${acceptedOfferDetails.nftokenID}`}>
                      <span className="text-primary hover:underline text-[13px] font-mono">
                        {acceptedOfferDetails.nftokenID.slice(0, 16)}...{acceptedOfferDetails.nftokenID.slice(-12)}
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
                    <span className={cn('text-[13px]', 'text-gray-500 dark:text-white/50')}>
                      Loading...
                    </span>
                  </DetailRow>
                ) : offerNftInfo ? (
                  <>
                    <DetailRow label="NFT">
                      <div className="flex items-center gap-3">
                        {getNftImage(offerNftInfo) && (
                          <img
                            src={getNftImage(offerNftInfo)}
                            alt={offerNftInfo.meta?.name || 'NFT'}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <Link href={`/nft/${offerNftInfo.NFTokenID}`}>
                          <span
                            className="text-primary text-[13px] font-mono hover:underline"
                            title={offerNftInfo.NFTokenID}
                          >
                            <span className="hidden sm:inline">{offerNftInfo.NFTokenID}</span>
                            <span className="inline sm:hidden">{offerNftInfo.NFTokenID.slice(0, 12)}...{offerNftInfo.NFTokenID.slice(-8)}</span>
                          </span>
                        </Link>
                      </div>
                    </DetailRow>
                    <DetailRow label="Issuer">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link href={`/address/${offerNftInfo.issuer}`}>
                          <span className="text-primary text-[13px] font-mono hover:underline" title={offerNftInfo.issuer}>
                            <span className="hidden sm:inline">{offerNftInfo.issuer}</span>
                            <span className="inline sm:hidden">{offerNftInfo.issuer.slice(0, 10)}...{offerNftInfo.issuer.slice(-6)}</span>
                          </span>
                        </Link>
                      </div>
                    </DetailRow>
                  </>
                ) : (
                  <DetailRow label="NFT">
                    <Link href={`/nft/${NFTokenID}`}>
                      <span className="text-primary text-[13px] font-mono hover:underline" title={NFTokenID}>
                        <span className="hidden sm:inline">{NFTokenID}</span>
                        <span className="inline sm:hidden">{NFTokenID.slice(0, 12)}...{NFTokenID.slice(-8)}</span>
                      </span>
                    </Link>
                  </DetailRow>
                )}
                {Owner && (
                  <DetailRow label="NFT Owner">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link href={`/address/${Owner}`}>
                        <span className="text-primary text-[13px] font-mono hover:underline" title={Owner}>
                          <span className="hidden sm:inline">{Owner}</span>
                          <span className="inline sm:hidden">{Owner.slice(0, 10)}...{Owner.slice(-6)}</span>
                        </span>
                      </Link>
                    </div>
                  </DetailRow>
                )}
                {meta.offer_id && (
                  <DetailRow label="Offer ID">
                    <span
                      className={cn(
                        'text-[13px] font-mono',
                        'text-gray-700 dark:text-white/70'
                      )}
                      title={meta.offer_id}
                    >
                      <span className="hidden sm:inline">{meta.offer_id}</span>
                      <span className="inline sm:hidden">{meta.offer_id.slice(0, 12)}...{meta.offer_id.slice(-8)}</span>
                    </span>
                  </DetailRow>
                )}
                <DetailRow label="Amount">
                  <AmountDisplay amount={Amount} />
                </DetailRow>
                {Destination && (
                  <DetailRow label="Destination">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link href={`/address/${Destination}`}>
                        <span className="text-primary text-[13px] font-mono hover:underline" title={Destination}>
                          <span className="hidden sm:inline">{Destination}</span>
                          <span className="inline sm:hidden">{Destination.slice(0, 10)}...{Destination.slice(-6)}</span>
                        </span>
                      </Link>
                    </div>
                  </DetailRow>
                )}
              </>
            )}

            {TransactionType === 'NFTokenMint' && (
              <>
                {meta.nftoken_id && (
                  <DetailRow label="NFT">
                    <div className="flex items-center gap-3">
                      {mintedNftInfoLoading ? (
                        <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse" />
                      ) : getNftImage(mintedNftInfo) ? (
                        <img
                          src={getNftImage(mintedNftInfo)}
                          alt={mintedNftInfo?.meta?.name || 'NFT'}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : null}
                      <Link href={`/nft/${meta.nftoken_id}`}>
                        <span
                          className="text-primary text-[13px] font-mono hover:underline"
                          title={meta.nftoken_id}
                        >
                          <span className="hidden sm:inline">{meta.nftoken_id}</span>
                          <span className="inline sm:hidden">{meta.nftoken_id.slice(0, 12)}...{meta.nftoken_id.slice(-8)}</span>
                        </span>
                      </Link>
                    </div>
                  </DetailRow>
                )}
                {typeof TransferFee !== 'undefined' && (
                  <DetailRow label="Transfer Fee">
                    <span className={cn('text-[13px]', 'text-gray-700 dark:text-white/70')}>
                      {TransferFee / 1000}%
                    </span>
                  </DetailRow>
                )}
                {Flags > 0 && (
                  <DetailRow label="Flag">
                    <span className={cn('text-[13px]', 'text-gray-700 dark:text-white/70')}>
                      {getNFTokenMintFlagExplanation(Flags)}
                    </span>
                  </DetailRow>
                )}
                {typeof NFTokenTaxon !== 'undefined' && (
                  <DetailRow label="Taxon">
                    <span
                      className={cn(
                        'text-[13px] font-mono',
                        'text-gray-700 dark:text-white/70'
                      )}
                    >
                      {NFTokenTaxon}
                    </span>
                  </DetailRow>
                )}
                {URI && safeHexDecode(URI) && (
                  <DetailRow label="URI">
                    <Link href={safeHexDecode(URI)} target="_blank" rel="noopener noreferrer">
                      <span
                        className="text-primary text-[13px] hover:underline truncate block max-w-full"
                        title={safeHexDecode(URI)}
                      >
                        {safeHexDecode(URI)}
                      </span>
                    </Link>
                  </DetailRow>
                )}
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
                        <DetailRow label="Document ID" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                          <Typography variant="body1">{OracleDocumentID}</Typography>
                        </DetailRow>
                      )}
                      {Provider && safeHexDecode(Provider) && (
                        <DetailRow label="Provider" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                          <Typography variant="body1">{safeHexDecode(Provider)}</Typography>
                        </DetailRow>
                      )}
                      {typeof LastUpdateTime !== 'undefined' && (
                        <DetailRow
                          label="Last Update Time"
                          sx={{ mb: 1, pb: 1, borderBottom: 'none' }}
                        >
                          <Typography variant="body1" suppressHydrationWarning>
                            {formatDistanceToNow(new Date(LastUpdateTime * 1000))} ago (
                            {new Date(LastUpdateTime * 1000).toLocaleString()})
                          </Typography>
                        </DetailRow>
                      )}
                      {URI && safeHexDecode(URI) && (
                        <DetailRow label="URI" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                          <Link href={safeHexDecode(URI)} target="_blank" rel="noopener noreferrer" className="min-w-0">
                            <span className="text-[#4285f4] hover:underline text-[13px] truncate block max-w-full">
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
                        const base = BaseAsset === 'XRP' ? 'XRP' : normalizeCurrencyCode(BaseAsset);
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
                {/* Show LP tokens burned from metadata or transaction field */}
                {(ammChanges?.lpTokenChange || LPTokenIn) && (
                  <DetailRow label="LP Tokens Burned">
                    {ammChanges?.lpTokenChange ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[13px] bg-red-500/10 border border-red-500/20 text-[#ef4444]"
                        >
                          -{formatDecimal(new Decimal(ammChanges.lpTokenChange.value))}
                          <TokenDisplay
                            slug={`${ammChanges.lpTokenChange.issuer}-${ammChanges.lpTokenChange.rawCurrency}`}
                            currency={ammChanges.lpTokenChange.currency}
                            rawCurrency={ammChanges.lpTokenChange.rawCurrency}
                            variant="body2"
                          />
                        </span>
                      </div>
                    ) : (
                      <AmountDisplay amount={LPTokenIn} />
                    )}
                  </DetailRow>
                )}
                {/* Show assets received from metadata */}
                {ammChanges?.assetsReceived?.length > 0 && (
                  <DetailRow label="Assets Received">
                    <div className="flex flex-wrap gap-2">
                      {ammChanges.assetsReceived.map((asset, idx) => (
                        <span
                          key={`${asset.currency}-${idx}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[13px] bg-emerald-500/10 border border-emerald-500/20 text-[#10b981]"
                        >
                          +{formatDecimal(new Decimal(asset.value))}
                          {asset.currency === 'XRP' ? (
                            <XrpDisplay variant="body2" showText={true} />
                          ) : (
                            <TokenDisplay
                              slug={`${asset.issuer}-${asset.rawCurrency}`}
                              currency={asset.currency}
                              rawCurrency={asset.rawCurrency}
                              variant="body2"
                            />
                          )}
                        </span>
                      ))}
                    </div>
                  </DetailRow>
                )}
                {Flags > 0 && getAMMWithdrawFlagExplanation(Flags) && (
                  <DetailRow label="Withdrawal Mode">
                    <Typography variant="body1">{getAMMWithdrawFlagExplanation(Flags)}</Typography>
                  </DetailRow>
                )}
              </>
            )}

            {/* NFTokenBurn Details */}
            {TransactionType === 'NFTokenBurn' && NFTokenID && (
              <DetailRow label="Burned NFT">
                <Link href={`/nft/${NFTokenID}`} passHref>
                  <span className="text-primary text-[13px] font-mono hover:underline" title={NFTokenID}>
                    <span className="hidden sm:inline">{NFTokenID}</span>
                    <span className="inline sm:hidden">{NFTokenID.slice(0, 12)}...{NFTokenID.slice(-8)}</span>
                  </span>
                </Link>
              </DetailRow>
            )}

            {/* AccountSet Details */}
            {TransactionType === 'AccountSet' && (
              <>
                {txData.Domain && safeHexDecode(txData.Domain) && (
                  <DetailRow label="Domain">
                    <Typography variant="body1">{safeHexDecode(txData.Domain)}</Typography>
                  </DetailRow>
                )}
                {txData.EmailHash && (
                  <DetailRow label="Email Hash">
                    <span className="text-[13px] font-mono break-all">{txData.EmailHash}</span>
                  </DetailRow>
                )}
                {txData.MessageKey && (
                  <DetailRow label="Message Key">
                    <span className={cn('text-[13px] font-mono', 'text-gray-700 dark:text-white/70')} title={txData.MessageKey}>
                      <span className="hidden sm:inline break-all">{txData.MessageKey}</span>
                      <span className="inline sm:hidden">{txData.MessageKey.slice(0, 16)}...{txData.MessageKey.slice(-8)}</span>
                    </span>
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
                  <span className="text-primary text-[13px] font-mono hover:underline" title={txData.RegularKey}>
                    <span className="hidden sm:inline">{txData.RegularKey}</span>
                    <span className="inline sm:hidden">{txData.RegularKey.slice(0, 10)}...{txData.RegularKey.slice(-6)}</span>
                  </span>
                </Link>
              </DetailRow>
            )}

            {/* Check Transactions */}
            {(TransactionType === 'CheckCreate' ||
              TransactionType === 'CheckCash' ||
              TransactionType === 'CheckCancel') && (
              <>
                {txData.CheckID && (
                  <DetailRow label="Check ID">
                    <span className={cn('text-[13px] font-mono', 'text-gray-700 dark:text-white/70')} title={txData.CheckID}>
                      <span className="hidden sm:inline break-all">{txData.CheckID}</span>
                      <span className="inline sm:hidden">{txData.CheckID.slice(0, 12)}...{txData.CheckID.slice(-8)}</span>
                    </span>
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
            {(TransactionType === 'EscrowCreate' ||
              TransactionType === 'EscrowFinish' ||
              TransactionType === 'EscrowCancel') && (
              <>
                {txData.FinishAfter && parseTransactionDate(txData.FinishAfter) && (
                  <DetailRow label="Can Finish After">
                    <Typography variant="body1" suppressHydrationWarning>
                      {parseTransactionDate(txData.FinishAfter).toLocaleString()}
                    </Typography>
                  </DetailRow>
                )}
                {txData.CancelAfter && parseTransactionDate(txData.CancelAfter) && (
                  <DetailRow label="Expires After">
                    <Typography variant="body1" suppressHydrationWarning>
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
                    <span className={cn('text-[13px] font-mono', 'text-gray-700 dark:text-white/70')} title={txData.Condition}>
                      <span className="hidden sm:inline break-all">{txData.Condition}</span>
                      <span className="inline sm:hidden">{txData.Condition.slice(0, 16)}...{txData.Condition.slice(-8)}</span>
                    </span>
                  </DetailRow>
                )}
                {txData.Fulfillment && (
                  <DetailRow label="Fulfillment">
                    <span className={cn('text-[13px] font-mono', 'text-gray-700 dark:text-white/70')} title={txData.Fulfillment}>
                      <span className="hidden sm:inline break-all">{txData.Fulfillment}</span>
                      <span className="inline sm:hidden">{txData.Fulfillment.slice(0, 16)}...{txData.Fulfillment.slice(-8)}</span>
                    </span>
                  </DetailRow>
                )}
              </>
            )}

            {/* Payment Channel Transactions */}
            {(TransactionType === 'PaymentChannelCreate' ||
              TransactionType === 'PaymentChannelFund' ||
              TransactionType === 'PaymentChannelClaim') && (
              <>
                {txData.Channel && (
                  <DetailRow label="Channel ID">
                    <span className={cn('text-[13px] font-mono', 'text-gray-700 dark:text-white/70')} title={txData.Channel}>
                      <span className="hidden sm:inline break-all">{txData.Channel}</span>
                      <span className="inline sm:hidden">{txData.Channel.slice(0, 12)}...{txData.Channel.slice(-8)}</span>
                    </span>
                  </DetailRow>
                )}
                {txData.SettleDelay && (
                  <DetailRow label="Settlement Delay">
                    <Typography variant="body1">{txData.SettleDelay} seconds</Typography>
                  </DetailRow>
                )}
                {txData.PublicKey && (
                  <DetailRow label="Public Key">
                    <span className={cn('text-[13px] font-mono', 'text-gray-700 dark:text-white/70')} title={txData.PublicKey}>
                      <span className="hidden sm:inline break-all">{txData.PublicKey}</span>
                      <span className="inline sm:hidden">{txData.PublicKey.slice(0, 12)}...{txData.PublicKey.slice(-8)}</span>
                    </span>
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
                    <span className="text-[13px] font-mono break-all">{txData.DIDDocument}</span>
                  </DetailRow>
                )}
                {txData.Data && (
                  <DetailRow label="Data">
                    <span className="text-[13px] font-mono break-all">{txData.Data}</span>
                  </DetailRow>
                )}
              </>
            )}

            {/* Credential Transactions */}
            {(TransactionType === 'CredentialCreate' ||
              TransactionType === 'CredentialAccept' ||
              TransactionType === 'CredentialDelete') && (
              <>
                {txData.CredentialType && (
                  <DetailRow label="Credential Type">
                    <Typography variant="body1">{txData.CredentialType}</Typography>
                  </DetailRow>
                )}
                {txData.Issuer && (
                  <DetailRow label="Issuer">
                    <Link href={`/address/${txData.Issuer}`} passHref>
                      <span className="text-primary text-[13px] font-mono hover:underline" title={txData.Issuer}>
                        <span className="hidden sm:inline">{txData.Issuer}</span>
                        <span className="inline sm:hidden">{txData.Issuer.slice(0, 10)}...{txData.Issuer.slice(-6)}</span>
                      </span>
                    </Link>
                  </DetailRow>
                )}
                {txData.Subject && (
                  <DetailRow label="Subject">
                    <Link href={`/address/${txData.Subject}`} passHref>
                      <span className="text-primary text-[13px] font-mono hover:underline" title={txData.Subject}>
                        <span className="hidden sm:inline">{txData.Subject}</span>
                        <span className="inline sm:hidden">{txData.Subject.slice(0, 10)}...{txData.Subject.slice(-6)}</span>
                      </span>
                    </Link>
                  </DetailRow>
                )}
              </>
            )}

            {/* AMM Create Details */}
            {TransactionType === 'AMMCreate' && (
              <>
                <DetailRow label="Initiated by">
                  <Link href={`/address/${Account}`}>
                    <span className="text-primary text-[13px] font-mono hover:underline" title={Account}>
                      <span className="hidden sm:inline">{Account}</span>
                      <span className="inline sm:hidden">{Account.slice(0, 10)}...{Account.slice(-6)}</span>
                    </span>
                  </Link>
                </DetailRow>
                {/* Show deposited assets */}
                {(Amount || Amount2) && (
                  <DetailRow label="Deposited">
                    <div className="flex flex-wrap gap-2">
                      {Amount && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[13px] bg-red-500/10 border border-red-500/20 text-[#ef4444]"
                        >
                          -{typeof Amount === 'string' ? (
                            <>
                              {dropsToXrp(Amount)}
                              <XrpDisplay variant="body2" showText={true} />
                            </>
                          ) : (
                            <>
                              {formatDecimal(new Decimal(Amount.value))}
                              <TokenDisplay
                                slug={`${Amount.issuer}-${Amount.currency}`}
                                currency={normalizeCurrencyCode(Amount.currency)}
                                rawCurrency={Amount.currency}
                                variant="body2"
                              />
                            </>
                          )}
                        </span>
                      )}
                      {Amount2 && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[13px] bg-red-500/10 border border-red-500/20 text-[#ef4444]"
                        >
                          -{typeof Amount2 === 'string' ? (
                            <>
                              {dropsToXrp(Amount2)}
                              <XrpDisplay variant="body2" showText={true} />
                            </>
                          ) : (
                            <>
                              {formatDecimal(new Decimal(Amount2.value))}
                              <TokenDisplay
                                slug={`${Amount2.issuer}-${Amount2.currency}`}
                                currency={normalizeCurrencyCode(Amount2.currency)}
                                rawCurrency={Amount2.currency}
                                variant="body2"
                              />
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </DetailRow>
                )}
                {/* Show LP tokens received from metadata */}
                {ammCreateDetails?.lpTokenBalance && (
                  <DetailRow label="Received">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[13px] bg-emerald-500/10 border border-emerald-500/20 text-[#10b981]"
                    >
                      +{formatDecimal(new Decimal(ammCreateDetails.lpTokenBalance.value))}
                      {(() => {
                        // Derive LP token name from the deposited assets
                        const asset1Name = typeof Amount === 'string' ? 'XRP' : normalizeCurrencyCode(Amount?.currency);
                        const asset2Name = typeof Amount2 === 'string' ? 'XRP' : normalizeCurrencyCode(Amount2?.currency);
                        const lpTokenName = asset1Name && asset2Name ? `${asset1Name}/${asset2Name} LP` : 'LP Token';
                        return (
                          <Link href={`/token/${ammCreateDetails.lpTokenBalance.issuer}-${ammCreateDetails.lpTokenBalance.currency}`}>
                            <span className="text-primary hover:underline ml-1">
                              {lpTokenName}
                            </span>
                          </Link>
                        );
                      })()}
                      <span className={cn('text-[11px] ml-1', 'text-gray-400 dark:text-white/50')}>
                        ({ammCreateDetails.lpTokenBalance.issuer.slice(0, 6)}...{ammCreateDetails.lpTokenBalance.issuer.slice(-6)})
                      </span>
                    </span>
                  </DetailRow>
                )}
                {txData.TradingFee !== undefined && (
                  <DetailRow label="Trading fee">
                    <span className={cn('text-[13px]', 'text-gray-700 dark:text-white/70')}>
                      {txData.TradingFee / 1000}%
                    </span>
                  </DetailRow>
                )}
                {/* Show specification of what was instructed */}
                {(Amount || Amount2) && (
                  <DetailRow label="Specification">
                    <span className={cn('text-[13px]', 'text-gray-500 dark:text-white/60')}>
                      It was instructed to deposit maximum{' '}
                      {Amount && (
                        <>
                          {typeof Amount === 'string' ? dropsToXrp(Amount) : formatDecimal(new Decimal(Amount.value))}{' '}
                          {typeof Amount === 'string' ? 'XRP' : normalizeCurrencyCode(Amount.currency)}
                          {Amount.issuer && ` (${Amount.issuer.slice(0, 6)}...${Amount.issuer.slice(-6)})`}
                        </>
                      )}
                      {Amount && Amount2 && ' and '}
                      {Amount2 && (
                        <>
                          {typeof Amount2 === 'string' ? dropsToXrp(Amount2) : formatDecimal(new Decimal(Amount2.value))}{' '}
                          {typeof Amount2 === 'string' ? 'XRP' : normalizeCurrencyCode(Amount2.currency)}
                          {Amount2.issuer && ` (${Amount2.issuer.slice(0, 6)}...${Amount2.issuer.slice(-6)})`}
                        </>
                      )}
                    </span>
                  </DetailRow>
                )}
              </>
            )}

            {displayExchange && isSuccess && (
              <>
                <DetailRow label="Sold">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    {formatDecimal(new Decimal(displayExchange.paid.value))}
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
                  </span>
                </DetailRow>
                <DetailRow label="Received">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {formatDecimal(new Decimal(displayExchange.got.value))}
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
                  </span>
                </DetailRow>
                <DetailRow label="Rate">
                  {(() => {
                    try {
                      const paidValue = new Decimal(displayExchange.paid.value);
                      const gotValue = new Decimal(displayExchange.got.value);

                      if (paidValue.isZero() || gotValue.isZero()) {
                        return (
                          <span
                            className={cn(
                              'text-[13px]',
                              'text-gray-400 dark:text-white/50'
                            )}
                          >
                            N/A
                          </span>
                        );
                      }

                      const rate = paidValue.div(gotValue);
                      return (
                        <span className="text-[13px] font-mono">
                          1 {displayExchange.got.currency} ={' '}
                          {rate.toFixed(rate.lt(0.000001) ? 15 : rate.lt(0.01) ? 10 : 6)}{' '}
                          {displayExchange.paid.currency}
                        </span>
                      );
                    } catch (error) {
                      return (
                        <span
                          className={cn('text-[13px]', 'text-gray-400 dark:text-white/50')}
                        >
                          N/A
                        </span>
                      );
                    }
                  })()}
                </DetailRow>
              </>
            )}

            {flagExplanations.length > 0 && (
              <DetailRow label="Flags">
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {TransactionType === 'Payment'
                    ? flagExplanations.map((flag) => (
                        <span
                          key={flag.title}
                          className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        >
                          {flag.title}
                        </span>
                      ))
                    : flagExplanations.map((text) => (
                        <span
                          key={text}
                          className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        >
                          {text}
                        </span>
                      ))}
                </div>
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
                      // If it's already readable text, use as-is
                      if (!isHex(value)) return value;
                      // Otherwise decode from hex
                      return decodeHex(value);
                    };

                    const memoType = decodeMemo(memo.Memo.MemoType);
                    const memoData = decodeMemo(memo.Memo.MemoData);

                    return (
                      <span
                        key={idx}
                        className="text-[13px] break-all block"
                      >
                        {[memoType, memoData].filter(Boolean).join(': ')}
                      </span>
                    );
                  })}
                </Stack>
              </DetailRow>
            )}
          </div>

          {/* Transaction Link */}
          <div
            className={cn(
              'grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start sm:items-center px-4 py-2.5 min-h-[44px] border-t gap-0.5 sm:gap-0',
              'border-gray-100 dark:border-white/[0.06]'
            )}
          >
            <span className={cn('text-[13px]', 'text-gray-500 dark:text-white/50')}>
              Link
            </span>
            <div className="flex items-center gap-2 sm:justify-end min-w-0">
              <Link href={`/tx/${hash}`} passHref className="min-w-0 overflow-hidden">
                <span
                  className="text-primary text-[13px] font-mono hover:underline truncate block"
                  title={txUrl}
                >
                  <span className="hidden sm:inline">{txUrl}</span>
                  <span className="inline sm:hidden">xrpl.to/tx/{hash.slice(0, 8)}...{hash.slice(-6)}</span>
                </span>
              </Link>
              <button
                onClick={copyUrlToClipboard}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-medium shrink-0 transition-[background-color,border-color]',
                  urlCopied
                    ? 'text-emerald-400'
                    : 'text-gray-500 hover:text-primary dark:text-white/50 dark:hover:text-primary'
                )}
              >
                {urlCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BALANCES Tab */}
      {activeTab === 'balances' && (
        <div
          className={cn(
            'rounded-xl overflow-hidden border-[1.5px]',
            'bg-white border-black/[0.08] dark:bg-transparent dark:border-white/10'
          )}
        >
          <div
            className={cn(
              'px-4 py-3',
              'border-b border-black/[0.08] dark:border-b dark:border-white/10'
            )}
          >
            <span
              className={cn(
                'text-[11px] font-medium uppercase tracking-wider',
                'text-gray-400 dark:text-white/50'
              )}
            >
              Balance Changes ({balanceChanges.length})
            </span>
          </div>
          {balanceChanges.length > 0 && isSuccess ? (
            <div
              className={cn('divide-y', 'divide-black/5 dark:divide-white/5')}
            >
              {balanceChanges.map(({ account, changes }, idx) => (
                <div
                  key={account}
                  className={cn(
                    'px-4 py-3 flex items-start gap-4 flex-wrap',
                    idx % 2 === 1 && ('bg-gray-50/50 dark:bg-white/[0.02]')
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 sm:min-w-[280px] flex-1">
                    <Link href={`/address/${account}`} passHref>
                      <span className="text-primary text-[13px] font-mono hover:underline" title={account}>
                        <span className="hidden sm:inline">{account}</span>
                        <span className="inline sm:hidden">{account.slice(0, 10)}...{account.slice(-6)}</span>
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
                          {sign}
                          {formatDecimal(new Decimal(change.value))}
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
            <div
              className={cn(
                'px-4 py-8 text-center text-[13px]',
                'text-gray-400 dark:text-white/50'
              )}
            >
              No balance changes
            </div>
          )}
        </div>
      )}

      {/* TECHNICAL Tab */}
      {activeTab === 'technical' && (
        <div
          className={cn(
            'rounded-xl overflow-hidden border-[1.5px]',
            'bg-white border-black/[0.08] dark:bg-transparent dark:border-white/10'
          )}
        >
          <div
            className={cn(
              'px-4 py-3',
              'border-b border-black/[0.08] dark:border-b dark:border-white/10'
            )}
          >
            <span
              className={cn(
                'text-[11px] font-medium uppercase tracking-wider',
                'text-gray-400 dark:text-white/50'
              )}
            >
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
                  <Link href={`/ledger/${LastLedgerSequence}`}>
                    <span className="text-primary hover:underline cursor-pointer">
                      #{LastLedgerSequence.toLocaleString()}
                    </span>
                  </Link>
                  {' '}({LastLedgerSequence - ledger_index} ledgers)
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
        <div
          className={cn(
            'rounded-xl overflow-hidden border-[1.5px]',
            'bg-white border-black/[0.08] dark:bg-transparent dark:border-white/10'
          )}
        >
          <div
            className={cn(
              'px-4 py-3',
              'border-b border-black/[0.08] dark:border-b dark:border-white/10'
            )}
          >
            <span
              className={cn(
                'text-[11px] font-medium uppercase tracking-wider',
                'text-gray-400 dark:text-white/50'
              )}
            >
              Raw Transaction JSON
            </span>
          </div>
          <div className="p-4 max-sm:p-2">
            <JsonViewer data={rawData} />
          </div>

          <div className={cn('px-4 py-3 border-t max-sm:px-2 max-sm:py-2', 'border-gray-200 dark:border-white/10')}>
            <span
              className={cn(
                'text-[11px] font-medium uppercase tracking-wider',
                'text-gray-400 dark:text-white/50'
              )}
            >
              Transaction Metadata
            </span>
          </div>
          <div className="p-4 max-sm:p-2">
            <JsonViewer data={meta} />
          </div>
        </div>
      )}

      {/* Copy notification toast */}
      {urlCopied && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={cn(
              'px-4 py-2.5 rounded-lg text-[13px] font-medium shadow-lg flex items-center gap-2',
              'bg-white text-gray-800 border border-gray-200 dark:bg-[#1a1a1a] dark:text-white dark:border dark:border-white/10'
            )}
          >
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
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  const hash = router.query.hash;
  const txType = txData?.TransactionType || 'Transaction';
  const pageTitle = txData
    ? `${txType} - ${hash?.slice(0, 8)}... | XRPL.to`
    : 'Transaction Details | XRPL.to';
  const pageDescription = txData
    ? `View ${txType} transaction ${hash} on the XRP Ledger. Explore balances, technical details, and raw JSON.`
    : 'View transaction details on the XRP Ledger.';

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Head>
      <Header />
      <div className={cn('flex-1 max-w-[1920px] mx-auto w-full px-2 sm:px-4 mt-4 overflow-hidden')}>
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-normal mb-2">Transaction Details</h1>
        </div>
        {error ? (
          <div
            className={cn(
              'rounded-xl border-[1.5px] p-8 text-center max-w-md mx-auto mt-8',
              'border-gray-200 bg-gray-50/50 dark:border-white/10 dark:bg-white/[0.02]'
            )}
          >
            <div className="relative w-14 h-14 mx-auto mb-4">
              <div className={cn('absolute -top-1 left-0 w-5 h-5 rounded-full', 'bg-gray-200 dark:bg-white/15')}>
                <div className={cn('absolute top-1 left-1 w-3 h-3 rounded-full', 'bg-gray-100 dark:bg-white/10')} />
              </div>
              <div className={cn('absolute -top-1 right-0 w-5 h-5 rounded-full', 'bg-gray-200 dark:bg-white/15')}>
                <div className={cn('absolute top-1 right-1 w-3 h-3 rounded-full', 'bg-gray-100 dark:bg-white/10')} />
              </div>
              <div className={cn('absolute top-2 left-1/2 -translate-x-1/2 w-12 h-11 rounded-full', 'bg-gray-200 dark:bg-white/15')}>
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={cn('h-[2px] w-full', 'bg-gray-300/50 dark:bg-white/15')} style={{ marginTop: i * 3 + 2, transform: `translateX(${i % 2 === 0 ? '1px' : '-1px'})` }} />
                  ))}
                </div>
                <div className="absolute top-3 left-2 w-3 h-3 flex items-center justify-center">
                  <div className={cn('absolute w-2.5 h-[2px] rotate-45', 'bg-gray-400 dark:bg-white/40')} />
                  <div className={cn('absolute w-2.5 h-[2px] -rotate-45', 'bg-gray-400 dark:bg-white/40')} />
                </div>
                <div className="absolute top-3 right-2 w-3 h-3 flex items-center justify-center">
                  <div className={cn('absolute w-2.5 h-[2px] rotate-45', 'bg-gray-400 dark:bg-white/40')} />
                  <div className={cn('absolute w-2.5 h-[2px] -rotate-45', 'bg-gray-400 dark:bg-white/40')} />
                </div>
                <div className={cn('absolute bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-4 rounded-full', 'bg-gray-100 dark:bg-white/10')}>
                  <div className={cn('absolute top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2 rounded-full', 'bg-gray-300 dark:bg-white/25')} />
                </div>
              </div>
            </div>
            <p
              className={cn(
                'text-sm font-medium tracking-widest mb-2',
                'text-gray-600 dark:text-white/80'
              )}
            >
              TX NOT FOUND
            </p>
            <p className={cn('text-xs mb-6', 'text-gray-400 dark:text-white/30')}>
              {error}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/">
                <button
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] text-[13px] font-normal transition-[background-color,border-color]',
                    'border-gray-300 text-gray-700 hover:border-primary hover:bg-primary/5 dark:border-white/15 dark:text-white/80 dark:hover:border-primary dark:hover:bg-primary/5'
                  )}
                >
                  <Home size={14} />
                  Go Home
                </button>
              </Link>
              <button
                onClick={() => router.back()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] text-[13px] font-normal transition-[background-color,border-color]',
                  'border-gray-300 text-gray-700 hover:border-primary hover:bg-primary/5 dark:border-white/15 dark:text-white/80 dark:hover:border-primary dark:hover:bg-primary/5'
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

  const response = await api.get(`https://api.xrpl.to/v1/tx/${hash}`, { timeout: 8000 }).catch(() => null);

  if (!response || !response.data) {
    return {
      props: {
        txData: null,
        error: 'Transaction not found. Please check the hash and try again.'
      }
    };
  }

  try {
    if (response.data.error) {
      if (response.status === 404) {
        return { notFound: true };
      }
      return {
        props: {
          txData: null,
          error: response.data.error || 'Transaction not found'
        }
      };
    }

    const { tx_json, meta, ...rest } = response.data;
    // Flatten tx_json into the response for compatibility
    const txData = { ...rest, ...tx_json, meta: meta ?? null };

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
