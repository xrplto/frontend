import { useState, useContext } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { ChevronsLeft, ChevronsRight, ChevronDown, Loader2 } from 'lucide-react';
import { fNumber, fVolume, formatDistanceToNowStrict } from 'src/utils/formatters';
import Link from 'next/link';

const BASE_URL = 'https://api.xrpl.to/api';

// Styled Components - matching CollectionList pattern
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

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const MetricBox = styled.div`
  padding: 12px;
  border-radius: 12px;
  background: ${({ darkMode }) => (darkMode ? 'rgba(59, 130, 246, 0.02)' : 'rgba(59, 130, 246, 0.02)')};
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)')};
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: ${({ darkMode }) => (darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.35)')};
    background: ${({ darkMode }) => (darkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.04)')};
  }
`;

const MetricLabel = styled.div`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')};
  margin-bottom: 4px;
`;

const MetricValue = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#212B36')};
`;

const TableContainer = styled.div`
  overflow-x: auto;
  scrollbar-width: none;
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
  background: ${({ darkMode }) => (darkMode ? '#0a0a0a' : '#ffffff')};
  backdrop-filter: blur(12px);
`;

const StyledTh = styled.th`
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)')};
  padding: 16px 12px;
  border-bottom: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')};
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
    border-bottom: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
    transition: background 0.2s ease;
    &:hover {
      background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')};
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
  transform: ${({ direction }) => (direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.15s ease;
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
    type === 'seller' ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.12)'};
  color: ${({ type }) =>
    type === 'buyer' ? '#3b82f6' :
    type === 'seller' ? '#ef4444' : '#eab308'};
`;

const CollectionImg = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid ${({ darkMode }) => (darkMode ? '#0a0a0a' : '#fff')};
  object-fit: cover;
`;

const MarketBadge = styled.span`
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  letter-spacing: 0.02em;
  background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)')};
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)')};
`;

// Pagination Components
const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 16px;
  padding: 6px 10px;
  min-height: 36px;
  border-radius: 8px;
  background: ${({ darkMode }) => (darkMode ? 'rgba(59, 130, 246, 0.02)' : 'rgba(59, 130, 246, 0.02)')};
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.12)')};
`;

const NavButton = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 5px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#212B36')};
  transition: background 0.2s ease;

  &:hover:not(:disabled) { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const PageButton = styled.button`
  min-width: 22px;
  height: 22px;
  border-radius: 5px;
  border: none;
  background: ${({ selected }) => (selected ? '#3b82f6' : 'transparent')};
  color: ${({ selected, darkMode }) => (selected ? '#fff' : (darkMode ? '#fff' : '#212B36'))};
  cursor: pointer;
  font-size: 11px;
  font-weight: ${({ selected }) => (selected ? 500 : 400)};
  padding: 0 4px;
  transition: background 0.2s ease;

  &:hover:not(:disabled) { background: ${({ selected }) => (selected ? '#2563eb' : 'rgba(59, 130, 246, 0.1)')}; }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 16px;
  border-radius: 12px;
  border: 1.5px dashed ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')};
`;

const TABLE_HEAD = [
  { id: 'rank', label: '#', align: 'center', width: '50px' },
  { id: 'trader', label: 'TRADER', align: 'left', width: '180px' },
  { id: 'balance', label: 'BALANCE', align: 'right', width: '100px', sortable: true, tooltip: 'Current XRP balance' },
  { id: 'buyVolume', label: 'BOUGHT (24H)', align: 'right', width: '110px', sortable: true, tooltip: 'XRP spent buying NFTs in 24h' },
  { id: 'sellVolume', label: 'SOLD (24H)', align: 'right', width: '110px', sortable: true, tooltip: 'XRP received from selling NFTs in 24h' },
  { id: 'totalVolume', label: 'VOLUME (24H)', align: 'right', width: '110px', sortable: true, tooltip: 'Total trading volume in 24h' },
  { id: 'collections', label: 'COLLECTIONS', align: 'right', width: '100px', tooltip: 'Collections traded in 24h' },
  { id: 'lastActive', label: 'LAST ACTIVE', align: 'right', width: '100px', tooltip: 'Time since last trade' },
  { id: 'marketplaces', label: 'MARKETS', align: 'right', width: '120px', tooltip: 'Marketplaces used' },
];

export default function TradersPage({ traders = [], sortBy = 'totalVolume', globalMetrics = null }) {
  const { themeName } = useContext(AppContext);
  const darkMode = themeName === 'XrplToDarkTheme';
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const rowsPerPage = 20;

  const handleSortChange = (key) => {
    setPage(0);
    router.push(`/nft-traders?sortBy=${key}`);
  };

  const paginatedTraders = traders.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const totalPages = Math.ceil(traders.length / rowsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const current = page + 1;
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (current <= 3) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (current >= totalPages - 2) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
    }
    return pages;
  };

  const metrics = globalMetrics ? [
    { label: 'Active Traders', value: fNumber(globalMetrics.activeTraders24h || 0) },
    { label: 'Total Liquidity', value: `${fVolume(globalMetrics.totalLiquidity24h || 0)} XRP` },
    { label: '24h Volume', value: `${fVolume(globalMetrics.total24hVolume || 0)} XRP` },
    { label: '24h Sales', value: fNumber(globalMetrics.total24hSales || 0) },
    { label: '24h Mints', value: fNumber(globalMetrics.total24hMints || 0) },
    { label: '24h Burns', value: fNumber(globalMetrics.total24hBurns || 0) },
  ] : null;

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <div id="back-to-top-anchor" style={{ height: 24 }} />
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />

      <Container>
        <Title darkMode={darkMode}>NFT Traders Leaderboard</Title>
        <Subtitle darkMode={darkMode}>Top NFT traders by volume in the last 24 hours</Subtitle>

        {metrics && (
          <MetricsGrid>
            {metrics.map((m) => (
              <MetricBox key={m.label} darkMode={darkMode}>
                <MetricLabel darkMode={darkMode}>{m.label}</MetricLabel>
                <MetricValue darkMode={darkMode}>{m.value}</MetricValue>
              </MetricBox>
            ))}
          </MetricsGrid>
        )}

        {traders.length === 0 ? (
          <EmptyState darkMode={darkMode}>
            <div style={{ fontSize: 16, marginBottom: 8, color: darkMode ? 'rgba(255,255,255,0.6)' : '#637381' }}>
              No Traders Data
            </div>
            <div style={{ fontSize: 13, color: darkMode ? 'rgba(255,255,255,0.4)' : '#919EAB' }}>
              Trader data will appear here when available
            </div>
          </EmptyState>
        ) : (
          <>
            <TableContainer>
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
                  {paginatedTraders.map((trader, idx) => {
                    const addr = trader._id || trader.address;
                    return (
                      <tr key={addr || idx}>
                        <StyledTd align="center" darkMode={darkMode} color={darkMode ? 'rgba(255,255,255,0.4)' : '#919EAB'}>
                          {page * rowsPerPage + idx + 1}
                        </StyledTd>
                        <StyledTd darkMode={darkMode}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TraderLink href={`/address/${addr}`}>
                              {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-'}
                            </TraderLink>
                            {trader.traderType && <Badge type={trader.traderType}>{trader.traderType}</Badge>}
                          </div>
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode}>
                          {fNumber(trader.balance || 0)}
                        </StyledTd>
                        <StyledTd align="right" color="#3b82f6">
                          {fNumber(trader.buyVolume || 0)}
                        </StyledTd>
                        <StyledTd align="right" color="#EF5350">
                          {fNumber(trader.sellVolume || 0)}
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode}>
                          {fNumber(trader.totalVolume || 0)}
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode}>
                          {Array.isArray(trader.collectionsInfo) && trader.collectionsInfo.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                              <div style={{ display: 'flex', marginLeft: -4 }}>
                                {trader.collectionsInfo.slice(0, 2).map((col) => (
                                  <CollectionImg
                                    key={col._id}
                                    src={`https://s1.xrpl.to/nft-collection/${col.logoImage}`}
                                    alt={col.name}
                                    darkMode={darkMode}
                                    style={{ marginLeft: -4 }}
                                  />
                                ))}
                              </div>
                              <span style={{ color: darkMode ? 'rgba(255,255,255,0.4)' : '#919EAB', fontSize: 11 }}>
                                {trader.collectionsInfo.length}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: darkMode ? 'rgba(255,255,255,0.4)' : '#919EAB' }}>
                              {trader.collectionsTraded || 0}
                            </span>
                          )}
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} color={darkMode ? 'rgba(255,255,255,0.5)' : '#637381'}>
                          <span style={{ fontSize: 11 }}>
                            {trader.lastActive ? formatDistanceToNowStrict(new Date(trader.lastActive), { addSuffix: true }) : '-'}
                          </span>
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode}>
                          {Array.isArray(trader.marketplaces) && trader.marketplaces.length > 0 ? (
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {trader.marketplaces.slice(0, 2).map((mp, i) => (
                                <MarketBadge key={i} darkMode={darkMode}>{mp}</MarketBadge>
                              ))}
                              {trader.marketplaces.length > 2 && (
                                <span style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : '#919EAB', fontSize: 11 }}>
                                  +{trader.marketplaces.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : '#919EAB' }}>-</span>
                          )}
                        </StyledTd>
                      </tr>
                    );
                  })}
                </StyledTbody>
              </StyledTable>
            </TableContainer>

            {totalPages > 1 && (
              <PaginationContainer darkMode={darkMode}>
                <NavButton darkMode={darkMode} onClick={() => setPage(0)} disabled={page === 0}>
                  <ChevronsLeft size={12} />
                </NavButton>
                {getPageNumbers().map((p, i) =>
                  p === '...' ? (
                    <span key={`e${i}`} style={{ padding: '0 2px', fontSize: 11 }}>...</span>
                  ) : (
                    <PageButton key={p} selected={p === page + 1} darkMode={darkMode} onClick={() => setPage(p - 1)}>
                      {p}
                    </PageButton>
                  )
                )}
                <NavButton darkMode={darkMode} onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}>
                  <ChevronsRight size={12} />
                </NavButton>
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

export async function getServerSideProps(context) {
  const { sortBy = 'totalVolume' } = context.query;

  try {
    const response = await axios.get(`${BASE_URL}/nft/traders/active?sortBy=${sortBy}&limit=100&includeGlobalMetrics=true`);
    const traders = response.data.traders || response.data || [];
    const globalMetrics = response.data.globalMetrics || null;

    return { props: { traders, sortBy, globalMetrics } };
  } catch (error) {
    console.error('Failed to fetch traders:', error.message);
    return { props: { traders: [], sortBy, globalMetrics: null } };
  }
}
