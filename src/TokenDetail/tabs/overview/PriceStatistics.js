import Decimal from 'decimal.js-light';
import PropTypes from 'prop-types';
import { useState, useEffect, useContext } from 'react';
import styled from '@emotion/styled';
import { AlertTriangle, Lock, Copy, Twitter, Send, MessageCircle, Globe, Github, TrendingUp, Link as LinkIcon } from 'lucide-react';
import IssuerInfoDialog from '../../dialogs/IssuerInfoDialog';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { fNumber, fDate } from 'src/utils/formatters';
import { AppContext } from 'src/AppContext';

// Helper
const alpha = (color, opacity) => color.replace(')', `, ${opacity})`);

// Custom components
const Box = styled.div``;
const Stack = styled.div`
  display: flex;
  flex-direction: ${props => props.direction || 'column'};
  align-items: ${props => props.alignItems || 'stretch'};
  gap: ${props => props.spacing ? `${props.spacing * 8}px` : '0'};
  flex-wrap: ${props => props.flexWrap || 'nowrap'};
`;
const Typography = styled.div`
  font-size: ${props =>
    props.variant === 'h6' ? '1.25rem' :
    props.variant === 'body2' ? '0.875rem' :
    props.variant === 'caption' ? '0.75rem' : '1rem'};
  font-weight: ${props => props.fontWeight || 400};
  color: ${props => props.color || (props.isDark ? '#FFFFFF' : '#212B36')};
  white-space: ${props => props.noWrap ? 'nowrap' : 'normal'};
`;
const Table = styled.table`
  width: 100%;
  background: transparent;
`;
const TableBody = styled.tbody``;
const TableRow = styled.tr``;
const TableCell = styled.td`
  padding: ${props => props.padding || '4px 6px'};
  border-bottom: none;
  text-align: ${props => props.align || 'left'};
`;
const Chip = styled.div`
  display: inline-flex;
  align-items: center;
  padding: ${props => props.size === 'small' ? '2px 8px' : '4px 12px'};
  border-radius: 8px;
  font-size: ${props => props.fontSize || '11px'};
  font-weight: 400;
  cursor: ${props => props.onClick ? 'pointer' : 'default'};
`;
const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.size === 'small' ? '4px' : '8px'};
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
`;
const Link = styled.a`
  text-decoration: none;
  color: inherit;
  &:hover {
    text-decoration: underline;
  }
`;
const Tooltip = ({ title, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.9)',
          color: '#fff',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'pre-line',
          zIndex: 1000,
          marginBottom: '4px',
          minWidth: 'max-content'
        }}>
          {title}
        </div>
      )}
    </div>
  );
};
const Dialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: ${props => props.open ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
const DialogPaper = styled.div`
  background: ${props => props.isDark ? '#0a0a0a' : '#ffffff'};
  border-radius: 12px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
  padding: 0;
  max-width: 600px;
  width: 100%;
`;
const DialogContent = styled.div`
  padding: 16px;
  text-align: ${props => props.textAlign || 'left'};
`;
const Button = styled.button`
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 400;
  border-radius: 10px;
  border: 1.5px solid rgba(244, 67, 54, 0.3);
  cursor: pointer;
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  &:hover {
    background: rgba(244, 67, 54, 0.15);
    border-color: rgba(244, 67, 54, 0.4);
  }
`;

const StyledTable = styled(Table)`
  margin-top: 4px;
`;

const ModernTableCell = styled(TableCell)`
  padding: 6px 10px;
  border-bottom: none;
`;

// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};

// ----------------------------------------------------------------------

export default function PriceStatistics({ token, isDark = false }) {
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency, openSnackbar } = useContext(AppContext);
  const [openIssuerInfo, setOpenIssuerInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [creations, setCreations] = useState(0);
  const [openScamWarning, setOpenScamWarning] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const {
    id,
    name,
    amount,
    exch,
    maxMin24h = [0, 0],
    vol24hxrp,
    marketcap,
    dom,
    issuer,
    issuer_info,
    creator,
    tags,
    social,
    origin,
    holders,
    trustlines,
    uniqueTraders24h,
    vol24htx,
    date,
    dateon
  } = token;

  useEffect(() => {
    if (creator) {
      fetch(`https://api.xrpscan.com/api/v1/account/${creator}/activated`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.accounts) {
            let count = 0;
            const hasLegacy = data.accounts.some((acc) => acc.ledger_index <= 91444888);
            if (hasLegacy) {
              count = 1;
            } else {
              count = data.accounts.filter((acc) => acc.initial_balance > 98).length;
            }
            setCreations(count);
          }
        })
        .catch((err) => console.error('Failed to fetch account creations:', err));
    }
  }, [creator]);

  const info = issuer_info || {};

  function truncate(str, n) {
    if (!str) return '';
    const effectiveN = isMobile ? Math.floor(n * 0.7) : n; // Make truncation more aggressive on mobile
    return str.length > effectiveN ? str.substr(0, effectiveN - 1) + '... ' : str;
  }

  let user = token.user;
  if (!user) user = name;

  const voldivmarket =
    marketcap > 0 && vol24hxrp != null
      ? new Decimal(vol24hxrp || 0).div(marketcap || 1).toNumber()
      : 0;

  const handleOpenIssuerInfo = () => {
    setOpenIssuerInfo(true);
  };

  // Create enhanced tags array that includes origin-based tags (same as UserDesc.js)
  const getOriginTag = (origin) => {
    switch (origin) {
      case 'FirstLedger':
        return 'FirstLedger';
      case 'XPMarket':
        return 'XPMarket';
      case 'LedgerMeme':
        return 'LedgerMeme';
      case 'Horizon':
        return 'Horizon';
      case 'aigent.run':
        return 'aigent.run';
      case 'Magnetic X':
        return 'Magnetic X';
      case 'xrp.fun':
        return 'xrp.fun';
      default:
        return null;
    }
  };

  const enhancedTags = (() => {
    const baseTags = tags || [];
    const originTag = getOriginTag(origin);

    if (originTag && !baseTags.includes(originTag)) {
      return [originTag, ...baseTags];
    }

    return baseTags;
  })();

  const hasScamTag = enhancedTags.some((tag) => tag.toLowerCase() === 'scam');

  useEffect(() => {
    if (hasScamTag) {
      setOpenScamWarning(true);
    }
  }, [hasScamTag]);

  return (
    <Box
      style={{
        borderRadius: '10px',
        background: 'transparent',
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        width: '100%',
        marginBottom: '6px'
      }}
    >
      <IssuerInfoDialog open={openIssuerInfo} setOpen={setOpenIssuerInfo} token={token} />

      {/* Scam Warning Dialog */}
      {openScamWarning && (
        <Dialog open>
          <DialogPaper isDark={isDark} onClick={(e) => e.stopPropagation()}>
            <DialogContent style={{ textAlign: 'center', padding: '16px' }}>
              <AlertTriangle size={32} color="#f44336" style={{ marginBottom: '8px' }} />
              <Typography
                variant="h6"
                style={{
                  color: '#f44336',
                  fontWeight: 400,
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}
              >
                Scam Warning
              </Typography>
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  marginBottom: '16px'
                }}
              >
                This token has been flagged as a potential scam. Please exercise extreme caution.
              </Typography>
              <Button
                isDark={isDark}
                onClick={() => setOpenScamWarning(false)}
              >
                I Understand
              </Button>
            </DialogContent>
          </DialogPaper>
        </Dialog>
      )}

      {/* Header */}
      <Box
        style={{
          padding: '8px 10px 4px'
        }}
      >
        <Typography
          variant="h6"
          isDark={isDark}
          style={{
            fontSize: '10px',
            fontWeight: 500,
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(33,43,54,0.4)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}
        >
          Additional Details
        </Typography>
      </Box>

      <StyledTable size="small" style={{ marginTop: '4px' }}>
        <TableBody>
          {/* Issuer Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  fontWeight: 400,
                  color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                  fontSize: '11px'
                }}
                noWrap
              >
                Issuer
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Stack direction="row" alignItems="center" spacing={isMobile ? 0.75 : 1.25} style={{ minWidth: 0, flex: 1 }}>
                <Chip
                  size="small"
                  style={{
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    borderRadius: '8px',
                    height: '26px',
                    cursor: 'pointer',
                    background: alpha('rgba(66,133,244,1)', 0.08),
                    border: `1.5px solid ${alpha('rgba(66,133,244,1)', 0.15)}`,
                    color: '#4285f4',
                    fontWeight: 400,
                    gap: '6px',
                    minWidth: 0,
                    maxWidth: isMobile ? '120px' : '200px',
                    overflow: 'hidden'
                  }}
                  onClick={handleOpenIssuerInfo}
                >
                  <Typography
                    variant="caption"
                    style={{ fontWeight: 400, fontSize: '11px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {issuer}
                  </Typography>
                  {info.blackholed && (
                    <Tooltip title="Blackholed - Cannot issue more tokens">
                      <Lock size={14} color="#2E7D32" />
                    </Tooltip>
                  )}
                </Chip>
                <Tooltip title="Copy issuer address">
                  <IconButton
                    onClick={() => {
                      navigator.clipboard.writeText(issuer).then(() => {
                        openSnackbar('Copied!', 'success');
                      });
                    }}
                    size="small"
                    style={{
                      padding: '4px',
                      width: '26px',
                      height: '26px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`
                    }}
                  >
                    <Copy size={isMobile ? 12 : 14} color="#4285f4" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </ModernTableCell>
          </TableRow>

          {/* Creator Row */}
          {creator && (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
                  }}
                  noWrap
                >
                  Creator
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Stack direction="row" alignItems="center" spacing={isMobile ? 0.75 : 1.25} style={{ minWidth: 0, flex: 1 }}>
                  <Chip
                    size="small"
                    style={{
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      borderRadius: '8px',
                      height: '26px',
                      background: alpha('rgba(156,39,176,1)', 0.08),
                      border: `1.5px solid ${alpha('rgba(156,39,176,1)', 0.15)}`,
                      color: '#9C27B0',
                      fontWeight: 400,
                      minWidth: 0,
                      maxWidth: isMobile ? '120px' : '200px',
                      overflow: 'hidden'
                    }}
                  >
                    <Typography
                      variant="caption"
                      style={{ fontWeight: 400, fontSize: '11px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {creator}
                    </Typography>
                  </Chip>
                  <Tooltip title="Copy creator address">
                    <IconButton
                      onClick={() => {
                        navigator.clipboard.writeText(creator).then(() => {
                          openSnackbar('Copied!', 'success');
                        });
                      }}
                      size="small"
                      style={{
                        padding: '4px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`
                      }}
                    >
                      <Copy size={isMobile ? 10 : 12} color="#9C27B0" />
                    </IconButton>
                  </Tooltip>
                  {creations > 0 ? (
                    <Tooltip title="Number of tokens created by this creator.">
                      <Chip
                        size="small"
                        style={{
                          borderRadius: '8px',
                          height: '20px',
                          background: alpha('rgba(33,150,243,1)', 0.08),
                          border: `1.5px solid ${alpha('rgba(33,150,243,1)', 0.15)}`,
                          color: '#2196F3',
                          fontWeight: 400,
                          fontSize: '10px',
                          paddingLeft: '8px',
                          paddingRight: '8px',
                          flexShrink: 0
                        }}
                      >
                        {creations}
                      </Chip>
                    </Tooltip>
                  ) : null}
                </Stack>
              </ModernTableCell>
            </TableRow>
          )}

          {/* Volume/Market Cap Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  fontWeight: 400,
                  color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                  fontSize: '11px'
                }}
                noWrap
              >
                Volume / Market Cap
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  fontWeight: 400,
                  color: '#FF9800',
                  fontSize: '12px'
                }}
              >
                {fNumber(voldivmarket)}
              </Typography>
            </ModernTableCell>
          </TableRow>

          {/* Market Dominance Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  fontWeight: 400,
                  color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                  fontSize: '11px'
                }}
                noWrap
              >
                Market Dominance
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  fontWeight: 400,
                  color: '#22c55e',
                  fontSize: '12px'
                }}
              >
                {fNumber(dom || 0)} %
              </Typography>
            </ModernTableCell>
          </TableRow>

          {/* Diluted Market Cap Row */}
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  fontWeight: 400,
                  color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                  fontSize: '11px'
                }}
                noWrap
              >
                Fully Diluted Market Cap
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  fontWeight: 400,
                  color: '#3b82f6',
                  fontSize: '12px'
                }}
              >
                {currencySymbols[activeFiatCurrency]}{' '}
                {fNumber(amount * (exch / (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1)))}
              </Typography>
            </ModernTableCell>
          </TableRow>

          {/* Supply Row */}
          {amount ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
                  }}
                  noWrap
                >
                  Supply
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: '#FF9800',
                    fontSize: '12px'
                  }}
                >
                  {fNumber(amount)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Holders Row */}
          {holders ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
                  }}
                  noWrap
                >
                  Holders
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: '#3b82f6',
                    fontSize: '12px'
                  }}
                >
                  {fNumber(holders)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Trustlines Row */}
          {trustlines ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
                  }}
                  noWrap
                >
                  Trustlines
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: '#3b82f6',
                    fontSize: '12px'
                  }}
                >
                  {fNumber(trustlines)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Unique Traders (24h) Row */}
          {uniqueTraders24h ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
                  }}
                  noWrap
                >
                  Unique Traders (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: '#FF9800',
                    fontSize: '12px'
                  }}
                >
                  {fNumber(uniqueTraders24h)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Trades (24h) Row */}
          {vol24htx ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
                  }}
                  noWrap
                >
                  Trades (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: '#F57C00',
                    fontSize: '12px'
                  }}
                >
                  {fNumber(vol24htx)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Created Date Row */}
          {date || dateon ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
                  }}
                  noWrap
                >
                  Created
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                    fontSize: '12px'
                  }}
                >
                  {fDate(date || dateon)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Social Links & Tags Row */}
          {social || enhancedTags.length > 0 ? (
            <TableRow>
              <ModernTableCell align="left">
                <Typography
                  isDark={isDark}
                variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
                  }}
                  noWrap
                >
                  Social & Tags
                </Typography>
              </ModernTableCell>
              <ModernTableCell align="left">
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={isMobile ? 0.5 : 1.25}
                  style={{ flexWrap: 'wrap', gap: isMobile ? 0.25 : 0.75 }}
                >
                  <CompactTags enhancedTags={enhancedTags} maxTags={isMobile ? 2 : 3} />
                  <CompactSocialLinks social={social} size="small" />
                </Stack>
              </ModernTableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </StyledTable>
    </Box>
  );
}

PriceStatistics.propTypes = {
  token: PropTypes.object.isRequired
};

// Helper function to normalize tags for URL slugs
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

// Helper function to get full URLs for social platforms
const getFullUrl = (platform, handle) => {
  if (!handle) return '#';
  if (handle.startsWith('http')) return handle;
  switch (platform) {
    case 'twitter':
    case 'x':
      return `https://x.com/${handle}`;
    case 'telegram':
      return `https://t.me/${handle}`;
    case 'discord':
      return `https://discord.gg/${handle}`;
    case 'github':
      return `https://github.com/${handle}`;
    case 'reddit':
      return `https://www.reddit.com/user/${handle}`;
    case 'facebook':
      return `https://www.facebook.com/${handle}`;
    case 'linkedin':
      return `https://www.linkedin.com/company/${handle}`;
    case 'instagram':
      return `https://www.instagram.com/${handle}`;
    case 'youtube':
      return `https://www.youtube.com/@${handle}`;
    case 'medium':
      return `https://medium.com/@${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'twitch':
      return `https://www.twitch.tv/${handle}`;
    case 'website':
      return `https://${handle}`;
    default:
      return handle;
  }
};

// Compact social links component for header integration
export const CompactSocialLinks = ({ social, toggleLinksDrawer, size = 'small', isDark = false }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!social) return null;

  const socialEntries = Object.entries(social).filter(([key, value]) => value);
  if (socialEntries.length === 0) return null;

  const getIcon = (platform) => {
    const size = isMobile ? 12 : 14;
    const color = '#4285f4';
    switch(platform) {
      case 'twitter':
      case 'x': return <Twitter size={size} color={color} />;
      case 'telegram': return <Send size={size} color={color} />;
      case 'discord': return <MessageCircle size={size} color={color} />;
      case 'website': return <Globe size={size} color={color} />;
      case 'github': return <Github size={size} color={color} />;
      case 'reddit': return <TrendingUp size={size} color={color} />;
      default: return <LinkIcon size={size} color={color} />;
    }
  };

  return (
    <Stack direction="row" spacing={0.75} alignItems="center" style={{ gap: '8px' }}>
      {socialEntries.slice(0, 4).map(([platform, url]) => (
        <Tooltip key={platform} title={`${platform}: ${url}`}>
          <IconButton
            as="a"
            href={getFullUrl(platform, url)}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            style={{
              width: '26px',
              height: '26px',
              padding: '4px',
              borderRadius: '8px',
              background: alpha('rgba(66,133,244,1)', 0.08),
              border: `1.5px solid ${alpha('rgba(66,133,244,1)', 0.15)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {getIcon(platform)}
          </IconButton>
        </Tooltip>
      ))}
      {socialEntries.length > 4 && toggleLinksDrawer && (
        <Tooltip title="View all links">
          <IconButton
            onClick={() => toggleLinksDrawer(true)}
            size="small"
            style={{
              width: '26px',
              height: '26px',
              padding: '4px',
              borderRadius: '8px',
              background: alpha('rgba(156,39,176,1)', 0.08),
              border: `1.5px solid ${alpha('rgba(156,39,176,1)', 0.15)}`,
              color: '#9C27B0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography style={{ fontSize: '11px', fontWeight: 400 }}>
              +{socialEntries.length - 4}
            </Typography>
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

// Compact tags component for inline integration
export const CompactTags = ({ enhancedTags, toggleTagsDrawer, maxTags = 3, isDark = false }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!enhancedTags || enhancedTags.length === 0) return null;

  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      style={{ flexWrap: 'wrap', gap: '8px' }}
    >
      {enhancedTags.slice(0, maxTags).map((tag) => (
        <Link
          key={tag}
          href={`/view/${normalizeTag(tag)}`}
          style={{ display: 'inline-flex', textDecoration: 'none' }}
          rel="noreferrer noopener nofollow"
        >
          <Chip
            size="small"
            style={{
              height: '24px',
              fontSize: '10px',
              borderRadius: '8px',
              paddingLeft: '10px',
              paddingRight: '10px',
              background: alpha('rgba(66,133,244,1)', 0.08),
              border: `1.5px solid ${alpha('rgba(66,133,244,1)', 0.15)}`,
              color: '#4285f4',
              fontWeight: 400,
              cursor: 'pointer',
              minHeight: 'auto',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {tag === 'aigent.run' ? (
              <Box style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <img
                  src="/static/aigentrun.gif"
                  alt="Aigent.Run"
                  style={{
                    width: '14px',
                    height: '14px',
                    objectFit: 'contain'
                  }}
                />
                {tag}
              </Box>
            ) : (
              tag
            )}
          </Chip>
        </Link>
      ))}
      {enhancedTags.length > maxTags && toggleTagsDrawer && (
        <Chip
          size="small"
          onClick={() => toggleTagsDrawer(true)}
          style={{
            height: '24px',
            fontSize: '10px',
            borderRadius: '8px',
            paddingLeft: '10px',
            paddingRight: '10px',
            background: alpha('rgba(66,133,244,1)', 0.08),
            border: `1.5px solid ${alpha('rgba(66,133,244,1)', 0.15)}`,
            color: '#4285f4',
            fontWeight: 400,
            cursor: 'pointer',
            minHeight: 'auto'
          }}
        >
          +{enhancedTags.length - maxTags}
        </Chip>
      )}
    </Stack>
  );
};

// Combined component for easy usage
export const CompactSocialAndTags = ({
  social,
  enhancedTags,
  toggleLinksDrawer,
  toggleTagsDrawer,
  maxTags = 3,
  socialSize = 'small',
  isDark = false
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      style={{ flexWrap: 'wrap', gap: '8px' }}
    >
      <CompactTags
        enhancedTags={enhancedTags}
        toggleTagsDrawer={toggleTagsDrawer}
        maxTags={maxTags}
        isDark={isDark}
      />
      <CompactSocialLinks
        social={social}
        toggleLinksDrawer={toggleLinksDrawer}
        size={socialSize}
        isDark={isDark}
      />
    </Stack>
  );
};
