import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from 'src/utils/api';
import { ThemeContext } from 'src/context/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, ArrowDownUp } from 'lucide-react';
import { ApiButton, registerApiCalls } from 'src/components/ApiEndpointsModal';
import { fNumber, fVolume, formatDistanceToNowStrict } from 'src/utils/formatters';
import Link from 'next/link';
import { cn } from 'src/utils/cn';

const BASE_URL = 'https://api.xrpl.to/v1';

const Container = ({ className, children, ...p }) => <div className={cn('max-w-[1920px] mx-auto px-2.5 py-4 md:px-4 md:py-6', className)} {...p}>{children}</div>;

const Title = ({ darkMode, className, children, ...p }) => <h1 className={cn('text-[22px] font-semibold tracking-[-0.02em] mb-1', darkMode ? 'text-white/95' : 'text-[#1a1a2e]', className)} {...p}>{children}</h1>;

const Subtitle = ({ darkMode, className, children, ...p }) => <p className={cn('text-[13px] tracking-[0.01em] mb-6', darkMode ? 'text-white/60' : 'text-[#637381]', className)} {...p}>{children}</p>;

const TableContainer = ({ darkMode, className, children, ...p }) => <div className={cn('overflow-x-auto scrollbar-none bg-transparent rounded-xl backdrop-blur-[12px] border-[1.5px]', darkMode ? 'border-white/10' : 'border-black/[0.06]', className)} style={{ scrollbarWidth: 'none' }} {...p}>{children}</div>;

const StyledTable = ({ className, children, ...p }) => <table className={cn('w-full border-collapse table-fixed hidden md:table', className)} {...p}>{children}</table>;

const StyledTableHead = ({ darkMode, className, children, ...p }) => <thead className={cn('sticky top-0 z-10 bg-transparent backdrop-blur-[12px]', className)} {...p}>{children}</thead>;

const StyledTh = ({ darkMode, align, width, sortable, className, children, ...p }) => (
  <th
    className={cn(
      'font-semibold text-[10px] tracking-[0.06em] uppercase py-4 px-3 whitespace-nowrap transition-[background-color,border-color] duration-150',
      darkMode ? 'text-white/50 border-b-[1.5px] border-white/10' : 'text-[#919EAB] border-b-[1.5px] border-black/[0.06]',
      sortable ? 'cursor-pointer' : 'cursor-default',
      sortable && 'hover:text-[#3b82f6]',
      className
    )}
    style={{ textAlign: align || 'left', width: width || 'auto' }}
    {...p}
  >
    {children}
  </th>
);

const StyledTbody = ({ darkMode, className, children, ...p }) => (
  <tbody className={cn('[&_tr]:border-b-[1.5px] [&_tr]:transition-[background-color,border-color] [&_tr]:duration-150', darkMode ? '[&_tr]:border-white/10 [&_tr:hover]:bg-white/[0.02]' : '[&_tr]:border-black/[0.06] [&_tr:hover]:bg-black/[0.01]', className)} {...p}>{children}</tbody>
);

const StyledTd = ({ darkMode, color, align, className, children, ...p }) => (
  <td
    className={cn('py-[18px] px-3 text-[13px] tracking-[0.005em] align-middle whitespace-nowrap', className)}
    style={{ color: color || (darkMode ? 'rgba(255,255,255,0.88)' : '#1a1a2e'), textAlign: align || 'left' }}
    {...p}
  >
    {children}
  </td>
);

const SortIndicator = ({ className, children, ...p }) => <span className={cn('inline-block ml-1 text-[8px] text-[#3b82f6]', className)} {...p}>{children}</span>;

const TraderLink = ({ className, children, ...p }) => <Link className={cn('text-[#3b82f6] no-underline font-semibold tracking-[0.01em] hover:text-[#60a5fa] hover:underline', className)} {...p}>{children}</Link>;

const Badge = ({ type, className, children, ...p }) => (
  <span
    className={cn(
      'py-[3px] px-2 rounded-md text-[9px] uppercase tracking-[0.05em] font-bold',
      type === 'buyer' && 'bg-[rgba(59,130,246,0.12)] text-[#3b82f6]',
      type === 'seller' && 'bg-[rgba(239,68,68,0.12)] text-[#ef4444]',
      type === 'both' && 'bg-[rgba(168,85,247,0.12)] text-[#a855f7]',
      type !== 'buyer' && type !== 'seller' && type !== 'both' && 'bg-[rgba(234,179,8,0.12)] text-[#eab308]',
      className
    )}
    {...p}
  >
    {children}
  </span>
);

const PaginationContainer = ({ darkMode, className, children, ...p }) => <div className={cn('flex items-center justify-center gap-1 mt-4 px-[10px] py-[6px] min-h-[36px] rounded-xl bg-transparent border-[1.5px]', darkMode ? 'border-white/10' : 'border-black/[0.06]', className)} {...p}>{children}</div>;

const NavButton = ({ darkMode, className, children, ...p }) => (
  <button
    className={cn(
      'w-[26px] h-[26px] rounded-xl border-[1.5px] bg-transparent cursor-pointer flex items-center justify-center transition-[background-color,border-color] duration-150',
      darkMode ? 'border-white/10 text-white hover:not-disabled:border-white/[0.15] hover:not-disabled:bg-white/[0.02]' : 'border-black/[0.06] text-[#212B36] hover:not-disabled:border-black/10 hover:not-disabled:bg-black/[0.01]',
      'disabled:opacity-30 disabled:cursor-not-allowed',
      className
    )}
    {...p}
  >
    {children}
  </button>
);

const PageButton = ({ selected, darkMode, className, children, ...p }) => (
  <button
    className={cn(
      'min-w-[22px] h-[22px] rounded-xl border-[1.5px] cursor-pointer text-[11px] px-1 transition-[background-color,border-color] duration-150',
      selected
        ? 'border-[#4285f4] bg-[#4285f4] text-white font-medium hover:not-disabled:border-[#1976D2] hover:not-disabled:bg-[#1976D2]'
        : darkMode
          ? 'border-white/10 bg-transparent text-white font-normal hover:not-disabled:border-white/[0.15] hover:not-disabled:bg-white/[0.02]'
          : 'border-black/[0.06] bg-transparent text-[#212B36] font-normal hover:not-disabled:border-black/10 hover:not-disabled:bg-black/[0.01]',
      className
    )}
    {...p}
  >
    {children}
  </button>
);

const EmptyState = ({ darkMode, className, children, ...p }) => <div className={cn('text-center py-16 px-4 rounded-xl border-[1.5px] border-dashed', darkMode ? 'border-white/20' : 'border-black/20', className)} {...p}>{children}</div>;

const PaginationInfo = ({ darkMode, className, children, ...p }) => <span className={cn('text-[11px] font-medium tracking-[0.02em] mx-2', darkMode ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</span>;

const StatsGrid = ({ className, children, ...p }) => <div className={cn('grid grid-cols-4 gap-3 mb-6 max-md:grid-cols-2', className)} {...p}>{children}</div>;

const StatCard = ({ darkMode, className, children, ...p }) => <div className={cn('p-4 rounded-xl bg-transparent border-[1.5px] transition-[background-color,border-color] duration-150', darkMode ? 'border-white/10 hover:border-white/[0.15] hover:bg-white/[0.02]' : 'border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]', className)} {...p}>{children}</div>;

const StatLabel = ({ darkMode, className, children, ...p }) => <div className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[6px]', darkMode ? 'text-white/50' : 'text-[#919EAB]', className)} {...p}>{children}</div>;

const StatValue = ({ darkMode, className, children, ...p }) => <div className={cn('text-lg font-bold tracking-[-0.01em]', darkMode ? 'text-white/95' : 'text-[#1a1a2e]', className)} {...p}>{children}</div>;

const StatSub = ({ darkMode, className, children, ...p }) => <div className={cn('text-[11px] mt-1 tracking-[0.01em]', darkMode ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</div>;

const TABLE_HEAD = [
  { id: 'rank', label: '#', align: 'center', width: '32px' },
  { id: 'trader', label: 'TRADER', align: 'left', width: '120px' },
  { id: 'xrpBalance', label: 'BALANCE', align: 'right', width: '85px', sortable: true },
  { id: 'totalVolume', label: 'VOL (XRP)', align: 'right', width: '85px', sortable: true },
  { id: 'totalTrades', label: 'TRADES', align: 'right', width: '60px', sortable: true },
  { id: 'flips', label: 'FLIPS', align: 'right', width: '50px', sortable: true },
  { id: 'buyVolume', label: 'BOUGHT', align: 'right', width: '80px', sortable: true },
  { id: 'sellVolume', label: 'SOLD', align: 'right', width: '80px', sortable: true },
  { id: 'combinedProfit', label: 'Profit / Loss (XRP)', align: 'right', width: '90px', sortable: true },
  { id: 'roi', label: 'Return', align: 'right', width: '55px', sortable: true },
  { id: 'winRate', label: 'WIN', align: 'right', width: '50px', sortable: true },
  { id: 'holdingsCount', label: 'NFTs', align: 'right', width: '55px', sortable: true },
  { id: 'marketplace', label: 'SOURCE', align: 'center', width: '80px' },
  { id: 'lastTrade', label: 'LAST ACTIVE', align: 'right', width: '90px', sortable: true }
];

const ROWS_PER_PAGE = 20;

export default function NFTTradersPage({ traders = [], pagination = {}, traderBalances = {} }) {
  const router = useRouter();
  const { themeName } = useContext(ThemeContext);
  const darkMode = themeName === 'XrplToDarkTheme';
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  // Register server-side API calls
  useEffect(() => {
    registerApiCalls([
      'https://api.xrpl.to/v1/nft/analytics/traders',
      'https://api.xrpl.to/v1/nft/analytics/market'
    ]);
  }, []);

  const currentPage = pagination.page || 1;
  const totalPages = pagination.totalPages || 1;
  const totalTraders = pagination.total || 0;
  const sortBy = router.query.sortBy || 'combinedProfit';

  const navigateToPage = (page) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, page }
      },
      undefined,
      { shallow: false }
    );
  };

  const handleSortChange = (key) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, sortBy: key, page: 1 }
      },
      undefined,
      { shallow: false }
    );
  };

  const getLastActive = (t) =>
    t.lastTrade ? formatDistanceToNowStrict(new Date(t.lastTrade)) : '-';

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <div id="back-to-top-anchor" className="h-6" />
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />

      <Container>
        <div className="flex items-center justify-between mb-1">
          <Title darkMode={darkMode} className="!mb-0">
            NFT Traders Leaderboard
          </Title>
          <ApiButton />
        </div>
        <Subtitle darkMode={darkMode}>
          {totalTraders > 0
            ? `${fNumber(totalTraders)} traders on XRPL`
            : 'Top NFT traders by profit'}
        </Subtitle>

        {traderBalances.balanceAll > 0 && (
          <StatsGrid>
            <StatCard darkMode={darkMode}>
              <StatLabel darkMode={darkMode}>24h Balance</StatLabel>
              <StatValue darkMode={darkMode}>
                {fVolume(traderBalances.balance24h || 0)} XRP
              </StatValue>
              <StatSub darkMode={darkMode}>
                {fNumber(traderBalances.traders24h || 0)} funded of {fNumber(totalTraders)} traders
              </StatSub>
            </StatCard>
            <StatCard darkMode={darkMode}>
              <StatLabel darkMode={darkMode}>7d Balance</StatLabel>
              <StatValue darkMode={darkMode}>
                {fVolume(traderBalances.balance7d || 0)} XRP
              </StatValue>
              <StatSub darkMode={darkMode}>
                {fNumber(traderBalances.traders7d || 0)} funded of {fNumber(totalTraders)} traders
              </StatSub>
            </StatCard>
            <StatCard darkMode={darkMode}>
              <StatLabel darkMode={darkMode}>30d Balance</StatLabel>
              <StatValue darkMode={darkMode}>
                {fVolume(traderBalances.balance30d || 0)} XRP
              </StatValue>
              <StatSub darkMode={darkMode}>
                {fNumber(traderBalances.traders30d || 0)} funded of {fNumber(totalTraders)} traders
              </StatSub>
            </StatCard>
            <StatCard darkMode={darkMode}>
              <StatLabel darkMode={darkMode}>All Time Balance</StatLabel>
              <StatValue darkMode={darkMode}>
                {fVolume(traderBalances.balanceAll || 0)} XRP
              </StatValue>
              <StatSub darkMode={darkMode}>
                {fNumber(traderBalances.tradersAll || 0)} funded of {fNumber(totalTraders)} traders
              </StatSub>
            </StatCard>
          </StatsGrid>
        )}

        {traders.length === 0 ? (
          <EmptyState darkMode={darkMode}>
            <div className="relative w-[64px] h-[64px] mx-auto mb-4">
              <div
                className={cn('absolute -top-1 left-1 w-5 h-5 rounded-full', darkMode ? 'bg-[#4285f4]' : 'bg-[#60a5fa]')}
              />
              <div
                className={cn('absolute -top-1 right-1 w-5 h-5 rounded-full', darkMode ? 'bg-[#4285f4]' : 'bg-[#60a5fa]')}
              />
              <div
                className={cn('absolute top-[2px] left-2 w-[10px] h-[10px] rounded-full', darkMode ? 'bg-[#3b78e7]' : 'bg-[#3b82f6]')}
              />
              <div
                className={cn('absolute top-[2px] right-2 w-[10px] h-[10px] rounded-full', darkMode ? 'bg-[#3b78e7]' : 'bg-[#3b82f6]')}
              />
              <div
                className={cn('absolute top-[10px] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full', darkMode ? 'bg-[#4285f4]' : 'bg-[#60a5fa]')}
              >
                <div
                  className="absolute top-4 left-[10px] w-2 h-[6px] rounded-full bg-[#0a0a0a] -rotate-[10deg]"
                />
                <div
                  className="absolute top-4 right-[10px] w-2 h-[6px] rounded-full bg-[#0a0a0a] rotate-[10deg]"
                />
                <div
                  className={cn('absolute bottom-[10px] left-1/2 -translate-x-1/2 w-4 h-[10px] rounded-full', darkMode ? 'bg-[#5a9fff]' : 'bg-[#93c5fd]')}
                >
                  <div
                    className="absolute top-1 left-1/2 -translate-x-1/2 w-[6px] h-1 rounded-full bg-[#0a0a0a]"
                  />
                </div>
                <div
                  className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[10px] h-[5px] rounded-t-lg border-t-2 border-l-2 border-r-2 border-[#0a0a0a]"
                />
              </div>
              <div
                className="absolute top-[10px] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full overflow-hidden flex flex-col gap-[2px] pointer-events-none"
              >
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={cn('h-[2px] w-full', darkMode ? 'bg-[rgba(10,10,10,0.4)]' : 'bg-[rgba(255,255,255,0.4)]')}
                  />
                ))}
              </div>
            </div>
            <div
              className={cn('text-[11px] font-bold tracking-[0.12em] mb-1', darkMode ? 'text-white/60' : 'text-[#4b5563]')}
            >
              NO TRADERS DATA
            </div>
            <div className={cn('text-[11px] tracking-[0.01em]', darkMode ? 'text-white/25' : 'text-[#9ca3af]')}>
              Trader data will appear here when available
            </div>
          </EmptyState>
        ) : (
          <>
            {/* Mobile sort chips */}
            <div className="md:hidden mb-3 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1" style={{ scrollbarWidth: 'none' }}>
              <div className={cn('flex items-center gap-1 shrink-0 pl-0.5', darkMode ? 'text-white/40' : 'text-black/[0.45]')}>
                <ArrowDownUp size={12} />
              </div>
              {TABLE_HEAD.filter(c => c.sortable).map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSortChange(c.id)}
                  className={cn(
                    'shrink-0 text-[11px] tracking-[0.02em] py-[5px] px-2.5 rounded-full border-[1.5px] transition-[background-color,border-color] duration-150 cursor-pointer whitespace-nowrap',
                    sortBy === c.id
                      ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6] font-medium'
                      : darkMode
                        ? 'border-white/10 bg-transparent text-white/50 hover:border-white/20 hover:text-white/70'
                        : 'border-black/[0.06] bg-transparent text-black/40 hover:border-black/10 hover:text-black/60'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <TableContainer darkMode={darkMode}>
              <StyledTable>
                <StyledTableHead darkMode={darkMode}>
                  <tr>
                    {TABLE_HEAD.map((col) => (
                      <StyledTh
                        key={col.id}
                        darkMode={darkMode}
                        align={col.align}
                        width={col.width}
                        sortable={col.sortable}
                        onClick={() => col.sortable && handleSortChange(col.id)}
                        className={sortBy === col.id ? 'text-[#3b82f6]' : ''}
                      >
                        {col.label}
                        {sortBy === col.id && <SortIndicator>▼</SortIndicator>}
                      </StyledTh>
                    ))}
                  </tr>
                </StyledTableHead>
                <StyledTbody darkMode={darkMode}>
                  {traders.map((trader, idx) => {
                    const addr = trader._id || trader.address;
                    const cp = trader.combinedProfit || 0;
                    const roi = trader.roi || 0;
                    const bought = trader.buyVolume || 0;
                    const sold = trader.sellVolume || 0;
                    const rank = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;

                    return (
                      <tr key={addr || idx}>
                        <StyledTd
                          align="center"
                          darkMode={darkMode}
                          color={darkMode ? 'rgba(255,255,255,0.6)' : '#919EAB'}
                        >
                          {rank}
                        </StyledTd>
                        <StyledTd darkMode={darkMode}>
                          <div className="flex items-center gap-[5px]">
                            <TraderLink href={`/address/${addr}`}>
                              {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-'}
                            </TraderLink>
                            {trader.traderType && (
                              <Badge type={trader.traderType}>{trader.traderType}</Badge>
                            )}
                          </div>
                        </StyledTd>
                        <StyledTd
                          align="right"
                          darkMode={darkMode}
                          className="font-medium text-xs"
                        >
                          {fVolume(trader.xrpBalance || 0)}
                        </StyledTd>
                        <StyledTd
                          align="right"
                          darkMode={darkMode}
                          className="font-medium text-xs"
                        >
                          <div>{fVolume(trader.totalVolume || 0)}</div>
                          {trader.vol24h > 0 && (
                            <div className={cn('text-[10px] font-normal', darkMode ? 'text-white/40' : 'text-black/35')}>
                              24h: {fVolume(trader.vol24h)}
                            </div>
                          )}
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} className="text-[11px]">
                          {fNumber(trader.totalTrades || 0)}
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} className="text-[11px]">
                          {trader.flips > 0 ? fNumber(trader.flips) : '-'}
                        </StyledTd>
                        <StyledTd align="right" color="#10b981" className="text-xs">
                          {fVolume(bought)}
                        </StyledTd>
                        <StyledTd align="right" color="#ef4444" className="text-xs">
                          {fVolume(sold)}
                        </StyledTd>
                        <StyledTd
                          align="right"
                          color={cp >= 0 ? '#10b981' : '#ef4444'}
                          className="font-semibold text-xs"
                        >
                          {cp >= 0 ? '+' : ''}
                          {fVolume(cp)}
                        </StyledTd>
                        <StyledTd
                          align="right"
                          color={roi >= 0 ? '#10b981' : '#ef4444'}
                          className="text-[11px]"
                        >
                          {roi >= 0 ? '+' : ''}
                          {roi.toFixed(1)}%
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} className="text-[11px]">
                          {(trader.winRate || 0).toFixed(0)}%
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} className="text-[11px]">
                          {fNumber(trader.holdingsCount || 0)}
                        </StyledTd>
                        <StyledTd align="center" darkMode={darkMode} className="text-[10px]">
                          {(() => {
                            const markets = Object.keys(trader.marketplaceBreakdown || {}).filter(
                              (m) => m !== 'XRPL'
                            );
                            return markets.length > 0 ? markets.join(', ') : '-';
                          })()}
                        </StyledTd>
                        <StyledTd
                          align="right"
                          darkMode={darkMode}
                          color={darkMode ? 'rgba(255,255,255,0.5)' : '#637381'}
                          className="text-[11px]"
                        >
                          {getLastActive(trader)}
                        </StyledTd>
                      </tr>
                    );
                  })}
                </StyledTbody>
              </StyledTable>

              {/* Mobile card layout */}
              <div className="md:hidden divide-y divide-white/10">
                {traders.map((trader, idx) => {
                  const addr = trader._id || trader.address;
                  const cp = trader.combinedProfit || 0;
                  const roi = trader.roi || 0;
                  const rank = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;

                  return (
                    <div key={addr || idx} className={cn('px-3 py-3', darkMode ? 'border-white/10' : 'border-black/[0.06]', idx > 0 && 'border-t-[1.5px]')}>
                      {/* Row 1: Rank + Trader + P/L */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn('text-[11px] w-5 text-center shrink-0', darkMode ? 'text-white/40' : 'text-[#919EAB]')}>{rank}</span>
                          <TraderLink href={`/address/${addr}`} className="text-[13px]">
                            {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-'}
                          </TraderLink>
                          {trader.traderType && (
                            <Badge type={trader.traderType}>{trader.traderType}</Badge>
                          )}
                        </div>
                        <span className="font-semibold text-[13px] shrink-0 ml-2" style={{ color: cp >= 0 ? '#10b981' : '#ef4444' }}>
                          {cp >= 0 ? '+' : ''}{fVolume(cp)}
                        </span>
                      </div>

                      {/* Row 2: Key stats grid */}
                      <div className="grid grid-cols-4 gap-x-3 gap-y-1.5 ml-7">
                        <div>
                          <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', darkMode ? 'text-white/25' : 'text-black/30')}>Volume</div>
                          <div className={cn('text-[12px] font-medium', darkMode ? 'text-white/85' : 'text-[#1a1a2e]')}>{fVolume(trader.totalVolume || 0)}</div>
                          {trader.vol24h > 0 && (
                            <div className={cn('text-[10px]', darkMode ? 'text-white/35' : 'text-black/30')}>24h: {fVolume(trader.vol24h)}</div>
                          )}
                        </div>
                        <div>
                          <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', darkMode ? 'text-white/25' : 'text-black/30')}>Trades</div>
                          <div className={cn('text-[12px] font-medium', darkMode ? 'text-white/85' : 'text-[#1a1a2e]')}>{fNumber(trader.totalTrades || 0)}</div>
                        </div>
                        <div>
                          <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', darkMode ? 'text-white/25' : 'text-black/30')}>Return</div>
                          <div className="text-[12px]" style={{ color: roi >= 0 ? '#10b981' : '#ef4444' }}>
                            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', darkMode ? 'text-white/25' : 'text-black/30')}>Win</div>
                          <div className={cn('text-[12px] font-medium', darkMode ? 'text-white/85' : 'text-[#1a1a2e]')}>{(trader.winRate || 0).toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TableContainer>

            {totalPages > 1 && (
              <PaginationContainer darkMode={darkMode}>
                <NavButton
                  darkMode={darkMode}
                  onClick={() => navigateToPage(1)}
                  disabled={currentPage === 1}
                  aria-label="First page"
                >
                  <ChevronsLeft size={12} />
                </NavButton>
                <NavButton
                  darkMode={darkMode}
                  onClick={() => navigateToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={12} />
                </NavButton>
                {getPageNumbers().map((p, i) =>
                  p === '...' ? (
                    <span
                      key={`e${i}`}
                      className={cn('px-[2px] text-[11px]', darkMode ? 'text-white/30' : 'text-black/30')}
                    >
                      ...
                    </span>
                  ) : (
                    <PageButton
                      key={p}
                      selected={p === currentPage}
                      darkMode={darkMode}
                      onClick={() => navigateToPage(p)}
                    >
                      {p}
                    </PageButton>
                  )
                )}
                <NavButton
                  darkMode={darkMode}
                  onClick={() => navigateToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={12} />
                </NavButton>
                <NavButton
                  darkMode={darkMode}
                  onClick={() => navigateToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-label="Last page"
                >
                  <ChevronsRight size={12} />
                </NavButton>
                <PaginationInfo darkMode={darkMode}>
                  Page {currentPage} of {fNumber(totalPages)}
                </PaginationInfo>
              </PaginationContainer>
            )}
          </>
        )}
      </Container>

      <ScrollToTop />
      <Footer />
    </div>
  );
}

export async function getServerSideProps({ query, req, res }) {
  // Only cache full page loads (s-maxage for CDN). Client-side data fetches
  // (/_next/data/) must not be cached — stale empty responses cause blank pages
  // when navigating between pages via router.push.
  const isDataReq = req.url?.includes('/_next/data/');
  res.setHeader(
    'Cache-Control',
    isDataReq
      ? 'private, no-cache, no-store, must-revalidate'
      : 'public, s-maxage=30, stale-while-revalidate=120'
  );

  const page = parseInt(query.page) || 1;
  const sortBy = query.sortBy || 'combinedProfit';

  // Validate inputs to prevent abuse
  const safePage = Math.min(Math.max(1, page), 10000);
  const allowedSorts = ['combinedProfit', 'totalVolume', 'totalTrades', 'flips', 'buyVolume', 'sellVolume', 'roi', 'winRate', 'holdingsCount', 'lastTrade', 'xrpBalance'];
  const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : 'combinedProfit';

  const fetchData = () => Promise.all([
    api.get(
      `${BASE_URL}/nft/analytics/traders?sortBy=${safeSortBy}&limit=${ROWS_PER_PAGE}&page=${safePage}`,
      { timeout: 8000 }
    ),
    api.get(`${BASE_URL}/nft/analytics/market`, { timeout: 8000 })
  ]);

  try {
    let tradersRes, marketRes;
    try {
      [tradersRes, marketRes] = await fetchData();
    } catch {
      [tradersRes, marketRes] = await fetchData();
    }
    const traders = tradersRes.data.traders || [];
    const pagination = tradersRes.data.pagination || {};
    const traderBalances = marketRes.data.traderBalances || {};

    return { props: { traders, pagination, traderBalances, ogp: {
      canonical: 'https://xrpl.to/nft-traders',
      title: 'NFT Traders | Top XRPL NFT Traders',
      url: 'https://xrpl.to/nft-traders',
      imgUrl: 'https://xrpl.to/api/og/nft-traders',
      imgType: 'image/png',
      desc: 'Discover the top NFT traders on the XRP Ledger. Track profits, volume, and trading activity.'
    } } };
  } catch (error) {
    console.error('Failed to fetch NFT traders:', error.message);
    return { props: { traders: [], pagination: {}, traderBalances: {}, ogp: {
      canonical: 'https://xrpl.to/nft-traders',
      title: 'NFT Traders | Top XRPL NFT Traders',
      url: 'https://xrpl.to/nft-traders',
      imgUrl: 'https://xrpl.to/api/og/nft-traders',
      imgType: 'image/png',
      desc: 'Discover the top NFT traders on the XRP Ledger. Track profits, volume, and trading activity.'
    } } };
  }
}
