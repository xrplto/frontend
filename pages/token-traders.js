import { useState } from 'react';
import { useRouter } from 'next/router';
import api from 'src/utils/api';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, ArrowDownUp } from 'lucide-react';
import { fNumber, fVolume, formatDistanceToNowStrict } from 'src/utils/formatters';
import Link from 'next/link';
import { cn } from 'src/utils/cn';

const BASE_URL = 'https://api.xrpl.to/v1';

const Container = ({ className, children, ...p }) => <div className={cn('max-w-[1920px] mx-auto px-2.5 py-4 md:px-4 md:py-6', className)} {...p}>{children}</div>;

const Title = ({ className, children, ...p }) => <h1 className={cn('text-[22px] font-semibold tracking-[-0.02em] mb-1', 'text-[#1a1a2e] dark:text-white/95', className)} {...p}>{children}</h1>;

const Subtitle = ({ className, children, ...p }) => <p className={cn('text-[13px] tracking-[0.01em] mb-6', 'text-[#637381] dark:text-white/60', className)} {...p}>{children}</p>;

const TableContainer = ({ className, children, ...p }) => <div className={cn('overflow-x-auto scrollbar-none bg-transparent rounded-xl backdrop-blur-[12px] border-[1.5px]', 'border-black/[0.06] dark:border-white/10', className)} style={{ scrollbarWidth: 'none' }} {...p}>{children}</div>;

const StyledTable = ({ className, children, ...p }) => <table className={cn('w-full border-collapse table-fixed hidden md:table', className)} {...p}>{children}</table>;

const StyledTableHead = ({ className, children, ...p }) => <thead className={cn('sticky top-0 z-10 bg-transparent backdrop-blur-[12px]', className)} {...p}>{children}</thead>;

const StyledTh = ({ align, width, sortable, className, children, ...p }) => (
  <th
    className={cn(
      'font-semibold text-[10px] tracking-[0.06em] uppercase py-4 px-3 whitespace-nowrap transition-none',
      'text-[#919EAB] border-b-[1.5px] border-black/[0.06] dark:text-white/60 dark:border-b-[1.5px] dark:border-white/10',
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

const StyledTbody = ({ className, children, ...p }) => (
  <tbody className={cn('[&_tr]:border-b-[1.5px] [&_tr]:transition-[border-color,background-color] [&_tr]:duration-150', '[&_tr]:border-black/[0.06] [&_tr:hover]:bg-black/[0.01] dark:[&_tr]:border-white/10 dark:[&_tr:hover]:bg-white/[0.02]', className)} {...p}>{children}</tbody>
);

const StyledTd = ({ color, align, className, children, ...p }) => (
  <td
    className={cn('py-[18px] px-3 text-[13px] tracking-[0.005em] align-middle whitespace-nowrap', !color && 'text-[#1a1a2e] dark:text-white/[0.88]', className)}
    style={{ color: color || undefined, textAlign: align || 'left' }}
    {...p}
  >
    {children}
  </td>
);

const SortIndicator = ({ direction, className, children, ...p }) => (
  <span
    className={cn('inline-block ml-1 text-[8px] text-[#3b82f6] transition-transform duration-150', className)}
    style={{ transform: direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)' }}
    {...p}
  >
    {children}
  </span>
);

const TraderLink = ({ className, children, ...p }) => <Link className={cn('text-[#3b82f6] no-underline font-semibold tracking-[0.01em] hover:text-[#60a5fa] hover:underline', className)} {...p}>{children}</Link>;

const PaginationContainer = ({ className, children, ...p }) => <div className={cn('flex items-center justify-center gap-1 mt-4 px-[10px] py-[6px] min-h-[36px] rounded-xl bg-transparent border-[1.5px]', 'border-black/[0.06] dark:border-white/10', className)} {...p}>{children}</div>;

const NavButton = ({ className, children, ...p }) => (
  <button
    className={cn(
      'w-[26px] h-[26px] rounded-xl border-[1.5px] bg-transparent cursor-pointer flex items-center justify-center transition-[border-color,background-color] duration-150',
      'border-black/[0.06] text-[#212B36] hover:not-disabled:border-black/10 hover:not-disabled:bg-black/[0.01] dark:border-white/10 dark:text-white dark:hover:not-disabled:border-white/[0.15] dark:hover:not-disabled:bg-white/[0.02]',
      'disabled:opacity-30 disabled:cursor-not-allowed',
      className
    )}
    {...p}
  >
    {children}
  </button>
);

const PageButton = ({ selected, className, children, ...p }) => (
  <button
    className={cn(
      'min-w-[22px] h-[22px] rounded-xl border-[1.5px] cursor-pointer text-[11px] px-1 transition-[border-color,background-color] duration-150',
      selected
        ? 'border-[#4285f4] bg-[#4285f4] text-white font-medium hover:not-disabled:border-[#1976D2] hover:not-disabled:bg-[#1976D2]'
        : 'border-black/[0.06] bg-transparent text-[#212B36] font-normal hover:not-disabled:border-black/10 hover:not-disabled:bg-black/[0.01] dark:border-white/10 dark:bg-transparent dark:text-white dark:font-normal dark:hover:not-disabled:border-white/[0.15] dark:hover:not-disabled:bg-white/[0.02]',
      className
    )}
    {...p}
  >
    {children}
  </button>
);

const EmptyState = ({ className, children, ...p }) => <div className={cn('text-center py-16 px-4 rounded-xl border-[1.5px] border-dashed', 'border-black/20 dark:border-white/20', className)} {...p}>{children}</div>;

const PaginationInfo = ({ className, children, ...p }) => <span className={cn('text-[11px] font-medium tracking-[0.02em] mx-2', 'text-black/35 dark:text-white/50', className)} {...p}>{children}</span>;

const StatsGrid = ({ className, children, ...p }) => <div className={cn('grid grid-cols-4 gap-3 mb-6 max-md:grid-cols-2', className)} {...p}>{children}</div>;

const StatCard = ({ className, children, ...p }) => <div className={cn('p-4 rounded-xl bg-transparent border-[1.5px] transition-[border-color,background-color] duration-150', 'border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01] dark:border-white/10 dark:hover:border-white/[0.15] dark:hover:bg-white/[0.02]', className)} {...p}>{children}</div>;

const StatLabel = ({ className, children, ...p }) => <div className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[6px]', 'text-[#919EAB] dark:text-white/50', className)} {...p}>{children}</div>;

const StatValue = ({ className, children, ...p }) => <div className={cn('text-lg font-bold tracking-[-0.01em]', 'text-[#1a1a2e] dark:text-white/95', className)} {...p}>{children}</div>;

const StatSub = ({ className, children, ...p }) => <div className={cn('text-[11px] tracking-[0.01em] mt-1', 'text-black/35 dark:text-white/50', className)} {...p}>{children}</div>;

const TABLE_HEAD = [
  { id: 'rank', label: '#', align: 'center', width: '32px' },
  { id: 'trader', label: 'TRADER', align: 'left', width: '120px' },
  { id: 'xrpBalance', label: 'BALANCE', align: 'right', width: '85px', sortable: true },
  { id: 'totalVolume', label: 'Volume (XRP)', align: 'right', width: '85px', sortable: true },
  { id: 'totalTrades', label: 'TRADES', align: 'right', width: '60px', sortable: true },
  { id: 'buyVolume', label: 'BOUGHT', align: 'right', width: '80px', sortable: true },
  { id: 'sellVolume', label: 'SOLD', align: 'right', width: '80px', sortable: true },
  { id: 'totalProfit', label: 'Profit / Loss (XRP)', align: 'right', width: '90px', sortable: true },
  { id: 'avgROI', label: 'Return', align: 'right', width: '55px', sortable: true },
  { id: 'winRate', label: 'WIN', align: 'right', width: '50px', sortable: true },
  { id: 'dexAmm', label: 'DEX/AMM', align: 'center', width: '90px' },
  { id: 'source', label: 'SOURCE', align: 'center', width: '70px' },
  { id: 'washTradingScore', label: 'WASH', align: 'right', width: '55px', sortable: true },
  { id: 'lastActive', label: 'LAST ACTIVE', align: 'right', width: '90px', sortable: true }
];

const SOURCE_TAGS = {
  10011010: 'Magnetic',
  74920348: 'First Ledger',
  20221212: 'xpmarket',
  69420589: 'Bidds',
  110100111: 'Sologenic',
  111: 'Horizon',
  11782013: 'Anodos',
  19089388: 'HBot',
  100010010: 'StaticBit',
  13888813: 'Zerpmon',
  20102305: 'Opulencex',
  589123: 'Katz',
  101102979: 'XRP Cafe',
  42697468: 'Bithomp',
  89898989: 'Axelar',
  54955974: 'XAH Teleport',
  510162502: 'Sonar Muse',
  280957156: 'Dhali',
  30033003: 'Calypso'
};

const ROWS_PER_PAGE = 20;

export default function TokenTradersPage({ traders = [], pagination = {}, traderBalances = {} }) {
  const router = useRouter();
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  const currentPage = pagination.page || 1;
  const totalPages = pagination.totalPages || 1;
  const totalTraders = pagination.total || 0;
  const sortBy = router.query.sortBy || 'totalProfit';

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
    t.lastTradeDate ? formatDistanceToNowStrict(new Date(t.lastTradeDate)) : '-';

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
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <div id="back-to-top-anchor" />

      <Container>
        <Title>Token Traders Leaderboard</Title>
        <Subtitle>
          {totalTraders > 0
            ? `${fNumber(totalTraders)} traders on XRPL DEX`
            : 'Top traders by profit on XRPL DEX'}
        </Subtitle>

        {traderBalances.balanceAll > 0 && (
          <StatsGrid>
            <StatCard>
              <StatLabel>24h Balance</StatLabel>
              <StatValue>
                {fVolume(traderBalances.balance24h || 0)} XRP
              </StatValue>
              <StatSub>
                {fNumber(traderBalances.traders24h || 0)} funded of {fNumber(totalTraders)} traders
              </StatSub>
            </StatCard>
            <StatCard>
              <StatLabel>7d Balance</StatLabel>
              <StatValue>
                {fVolume(traderBalances.balance7d || 0)} XRP
              </StatValue>
              <StatSub>
                {fNumber(traderBalances.traders7d || 0)} funded of {fNumber(totalTraders)} traders
              </StatSub>
            </StatCard>
            <StatCard>
              <StatLabel>30d Balance</StatLabel>
              <StatValue>
                {fVolume(traderBalances.balance30d || 0)} XRP
              </StatValue>
              <StatSub>
                {fNumber(traderBalances.traders30d || 0)} funded of {fNumber(totalTraders)} traders
              </StatSub>
            </StatCard>
            <StatCard>
              <StatLabel>All Time Balance</StatLabel>
              <StatValue>
                {fVolume(traderBalances.balanceAll || 0)} XRP
              </StatValue>
              <StatSub>
                {fNumber(traderBalances.tradersAll || 0)} funded of {fNumber(totalTraders)} traders
              </StatSub>
            </StatCard>
          </StatsGrid>
        )}

        {traders.length === 0 ? (
          <EmptyState>
            <div className="relative w-[64px] h-[64px] mx-auto mb-4">
              <div
                className={cn('absolute -top-1 left-1 w-5 h-5 rounded-full', 'bg-[#60a5fa] dark:bg-[#4285f4]')}
              />
              <div
                className={cn('absolute -top-1 right-1 w-5 h-5 rounded-full', 'bg-[#60a5fa] dark:bg-[#4285f4]')}
              />
              <div
                className={cn('absolute top-[2px] left-2 w-[10px] h-[10px] rounded-full', 'bg-[#3b82f6] dark:bg-[#3b78e7]')}
              />
              <div
                className={cn('absolute top-[2px] right-2 w-[10px] h-[10px] rounded-full', 'bg-[#3b82f6] dark:bg-[#3b78e7]')}
              />
              <div
                className={cn('absolute top-[10px] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full', 'bg-[#60a5fa] dark:bg-[#4285f4]')}
              >
                <div
                  className="absolute top-4 left-[10px] w-2 h-[6px] rounded-full bg-[#0a0a0a] -rotate-[10deg]"
                />
                <div
                  className="absolute top-4 right-[10px] w-2 h-[6px] rounded-full bg-[#0a0a0a] rotate-[10deg]"
                />
                <div
                  className={cn('absolute bottom-[10px] left-1/2 -translate-x-1/2 w-4 h-[10px] rounded-full', 'bg-[#93c5fd] dark:bg-[#5a9fff]')}
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
                    className={cn('h-[2px] w-full', 'bg-[rgba(255,255,255,0.4)] dark:bg-[rgba(10,10,10,0.4)]')}
                  />
                ))}
              </div>
            </div>
            <div
              className={cn('text-[11px] font-bold tracking-[0.12em] mb-1', 'text-[#4b5563] dark:text-white/60')}
            >
              NO TRADERS DATA
            </div>
            <div className={cn('text-[11px] tracking-[0.01em]', 'text-[#9ca3af] dark:text-white/25')}>
              Trader data will appear here when available
            </div>
          </EmptyState>
        ) : (
          <>
            {/* Mobile sort chips */}
            <div className="md:hidden mb-3 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1" style={{ scrollbarWidth: 'none' }}>
              <div className={cn('flex items-center gap-1 shrink-0 pl-0.5', 'text-black/[0.45] dark:text-white/40')}>
                <ArrowDownUp size={12} />
              </div>
              {TABLE_HEAD.filter(c => c.sortable).map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSortChange(c.id)}
                  className={cn(
                    'shrink-0 text-[11px] tracking-[0.02em] py-[5px] px-2.5 rounded-full border-[1.5px] transition-[border-color,background-color] duration-150 cursor-pointer whitespace-nowrap',
                    sortBy === c.id
                      ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6] font-medium'
                      : 'border-black/[0.06] bg-transparent text-black/40 hover:border-black/10 hover:text-black/60 dark:border-white/10 dark:bg-transparent dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white/70'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <TableContainer>
              <StyledTable>
                <StyledTableHead>
                  <tr>
                    {TABLE_HEAD.map((col) => (
                      <StyledTh
                        key={col.id}
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
                <StyledTbody>
                  {traders.map((trader, idx) => {
                    const addr = trader.address;
                    const tp = trader.totalProfit || 0;
                    const roi = trader.avgROI || 0;
                    const totalVol = trader.totalVolume || 0;
                    const bought = trader.buyVolume || 0;
                    const sold = trader.sellVolume || 0;
                    const winRate = trader.winRate || 0;
                    const dex = trader.dexVolume || 0;
                    const amm = trader.ammVolume || 0;
                    const dexAmmTotal = dex + amm;
                    const dexPct = dexAmmTotal > 0 ? Math.round((dex / dexAmmTotal) * 100) : 0;
                    const ammPct = 100 - dexPct;
                    const rank = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;

                    return (
                      <tr key={addr || idx}>
                        <StyledTd
                          align="center"
                          className="!text-[#919EAB] dark:!text-white/60"
                        >
                          {rank}
                        </StyledTd>
                        <StyledTd>
                          <TraderLink href={`/address/${addr}`}>
                            {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-'}
                          </TraderLink>
                        </StyledTd>
                        <StyledTd
                          align="right"
                          className="font-medium text-xs"
                        >
                          {fVolume(trader.xrpBalance || 0)}
                        </StyledTd>
                        <StyledTd
                          align="right"
                          className="font-medium text-xs"
                        >
                          <div>{fVolume(totalVol)}</div>
                          {trader.volume24h > 0 && (
                            <div className={cn('text-[10px] font-normal', 'text-black/35 dark:text-white/40')}>
                              24h: {fVolume(trader.volume24h)}
                            </div>
                          )}
                        </StyledTd>
                        <StyledTd align="right" className="text-[11px]">
                          {fNumber(trader.totalTrades || 0)}
                        </StyledTd>
                        <StyledTd align="right" color="#10b981" className="text-xs">
                          {fVolume(bought)}
                        </StyledTd>
                        <StyledTd align="right" color="#ef4444" className="text-xs">
                          {fVolume(sold)}
                        </StyledTd>
                        <StyledTd
                          align="right"
                          color={tp >= 0 ? '#10b981' : '#ef4444'}
                          className="font-semibold text-xs"
                        >
                          {tp >= 0 ? '+' : ''}
                          {fVolume(tp)}
                        </StyledTd>
                        <StyledTd
                          align="right"
                          color={roi >= 0 ? '#10b981' : '#ef4444'}
                          className="text-[11px]"
                        >
                          {roi >= 0 ? '+' : ''}
                          {roi.toFixed(1)}%
                        </StyledTd>
                        <StyledTd align="right" className="text-[11px]">
                          {winRate.toFixed(0)}%
                        </StyledTd>
                        <StyledTd align="center" className="text-[11px]">
                          {dexAmmTotal === 0 ? (
                            '-'
                          ) : (
                            <span className="flex items-center justify-center gap-1">
                              <span className="text-[#3b82f6]">{dexPct}%</span>
                              <span
                                className={'text-black/20 dark:text-white/20'}
                              >
                                /
                              </span>
                              <span className="text-[#8b5cf6]">{ammPct}%</span>
                            </span>
                          )}
                        </StyledTd>
                        <StyledTd align="center" className="text-[10px]">
                          {(trader.sourceTagStats?.length || 0) > 0
                            ? trader.sourceTagStats
                                .map((s) => SOURCE_TAGS[s.sourceTag] || s.sourceTag)
                                .join(', ')
                            : '-'}
                        </StyledTd>
                        <StyledTd
                          align="right"
                          color={trader.washTradingScore > 0 ? '#f59e0b' : undefined}
                          className={cn('text-[11px]', trader.washTradingScore <= 0 && '!text-[#d1d5db] dark:!text-white/30')}
                        >
                          {trader.washTradingScore > 0 ? fNumber(trader.washTradingScore) : '-'}
                        </StyledTd>
                        <StyledTd
                          align="right"
                          className="text-[11px] !text-[#637381] dark:!text-white/50"
                          suppressHydrationWarning
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
                  const addr = trader.address;
                  const tp = trader.totalProfit || 0;
                  const roi = trader.avgROI || 0;
                  const rank = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;

                  return (
                    <div key={addr || idx} className={cn('px-3 py-3', 'border-black/[0.06] dark:border-white/10', idx > 0 && 'border-t-[1.5px]')}>
                      {/* Row 1: Rank + Trader + P/L */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn('text-[11px] w-5 text-center shrink-0', 'text-[#919EAB] dark:text-white/60')}>{rank}</span>
                          <TraderLink href={`/address/${addr}`} className="text-[13px]">
                            {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-'}
                          </TraderLink>
                        </div>
                        <span className="font-semibold text-[13px] shrink-0 ml-2" style={{ color: tp >= 0 ? '#10b981' : '#ef4444' }}>
                          {tp >= 0 ? '+' : ''}{fVolume(tp)}
                        </span>
                      </div>

                      {/* Row 2: Key stats grid */}
                      <div className="grid grid-cols-4 gap-x-3 gap-y-1.5 ml-7">
                        <div>
                          <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', 'text-black/30 dark:text-white/50')}>Volume</div>
                          <div className={cn('text-[12px] font-medium', 'text-[#1a1a2e] dark:text-white/85')}>{fVolume(trader.totalVolume || 0)}</div>
                          {trader.volume24h > 0 && (
                            <div className={cn('text-[10px]', 'text-black/30 dark:text-white/35')}>24h: {fVolume(trader.volume24h)}</div>
                          )}
                        </div>
                        <div>
                          <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', 'text-black/30 dark:text-white/50')}>Trades</div>
                          <div className={cn('text-[12px] font-medium', 'text-[#1a1a2e] dark:text-white/85')}>{fNumber(trader.totalTrades || 0)}</div>
                        </div>
                        <div>
                          <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', 'text-black/30 dark:text-white/50')}>Return</div>
                          <div className="text-[12px]" style={{ color: roi >= 0 ? '#10b981' : '#ef4444' }}>
                            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', 'text-black/30 dark:text-white/50')}>Win</div>
                          <div className={cn('text-[12px] font-medium', 'text-[#1a1a2e] dark:text-white/85')}>{(trader.winRate || 0).toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TableContainer>

            {totalPages > 1 && (
              <PaginationContainer>
                <NavButton
                  onClick={() => navigateToPage(1)}
                  disabled={currentPage === 1}
                  aria-label="First page"
                >
                  <ChevronsLeft size={12} />
                </NavButton>
                <NavButton
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
                      className={cn('px-[2px] text-[11px]', 'text-black/30 dark:text-white/30')}
                    >
                      ...
                    </span>
                  ) : (
                    <PageButton
                      key={p}
                      selected={p === currentPage}
                      onClick={() => navigateToPage(p)}
                    >
                      {p}
                    </PageButton>
                  )
                )}
                <NavButton
                  onClick={() => navigateToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={12} />
                </NavButton>
                <NavButton
                  onClick={() => navigateToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-label="Last page"
                >
                  <ChevronsRight size={12} />
                </NavButton>
                <PaginationInfo>
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
  const sortBy = query.sortBy || 'totalProfit';

  // Validate inputs to prevent abuse
  const safePage = Math.min(Math.max(1, page), 10000);
  const allowedSorts = ['totalProfit', 'totalVolume', 'totalTrades', 'buyVolume', 'sellVolume', 'avgROI', 'winRate', 'washTradingScore', 'lastActive', 'xrpBalance'];
  const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : 'totalProfit';

  const fetchData = () => Promise.all([
    api.get(
      `${BASE_URL}/token/analytics/traders?sortBy=${safeSortBy}&limit=${ROWS_PER_PAGE}&page=${safePage}`,
      { timeout: 8000 }
    ),
    api.get(`${BASE_URL}/token/analytics/traders/summary`, { timeout: 8000 })
  ]);

  try {
    let tradersRes, summaryRes;
    try {
      [tradersRes, summaryRes] = await fetchData();
    } catch {
      [tradersRes, summaryRes] = await fetchData();
    }
    const rawTraders = tradersRes.data.data || [];
    const traders = rawTraders.map(t => ({
      address: t.address,
      xrpBalance: t.xrpBalance || 0,
      totalVolume: (t.dexVolume || 0) + (t.ammVolume || 0),
      totalTrades: t.totalTrades || 0,
      buyVolume: t.buyVolume || 0,
      sellVolume: t.sellVolume || 0,
      totalProfit: t.totalProfit || 0,
      avgROI: t.avgROI || 0,
      winRate: t.winRate || 0,
      dexVolume: t.dexVolume || 0,
      ammVolume: t.ammVolume || 0,
      sourceTagStats: t.sourceTagStats || [],
      volume24h: t.volume24h || 0,
      washTradingScore: t.washTradingScore || 0,
      lastTradeDate: t.lastTradeDate || null
    }));
    const pagination = tradersRes.data.pagination || {};
    const traderBalances = summaryRes.data.traderBalances || {};

    return { props: { traders, pagination, traderBalances, ogp: {
      canonical: 'https://xrpl.to/token-traders',
      title: 'Token Traders | Top XRPL Token Traders',
      url: 'https://xrpl.to/token-traders',
      imgUrl: 'https://xrpl.to/api/og/token-traders',
      imgType: 'image/png',
      desc: 'Discover the top token traders on the XRP Ledger. Track profits, volume, and trading activity.'
    } } };
  } catch (error) {
    console.error('Failed to fetch token traders:', error.message);
    return { props: { traders: [], pagination: {}, traderBalances: {}, ogp: {
      canonical: 'https://xrpl.to/token-traders',
      title: 'Token Traders | Top XRPL Token Traders',
      url: 'https://xrpl.to/token-traders',
      imgUrl: 'https://xrpl.to/api/og/token-traders',
      imgType: 'image/png',
      desc: 'Discover the top token traders on the XRP Ledger. Track profits, volume, and trading activity.'
    } } };
  }
}
