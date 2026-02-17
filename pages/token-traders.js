import { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import api from 'src/utils/api';
import { ThemeContext } from 'src/context/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { fNumber, fVolume, formatDistanceToNowStrict } from 'src/utils/formatters';
import Link from 'next/link';
import { cn } from 'src/utils/cn';

const BASE_URL = 'https://api.xrpl.to/v1';

const Container = ({ className, children, ...p }) => <div className={cn('max-w-[1920px] mx-auto px-4 py-6', className)} {...p}>{children}</div>;

const Title = ({ darkMode, className, children, ...p }) => <h1 className={cn('text-[22px] font-normal mb-1', darkMode ? 'text-white' : 'text-[#212B36]', className)} {...p}>{children}</h1>;

const Subtitle = ({ darkMode, className, children, ...p }) => <p className={cn('text-[13px] mb-6', darkMode ? 'text-white/50' : 'text-[#637381]', className)} {...p}>{children}</p>;

const TableContainer = ({ darkMode, className, children, ...p }) => <div className={cn('overflow-x-auto scrollbar-none bg-transparent rounded-xl backdrop-blur-[12px] border-[1.5px]', darkMode ? 'border-white/10' : 'border-black/[0.06]', className)} style={{ scrollbarWidth: 'none' }} {...p}>{children}</div>;

const StyledTable = ({ className, children, ...p }) => <table className={cn('w-full border-collapse table-fixed', className)} {...p}>{children}</table>;

const StyledTableHead = ({ darkMode, className, children, ...p }) => <thead className={cn('sticky top-0 z-10 bg-transparent backdrop-blur-[12px]', className)} {...p}>{children}</thead>;

const StyledTh = ({ darkMode, align, width, sortable, className, children, ...p }) => (
  <th
    className={cn(
      'font-medium text-[11px] tracking-[0.04em] uppercase py-4 px-3 whitespace-nowrap font-[inherit] transition-colors duration-150',
      darkMode ? 'text-white/40 border-b-[1.5px] border-white/10' : 'text-black/[0.45] border-b-[1.5px] border-black/[0.06]',
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
  <tbody className={cn('[&_tr]:border-b-[1.5px] [&_tr]:transition-all [&_tr]:duration-150', darkMode ? '[&_tr]:border-white/10 [&_tr:hover]:bg-white/[0.02]' : '[&_tr]:border-black/[0.06] [&_tr:hover]:bg-black/[0.01]', className)} {...p}>{children}</tbody>
);

const StyledTd = ({ darkMode, color, align, className, children, ...p }) => (
  <td
    className={cn('py-[18px] px-3 text-[13px] tracking-[0.01em] align-middle whitespace-nowrap', className)}
    style={{ color: color || (darkMode ? '#fff' : '#212B36'), textAlign: align || 'left' }}
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

const TraderLink = ({ className, children, ...p }) => <Link className={cn('text-[#3b82f6] no-underline font-medium transition-colors duration-150 hover:text-[#60a5fa] hover:underline', className)} {...p}>{children}</Link>;

const PaginationContainer = ({ darkMode, className, children, ...p }) => <div className={cn('flex items-center justify-center gap-1 mt-4 px-[10px] py-[6px] min-h-[36px] rounded-xl bg-transparent border-[1.5px]', darkMode ? 'border-white/10' : 'border-black/[0.06]', className)} {...p}>{children}</div>;

const NavButton = ({ darkMode, className, children, ...p }) => (
  <button
    className={cn(
      'w-[26px] h-[26px] rounded-xl border-[1.5px] bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150',
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
      'min-w-[22px] h-[22px] rounded-xl border-[1.5px] cursor-pointer text-[11px] px-1 transition-all duration-150',
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

const PaginationInfo = ({ darkMode, className, children, ...p }) => <span className={cn('text-[11px] mx-2', darkMode ? 'text-white/40' : 'text-black/40', className)} {...p}>{children}</span>;

const StatsGrid = ({ className, children, ...p }) => <div className={cn('grid grid-cols-4 gap-3 mb-6 max-md:grid-cols-2', className)} {...p}>{children}</div>;

const StatCard = ({ darkMode, className, children, ...p }) => <div className={cn('p-4 rounded-xl bg-transparent border-[1.5px] transition-all duration-150', darkMode ? 'border-white/10 hover:border-white/[0.15] hover:bg-white/[0.02]' : 'border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]', className)} {...p}>{children}</div>;

const StatLabel = ({ darkMode, className, children, ...p }) => <div className={cn('text-[10px] uppercase tracking-[0.05em] mb-[6px]', darkMode ? 'text-white/40' : 'text-black/[0.45]', className)} {...p}>{children}</div>;

const StatValue = ({ darkMode, className, children, ...p }) => <div className={cn('text-lg font-semibold', darkMode ? 'text-white' : 'text-[#212B36]', className)} {...p}>{children}</div>;

const StatSub = ({ darkMode, className, children, ...p }) => <div className={cn('text-[11px] mt-1', darkMode ? 'text-white/[0.35]' : 'text-black/40', className)} {...p}>{children}</div>;

const TABLE_HEAD = [
  { id: 'rank', label: '#', align: 'center', width: '32px' },
  { id: 'trader', label: 'TRADER', align: 'left', width: '120px' },
  { id: 'xrpBalance', label: 'BALANCE', align: 'right', width: '85px', sortable: true },
  { id: 'totalVolume', label: 'VOL (XRP)', align: 'right', width: '85px', sortable: true },
  { id: 'totalTrades', label: 'TRADES', align: 'right', width: '60px', sortable: true },
  { id: 'buyVolume', label: 'BOUGHT', align: 'right', width: '80px', sortable: true },
  { id: 'sellVolume', label: 'SOLD', align: 'right', width: '80px', sortable: true },
  { id: 'totalProfit', label: 'P/L (XRP)', align: 'right', width: '90px', sortable: true },
  { id: 'avgROI', label: 'ROI', align: 'right', width: '55px', sortable: true },
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
  const { themeName } = useContext(ThemeContext);
  const darkMode = themeName === 'XrplToDarkTheme';
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
      <div id="back-to-top-anchor" className="h-6" />
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />

      <Container>
        <Title darkMode={darkMode}>Token Traders Leaderboard</Title>
        <Subtitle darkMode={darkMode}>
          {totalTraders > 0
            ? `${fNumber(totalTraders)} traders on XRPL DEX`
            : 'Top traders by profit on XRPL DEX'}
        </Subtitle>

        {traderBalances.balanceAll > 0 && (
          <StatsGrid>
            <StatCard darkMode={darkMode}>
              <StatLabel darkMode={darkMode}>24h Balance</StatLabel>
              <StatValue darkMode={darkMode}>
                {fVolume(traderBalances.balance24h || 0)} XRP
              </StatValue>
              <StatSub darkMode={darkMode}>
                {fNumber(traderBalances.traders24h || 0)} traders
              </StatSub>
            </StatCard>
            <StatCard darkMode={darkMode}>
              <StatLabel darkMode={darkMode}>7d Balance</StatLabel>
              <StatValue darkMode={darkMode}>
                {fVolume(traderBalances.balance7d || 0)} XRP
              </StatValue>
              <StatSub darkMode={darkMode}>
                {fNumber(traderBalances.traders7d || 0)} traders
              </StatSub>
            </StatCard>
            <StatCard darkMode={darkMode}>
              <StatLabel darkMode={darkMode}>30d Balance</StatLabel>
              <StatValue darkMode={darkMode}>
                {fVolume(traderBalances.balance30d || 0)} XRP
              </StatValue>
              <StatSub darkMode={darkMode}>
                {fNumber(traderBalances.traders30d || 0)} traders
              </StatSub>
            </StatCard>
            <StatCard darkMode={darkMode}>
              <StatLabel darkMode={darkMode}>All Time Balance</StatLabel>
              <StatValue darkMode={darkMode}>
                {fVolume(traderBalances.balanceAll || 0)} XRP
              </StatValue>
              <StatSub darkMode={darkMode}>
                {fNumber(traderBalances.tradersAll || 0)} traders
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
              className={cn('text-xs font-medium tracking-[0.1em] mb-1', darkMode ? 'text-white/80' : 'text-[#4b5563]')}
            >
              NO TRADERS DATA
            </div>
            <div className={cn('text-[11px]', darkMode ? 'text-white/30' : 'text-[#9ca3af]')}>
              Trader data will appear here when available
            </div>
          </EmptyState>
        ) : (
          <>
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
                          darkMode={darkMode}
                          color={darkMode ? 'rgba(255,255,255,0.4)' : '#919EAB'}
                        >
                          {rank}
                        </StyledTd>
                        <StyledTd darkMode={darkMode}>
                          <TraderLink href={`/address/${addr}`}>
                            {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-'}
                          </TraderLink>
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
                          {fVolume(totalVol)}
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} className="text-[11px]">
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
                        <StyledTd align="right" darkMode={darkMode} className="text-[11px]">
                          {winRate.toFixed(0)}%
                        </StyledTd>
                        <StyledTd align="center" darkMode={darkMode} className="text-[11px]">
                          {dexAmmTotal === 0 ? (
                            '-'
                          ) : (
                            <span className="flex items-center justify-center gap-1">
                              <span className="text-[#3b82f6]">{dexPct}%</span>
                              <span
                                className={darkMode ? 'text-white/20' : 'text-black/20'}
                              >
                                /
                              </span>
                              <span className="text-[#8b5cf6]">{ammPct}%</span>
                            </span>
                          )}
                        </StyledTd>
                        <StyledTd align="center" darkMode={darkMode} className="text-[10px]">
                          {(trader.sourceTagStats?.length || 0) > 0
                            ? trader.sourceTagStats
                                .map((s) => SOURCE_TAGS[s.sourceTag] || s.sourceTag)
                                .join(', ')
                            : '-'}
                        </StyledTd>
                        <StyledTd
                          align="right"
                          color={
                            trader.washTradingScore > 0
                              ? '#f59e0b'
                              : darkMode
                                ? 'rgba(255,255,255,0.3)'
                                : '#d1d5db'
                          }
                          className="text-[11px]"
                        >
                          {trader.washTradingScore > 0 ? fNumber(trader.washTradingScore) : '-'}
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
            </TableContainer>

            {totalPages > 1 && (
              <PaginationContainer darkMode={darkMode}>
                <NavButton
                  darkMode={darkMode}
                  onClick={() => navigateToPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft size={12} />
                </NavButton>
                <NavButton
                  darkMode={darkMode}
                  onClick={() => navigateToPage(currentPage - 1)}
                  disabled={currentPage === 1}
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
                >
                  <ChevronRight size={12} />
                </NavButton>
                <NavButton
                  darkMode={darkMode}
                  onClick={() => navigateToPage(totalPages)}
                  disabled={currentPage === totalPages}
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

export async function getServerSideProps({ query }) {
  const page = parseInt(query.page) || 1;
  const sortBy = query.sortBy || 'totalProfit';

  try {
    const [tradersRes, summaryRes] = await Promise.all([
      api.get(
        `${BASE_URL}/token/analytics/traders?sortBy=${sortBy}&limit=${ROWS_PER_PAGE}&page=${page}`
      ),
      api.get(`${BASE_URL}/token/analytics/traders/summary`)
    ]);
    const traders = tradersRes.data.data || [];
    const pagination = tradersRes.data.pagination || {};
    const traderBalances = summaryRes.data.traderBalances || {};

    return { props: { traders, pagination, traderBalances, ogp: {
      canonical: 'https://xrpl.to/token-traders',
      title: 'Token Traders | Top XRPL Token Traders',
      url: 'https://xrpl.to/token-traders',
      imgUrl: 'https://xrpl.to/og/token-traders.webp',
      desc: 'Discover the top token traders on the XRP Ledger. Track profits, volume, and trading activity.'
    } } };
  } catch (error) {
    console.error('Failed to fetch token traders:', error.message);
    return { props: { traders: [], pagination: {}, traderBalances: {}, ogp: {
      canonical: 'https://xrpl.to/token-traders',
      title: 'Token Traders | Top XRPL Token Traders',
      url: 'https://xrpl.to/token-traders',
      imgUrl: 'https://xrpl.to/og/token-traders.webp',
      desc: 'Discover the top token traders on the XRP Ledger. Track profits, volume, and trading activity.'
    } } };
  }
}
