import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ApiButton, registerApiCalls } from 'src/components/ApiEndpointsModal';
import { fNumber, fVolume, formatDistanceToNowStrict } from 'src/utils/formatters';
import Link from 'next/link';

const BASE_URL = 'https://api.xrpl.to/v1';

const Container = styled.div`
  max-width: 1920px;
  margin: 0 auto;
  padding: 24px 16px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 400;
  margin-bottom: 4px;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#212B36')};
`;

const Subtitle = styled.p`
  font-size: 13px;
  margin-bottom: 24px;
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.5)' : '#637381')};
`;

const TableContainer = styled.div`
  overflow-x: auto;
  scrollbar-width: none;
  background: transparent;
  border: 1.5px solid ${({ darkMode }) => (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  border-radius: 12px;
  backdrop-filter: blur(12px);
  &::-webkit-scrollbar { display: none; }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
`;

const StyledTableHead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 10;
  background: transparent;
  backdrop-filter: blur(12px);
`;

const StyledTh = styled.th`
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)')};
  padding: 16px 12px;
  border-bottom: 1.5px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')};
  text-align: ${({ align }) => align || 'left'};
  width: ${({ width }) => width || 'auto'};
  cursor: ${({ sortable }) => (sortable ? 'pointer' : 'default')};
  white-space: nowrap;
  font-family: inherit;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ sortable, darkMode }) => (sortable ? '#3b82f6' : (darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)'))};
  }
`;

const StyledTbody = styled.tbody`
  tr {
    border-bottom: 1.5px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')};
    transition: all 0.15s ease;
    &:hover {
      background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)')};
    }
  }
`;

const StyledTd = styled.td`
  padding: 18px 12px;
  font-size: 13px;
  letter-spacing: 0.01em;
  color: ${({ color, darkMode }) => color || (darkMode ? '#fff' : '#212B36')};
  text-align: ${({ align }) => align || 'left'};
  vertical-align: middle;
  white-space: nowrap;
`;

const SortIndicator = styled.span`
  display: inline-block;
  margin-left: 4px;
  font-size: 8px;
  color: #3b82f6;
`;

const TraderLink = styled(Link)`
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
  &:hover {
    color: #60a5fa;
    text-decoration: underline;
  }
`;

const Badge = styled.span`
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 500;
  background: ${({ type }) =>
    type === 'buyer' ? 'rgba(59, 130, 246, 0.12)' :
    type === 'seller' ? 'rgba(239,68,68,0.12)' :
    type === 'both' ? 'rgba(168,85,247,0.12)' : 'rgba(234,179,8,0.12)'};
  color: ${({ type }) =>
    type === 'buyer' ? '#3b82f6' :
    type === 'seller' ? '#ef4444' :
    type === 'both' ? '#a855f7' : '#eab308'};
`;

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 16px;
  padding: 6px 10px;
  min-height: 36px;
  border-radius: 12px;
  background: transparent;
  border: 1.5px solid ${({ darkMode }) => (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
`;

const NavButton = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 12px;
  border: 1.5px solid ${({ darkMode }) => (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#212B36')};
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ darkMode }) => (darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)')};
    background: ${({ darkMode }) => (darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)')};
  }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const PageButton = styled.button`
  min-width: 22px;
  height: 22px;
  border-radius: 12px;
  border: 1.5px solid ${({ selected, darkMode }) => (selected ? '#4285f4' : darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  background: ${({ selected }) => (selected ? '#4285f4' : 'transparent')};
  color: ${({ selected, darkMode }) => (selected ? '#fff' : (darkMode ? '#fff' : '#212B36'))};
  cursor: pointer;
  font-size: 11px;
  font-weight: ${({ selected }) => (selected ? 500 : 400)};
  padding: 0 4px;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ selected, darkMode }) => (selected ? '#1976D2' : darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)')};
    background: ${({ selected, darkMode }) => (selected ? '#1976D2' : darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)')};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 16px;
  border-radius: 12px;
  border: 1.5px dashed ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')};
`;

const PaginationInfo = styled.span`
  font-size: 11px;
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)')};
  margin: 0 8px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  padding: 16px;
  border-radius: 12px;
  background: transparent;
  border: 1.5px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')};
    background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)')};
  }
`;

const StatLabel = styled.div`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)')};
  margin-bottom: 6px;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#212B36')};
`;

const StatSub = styled.div`
  font-size: 11px;
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)')};
  margin-top: 4px;
`;

const TABLE_HEAD = [
  { id: 'rank', label: '#', align: 'center', width: '32px' },
  { id: 'trader', label: 'TRADER', align: 'left', width: '120px' },
  { id: 'xrpBalance', label: 'BALANCE', align: 'right', width: '85px', sortable: true },
  { id: 'totalVolume', label: 'VOL (XRP)', align: 'right', width: '85px', sortable: true },
  { id: 'totalTrades', label: 'TRADES', align: 'right', width: '60px', sortable: true },
  { id: 'flips', label: 'FLIPS', align: 'right', width: '50px', sortable: true },
  { id: 'buyVolume', label: 'BOUGHT', align: 'right', width: '80px', sortable: true },
  { id: 'sellVolume', label: 'SOLD', align: 'right', width: '80px', sortable: true },
  { id: 'combinedProfit', label: 'P/L (XRP)', align: 'right', width: '90px', sortable: true },
  { id: 'roi', label: 'ROI', align: 'right', width: '55px', sortable: true },
  { id: 'winRate', label: 'WIN', align: 'right', width: '50px', sortable: true },
  { id: 'holdingsCount', label: 'NFTs', align: 'right', width: '55px', sortable: true },
  { id: 'marketplace', label: 'SOURCE', align: 'center', width: '80px' },
  { id: 'lastTrade', label: 'LAST ACTIVE', align: 'right', width: '90px', sortable: true },
];

const ROWS_PER_PAGE = 20;


export default function NFTTradersPage({ traders = [], pagination = {}, traderBalances = {} }) {
  const router = useRouter();
  const { themeName } = useContext(AppContext);
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
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page },
    }, undefined, { shallow: false });
  };

  const handleSortChange = (key) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, sortBy: key, page: 1 },
    }, undefined, { shallow: false });
  };

  const getLastActive = (t) => t.lastTrade ? formatDistanceToNowStrict(new Date(t.lastTrade)) : '-';

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <div id="back-to-top-anchor" style={{ height: 24 }} />
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />

      <Container>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Title darkMode={darkMode} style={{ marginBottom: 0 }}>NFT Traders Leaderboard</Title>
          <ApiButton />
        </div>
        <Subtitle darkMode={darkMode}>
          {totalTraders > 0 ? `${fNumber(totalTraders)} traders on XRPL` : 'Top NFT traders by profit'}
        </Subtitle>

        {traderBalances.balanceAll > 0 && (
          <StatsGrid>
            <StatCard darkMode={darkMode}>
              <StatLabel darkMode={darkMode}>24h Balance</StatLabel>
              <StatValue darkMode={darkMode}>{fVolume(traderBalances.balance24h || 0)} XRP</StatValue>
              <StatSub darkMode={darkMode}>{fNumber(traderBalances.traders24h || 0)} traders</StatSub>
            </StatCard>
            <StatCard darkMode={darkMode}>
              <StatLabel darkMode={darkMode}>7d Balance</StatLabel>
              <StatValue darkMode={darkMode}>{fVolume(traderBalances.balance7d || 0)} XRP</StatValue>
              <StatSub darkMode={darkMode}>{fNumber(traderBalances.traders7d || 0)} traders</StatSub>
            </StatCard>
            <StatCard darkMode={darkMode}>
              <StatLabel darkMode={darkMode}>30d Balance</StatLabel>
              <StatValue darkMode={darkMode}>{fVolume(traderBalances.balance30d || 0)} XRP</StatValue>
              <StatSub darkMode={darkMode}>{fNumber(traderBalances.traders30d || 0)} traders</StatSub>
            </StatCard>
            <StatCard darkMode={darkMode}>
              <StatLabel darkMode={darkMode}>All Time Balance</StatLabel>
              <StatValue darkMode={darkMode}>{fVolume(traderBalances.balanceAll || 0)} XRP</StatValue>
              <StatSub darkMode={darkMode}>{fNumber(traderBalances.tradersAll || 0)} traders</StatSub>
            </StatCard>
          </StatsGrid>
        )}

        {traders.length === 0 ? (
          <EmptyState darkMode={darkMode}>
            <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 16px' }}>
              <div style={{ position: 'absolute', top: -4, left: 4, width: 20, height: 20, borderRadius: '50%', background: darkMode ? '#4285f4' : '#60a5fa' }} />
              <div style={{ position: 'absolute', top: -4, right: 4, width: 20, height: 20, borderRadius: '50%', background: darkMode ? '#4285f4' : '#60a5fa' }} />
              <div style={{ position: 'absolute', top: 2, left: 8, width: 10, height: 10, borderRadius: '50%', background: darkMode ? '#3b78e7' : '#3b82f6' }} />
              <div style={{ position: 'absolute', top: 2, right: 8, width: 10, height: 10, borderRadius: '50%', background: darkMode ? '#3b78e7' : '#3b82f6' }} />
              <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 48, height: 48, borderRadius: '50%', background: darkMode ? '#4285f4' : '#60a5fa' }}>
                <div style={{ position: 'absolute', top: 16, left: 10, width: 8, height: 6, borderRadius: '50%', background: '#0a0a0a', transform: 'rotate(-10deg)' }} />
                <div style={{ position: 'absolute', top: 16, right: 10, width: 8, height: 6, borderRadius: '50%', background: '#0a0a0a', transform: 'rotate(10deg)' }} />
                <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 16, height: 10, borderRadius: '50%', background: darkMode ? '#5a9fff' : '#93c5fd' }}>
                  <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 6, height: 4, borderRadius: '50%', background: '#0a0a0a' }} />
                </div>
                <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 10, height: 5, borderRadius: '8px 8px 0 0', borderTop: '2px solid #0a0a0a', borderLeft: '2px solid #0a0a0a', borderRight: '2px solid #0a0a0a' }} />
              </div>
              <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2, pointerEvents: 'none' }}>
                {[...Array(10)].map((_, i) => (<div key={i} style={{ height: 2, width: '100%', background: darkMode ? 'rgba(10,10,10,0.4)' : 'rgba(255,255,255,0.4)' }} />))}
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.1em', marginBottom: 4, color: darkMode ? 'rgba(255,255,255,0.8)' : '#4b5563' }}>
              NO TRADERS DATA
            </div>
            <div style={{ fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.3)' : '#9ca3af' }}>
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
                        style={sortBy === col.id ? { color: '#3b82f6' } : {}}
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
                        <StyledTd align="center" darkMode={darkMode} color={darkMode ? 'rgba(255,255,255,0.4)' : '#919EAB'}>
                          {rank}
                        </StyledTd>
                        <StyledTd darkMode={darkMode}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <TraderLink href={`/address/${addr}`}>
                              {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-'}
                            </TraderLink>
                            {trader.traderType && <Badge type={trader.traderType}>{trader.traderType}</Badge>}
                          </div>
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} style={{ fontWeight: 500, fontSize: 12 }}>
                          {fVolume(trader.xrpBalance || 0)}
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} style={{ fontWeight: 500, fontSize: 12 }}>
                          {fVolume(trader.totalVolume || 0)}
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} style={{ fontSize: 11 }}>
                          {fNumber(trader.totalTrades || 0)}
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} style={{ fontSize: 11 }}>
                          {trader.flips > 0 ? fNumber(trader.flips) : '-'}
                        </StyledTd>
                        <StyledTd align="right" style={{ color: '#10b981', fontSize: 12 }}>
                          {fVolume(bought)}
                        </StyledTd>
                        <StyledTd align="right" style={{ color: '#ef4444', fontSize: 12 }}>
                          {fVolume(sold)}
                        </StyledTd>
                        <StyledTd align="right" style={{ color: cp >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: 12 }}>
                          {cp >= 0 ? '+' : ''}{fVolume(cp)}
                        </StyledTd>
                        <StyledTd align="right" style={{ color: roi >= 0 ? '#10b981' : '#ef4444', fontSize: 11 }}>
                          {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} style={{ fontSize: 11 }}>
                          {(trader.winRate || 0).toFixed(0)}%
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} style={{ fontSize: 11 }}>
                          {fNumber(trader.holdingsCount || 0)}
                        </StyledTd>
                        <StyledTd align="center" darkMode={darkMode} style={{ fontSize: 10 }}>
                          {(() => {
                            const markets = Object.keys(trader.marketplaceBreakdown || {}).filter(m => m !== 'XRPL');
                            return markets.length > 0 ? markets.join(', ') : '-';
                          })()}
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} color={darkMode ? 'rgba(255,255,255,0.5)' : '#637381'} style={{ fontSize: 11 }}>
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
                <NavButton darkMode={darkMode} onClick={() => navigateToPage(1)} disabled={currentPage === 1}>
                  <ChevronsLeft size={12} />
                </NavButton>
                <NavButton darkMode={darkMode} onClick={() => navigateToPage(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft size={12} />
                </NavButton>
                {getPageNumbers().map((p, i) =>
                  p === '...' ? (
                    <span key={`e${i}`} style={{ padding: '0 2px', fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>...</span>
                  ) : (
                    <PageButton key={p} selected={p === currentPage} darkMode={darkMode} onClick={() => navigateToPage(p)}>
                      {p}
                    </PageButton>
                  )
                )}
                <NavButton darkMode={darkMode} onClick={() => navigateToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                  <ChevronRight size={12} />
                </NavButton>
                <NavButton darkMode={darkMode} onClick={() => navigateToPage(totalPages)} disabled={currentPage === totalPages}>
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
  const sortBy = query.sortBy || 'combinedProfit';

  try {
    const [tradersRes, marketRes] = await Promise.all([
      axios.get(`${BASE_URL}/nft/analytics/traders?sortBy=${sortBy}&limit=${ROWS_PER_PAGE}&page=${page}`),
      axios.get(`${BASE_URL}/nft/analytics/market`)
    ]);
    const traders = tradersRes.data.traders || [];
    const pagination = tradersRes.data.pagination || {};
    const traderBalances = marketRes.data.traderBalances || {};

    return { props: { traders, pagination, traderBalances } };
  } catch (error) {
    console.error('Failed to fetch NFT traders:', error.message);
    return { props: { traders: [], pagination: {}, traderBalances: {} } };
  }
}
